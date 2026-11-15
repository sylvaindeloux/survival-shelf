import { parseShelf } from './document';
import type { Lang, ParseResult, Shelf } from './types';

export interface OpenResult extends ParseResult {
  /** Language the app must switch to, the one saved in the file; null when it already uses it. */
  switchTo: Lang | null;
}

/**
 * Reads a file for the app. The language saved in the file wins over the app's;
 * a file that does not say its language is taken as written in the app's one.
 */
export function openShelf(text: string, appLang: Lang): OpenResult {
  const result = parseShelf(text, { lang: appLang });
  const fileLang = result.shelf.settings.lang;
  return { ...result, switchTo: fileLang === appLang ? null : fileLang };
}

/** The shelf to save after the app language changed: the file is rewritten in `lang`. */
export function withLanguage(shelf: Shelf, lang: Lang): Shelf {
  return shelf.settings.lang === lang ? shelf : { ...shelf, settings: { ...shelf.settings, lang } };
}
