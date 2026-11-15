import { LANGS, type Lang } from '../core/types.ts';
import { parseIndex } from './library.ts';

/** What a guide must look like in one language (see guides/CONTRIBUTING.md). */
interface GuideTemplate {
  /** Start of the summary line, right under the title. */
  summary: string;
  /** Every allowed `##` heading, in the order they must appear. */
  sections: string[];
  steps: string;
  /** Replace the steps in guides about a disaster. */
  phases: string[];
  /** What must never be done: shown with crosses in the app. */
  never: string;
  sources: string;
  /** Line that says when the guide was last checked. */
  checked: RegExp;
  /** Last line: link to the same guide in the other language. */
  translation: RegExp;
}

export const TEMPLATES: Record<Lang, GuideTemplate> = {
  en: {
    summary: '> **In short**: ',
    sections: [
      'When to use it',
      'What you need',
      'Steps',
      'Before',
      'During',
      'After',
      'Never do this',
      'Without equipment',
      'Depending on where you are',
      'See also',
      'Sources',
    ],
    steps: 'Steps',
    phases: ['Before', 'During', 'After'],
    never: 'Never do this',
    sources: 'Sources',
    checked: /^Guide and sources checked in [A-Z][a-z]+ \d{4}\. /,
    translation: /^Version française : \[(.+)\]\(\.\.\/\.\.\/(fr\/[a-z0-9-]+\/[a-z0-9-]+)\.md\)$/,
  },
  fr: {
    summary: '> **En bref** : ',
    sections: [
      'Quand s’en servir',
      'Ce qu’il te faut',
      'Étapes',
      'Avant',
      'Pendant',
      'Après',
      'À ne jamais faire',
      'Sans matériel',
      'Selon l’endroit',
      'Voir aussi',
      'Sources',
    ],
    steps: 'Étapes',
    phases: ['Avant', 'Pendant', 'Après'],
    never: 'À ne jamais faire',
    sources: 'Sources',
    checked: /^Fiche et sources vérifiées en [a-zéû]+ \d{4}\. /,
    translation: /^English version: \[(.+)\]\(\.\.\/\.\.\/(en\/[a-z0-9-]+\/[a-z0-9-]+)\.md\)$/,
  },
};

const GUIDE_PATH = /^([a-z]{2})\/([a-z0-9-]+)\/([a-z0-9-]+)\.md$/;
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const HTML_TAG = /<\/?[a-zA-Z][^>]*>/;

