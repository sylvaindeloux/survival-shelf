/**
 * The languages of the app and of the data file. Adding a language starts here:
 * see .github/TRANSLATING.md.
 */
export interface Language {
  /** Name of the language, written in that language, as shown in the language lists. */
  name: string;
  /** Other names accepted in the Language setting of the data file, besides the code and the name. */
  aliases: string[];
  /** Whether the data file writes decimal numbers with a comma. */
  decimalComma: boolean;
  /** Translated README, from the repository root, with the anchor of its "get started" section. */
  readme?: string;
  /** Translated file format guide, from the repository root. */
  fileFormat?: string;
}

export const LANGUAGES = {
  en: {
    name: 'English',
    aliases: ['anglais'],
    decimalComma: false,
    readme: 'README.md#get-started',
    fileFormat: 'docs/FILE_FORMAT.md',
  },
  fr: {
    name: 'Français',
    aliases: ['french'],
    decimalComma: true,
    readme: 'README.fr.md#pour-commencer',
    fileFormat: 'docs/FILE_FORMAT.fr.md',
  },
} satisfies Record<string, Language>;

/** Languages the app and the data file can be written in. */
export type Lang = keyof typeof LANGUAGES;

export const LANGS = Object.keys(LANGUAGES) as Lang[];

/**
 * Languages that are always complete. Texts missing in the other languages
 * fall back to English.
 */
export type CompleteLang = 'en' | 'fr';

export const COMPLETE_LANGS: CompleteLang[] = ['en', 'fr'];

/** A text in each language: required in English and French, optional in the others. */
export type Translated = Record<CompleteLang, string> & Partial<Record<Lang, string>>;

/** The text in `lang`, or in English when it is not translated yet. */
export function inLang(text: Translated, lang: Lang): string {
  return text[lang] ?? text.en;
}

/** Every translation of a text, to recognize it whatever the language it is written in. */
export function translations(text: Translated): string[] {
  return LANGS.map((lang) => text[lang]).filter((value): value is string => value !== undefined);
}

/** Path of a doc in the repository, in `lang` when it is translated, in English otherwise. */
export function docPath(lang: Lang, doc: 'readme' | 'fileFormat'): string {
  const language: Language = LANGUAGES[lang];
  return language[doc] ?? LANGUAGES.en[doc];
}
