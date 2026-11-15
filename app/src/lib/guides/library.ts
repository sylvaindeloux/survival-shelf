/** Languages the guides are written in. A language of the app does not have to be one of them. */
export const GUIDE_LANGS = ['en', 'fr'] as const;
export type GuideLang = (typeof GUIDE_LANGS)[number];

/** Language to show the guides in: the wanted one when they exist in it, English otherwise. */
export function guideLang(lang: string): GuideLang {
  return (GUIDE_LANGS as readonly string[]).includes(lang) ? (lang as GuideLang) : 'en';
}

/** One practical guide, as the app shows it. */
export interface Guide {
  /** Path of the guide inside the guides folder, without `.md`: `fr/eau/stocker-de-l-eau`. */
  id: string;
  title: string;
  /** One line taken from the table of contents. */
  description: string;
  /** Body rendered to HTML, without the title. */
  html: string;
}

export interface GuideTheme {
  /** Folder name: `eau`, `water`. */
  slug: string;
  title: string;
  guides: Guide[];
}

/** All the guides of one language, in the order of its table of contents. */
export interface GuideLibrary {
  lang: GuideLang;
  themes: GuideTheme[];
}

export interface IndexEntry {
  theme: string;
  slug: string;
  title: string;
  description: string;
}

export interface IndexTheme {
  title: string;
  /** Folder of the first guide listed under the heading. */
  slug: string;
  entries: IndexEntry[];
}

const INDEX_ENTRY = /^- \[(.+?)\]\(([a-z0-9-]+)\/([a-z0-9-]+)\.md\)\s*:?\s*(.*)$/;

/**
 * Reads the table of contents of a language (its `README.md`): each `##` heading followed by a
 * list of `- [Title](theme/guide.md): description` is a theme. Other sections are ignored.
 */
export function parseIndex(readme: string): IndexTheme[] {
  const themes: IndexTheme[] = [];
  let heading = '';
  for (const line of readme.split(/\r?\n/)) {
    const h2 = /^## +(.+?)\s*$/.exec(line);
    if (h2) {
      heading = h2[1];
      continue;
    }
    const entry = INDEX_ENTRY.exec(line);
    if (!entry || !heading) continue;
    const [, title, theme, slug, description] = entry;
    let current = themes.at(-1);
    if (!current || current.title !== heading) {
      current = { title: heading, slug: theme, entries: [] };
      themes.push(current);
    }
    current.entries.push({ theme, slug, title, description });
  }
  return themes;
}

/** Lowercase, without accents, punctuation turned into spaces: what a search compares. */
export function foldText(text: string): string {
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };

/** Text of a rendered guide, without its tags. */
export function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) => ENTITIES[name]);
}

export interface GuideMatch {
  guide: Guide;
  theme: GuideTheme;
}

const folded = new WeakMap<Guide, { title: string; description: string; body: string }>();

function foldedGuide(guide: Guide) {
  let entry = folded.get(guide);
  if (!entry) {
    entry = { title: foldText(guide.title), description: foldText(guide.description), body: foldText(plainText(guide.html)) };
    folded.set(guide, entry);
  }
  return entry;
}

/**
 * Guides that contain every word of the query, ignoring case and accents. Words found in a
 * title weigh more than in a description, and more than in the text.
 */
export function searchGuides(library: GuideLibrary, query: string): GuideMatch[] {
  const terms = foldText(query).split(' ').filter(Boolean);
  if (terms.length === 0) return [];
  const matches: (GuideMatch & { score: number })[] = [];
  for (const theme of library.themes) {
    for (const guide of theme.guides) {
      const text = foldedGuide(guide);
      let score = 0;
      for (const term of terms) {
        if (text.title.includes(term)) score += 4;
        else if (text.description.includes(term)) score += 2;
        else if (text.body.includes(term)) score += 1;
        else {
          score = -1;
          break;
        }
      }
      if (score > 0) matches.push({ guide, theme, score });
    }
  }
  // Array.prototype.sort is stable: equal scores keep the order of the table of contents.
  return matches.sort((a, b) => b.score - a.score).map(({ guide, theme }) => ({ guide, theme }));
}
