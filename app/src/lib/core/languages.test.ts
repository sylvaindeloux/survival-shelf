import { describe, expect, it } from 'vitest';
import { docPath, inLang, LANGS, translations, type Translated } from './languages';
import { formatNumber } from './text';

describe('languages', () => {
  it('lists English first, as the reference', () => {
    expect(LANGS[0]).toBe('en');
  });

  it('falls back to English for a text not translated yet', () => {
    const text = { en: 'Water', fr: 'Eau' } as Translated;
    expect(inLang(text, 'fr')).toBe('Eau');
    expect(inLang({ en: 'Water' } as Translated, 'fr')).toBe('Water');
  });

  it('lists only the translations that exist', () => {
    expect(translations({ en: 'Water' } as Translated)).toEqual(['Water']);
    expect(translations({ en: 'Water', fr: 'Eau' })).toEqual(['Water', 'Eau']);
  });

  it('points to the docs of the language', () => {
    expect(docPath('en', 'fileFormat')).toBe('docs/FILE_FORMAT.md');
    expect(docPath('fr', 'fileFormat')).toBe('docs/FILE_FORMAT.fr.md');
    expect(docPath('fr', 'readme')).toBe('README.fr.md#pour-commencer');
  });

  it('writes decimal commas in the languages that use them', () => {
    expect(formatNumber(2.5, 'en')).toBe('2.5');
    expect(formatNumber(2.5, 'fr')).toBe('2,5');
  });
});
