import { Marked, type Tokens } from 'marked';
import { parseIndex, type GuideLang, type GuideLibrary } from './library.ts';
import { resolveLink, TEMPLATES } from './lint.ts';

// Build-time only: turns the Markdown guides into the data of the app's Guides page.
// Loaded by the Vite config too, hence the imports with their file extension.
// Nothing here ships in the app, which receives ready-made HTML.

const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Where a link between guides leads inside the app, or null for any other link. */
function appRoute(from: string, href: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null;
  const target = resolveLink(from, href);
  if (/^[a-z]{2}\/README\.md$/.test(target)) return '#/guides';
  return /^[a-z]{2}\/[a-z0-9-]+\/[a-z0-9-]+\.md$/.test(target) ? `#/guides/${target.slice(0, -3)}` : null;
}

/**
 * Renders a guide to HTML, without its title. Links to other guides stay in the app,
 * other links open in a new tab. `path` is the guide's path in the guides folder.
 */
export function renderGuide(path: string, markdown: string): string {
  const never = TEMPLATES[path.split('/')[0] as GuideLang]?.never;
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const mark = depth === 2 && text === never ? ' class="never"' : '';
        return `<h${depth}${mark}>${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const route = appRoute(path, href);
        if (route) return `<a href="${route}">${text}</a>`;
        return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
    },
  });
  const body = markdown.replace(/^# .*\r?\n/, '');
  // The summary is the first block: give it its own look.
  return marked.parse(body, { async: false }).replace('<blockquote>', '<blockquote class="summary">').trim();
}

/**
 * Builds the guides of one language, in the order of its table of contents.
 * `files` maps paths relative to the guides folder to their content.
 */
export function buildLibrary(files: Record<string, string>, lang: GuideLang): GuideLibrary {
  const readme = files[`${lang}/README.md`];
  if (readme === undefined) throw new Error(`guides/${lang}/README.md is missing`);
  return {
    lang,
    themes: parseIndex(readme).map((theme) => ({
      slug: theme.slug,
      title: theme.title,
      guides: theme.entries.map((entry) => {
        const id = `${lang}/${entry.theme}/${entry.slug}`;
        const markdown = files[`${id}.md`];
        if (markdown === undefined) throw new Error(`guides/${lang}/README.md lists ${id}.md, which does not exist`);
        return { id, title: entry.title, description: entry.description, html: renderGuide(`${id}.md`, markdown) };
      }),
    })),
  };
}
