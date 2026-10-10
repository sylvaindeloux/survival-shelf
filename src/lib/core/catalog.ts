import { sameName } from './text';
import type { Per, Product } from './types';

/**
 * Built-in catalog of common survival stock items, with approximate values,
 * used by the setup wizard and to pre-fill new products. Always check the
 * packaging: values vary between brands.
 */
export interface CatalogItem {
  /** Stable identifier (English slug). */
  id: string;
  name: { en: string; fr: string };
  category: string;
  unit: { en: string; fr: string };
  kcal: number | null;
  water: number | null;
  /** Suggested daily use, null for things that are not used up day by day. */
  daily: number | null;
  per: Per;
  /** Suggested minimum to own whatever the tier. */
  target: number | null;
  /** Typical shelf life in months when stored well, null when it does not really expire. */
  shelfLife: number | null;
  /** Proposed by default in the starter plan. */
  starter?: boolean;
  /** Only proposed for a household with this need. */
  need?: Need;
}

export type Need = 'cat' | 'dog' | 'treatment';

/** Setup wizard answers: number of cats and dogs, 1 for a daily medicine. */
export type Needs = Partial<Record<Need, number>>;

const KG = { en: 'kg', fr: 'kg' };
const L = { en: 'L', fr: 'L' };
const CAN = { en: 'can', fr: 'boîte' };
const BOX = { en: 'box', fr: 'boîte' };
const JAR = { en: 'jar', fr: 'pot' };
const PACK = { en: 'pack', fr: 'paquet' };
const UNIT = { en: 'unit', fr: 'pièce' };
const POUCH = { en: 'pouch', fr: 'sachet' };
const BOTTLE = { en: 'bottle', fr: 'bouteille' };
const ROLL = { en: 'roll', fr: 'rouleau' };
const BAR = { en: 'bar', fr: 'tablette' };
const TUBE = { en: 'tube', fr: 'tube' };
const CARTRIDGE = { en: 'cartridge', fr: 'cartouche' };
const TABLET = { en: 'tablet', fr: 'comprimé' };

type Values = Omit<CatalogItem, 'id' | 'name' | 'category' | 'unit'>;

function item(
  id: string,
  name: CatalogItem['name'],
  category: string,
  unit: CatalogItem['unit'],
  values: Partial<Values>,
): CatalogItem {
  return { id, name, category, unit, kcal: null, water: null, daily: null, per: 'person', target: null, shelfLife: null, ...values };
}

