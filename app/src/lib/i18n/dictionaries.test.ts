import { describe, expect, it } from 'vitest';
import { COMPLETE_LANGS, LANGS, type Lang } from '../core/languages';
import { DICTIONARIES } from './dictionaries';
import { en } from './en';

type Key = keyof typeof en;
const KEYS = Object.keys(en) as Key[];

/** `{name}` placeholders of a message, which the app replaces with values. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
}

describe('translations', () => {
  for (const lang of LANGS) {
    const dictionary = DICTIONARIES[lang];
    const translated = KEYS.filter((key) => dictionary[key] !== undefined);

    describe(lang, () => {
      it('only uses keys of the English reference', () => {
        expect(Object.keys(dictionary).filter((key) => !(key in en))).toEqual([]);
      });

      it('has no empty message', () => {
        expect(translated.filter((key) => dictionary[key]?.trim() === '')).toEqual([]);
      });

      it('only uses placeholders that the English message has', () => {
        const unknown = translated.filter((key) =>
          placeholders(dictionary[key] ?? '').some((name) => !placeholders(en[key]).includes(name)),
        );
        expect(unknown).toEqual([]);
      });

      it('translates both forms of a plural together', () => {
        const half = translated.filter((key) => {
          const pair = key.endsWith('_one') ? key.replace(/_one$/, '_other') : key.replace(/_other$/, '_one');
          return pair !== key && dictionary[pair as Key] === undefined;
        });
        expect(half).toEqual([]);
      });

      if ((COMPLETE_LANGS as Lang[]).includes(lang)) {
        it('translates every message', () => {
          expect(KEYS.filter((key) => dictionary[key] === undefined)).toEqual([]);
        });
      } else {
        it('lists the messages still shown in English', () => {
          const missing = KEYS.filter((key) => dictionary[key] === undefined);
          if (missing.length > 0) console.info(`${lang}: ${missing.length} messages still in English:\n${missing.join('\n')}`);
        });
      }
    });
  }
});
