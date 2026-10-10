import type { Layout, SectionLayout, SectionName, Settings, Shelf } from './types';

export const DEFAULT_SETTINGS: Settings = {
  people: 2,
  kcalPerPersonPerDay: 2200,
  waterPerPersonPerDay: 3,
  targetDays: 30,
  warningDays: 60,
  rotationMarginDays: 30,
};

export const SECTION_ORDER: SectionName[] = ['settings', 'products', 'stock', 'log'];

export const DEFAULT_PREAMBLE = `# Survival Shelf

> Data file of [Survival Shelf](https://github.com/sylvaindeloux/survival-shelf).
> You can edit it with any text editor: keep the \`## Section\` titles and the table header rows.
> Dates are written \`YYYY-MM-DD\`, or \`YYYY-MM\` for "end of that month". Decimals use a dot.
> Full syntax: https://github.com/sylvaindeloux/survival-shelf/blob/main/docs/FILE_FORMAT.md
`;

const SECTION_DEFAULTS: Record<SectionName, SectionLayout> = {
  settings: { heading: 'Settings', before: '', after: '', table: null },
  products: {
    heading: 'Products',
    before: '<!-- One row per product. Kcal and Water are per unit. Target is the quantity you want to keep in stock. -->',
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
    settings: { ...DEFAULT_SETTINGS },
    settingsExtra: [],
    products: [],
    lots: [],
    log: [],
    layout: defaultLayout(),
  };
}
