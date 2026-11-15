import type { Lang } from '../core/languages';
import { en, type Dictionary } from './en';
import { fr } from './fr';

/**
 * Messages of each language. English and French are complete; a message missing
 * in another language is shown in English.
 */
export const DICTIONARIES: Record<Lang, Dictionary> = { en, fr };
