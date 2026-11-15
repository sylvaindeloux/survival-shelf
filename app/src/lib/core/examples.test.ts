import { describe, expect, it } from 'vitest';
import english from '../../../../docs/examples/survival-shelf.md?raw';
import french from '../../../../docs/examples/survival-shelf.fr.md?raw';
import { CATALOG } from './catalog';
import { parseShelf, serializeShelf } from './document';
import { LANGS, type Translated } from './languages';

/** One example file per language; English and French are required, the others are welcome. */
const EXAMPLES: Translated = { en: english, fr: french };

const LOCATIONS_FR_TO_EN: Record<string, string> = { Cellier: 'Cellar', Cuisine: 'Kitchen', Garage: 'Garage', 'Sac 72h': '72h bag' };

/** English name and unit of a product of the French example, from the catalog. */
function inEnglish(name: string) {
  const entry = CATALOG.find((candidate) => candidate.name.fr === name);
  if (!entry) throw new Error(`"${name}" is not in the catalog`);
  return { name: entry.name.en, unit: entry.unit.en };
}

describe('example files', () => {
  for (const lang of LANGS) {
    const example = EXAMPLES[lang];
    if (example === undefined) continue;

    it(`imports the ${lang} example without any issue, whatever the app language`, () => {
      for (const appLang of LANGS) {
        const { shelf, issues } = parseShelf(example, { lang: appLang });
        expect(issues).toEqual([]);
        expect(shelf.settings.lang).toBe(lang);
        expect(shelf.products.length).toBeGreaterThan(0);
        expect(shelf.lots.length).toBeGreaterThan(0);
        expect(shelf.log.length).toBeGreaterThan(0);
      }
    });

    it(`exports the ${lang} example exactly as it is written`, () => {
      expect(serializeShelf(parseShelf(example).shelf)).toBe(example);
    });
  }

  it('holds the same stock in English and in French', () => {
    const en = parseShelf(EXAMPLES.en).shelf;
    const fr = parseShelf(EXAMPLES.fr).shelf;
    expect({ ...fr.settings, lang: 'en' }).toEqual(en.settings);
    expect(fr.products.map((product) => ({ ...product, ...inEnglish(product.name) }))).toEqual(en.products);
    expect(
      fr.lots.map(({ id: _id, ...lot }) => ({
        ...lot,
        product: inEnglish(lot.product).name,
        location: LOCATIONS_FR_TO_EN[lot.location] ?? lot.location,
      })),
    ).toEqual(en.lots.map(({ id: _id, ...lot }) => lot));
    expect(fr.log.map((entry) => ({ ...entry, product: inEnglish(entry.product).name }))).toEqual(en.log);
    // The emergency info is written by the household: the same lines, in each language.
    const lines = (entries: typeof en.emergency) => entries.map(({ topic, phone }) => ({ topic, phone }));
    expect(lines(fr.emergency)).toEqual(lines(en.emergency));
    expect(en.emergency.length).toBeGreaterThan(0);
  });
});
