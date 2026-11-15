import type { Layout, SectionLayout, SectionName, Settings, Shelf } from './types';

export const DEFAULT_TIERS = [3, 7, 30, 365];

export const DEFAULT_SETTINGS: Settings = {
  people: 1,
  cats: 0,
  dogs: 0,
  kcalPerPersonPerDay: 2200,
  waterPerPersonPerDay: 3,
  tiers: DEFAULT_TIERS,
  rhythm: 'monthly',
  warningDays: 60,
  rotationMarginDays: 30,
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

export const SECTION_ORDER: SectionName[] = ['settings', 'products', 'stock', 'log'];

export const DEFAULT_PREAMBLE = `# Survival Shelf

> Data file of [Survival Shelf](https://github.com/sylvaindeloux/survival-shelf).
> You can edit it with any text editor: keep the \`## Section\` titles and the table header rows.
> Dates are written \`YYYY-MM-DD\`, or \`YYYY-MM\` for "end of that month". Decimals use a dot.
> Full syntax: https://github.com/sylvaindeloux/survival-shelf/blob/master/docs/FILE_FORMAT.md
`;

const SECTION_DEFAULTS: Record<SectionName, SectionLayout> = {
  settings: { heading: 'Settings', before: '', after: '', table: null },
  products: {
    heading: 'Products',
    before:
      '<!-- One row per product. Kcal and Water are per unit. Daily use sets what each tier needs, Target is a minimum to own. Per: person, household, cat or dog. -->',
    after: '',
    table: null,
  },
  stock: {
    heading: 'Stock',
    before: '<!-- One row per lot: same product, same expiry date, same location. -->',
    after: '',
    table: null,
  },
  log: {
    heading: 'Log',
    before: '<!-- What was consumed or discarded. Action is "consumed" or "discarded". -->',
    after: '',
    table: null,
  },
};

export function defaultSectionLayout(name: SectionName): SectionLayout {
  return { ...SECTION_DEFAULTS[name] };
}

export function defaultLayout(): Layout {
  return {
    blocks: [{ type: 'raw', text: DEFAULT_PREAMBLE.trim() }, ...SECTION_ORDER.map((name) => ({ type: 'section' as const, name }))],
    sections: Object.fromEntries(SECTION_ORDER.map((name) => [name, defaultSectionLayout(name)])),
    settingsLabels: {},
  };
}

export function emptyShelf(): Shelf {
  return {
    settings: defaultSettings(),
    settingsExtra: [],
    products: [],
    lots: [],
    log: [],
    layout: defaultLayout(),
  };
}