export const CATALOG: CatalogItem[] = [
  // Water: the water need (Settings) sets how much, the first water product of the plan is used to buy it.
  item('water-bottle', { en: 'Water bottle 1.5 L', fr: 'Bouteille d’eau 1,5 L' }, 'water', BOTTLE, { water: 1.5, shelfLife: 24, starter: true }),
  item('water-pack', { en: 'Water pack 6 × 1.5 L', fr: 'Pack d’eau 6 × 1,5 L' }, 'water', PACK, { water: 9, shelfLife: 24 }),
  item('water-can', { en: 'Water can 5 L', fr: 'Bidon d’eau 5 L' }, 'water', UNIT, { water: 5, shelfLife: 24 }),
  item('water', { en: 'Water', fr: 'Eau' }, 'water', L, { water: 1, shelfLife: 24 }),
  item('water-filter', { en: 'Water filter (1500 L)', fr: 'Filtre à eau (1500 L)' }, 'water-treatment', UNIT, { water: 1500, starter: true }),
  item('purification-tablets', { en: 'Purification tablets (box of 50)', fr: 'Pastilles de purification (boîte de 50)' }, 'water-treatment', BOX, { water: 50, shelfLife: 60 }),

  // Food: daily use per person, the starter menu adds up to about 2200 kcal.
  item('rice', { en: 'Rice', fr: 'Riz' }, 'grains', KG, { kcal: 3600, daily: 0.1, shelfLife: 24, starter: true }),
  item('pasta', { en: 'Pasta', fr: 'Pâtes' }, 'grains', KG, { kcal: 3550, daily: 0.09, shelfLife: 24, starter: true }),
  item('oats', { en: 'Oats', fr: 'Flocons d’avoine' }, 'grains', KG, { kcal: 3800, daily: 0.055, shelfLife: 12, starter: true }),
  item('flour', { en: 'Flour', fr: 'Farine' }, 'grains', KG, { kcal: 3400, shelfLife: 12 }),
  item('rusks', { en: 'Rusks', fr: 'Biscottes' }, 'grains', PACK, { kcal: 1200, shelfLife: 12 }),
  item('lentils', { en: 'Dried lentils', fr: 'Lentilles sèches' }, 'legumes', KG, { kcal: 3500, daily: 0.04, shelfLife: 24, starter: true }),
  item('chickpeas', { en: 'Dried chickpeas', fr: 'Pois chiches secs' }, 'legumes', KG, { kcal: 3600, shelfLife: 24 }),
  item('beans', { en: 'Dried beans', fr: 'Haricots secs' }, 'legumes', KG, { kcal: 3400, shelfLife: 24 }),
  item('tuna', { en: 'Canned tuna 140 g', fr: 'Thon en boîte 140 g' }, 'canned', CAN, { kcal: 150, daily: 0.25, shelfLife: 48, starter: true }),
  item('sardines', { en: 'Canned sardines', fr: 'Sardines à l’huile' }, 'canned', CAN, { kcal: 250, shelfLife: 60 }),
  item('vegetables', { en: 'Canned vegetables 400 g', fr: 'Légumes en conserve 400 g' }, 'canned', CAN, { kcal: 120, daily: 0.5, shelfLife: 36, starter: true }),
  item('canned-beans', { en: 'Canned beans 400 g', fr: 'Haricots en conserve 400 g' }, 'canned', CAN, { kcal: 300, shelfLife: 36 }),
  item('fruit', { en: 'Canned fruit 400 g', fr: 'Fruits au sirop 400 g' }, 'canned', CAN, { kcal: 250, daily: 0.15, shelfLife: 24, starter: true }),
  item('ready-meal', { en: 'Canned ready meal 800 g', fr: 'Plat cuisiné en boîte 800 g' }, 'ready-meals', CAN, { kcal: 700, daily: 0.15, shelfLife: 36, starter: true }),
  item('freeze-dried', { en: 'Freeze-dried meal', fr: 'Repas lyophilisé' }, 'ready-meals', POUCH, { kcal: 500, shelfLife: 300 }),
  item('ration', { en: 'Emergency ration 2400 kcal', fr: 'Ration de survie 2400 kcal' }, 'ready-meals', PACK, { kcal: 2400, shelfLife: 60 }),
  item('milk-powder', { en: 'Milk powder', fr: 'Lait en poudre' }, 'dairy', KG, { kcal: 4900, daily: 0.025, shelfLife: 18, starter: true }),
  item('uht-milk', { en: 'UHT milk', fr: 'Lait UHT' }, 'dairy', L, { kcal: 460, shelfLife: 6 }),
  item('oil', { en: 'Vegetable oil', fr: 'Huile végétale' }, 'fats', L, { kcal: 8200, daily: 0.03, shelfLife: 18, starter: true }),
  item('peanut-butter', { en: 'Peanut butter 350 g', fr: 'Beurre de cacahuète 350 g' }, 'fats', JAR, { kcal: 2100, daily: 0.04, shelfLife: 12, starter: true }),
  item('sugar', { en: 'Sugar', fr: 'Sucre' }, 'sweets', KG, { kcal: 4000, daily: 0.03, starter: true }),
  item('honey', { en: 'Honey', fr: 'Miel' }, 'sweets', KG, { kcal: 3000 }),
  item('jam', { en: 'Jam 370 g', fr: 'Confiture 370 g' }, 'sweets', JAR, { kcal: 900, daily: 0.05, shelfLife: 24, starter: true }),
  item('chocolate', { en: 'Chocolate 100 g', fr: 'Chocolat 100 g' }, 'sweets', BAR, { kcal: 550, daily: 0.1, shelfLife: 12, starter: true }),
  item('biscuits', { en: 'Biscuits 200 g', fr: 'Biscuits 200 g' }, 'sweets', PACK, { kcal: 950, daily: 0.15, shelfLife: 12, starter: true }),
  item('nuts', { en: 'Nuts', fr: 'Fruits secs (noix, amandes)' }, 'sweets', KG, { kcal: 6000, daily: 0.02, shelfLife: 12, starter: true }),
  item('dried-fruit', { en: 'Dried fruit', fr: 'Fruits séchés' }, 'sweets', KG, { kcal: 3000, shelfLife: 12 }),
  item('coffee', { en: 'Coffee', fr: 'Café' }, 'drinks', KG, { shelfLife: 24 }),
  item('tea', { en: 'Tea', fr: 'Thé' }, 'drinks', PACK, { shelfLife: 24 }),
  item('salt', { en: 'Salt', fr: 'Sel' }, 'condiments', KG, { daily: 0.005, starter: true }),

  // Specific needs: per household, whatever the number of people. Pet items are per animal.
  item('cat-food', { en: 'Dry cat food', fr: 'Croquettes pour chat' }, 'pets', KG, { daily: 0.06, per: 'household', shelfLife: 12, need: 'cat' }),
  item('cat-litter', { en: 'Cat litter', fr: 'Litière pour chat' }, 'pets', KG, { daily: 0.15, per: 'household', need: 'cat' }),
  item('dog-food', { en: 'Dry dog food', fr: 'Croquettes pour chien' }, 'pets', KG, { daily: 0.25, per: 'household', shelfLife: 12, need: 'dog' }),
  item('daily-medicine', { en: 'Daily medicine', fr: 'Traitement quotidien' }, 'medical', TABLET, { daily: 1, per: 'household', shelfLife: 24, need: 'treatment' }),

  // Hygiene.
  item('toilet-paper', { en: 'Toilet paper', fr: 'Papier toilette' }, 'hygiene', ROLL, { daily: 0.2, starter: true }),
  item('soap', { en: 'Soap', fr: 'Savon' }, 'hygiene', BAR, { daily: 0.03, shelfLife: 36, starter: true }),
  item('toothpaste', { en: 'Toothpaste 75 ml', fr: 'Dentifrice 75 ml' }, 'hygiene', TUBE, { daily: 0.015, shelfLife: 24, starter: true }),
  item('bin-bags', { en: 'Bin bags (roll of 20)', fr: 'Sacs poubelle (rouleau de 20)' }, 'hygiene', ROLL, { daily: 0.05, per: 'household', starter: true }),

  // Health and first aid.
  item('first-aid-kit', { en: 'First aid kit', fr: 'Trousse de secours' }, 'medical', UNIT, { target: 1, per: 'household', starter: true }),
  item('paracetamol', { en: 'Paracetamol 500 mg', fr: 'Paracétamol 500 mg' }, 'medical', BOX, { target: 2, per: 'household', shelfLife: 36, starter: true }),

  // Energy and light.
  item('aa-batteries', { en: 'AA batteries', fr: 'Piles AA' }, 'energy', UNIT, { target: 12, per: 'household', shelfLife: 120, starter: true }),
  item('candles', { en: 'Candles', fr: 'Bougies' }, 'energy', UNIT, { daily: 0.2, per: 'household', starter: true }),
  item('gas-cartridge', { en: 'Gas cartridge', fr: 'Cartouche de gaz' }, 'energy', CARTRIDGE, { daily: 0.2, starter: true }),
  item('matches', { en: 'Matches', fr: 'Allumettes' }, 'energy', BOX, { target: 3, per: 'household', starter: true }),

  // Gear.
  item('headlamp', { en: 'Headlamp', fr: 'Lampe frontale' }, 'tools', UNIT, { target: 1, starter: true }),
  item('radio', { en: 'Hand-crank radio', fr: 'Radio à dynamo' }, 'tools', UNIT, { target: 1, per: 'household', starter: true }),
  item('stove', { en: 'Camping stove', fr: 'Réchaud à gaz' }, 'tools', UNIT, { target: 1, per: 'household', starter: true }),
  item('can-opener', { en: 'Manual can opener', fr: 'Ouvre-boîte manuel' }, 'tools', UNIT, { target: 1, per: 'household', starter: true }),
  item('multitool', { en: 'Multi-tool knife', fr: 'Couteau multifonction' }, 'tools', UNIT, { target: 1, per: 'household', starter: true }),
  item('survival-blanket', { en: 'Survival blanket', fr: 'Couverture de survie' }, 'tools', UNIT, { target: 1, starter: true }),
  item('jerrycan', { en: 'Jerrycan 20 L (empty)', fr: 'Jerrican 20 L (vide)' }, 'tools', UNIT, { target: 1, per: 'household' }),
  item('power-bank', { en: 'Power bank', fr: 'Batterie externe' }, 'energy', UNIT, { target: 1, per: 'household' }),
];

/** Catalog entry whose English or French name matches, if any. */
export function findCatalogItem(name: string): CatalogItem | undefined {
  return CATALOG.find((entry) => sameName(entry.name.en, name) || sameName(entry.name.fr, name));
}

/** Items proposed by the setup wizard for a household with these needs. */
export function starterItems(needs: Needs): CatalogItem[] {
  return CATALOG.filter((entry) => entry.starter || (entry.need !== undefined && (needs[entry.need] ?? 0) > 0));
}

/** Suggested daily use or minimum to own in the starter plan: pet items count once per animal. */
export function starterAmount(entry: CatalogItem, needs: Needs): number | null {
  const amount = entry.daily ?? entry.target;
  if (amount === null || entry.need === undefined) return amount;
  return Math.round(amount * (needs[entry.need] ?? 1) * 1000) / 1000;
}

/** A product ready to add to the shelf, named in the given language. */
export function productFromCatalog(entry: CatalogItem, lang: 'en' | 'fr'): Product {
  return {
    name: entry.name[lang],
    category: entry.category,
    unit: entry.unit[lang],
    kcal: entry.kcal,
    water: entry.water,
    daily: entry.daily,
    per: entry.per,
    target: entry.target,
    notes: '',
    extra: {},
  };
}