/** Straight and typographic apostrophes are the same heading. */
const sameQuotes = (text: string) => text.replace(/'/g, '’');

/** Title of a guide: its first line, a `#` heading. */
export function guideTitle(markdown: string): string | null {
  return /^# +(.+?)\s*$/.exec(markdown.split(/\r?\n/, 1)[0])?.[1] ?? null;
}

/** Id (`en/water/store-water`) of the same guide in the other language, from its last line. */
export function guideTranslation(markdown: string, lang: Lang): { id: string; title: string } | null {
  const last = markdown.trimEnd().split(/\r?\n/).at(-1) ?? '';
  const match = TEMPLATES[lang].translation.exec(last);
  return match ? { id: match[2], title: match[1] } : null;
}

/** Resolves a relative link against the folder of the file that holds it. */
export function resolveLink(from: string, href: string): string {
  const parts = from.split('/').slice(0, -1);
  for (const part of href.split('#')[0].split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.' && part !== '') parts.push(part);
  }
  return parts.join('/');
}

function lintGuide(path: string, markdown: string, lang: Lang): string[] {
  const problems: string[] = [];
  const problem = (message: string) => problems.push(`${path}: ${message}`);
  const template = TEMPLATES[lang];
  const lines = markdown.trimEnd().split(/\r?\n/);

  if (!guideTitle(markdown)) problem('the first line must be the title, as "# Title"');
  if (lines[1] !== '' || !lines[2]?.startsWith(template.summary) || lines[3] !== '') {
    problem(`the title must be followed by one summary line starting with "${template.summary}"`);
  }
  if (lines.slice(1).some((line) => /^# /.test(line))) problem('only one "# Title" is allowed');
  if (HTML_TAG.test(markdown)) problem('no HTML, plain Markdown only');

  const headings = lines.filter((line) => /^## /.test(line)).map((line) => sameQuotes(line.slice(3).trim()));
  const allowed = template.sections.map(sameQuotes);
  let last = -1;
  for (const heading of headings) {
    const index = allowed.indexOf(heading);
    if (index === -1) problem(`"## ${heading}" is not a section of the template`);
    else if (index <= last) problem(`"## ${heading}" is out of order or repeated`);
    else last = index;
  }
  const hasSteps = headings.includes(template.steps);
  const phases = template.phases.filter((phase) => headings.includes(phase)).length;
  if (hasSteps === phases > 0 || (phases > 0 && phases < template.phases.length)) {
    problem(`needs either "## ${template.steps}" or the sections ${template.phases.map((phase) => `"## ${phase}"`).join(', ')}`);
  }
  if (headings.at(-1) !== template.sources) problem(`the last section must be "## ${template.sources}"`);

  const sources = markdown.slice(markdown.lastIndexOf(`\n## ${template.sources}`));
  if ((sources.match(/\]\(https:\/\//g) ?? []).length < 2) problem('needs at least two sources with an https link');

  const [rule, blank, checked, , translation] = lines.slice(-5);
  if (rule !== '---' || blank !== '' || !template.checked.test(checked ?? '') || !template.translation.test(translation ?? '')) {
    problem('must end with "---", the line saying when it was checked, then the link to the other-language version');
  }
  return problems;
}

/**
 * Checks the whole guides folder against the rules of guides/CONTRIBUTING.md.
 * `files` maps paths relative to that folder (`fr/eau/stocker-de-l-eau.md`) to their content.
 * Returns one sentence per problem, nothing when all is well.
 */
export function lintGuides(files: Record<string, string>): string[] {
  const problems: string[] = [];
  const guides = new Map<string, { lang: Lang; theme: string; markdown: string }>();

  for (const [path, markdown] of Object.entries(files)) {
    if (path === 'README.md' || path === 'CONTRIBUTING.md' || /^[a-z]{2}\/README\.md$/.test(path)) continue;
    const match = GUIDE_PATH.exec(path);
    if (!match || !(LANGS as string[]).includes(match[1])) {
      problems.push(`${path}: guides go in <language>/<theme>/<guide>.md, lowercase, no accents, with hyphens`);
      continue;
    }
    const lang = match[1] as Lang;
    guides.set(path.slice(0, -3), { lang, theme: match[2], markdown });
    problems.push(...lintGuide(path, markdown, lang));
  }

  // Links: relative ones must lead to a file of the folder, others must be https.
  const folders = new Set(Object.keys(files).flatMap((path) => path.split('/').slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join('/'))));
  for (const [path, markdown] of Object.entries(files)) {
    if (path === 'CONTRIBUTING.md') continue;
    for (const [, href] of markdown.matchAll(LINK)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
        if (!href.startsWith('https://')) problems.push(`${path}: "${href}" must be an https link`);
        continue;
      }
      const target = resolveLink(path, href);
      if (!(target in files) && !folders.has(target)) problems.push(`${path}: the link "${href}" leads nowhere`);
      const guide = guides.get(path.slice(0, -3));
      const linked = guides.get(target.replace(/\.md$/, ''));
      if (guide && linked && linked.lang !== guide.lang && guideTranslation(guide.markdown, guide.lang)?.id !== target.slice(0, -3)) {
        problems.push(`${path}: "${href}" links to a guide in another language`);
      }
    }
  }

  // Tables of contents: every guide listed once, under the heading of its theme.
  const position = new Map<string, string>();
  for (const lang of LANGS) {
    const readme = files[`${lang}/README.md`];
    if (readme === undefined) {
      problems.push(`${lang}/README.md: missing table of contents`);
      continue;
    }
    if (HTML_TAG.test(readme)) problems.push(`${lang}/README.md: no HTML, plain Markdown only`);
    const listed = new Set<string>();
    const themeHeadings = new Map<string, string>();
    parseIndex(readme).forEach((theme, themeIndex) => {
      theme.entries.forEach((entry, entryIndex) => {
        const id = `${lang}/${entry.theme}/${entry.slug}`;
        const guide = guides.get(id);
        if (!guide) return; // Already reported as a link that leads nowhere.
        if (listed.has(id)) problems.push(`${lang}/README.md: "${entry.title}" is listed twice`);
        listed.add(id);
        position.set(id, `${themeIndex}.${entryIndex}`);
        if (guideTitle(guide.markdown) !== entry.title) {
          problems.push(`${lang}/README.md: "${entry.title}" is not the title of ${id}.md`);
        }
        if (!entry.description) problems.push(`${lang}/README.md: "${entry.title}" needs a one-line description`);
        const heading = themeHeadings.get(entry.theme) ?? theme.title;
        themeHeadings.set(entry.theme, heading);
        if (heading !== theme.title || entry.theme !== theme.slug) {
          problems.push(`${lang}/README.md: "## ${theme.title}" must list the guides of one folder, and all of them`);
        }
      });
    });
    for (const [id, guide] of guides) {
      if (guide.lang === lang && !listed.has(id)) problems.push(`${lang}/README.md: ${id}.md is not listed`);
    }
  }

  // Every guide has its twin in the other language, at the same place in the table of contents.
  for (const [id, guide] of guides) {
    const translation = guideTranslation(guide.markdown, guide.lang);
    if (!translation) continue; // Already reported by the template check.
    const twin = guides.get(translation.id);
    if (!twin) continue; // Already reported as a link that leads nowhere.
    if (guideTitle(twin.markdown) !== translation.title) {
      problems.push(`${id}.md: the link to the other language must show the title of ${translation.id}.md`);
    }
    if (guideTranslation(twin.markdown, twin.lang)?.id !== id) {
      problems.push(`${id}.md: ${translation.id}.md does not link back to it`);
    }
    if (position.has(id) && position.has(translation.id) && position.get(id) !== position.get(translation.id)) {
      problems.push(`${id}.md: not at the same place as ${translation.id}.md in the tables of contents`);
    }
  }
  return problems;
}
