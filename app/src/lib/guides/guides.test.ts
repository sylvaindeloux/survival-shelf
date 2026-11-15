import { describe, expect, it } from 'vitest';
import { buildLibrary, renderGuide } from './build';
import { foldText, GUIDE_LANGS, guideLang, parseIndex, searchGuides } from './library';
import { lintGuides } from './lint';

// The real guides folder, at the root of the repository.
const FILES: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../../../../guides/**/*.md', { query: '?raw', import: 'default', eager: true }),
  ).map(([path, content]) => [path.slice(path.indexOf('/guides/') + '/guides/'.length), content]),
);

const guide = (title: string, lang: 'en' | 'fr', other: string) =>
  lang === 'fr'
    ? `# ${title}\n\n> **En bref** : court.\n\n## Étapes\n\n1. Agis.\n\n## Sources\n\n- [A](https://a.example)\n- [B](https://b.example)\n\n---\n\nFiche et sources vérifiées en novembre 2026. Elle ne remplace rien.\n\nEnglish version: ${other}\n`
    : `# ${title}\n\n> **In short**: short.\n\n## Steps\n\n1. Act.\n\n## Sources\n\n- [A](https://a.example)\n- [B](https://b.example)\n\n---\n\nGuide and sources checked in November 2026. It replaces nothing.\n\nVersion française : ${other}\n`;

/** A tiny, valid guides folder to break one rule at a time. */
function sample(): Record<string, string> {
  return {
    'README.md': '# Guides\n\n- [English](en/README.md)\n- [Français](fr/README.md)\n',
    'en/README.md': '# Guides\n\n## Water\n\n- [Boil water](water/boil-water.md): one minute.\n',
    'fr/README.md': '# Fiches\n\n## Eau\n\n- [Faire bouillir l’eau](eau/faire-bouillir-l-eau.md) : une minute.\n',
    'en/water/boil-water.md': guide('Boil water', 'en', '[Faire bouillir l’eau](../../fr/eau/faire-bouillir-l-eau.md)'),
    'fr/eau/faire-bouillir-l-eau.md': guide('Faire bouillir l’eau', 'fr', '[Boil water](../../en/water/boil-water.md)'),
  };
}

describe('the guides folder', () => {
  it('follows every rule of guides/CONTRIBUTING.md', () => {
    expect(lintGuides(FILES)).toEqual([]);
  });

  it('has the same guides in every language', () => {
    const counts = GUIDE_LANGS.map((lang) => parseIndex(FILES[`${lang}/README.md`]).map((theme) => theme.entries.length));
    expect(counts[0].length).toBeGreaterThan(0);
    for (const count of counts) expect(count).toEqual(counts[0]);
  });

  it('builds into the library the app shows', () => {
    for (const lang of GUIDE_LANGS) {
      const library = buildLibrary(FILES, lang);
      const guides = library.themes.flatMap((theme) => theme.guides);
      expect(guides.length).toBeGreaterThan(0);
      for (const { id, html } of guides) {
        expect(html, id).toMatch(/^<blockquote class="summary">/);
        expect(html, id).not.toContain('<h1');
        // No link is left pointing at a Markdown file: guides open in the app, sources in a new tab.
        expect(html, id).not.toMatch(/href="[^"#]*\.md"/);
        expect(html, id).toMatch(/href="#\/guides\/(en|fr)\/[a-z0-9-]+\/[a-z0-9-]+"/);
      }
    }
  });
});

describe('lintGuides', () => {
  it('accepts a valid folder', () => {
    expect(lintGuides(sample())).toEqual([]);
  });

  it('accepts a disaster guide with before, during and after instead of steps', () => {
    const files = sample();
    files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace('## Steps\n\n1. Act.', '## Before\n\nA.\n\n## During\n\nB.\n\n## After\n\nC.');
    expect(lintGuides(files)).toEqual([]);
  });

  const broken: [string, (files: Record<string, string>) => void, RegExp][] = [
    ['a missing translation', (files) => delete files['en/water/boil-water.md'], /leads nowhere/],
    ['a guide missing from its table of contents', (files) => (files['en/README.md'] = '# Guides\n'), /is not listed/],
    ['a file name with capitals or accents', (files) => (files['fr/eau/Été.md'] = 'x'), /lowercase/],
    ['a missing summary', (files) => (files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace('> **In short**: short.', 'Short.')), /summary line/],
    ['an unknown section', (files) => (files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace('## Steps', '## How to')), /not a section of the template/],
    ['sections out of order', (files) => (files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace('## Steps', '## See also\n\nA.\n\n## Steps')), /out of order/],
    ['a single source', (files) => (files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace('- [B](https://b.example)\n', '')), /two sources/],
    ['an http link', (files) => (files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace('https://a.example', 'http://a.example')), /must be an https link/],
    ['HTML', (files) => (files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace('1. Act.', '1. <b>Act</b>.')), /no HTML/],
    ['a missing footer', (files) => (files['en/water/boil-water.md'] = files['en/water/boil-water.md'].replace(/\n---[^]*$/, '\n')), /must end with/],
    ['a wrong title in the table of contents', (files) => (files['en/README.md'] = files['en/README.md'].replace('[Boil water]', '[Boiling]')), /is not the title/],
    ['a wrong title in the link to the other language', (files) => (files['fr/eau/faire-bouillir-l-eau.md'] = files['fr/eau/faire-bouillir-l-eau.md'].replace('[Boil water]', '[Boiling]')), /must show the title/],
  ];
  for (const [name, breakIt, expected] of broken) {
    it(`reports ${name}`, () => {
      const files = sample();
      breakIt(files);
      expect(lintGuides(files).join('\n')).toMatch(expected);
    });
  }
});

describe('renderGuide', () => {
  it('keeps links between guides in the app and opens sources in a new tab', () => {
    const html = renderGuide('fr/eau/a.md', '# A\n\nVoir [B](b.md), [C](../../en/water/c.md) et [la source](https://example.org/?a=1&b=2).\n');
    expect(html).toContain('<a href="#/guides/fr/eau/b">B</a>');
    expect(html).toContain('<a href="#/guides/en/water/c">C</a>');
    expect(html).toContain('<a href="https://example.org/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">la source</a>');
    expect(html).not.toContain('<h1');
  });

  it('marks the summary and what never to do', () => {
    const html = renderGuide('en/water/a.md', '# A\n\n> **In short**: short.\n\n## Steps\n\n## Never do this\n\n- Drink it.\n');
    expect(html).toContain('<blockquote class="summary">');
    expect(html).toContain('<h2>Steps</h2>');
    expect(html).toContain('<h2 class="never">Never do this</h2>');
  });
});

describe('guideLang', () => {
  it('falls back to English for a language without guides', () => {
    expect(guideLang('fr')).toBe('fr');
    expect(guideLang('de')).toBe('en');
    expect(guideLang('')).toBe('en');
  });
});

describe('searchGuides', () => {
  const library = buildLibrary(sample(), 'fr');

  it('ignores case, accents and apostrophes', () => {
    expect(foldText('L’Été, à l’œil')).toBe('l ete a l oeil');
    expect(searchGuides(library, 'BOUILLIR l\'eau').map((match) => match.guide.title)).toEqual(['Faire bouillir l’eau']);
  });

  it('searches the text of the guides and needs every word', () => {
    expect(searchGuides(library, 'agis')).toHaveLength(1);
    expect(searchGuides(library, 'agis introuvable')).toHaveLength(0);
    expect(searchGuides(library, '  ')).toHaveLength(0);
  });
});
