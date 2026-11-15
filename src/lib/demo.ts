import { CATALOG, productFromCatalog, starterItems } from './core/catalog';
import { formatDay, type Day } from './core/dates';
import { emptyShelf } from './core/defaults';
import { addLot, upsertProduct } from './core/stock';
import type { Shelf } from './core/types';
import type { Lang } from './i18n/index.svelte';

interface DemoLot {
  qty: number;
  /** Days from today, null for no expiry. */
  in: number | null;
  where: 'cellar' | 'kitchen' | 'garage' | 'bag';
}

const LOCATIONS: Record<Lang, Record<DemoLot['where'], string>> = {
  en: { cellar: 'Cellar', kitchen: 'Kitchen', garage: 'Garage', bag: '72h bag' },
  fr: { cellar: 'Cellier', kitchen: 'Cuisine', garage: 'Garage', bag: 'Sac 72h' },
};

/** Lots by catalog id: the first tier is nearly complete, the next ones are under way. */
const DEMO_LOTS: Record<string, DemoLot[]> = {
  'water-bottle': [{ qty: 24, in: 300, where: 'garage' }, { qty: 12, in: 500, where: 'garage' }],
  rice: [{ qty: 3, in: 40, where: 'kitchen' }, { qty: 5, in: 700, where: 'cellar' }],
  pasta: [{ qty: 2, in: 25, where: 'kitchen' }, { qty: 4, in: 320, where: 'cellar' }],
  oats: [{ qty: 1, in: 150, where: 'kitchen' }],
  lentils: [{ qty: 2, in: 540, where: 'cellar' }],
  tuna: [{ qty: 6, in: 45, where: 'kitchen' }, { qty: 12, in: 900, where: 'cellar' }],
  vegetables: [{ qty: 4, in: -12, where: 'cellar' }, { qty: 8, in: 400, where: 'cellar' }],
  fruit: [{ qty: 3, in: 200, where: 'cellar' }],
  'ready-meal': [{ qty: 4, in: 600, where: 'cellar' }],
  'milk-powder': [{ qty: 0.5, in: 250, where: 'kitchen' }],
  oil: [{ qty: 2, in: 150, where: 'kitchen' }],
  'peanut-butter': [{ qty: 1, in: 120, where: 'kitchen' }],
  sugar: [{ qty: 2, in: null, where: 'cellar' }],
  jam: [{ qty: 2, in: 400, where: 'cellar' }],
  chocolate: [{ qty: 4, in: 80, where: 'kitchen' }],
  biscuits: [{ qty: 3, in: 100, where: 'kitchen' }],
  nuts: [{ qty: 0.5, in: 160, where: 'kitchen' }],
  salt: [{ qty: 1, in: null, where: 'kitchen' }],
  'toilet-paper': [{ qty: 12, in: null, where: 'garage' }],
  soap: [{ qty: 2, in: 1000, where: 'garage' }],
  toothpaste: [{ qty: 2, in: 500, where: 'garage' }],
  'bin-bags': [{ qty: 1, in: null, where: 'garage' }],
  'first-aid-kit': [{ qty: 1, in: null, where: 'bag' }],
  paracetamol: [{ qty: 1, in: 20, where: 'bag' }],
  'aa-batteries': [{ qty: 16, in: 2900, where: 'garage' }],
  candles: [{ qty: 20, in: null, where: 'garage' }],
  'gas-cartridge': [{ qty: 4, in: null, where: 'garage' }],
  matches: [{ qty: 3, in: null, where: 'garage' }],
  headlamp: [{ qty: 1, in: null, where: 'bag' }],
  radio: [{ qty: 1, in: null, where: 'garage' }],
  stove: [{ qty: 1, in: null, where: 'garage' }],
  'can-opener': [{ qty: 1, in: null, where: 'kitchen' }],
  'survival-blanket': [{ qty: 2, in: null, where: 'bag' }],
};

/** A realistic sample stock for 2 people, with dates relative to today so every state shows up. */
export function demoShelf(today: Day, lang: Lang): Shelf {
  let shelf = emptyShelf();
  shelf.settings.people = 2;
  for (const entry of starterItems({})) {
    shelf = upsertProduct(shelf, productFromCatalog(entry, lang));
  }
  for (const [id, lots] of Object.entries(DEMO_LOTS)) {
    const entry = CATALOG.find((candidate) => candidate.id === id);
    if (!entry) continue;
    for (const lot of lots) {
      shelf = addLot(
        shelf,
        {
          product: entry.name[lang],
          qty: lot.qty,
          expires: lot.in === null ? '' : formatDay(today + lot.in),
          location: LOCATIONS[lang][lot.where],
          added: formatDay(today - 30),
        },
        today,
      );
    }
  }
  return shelf;
}
