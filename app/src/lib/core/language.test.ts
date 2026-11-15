import { describe, expect, it } from 'vitest';
import { emptyShelf } from './defaults';
import { parseShelf, serializeShelf } from './document';
import { openShelf, withLanguage } from './language';
import { emptyProduct } from './stock';

function shelfIn(lang: 'en' | 'fr') {
  const shelf = emptyShelf(lang);
  shelf.settings.people = 2;
  shelf.products.push({ ...emptyProduct('Riz'), category: 'grains', unit: 'kg', daily: 0.1 });
  shelf.lots.push({ id: 'a', product: 'Riz', qty: 2.5, expires: '2027-03', location: 'Cave', added: '', extra: {} });
  return shelf;
}

describe('opening a file', () => {
  it('switches the app to the language saved in the file', () => {
    const text = serializeShelf(shelfIn('fr'));
    const result = openShelf(text, 'en');
    expect(result.switchTo).toBe('fr');
    expect(result.shelf.settings.lang).toBe('fr');
    expect(result.issues).toEqual([]);
  });

  it('keeps the app language when the file is written in it', () => {
    for (const lang of ['en', 'fr'] as const) {
      expect(openShelf(serializeShelf(shelfIn(lang)), lang).switchTo).toBeNull();
    }
  });

  it('reads a file without a language in the app language, and saves it in that language', () => {
    const text = '## Stock\n\n| Product | Qty |\n|---|---|\n| Rice | 2.5 |\n';
    const result = openShelf(text, 'fr');
    expect(result.switchTo).toBeNull();
    expect(result.shelf.settings.lang).toBe('fr');
    const saved = serializeShelf(result.shelf);
    expect(saved).toMatch(/\| Langue +\| fr +\|/);
    expect(saved).toMatch(/\| Rice +\| 2,5 +\|/);
  });
});

describe('changing the app language', () => {
  it('rewrites the file in the new language with the same data', () => {
    const french = shelfIn('fr');
    const english = withLanguage(french, 'en');
    const text = serializeShelf(english);
    expect(text).toContain('## Settings');
    expect(text).toMatch(/\| Language +\| en +\|/);
    expect(text).not.toContain('Paramètres');
    const again = parseShelf(text).shelf;
    expect(again.settings).toEqual({ ...french.settings, lang: 'en' });
    expect(again.products).toEqual(french.products);
    expect(again.lots.map(({ id: _id, ...lot }) => lot)).toEqual(french.lots.map(({ id: _id, ...lot }) => lot));
  });

  it('leaves the shelf untouched when the language does not change', () => {
    const shelf = shelfIn('en');
    expect(withLanguage(shelf, 'en')).toBe(shelf);
    expect(shelf.settings.lang).toBe('en');
    expect(withLanguage(shelf, 'fr').settings.lang).toBe('fr');
    expect(shelf.settings.lang).toBe('en');
  });
});
