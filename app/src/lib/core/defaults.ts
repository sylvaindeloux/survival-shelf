import { defaultEmergency } from './emergency';
import { inLang, translations } from './languages';
import { type Lang, type Layout, type SectionLayout, type SectionName, type Settings, type Shelf, type Translated } from './types';

export const DEFAULT_TIERS = [3, 7, 30, 365];

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  people: 1,
  cats: 0,
  dogs: 0,
  kcalPerPersonPerDay: 2200,
  waterPerPersonPerDay: 3,
  tiers: DEFAULT_TIERS,
  rhythm: 'monthly',
  warningDays: 60,
  rotationMarginDays: 30,
  emergencyReviewed: '',
};

/**
 * Liters of water a pet drinks per day, added to the household water need.
 * A 4 kg cat needs about 50 mL per kg (Royal Canin Academy), and nearly all of
 * it is drunk on dry food. A medium dog (20 to 25 kg) on dry food drinks about
 * 63 to 73 mL per kg (Zanghi & Gardner, Frontiers in Veterinary Science, 2018).
 */
export const PET_WATER_PER_DAY = { cat: 0.25, dog: 1.5 };

export function defaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS, tiers: [...DEFAULT_TIERS] };
}

/** The emergency info comes right after the settings: it is what someone reads first in a crisis. */
export const SECTION_ORDER: SectionName[] = ['settings', 'emergency', 'products', 'stock', 'log'];

const REPO = 'https://github.com/sylvaindeloux/survival-shelf';

/** Introduction written at the top of a new file. */
export const DEFAULT_PREAMBLE: Translated = {
  en: `# Survival Shelf

> Data file of [Survival Shelf](${REPO}).
> You can edit it with any text editor: keep the \`## Section\` titles and the table header rows.
> Dates are written \`YYYY-MM-DD\`, or \`YYYY-MM\` for "end of that month". Decimals use a dot.
> Full syntax: ${REPO}/blob/master/docs/FILE_FORMAT.md`,
  fr: `# Survival Shelf

> Fichier de données de [Survival Shelf](${REPO}).
> Tu peux le modifier avec n'importe quel éditeur de texte : garde les titres \`## Section\` et les lignes d'en-tête des tableaux.
> Les dates s'écrivent \`AAAA-MM-JJ\`, ou \`AAAA-MM\` pour « fin de ce mois ». Les décimales prennent une virgule.
> Syntaxe complète : ${REPO}/blob/master/docs/FILE_FORMAT.fr.md`,
};

/** Section titles written by the app. */
export const SECTION_HEADINGS: Record<SectionName, Translated> = {
  settings: { en: 'Settings', fr: 'Paramètres' },
  emergency: { en: 'Emergency info', fr: 'Infos d’urgence' },
  products: { en: 'Products', fr: 'Produits' },
  stock: { en: 'Stock', fr: 'Stock' },
  log: { en: 'Log', fr: 'Journal' },
};

/** Help comments written under the section titles. */
export const SECTION_COMMENTS: Record<SectionName, Translated> = {
  settings: { en: '', fr: '' },
  emergency: {
    en: '<!-- The household plan, one row per line. Topic: emergency number, out-of-area contact, contact, meeting point, who does what, shut-off or health. Write SMS before a number that only takes text messages. -->',
    fr: '<!-- Le plan du foyer, une ligne par info. Rubrique : numéro d’urgence, contact éloigné, contact, rendez-vous, qui fait quoi, couper ou santé. Écris SMS devant un numéro qui ne prend que les SMS. -->',
  },
  products: {
    en: '<!-- One row per product. Type: food, consumable or gear. Kcal and Water are per unit. Daily use sets what each tier needs, Target is a minimum to own. Per: person, household, cat or dog. -->',
    fr: '<!-- Une ligne par produit. Type : vivres, consommable ou matériel. Kcal et Eau sont par unité. Conso/jour fixe ce qu’il faut pour chaque palier, Objectif est un minimum à avoir. Par : personne, foyer, chat ou chien. -->',
  },
  stock: {
    en: '<!-- One row per lot: same product, same expiry date, same location. -->',
    fr: '<!-- Une ligne par lot : même produit, même date de péremption, même emplacement. -->',
  },
  log: {
    en: '<!-- What was consumed or discarded. Action is "consumed" or "discarded". -->',
    fr: '<!-- Ce qui a été consommé ou jeté. Action vaut « consommé » ou « jeté ». -->',
  },
};

/** The text written by the app in `lang` when `text` is one of its default texts, in any language. */
export function translateDefault(text: string, defaults: Translated, lang: Lang): string {
  const trimmed = text.trim();
  return translations(defaults).some((candidate) => candidate !== '' && candidate.trim() === trimmed)
    ? inLang(defaults, lang)
    : text;
}

export function defaultSectionLayout(name: SectionName, lang: Lang = 'en'): SectionLayout {
  return { heading: inLang(SECTION_HEADINGS[name], lang), before: inLang(SECTION_COMMENTS[name], lang), after: '', table: null };
}

export function defaultLayout(lang: Lang = 'en'): Layout {
  return {
    blocks: [{ type: 'raw', text: inLang(DEFAULT_PREAMBLE, lang) }, ...SECTION_ORDER.map((name) => ({ type: 'section' as const, name }))],
    sections: Object.fromEntries(SECTION_ORDER.map((name) => [name, defaultSectionLayout(name, lang)])),
    settingsLabels: {},
  };
}

/** A new, empty stock written in `lang`. */
export function emptyShelf(lang: Lang = 'en'): Shelf {
  return {
    settings: { ...defaultSettings(), lang },
    settingsExtra: [],
    products: [],
    lots: [],
    log: [],
    emergency: defaultEmergency(lang),
    layout: defaultLayout(lang),
  };
}
