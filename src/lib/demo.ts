import { formatDay, type Day } from './core/dates';
import { emptyShelf } from './core/defaults';
import { PRESETS } from './core/presets';
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

/** Preset English name, target, lots. */
const DEMO: [string, number, DemoLot[]][] = [
  ['Water pack 6 × 1.5 L', 10, [{ qty: 4, in: 200, where: 'garage' }, { qty: 3, in: 480, where: 'garage' }]],
  ['Water bottle 1.5 L', 4, [{ qty: 4, in: 300, where: 'bag' }]],
  ['Rice', 10, [{ qty: 3, in: 40, where: 'kitchen' }, { qty: 5, in: 700, where: 'cellar' }]],
  ['Pasta', 8, [{ qty: 2, in: 25, where: 'kitchen' }, { qty: 4, in: 320, where: 'cellar' }]],
  ['Dried lentils', 4, [{ qty: 2, in: 540, where: 'cellar' }]],
  ['Canned tuna 140 g', 24, [{ qty: 6, in: 45, where: 'kitchen' }, { qty: 12, in: 900, where: 'cellar' }]],
  ['Canned vegetables 400 g', 20, [{ qty: 4, in: -12, where: 'cellar' }, { qty: 8, in: 400, where: 'cellar' }]],
  ['Freeze-dried meal', 12, [{ qty: 6, in: 2400, where: 'cellar' }, { qty: 3, in: 2400, where: 'bag' }]],
  ['Vegetable oil', 3, [{ qty: 2, in: 150, where: 'kitchen' }]],
  ['Sugar', 2, [{ qty: 2, in: null, where: 'cellar' }]],
  ['Chocolate 100 g', 10, [{ qty: 4, in: 80, where: 'kitchen' }]],
  ['AA batteries', 24, [{ qty: 16, in: 2900, where: 'garage' }]],
  ['First aid kit', 2, [{ qty: 1, in: null, where: 'bag' }]],
  ['Paracetamol', 2, [{ qty: 1, in: 20, where: 'bag' }]],
  ['Candles', 20, [{ qty: 20, in: null, where: 'garage' }]],
];

/** A realistic sample stock, with dates relative to today so every state shows up. */
export function demoShelf(today: Day, lang: Lang): Shelf {
  let shelf = emptyShelf();
  for (const [name, target, lots] of DEMO) {
    const preset = PRESETS.find((candidate) => candidate.name.en === name);
    if (!preset) continue;
    const productName = preset.name[lang];
    shelf = upsertProduct(shelf, {
      name: productName,
      category: preset.category,
      unit: preset.unit[lang],
      kcal: preset.kcal,
      water: preset.water,
      target,
      notes: '',
      extra: {},
    });
    for (const lot of lots) {
      shelf = addLot(
        shelf,
        {
          product: productName,
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
