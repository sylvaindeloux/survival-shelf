/**
 * Common survival stock items with approximate values, to pre-fill a new
 * product. Always check the packaging: values vary between brands.
 */
export interface Preset {
  name: { en: string; fr: string };
  category: string;
  unit: { en: string; fr: string };
  kcal: number | null;
  water: number | null;
}

const KG = { en: 'kg', fr: 'kg' };
const L = { en: 'L', fr: 'L' };
const CAN = { en: 'can', fr: 'boîte' };
const JAR = { en: 'jar', fr: 'pot' };
const PACK = { en: 'pack', fr: 'paquet' };
const UNIT = { en: 'unit', fr: 'pièce' };
const POUCH = { en: 'pouch', fr: 'sachet' };
const BOTTLE = { en: 'bottle', fr: 'bouteille' };
const ROLL = { en: 'roll', fr: 'rouleau' };
const BAR = { en: 'bar', fr: 'tablette' };

export const PRESETS: Preset[] = [
  { name: { en: 'Water', fr: 'Eau' }, category: 'water', unit: L, kcal: null, water: 1 },
  { name: { en: 'Water bottle 1.5 L', fr: 'Bouteille d’eau 1,5 L' }, category: 'water', unit: BOTTLE, kcal: null, water: 1.5 },
  { name: { en: 'Water pack 6 × 1.5 L', fr: 'Pack d’eau 6 × 1,5 L' }, category: 'water', unit: PACK, kcal: null, water: 9 },
  { name: { en: 'Water purification tablets', fr: 'Pastilles de purification d’eau' }, category: 'water', unit: UNIT, kcal: null, water: null },
  { name: { en: 'Rice', fr: 'Riz' }, category: 'grains', unit: KG, kcal: 3600, water: null },
  { name: { en: 'Pasta', fr: 'Pâtes' }, category: 'grains', unit: KG, kcal: 3550, water: null },
  { name: { en: 'Flour', fr: 'Farine' }, category: 'grains', unit: KG, kcal: 3400, water: null },
  { name: { en: 'Oats', fr: 'Flocons d’avoine' }, category: 'grains', unit: KG, kcal: 3800, water: null },
  { name: { en: 'Rusks', fr: 'Biscottes' }, category: 'grains', unit: PACK, kcal: 1200, water: null },
  { name: { en: 'Dried lentils', fr: 'Lentilles sèches' }, category: 'legumes', unit: KG, kcal: 3500, water: null },
  { name: { en: 'Dried chickpeas', fr: 'Pois chiches secs' }, category: 'legumes', unit: KG, kcal: 3600, water: null },
  { name: { en: 'Dried beans', fr: 'Haricots secs' }, category: 'legumes', unit: KG, kcal: 3400, water: null },
  { name: { en: 'Canned tuna 140 g', fr: 'Thon en boîte 140 g' }, category: 'canned', unit: CAN, kcal: 150, water: null },
  { name: { en: 'Canned sardines', fr: 'Sardines à l’huile' }, category: 'canned', unit: CAN, kcal: 250, water: null },
  { name: { en: 'Canned vegetables 400 g', fr: 'Légumes en conserve 400 g' }, category: 'canned', unit: CAN, kcal: 120, water: null },
  { name: { en: 'Canned beans 400 g', fr: 'Haricots en conserve 400 g' }, category: 'canned', unit: CAN, kcal: 300, water: null },
  { name: { en: 'Canned fruit 400 g', fr: 'Fruits au sirop 400 g' }, category: 'canned', unit: CAN, kcal: 250, water: null },
  { name: { en: 'Canned ready meal 800 g', fr: 'Plat cuisiné en boîte 800 g' }, category: 'ready-meals', unit: CAN, kcal: 700, water: null },
  { name: { en: 'Freeze-dried meal', fr: 'Repas lyophilisé' }, category: 'ready-meals', unit: POUCH, kcal: 500, water: null },
  { name: { en: 'Emergency ration 2400 kcal', fr: 'Ration de survie 2400 kcal' }, category: 'ready-meals', unit: PACK, kcal: 2400, water: null },
  { name: { en: 'UHT milk', fr: 'Lait UHT' }, category: 'dairy', unit: L, kcal: 460, water: null },
  { name: { en: 'Milk powder', fr: 'Lait en poudre' }, category: 'dairy', unit: KG, kcal: 4900, water: null },
  { name: { en: 'Vegetable oil', fr: 'Huile végétale' }, category: 'fats', unit: L, kcal: 8200, water: null },
  { name: { en: 'Peanut butter 350 g', fr: 'Beurre de cacahuète 350 g' }, category: 'fats', unit: JAR, kcal: 2100, water: null },
  { name: { en: 'Sugar', fr: 'Sucre' }, category: 'sweets', unit: KG, kcal: 4000, water: null },
  { name: { en: 'Honey', fr: 'Miel' }, category: 'sweets', unit: KG, kcal: 3000, water: null },
  { name: { en: 'Jam 370 g', fr: 'Confiture 370 g' }, category: 'sweets', unit: JAR, kcal: 900, water: null },
  { name: { en: 'Chocolate 100 g', fr: 'Chocolat 100 g' }, category: 'sweets', unit: BAR, kcal: 550, water: null },
  { name: { en: 'Biscuits 200 g', fr: 'Biscuits 200 g' }, category: 'sweets', unit: PACK, kcal: 950, water: null },
  { name: { en: 'Nuts', fr: 'Fruits secs (noix, amandes)' }, category: 'sweets', unit: KG, kcal: 6000, water: null },
  { name: { en: 'Dried fruit', fr: 'Fruits séchés' }, category: 'sweets', unit: KG, kcal: 3000, water: null },
  { name: { en: 'Coffee', fr: 'Café' }, category: 'drinks', unit: KG, kcal: null, water: null },
  { name: { en: 'Tea', fr: 'Thé' }, category: 'drinks', unit: PACK, kcal: null, water: null },
  { name: { en: 'Salt', fr: 'Sel' }, category: 'condiments', unit: KG, kcal: null, water: null },
  { name: { en: 'Toilet paper', fr: 'Papier toilette' }, category: 'hygiene', unit: ROLL, kcal: null, water: null },
  { name: { en: 'Soap', fr: 'Savon' }, category: 'hygiene', unit: UNIT, kcal: null, water: null },
  { name: { en: 'First aid kit', fr: 'Trousse de secours' }, category: 'medical', unit: UNIT, kcal: null, water: null },
  { name: { en: 'Paracetamol', fr: 'Paracétamol' }, category: 'medical', unit: PACK, kcal: null, water: null },
  { name: { en: 'AA batteries', fr: 'Piles AA' }, category: 'energy', unit: UNIT, kcal: null, water: null },
  { name: { en: 'Candles', fr: 'Bougies' }, category: 'energy', unit: UNIT, kcal: null, water: null },
  { name: { en: 'Gas cartridge', fr: 'Cartouche de gaz' }, category: 'energy', unit: UNIT, kcal: null, water: null },
  { name: { en: 'Matches', fr: 'Allumettes' }, category: 'tools', unit: PACK, kcal: null, water: null },
];
