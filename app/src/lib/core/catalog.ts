import { categoryKind } from './categories';
import { inLang, translations, type Lang, type Translated } from './languages';
import { sameName } from './text';
import type { Kind, Per, Product } from './types';

/**
 * Built-in catalog of common survival stock items, with approximate values,
 * used by the setup wizard and to pre-fill new products. Always check the
 * packaging: values vary between brands. Names never hold a size: it goes in
 * the unit ("can (140 g)"), which is what the amounts count.
 */
export interface CatalogItem {
  /** Stable identifier (English slug). */
  id: string;
  name: Translated;
  /** Food, consumable or gear: the kind of its category unless set. */
  kind: Kind;
  category: string;
  unit: Translated;
  kcal: number | null;
  water: number | null;
  /** Suggested daily use, null for things that are not used up day by day. */
  daily: number | null;
  per: Per;
  /** Suggested minimum to own whatever the tier. */
  target: number | null;
  /** Typical shelf life in months when stored well, null when it does not really expire. */
  shelfLife: number | null;
  /** What it is good for, in a few words. */
  use: Translated;
  /** A detail on how long it keeps, when one figure is not enough: it follows the shelf life after a comma. */
  keeps?: Translated;
  /** Upkeep or renewal, when there is something to do. */
  care?: Translated;
  /** Place in the starter list: checked from the start, or offered unchecked. */
  starter?: 'essential' | 'optional';
  /** Only proposed for a household with this need. */
  need?: Need;
  /** Only proposed with these habits: for each habit listed, one of these answers. */
  habits?: HabitFilter;
}

export type Need = 'cat' | 'dog' | 'treatment';

/** Setup wizard answers: number of cats and dogs, 1 for a daily medicine. */
export type Needs = Partial<Record<Need, number>>;

/** Setup wizard answers on how the household lives. */
export interface Habits {
  /** Water stored as bottles, tap water in jerrycans, or both. */
  water: 'bottles' | 'tap' | 'both';
  /** Beyond a month: only stored water, or water treated with a filter or tablets. */
  beyond: 'stored' | 'treatment';
  /** Can already cook without electricity, needs a stove, or prefers food that needs no cooking. */
  cooking: 'ready' | 'stove' | 'none';
}

export type HabitFilter = { [Habit in keyof Habits]?: Habits[Habit][] };

const KG = { en: 'kg', fr: 'kg' };
const L = { en: 'L', fr: 'L' };
const BOX = { en: 'box', fr: 'boîte' };
const PACK = { en: 'pack', fr: 'paquet' };
const UNIT = { en: 'unit', fr: 'pièce' };
const POUCH = { en: 'pouch', fr: 'sachet' };
const ROLL = { en: 'roll', fr: 'rouleau' };
const BAR = { en: 'bar', fr: 'tablette' };
const CARTRIDGE = { en: 'cartridge', fr: 'cartouche' };
const TABLET = { en: 'tablet', fr: 'comprimé' };

/** "can (400 g)", "boîte (400 g)": a unit with its size, which never goes in the name. */
const sized = (unit: Translated, size: Translated): Translated => ({ en: `${unit.en} (${size.en})`, fr: `${unit.fr} (${size.fr})` });
const CAN = { en: 'can', fr: 'boîte' };
const JAR = { en: 'jar', fr: 'pot' };
const grams = (weight: number) => ({ en: `${weight} g`, fr: `${weight} g` });
const BAGS_20 = sized(ROLL, { en: '20 bags', fr: '20 sacs' });

// Upkeep shared by many items.
const EAT = { en: 'Rotation: eat and buy again before the date', fr: 'Rotation : manger et racheter avant la date' };
const DRINK = { en: 'Rotation: drink and buy again before the date', fr: 'Rotation : boire et racheter avant la date' };
const FEED = { en: 'Rotation: use and buy again before the date', fr: 'Rotation : utiliser et racheter avant la date' };
const CANS = {
  en: 'Rotation, throw away a bulging, rusted or badly dented can',
  fr: 'Rotation, jeter une boîte bombée, rouillée ou très cabossée',
};
const PULSES = { en: 'Rotation: they harden with age and need longer soaking', fr: 'Rotation : elles durcissent en vieillissant et trempent plus longtemps' };
const DRY = { en: 'Keep dry', fr: 'Garder au sec' };
const STRICT = { en: 'Strict date: replace it at the date', fr: 'Date stricte : remplacer à la date' };
const COMPOSTABLE = { en: 'compostable bags: use within 6 months', fr: 'sacs compostables : à utiliser dans les 6 mois' };
const OPENED_BAG = { en: 'about 1 month once opened', fr: 'environ 1 mois une fois ouvert' };

// Habits.
const COOKS: HabitFilter = { cooking: ['ready', 'stove'] };
const NO_COOKING: HabitFilter = { cooking: ['none'] };
const NEEDS_STOVE: HabitFilter = { cooking: ['stove'] };
const TREATS_WATER: HabitFilter = { beyond: ['treatment'] };

type Values = Omit<CatalogItem, 'id' | 'name' | 'category' | 'unit' | 'use'>;

function item(
  id: string,
  name: CatalogItem['name'],
  category: string,
  unit: CatalogItem['unit'],
  use: CatalogItem['use'],
  values: Partial<Values>,
): CatalogItem {
  return {
    id,
    name,
    kind: categoryKind(category),
    category,
    unit,
    kcal: null,
    water: null,
    daily: null,
    per: 'person',
    target: null,
    shelfLife: null,
    use,
    ...values,
  };
}

export const CATALOG: CatalogItem[] = [
  // Water: the water need (Settings) sets how much. The first stored water product of the plan buys the
  // first tier, the second one the rest; water treatment takes over after a month (see plan.ts).
  item('water-bottle', { en: 'Bottled water', fr: 'Eau en bouteille' }, 'water', sized({ en: 'bottle', fr: 'bouteille' }, { en: '1.5 L', fr: '1,5 L' }),
    { en: 'Ready to drink, nothing to prepare', fr: 'Prête à boire, rien à préparer' },
    { water: 1.5, shelfLife: 24, care: DRINK, starter: 'essential', habits: { water: ['bottles', 'both'] } }),
  item('tap-water', { en: 'Tap water in jerrycans', fr: 'Eau du robinet en jerricans' }, 'water', sized({ en: 'jerrycan', fr: 'jerrican' }, { en: '20 L', fr: '20 L' }),
    { en: 'Almost free, filled at home', fr: 'Presque gratuite, remplie à la maison' },
    {
      water: 20,
      shelfLife: 6,
      care: {
        en: 'Empty and refill every 6 months, in a washed and disinfected food-grade jerrycan',
        fr: 'Vider et remplir tous les 6 mois, dans un jerrican alimentaire lavé et désinfecté',
      },
      starter: 'essential',
      habits: { water: ['tap', 'both'] },
    }),
  item('water-pack', { en: 'Water pack', fr: 'Pack d’eau' }, 'water', sized({ en: 'pack', fr: 'pack' }, { en: '6 × 1.5 L', fr: '6 × 1,5 L' }),
    { en: 'Ready to drink, nothing to prepare', fr: 'Prête à boire, rien à préparer' }, { water: 9, shelfLife: 24, care: DRINK }),
  item('water-can', { en: 'Water in jugs', fr: 'Eau en bidon' }, 'water', sized({ en: 'jug', fr: 'bidon' }, { en: '5 L', fr: '5 L' }),
    { en: 'Ready to drink, nothing to prepare', fr: 'Prête à boire, rien à préparer' }, { water: 5, shelfLife: 24, care: DRINK }),
  item('water', { en: 'Water', fr: 'Eau' }, 'water', L, { en: 'Stored drinking water', fr: 'Eau de boisson stockée' }, { water: 1, shelfLife: 24, care: DRINK }),
  item('water-filter', { en: 'Water filter', fr: 'Filtre à eau' }, 'water-treatment', sized(UNIT, { en: '1500 L', fr: '1500 L' }),
    { en: 'Filters water from a river or a well', fr: 'Filtre l’eau d’une rivière ou d’un puits' },
    {
      kind: 'gear',
      water: 1500,
      care: { en: 'Check it after 5 years, never let it freeze once used', fr: 'À contrôler après 5 ans, ne jamais le laisser geler une fois utilisé' },
      starter: 'essential',
      habits: TREATS_WATER,
    }),
  item('purification-tablets', { en: 'Purification tablets', fr: 'Pastilles de purification' }, 'water-treatment', sized(BOX, { en: '50 tablets', fr: '50 pastilles' }),
    { en: 'Disinfect water, light to carry', fr: 'Désinfectent l’eau, légères à emporter' },
    {
      water: 50,
      shelfLife: 60,
      keeps: { en: '3 years in a tub', fr: '3 ans en pot' },
      care: { en: 'Strict date: the chlorine weakens', fr: 'Date stricte : le chlore s’affaiblit' },
      starter: 'optional',
      habits: TREATS_WATER,
    }),

  // Food: suggested shares of a day's food per person. The starter list scales the chosen ones together to
  // the calories of a day (Settings), so only their proportions matter here.
  item('rice', { en: 'Rice', fr: 'Riz' }, 'grains', KG, { en: 'Staple starch, filling and cheap', fr: 'Féculent de base, nourrissant et bon marché' },
    { kcal: 3600, daily: 0.1, shelfLife: 24, keeps: { en: 'brown rice: 6 to 12 months', fr: 'riz complet : 6 à 12 mois' }, care: EAT, starter: 'essential', habits: COOKS }),
  item('pasta', { en: 'Pasta', fr: 'Pâtes' }, 'grains', KG, { en: 'Starch that cooks quickly', fr: 'Féculent qui cuit vite' },
    { kcal: 3550, daily: 0.09, shelfLife: 24, care: EAT, starter: 'essential', habits: COOKS }),
  item('oats', { en: 'Oats', fr: 'Flocons d’avoine' }, 'grains', KG, { en: 'Breakfast, can be eaten soaked without cooking', fr: 'Petit-déjeuner, se mange trempé sans cuisson' },
    {
      kcal: 3800,
      daily: 0.055,
      shelfLife: 12,
      care: { en: 'Rotation, smell before use: they can go rancid', fr: 'Rotation, sentir avant usage : ils peuvent rancir' },
      starter: 'essential',
    }),
  item('flour', { en: 'Flour', fr: 'Farine' }, 'grains', KG, { en: 'Bread, pancakes and sauces', fr: 'Pain, galettes et sauces' },
    { kcal: 3400, shelfLife: 12, keeps: { en: 'whole-wheat flour: about 3 months', fr: 'farine complète : environ 3 mois' }, care: EAT }),
  item('rusks', { en: 'Rusks', fr: 'Biscottes' }, 'grains', sized(PACK, grams(300)), { en: 'Bread that keeps, no cooking', fr: 'Du pain qui se garde, sans cuisson' },
    { kcal: 1200, daily: 0.25, shelfLife: 12, care: EAT, starter: 'essential', habits: NO_COOKING }),
  item('lentils', { en: 'Dried lentils', fr: 'Lentilles sèches' }, 'legumes', KG, { en: 'Cheap plant protein', fr: 'Protéines végétales bon marché' },
    { kcal: 3500, daily: 0.04, shelfLife: 24, care: PULSES, starter: 'essential', habits: COOKS }),
  item('chickpeas', { en: 'Dried chickpeas', fr: 'Pois chiches secs' }, 'legumes', KG, { en: 'Cheap plant protein', fr: 'Protéines végétales bon marché' },
    { kcal: 3600, shelfLife: 24, care: PULSES }),
  item('beans', { en: 'Dried beans', fr: 'Haricots secs' }, 'legumes', KG, { en: 'Cheap plant protein', fr: 'Protéines végétales bon marché' },
    { kcal: 3400, shelfLife: 24, care: PULSES }),
  item('tuna', { en: 'Canned tuna', fr: 'Thon en boîte' }, 'canned', sized(CAN, grams(140)), { en: 'Ready-to-eat protein', fr: 'Protéines prêtes à manger' },
    { kcal: 150, daily: 0.25, shelfLife: 36, care: CANS, starter: 'essential' }),
  item('sardines', { en: 'Sardines in oil', fr: 'Sardines à l’huile' }, 'canned', sized(CAN, grams(135)),
    { en: 'Ready-to-eat protein and fat', fr: 'Protéines et matières grasses prêtes à manger' },
    { kcal: 250, daily: 0.25, shelfLife: 60, care: CANS, starter: 'essential', habits: NO_COOKING }),
  item('vegetables', { en: 'Canned vegetables', fr: 'Légumes en conserve' }, 'canned', sized(CAN, grams(400)), { en: 'Ready-to-eat vegetables', fr: 'Légumes prêts à manger' },
    { kcal: 120, daily: 0.5, shelfLife: 36, keeps: { en: 'up to 4 years depending on the brand', fr: 'jusqu’à 4 ans selon la marque' }, care: CANS, starter: 'essential' }),
  item('canned-beans', { en: 'Canned beans', fr: 'Haricots en conserve' }, 'canned', sized(CAN, grams(400)),
    { en: 'Ready-to-eat plant protein', fr: 'Protéines végétales prêtes à manger' },
    { kcal: 300, daily: 0.5, shelfLife: 36, care: CANS, starter: 'essential', habits: NO_COOKING }),
  item('fruit', { en: 'Canned fruit', fr: 'Fruits au sirop' }, 'canned', sized(CAN, grams(400)), { en: 'Ready-to-eat fruit', fr: 'Fruits prêts à manger' },
    {
      kcal: 250,
      daily: 0.15,
      shelfLife: 24,
      care: { en: 'Rotation, watch for rust: the acid attacks the can', fr: 'Rotation, surveiller la rouille : l’acide attaque la boîte' },
      starter: 'essential',
    }),
  item('ready-meal', { en: 'Canned ready meal', fr: 'Plat cuisiné en boîte' }, 'ready-meals', sized(CAN, grams(800)),
    { en: 'A full meal, just heat it up', fr: 'Repas complet, juste à réchauffer' }, { kcal: 700, daily: 0.15, shelfLife: 36, care: CANS, starter: 'essential' }),
  item('freeze-dried', { en: 'Freeze-dried meal', fr: 'Repas lyophilisé' }, 'ready-meals', POUCH,
    { en: 'A light full meal, add hot water', fr: 'Repas complet et léger, à l’eau chaude' }, { kcal: 500, shelfLife: 48, care: EAT }),
  item('ration', { en: 'Emergency ration', fr: 'Ration de survie' }, 'ready-meals', sized(PACK, { en: '2400 kcal', fr: '2400 kcal' }),
    { en: 'Compact energy, eaten as is', fr: 'Énergie compacte, se mange telle quelle' }, { kcal: 2400, shelfLife: 60, care: EAT }),
  item('milk-powder', { en: 'Milk powder', fr: 'Lait en poudre' }, 'dairy', KG, { en: 'Calcium and protein, no fridge', fr: 'Calcium et protéines, sans frigo' },
    { kcal: 4900, daily: 0.025, shelfLife: 12, keeps: { en: 'semi-skimmed: 18 months', fr: 'demi-écrémé : 18 mois' }, care: EAT, starter: 'essential' }),
  item('uht-milk', { en: 'UHT milk', fr: 'Lait UHT' }, 'dairy', L, { en: 'Milk ready to drink, no fridge until opened', fr: 'Lait prêt à boire, sans frigo avant ouverture' },
    { kcal: 460, shelfLife: 3, care: DRINK }),
  item('oil', { en: 'Vegetable oil', fr: 'Huile végétale' }, 'fats', L, { en: 'Lots of calories in little space', fr: 'Beaucoup de calories pour peu de place' },
    { kcal: 8200, daily: 0.03, shelfLife: 12, care: EAT, starter: 'essential', habits: COOKS }),
  item('peanut-butter', { en: 'Peanut butter', fr: 'Beurre de cacahuète' }, 'fats', sized(JAR, grams(350)), { en: 'Calories and protein, no cooking', fr: 'Calories et protéines, sans cuisson' },
    { kcal: 2100, daily: 0.04, shelfLife: 12, care: EAT, starter: 'essential' }),
  item('sugar', { en: 'Sugar', fr: 'Sucre' }, 'sweets', KG, { en: 'Quick energy, to sweeten drinks', fr: 'Énergie rapide, pour sucrer les boissons' },
    { kcal: 4000, daily: 0.03, starter: 'optional' }),
  item('honey', { en: 'Honey', fr: 'Miel' }, 'sweets', KG, { en: 'Quick energy', fr: 'Énergie rapide' }, { kcal: 3000, shelfLife: 24, care: EAT }),
  item('jam', { en: 'Jam', fr: 'Confiture' }, 'sweets', sized(JAR, grams(370)), { en: 'Breakfast', fr: 'Petit-déjeuner' },
    { kcal: 900, daily: 0.05, shelfLife: 24, care: EAT, starter: 'optional' }),
  item('chocolate', { en: 'Chocolate', fr: 'Chocolat' }, 'sweets', sized(BAR, grams(100)), { en: 'Quick energy and comfort', fr: 'Énergie rapide et réconfort' },
    { kcal: 550, daily: 0.1, shelfLife: 12, keeps: { en: 'dark chocolate: 18 to 24 months', fr: 'noir : 18 à 24 mois' }, care: EAT, starter: 'optional' }),
  item('biscuits', { en: 'Biscuits', fr: 'Biscuits' }, 'sweets', sized(PACK, grams(200)), { en: 'Snack, no cooking', fr: 'En-cas sans cuisson' },
    { kcal: 950, daily: 0.15, shelfLife: 9, care: EAT, starter: 'optional' }),
  item('nuts', { en: 'Nuts', fr: 'Fruits secs (noix, amandes)' }, 'sweets', KG, { en: 'Filling snack, no cooking', fr: 'En-cas nourrissant, sans cuisson' },
    {
      kcal: 6000,
      daily: 0.02,
      shelfLife: 12,
      care: { en: 'Rotation, throw them away if rancid', fr: 'Rotation, jeter s’ils sont rances' },
      starter: 'essential',
    }),
  item('dried-fruit', { en: 'Dried fruit', fr: 'Fruits séchés' }, 'sweets', KG, { en: 'Sweet snack, no cooking', fr: 'En-cas sucré, sans cuisson' },
    { kcal: 3000, shelfLife: 12, care: EAT }),
  // Coffee and tea have no daily amount: no source gives one, and they bring no calories.
  item('coffee', { en: 'Coffee', fr: 'Café' }, 'drinks', KG, { en: 'Avoids withdrawal if you drink it every day', fr: 'Évite le manque si vous en buvez chaque jour' },
    { shelfLife: 18, keeps: { en: 'then only the aroma fades', fr: 'puis seul l’arôme baisse' }, care: DRINK, starter: 'optional' }),
  item('tea', { en: 'Tea', fr: 'Thé' }, 'drinks', PACK, { en: 'Hot drink', fr: 'Boisson chaude' },
    { shelfLife: 18, keeps: { en: 'from 12 to 24 depending on the brand', fr: 'de 12 à 24 selon la marque' }, care: DRINK, starter: 'optional' }),
  item('salt', { en: 'Salt', fr: 'Sel' }, 'condiments', KG, { en: 'Season the cooking', fr: 'Assaisonner la cuisine' },
    { daily: 0.005, keeps: { en: 'iodised salt slowly loses its iodine', fr: 'le sel iodé perd lentement son iode' }, starter: 'optional' }),

  // Specific needs. Pet items are per cat or per dog: the Cats and Dogs settings multiply them.
  item('cat-food', { en: 'Dry cat food', fr: 'Croquettes pour chat' }, 'pets', KG, { en: 'The cat’s full meal', fr: 'Repas complet du chat' },
    { daily: 0.06, per: 'cat', shelfLife: 12, keeps: OPENED_BAG, care: FEED, starter: 'essential', need: 'cat' }),
  // 0.4 kg of litter per cat and per day, an estimate (see docs/SHELF_LIFE.md).
  item('cat-litter', { en: 'Clumping cat litter', fr: 'Litière agglomérante' }, 'pets', sized({ en: 'bag', fr: 'sac' }, { en: '10 kg', fr: '10 kg' }),
    { en: 'Cat hygiene at home', fr: 'Hygiène du chat à la maison' },
    { kind: 'consumable', daily: 0.04, per: 'cat', care: DRY, starter: 'essential', need: 'cat' }),
  // One bag a day: the tray is cleaned at least once a day.
  item('litter-bags', { en: 'Litter disposal bags', fr: 'Sacs pour la litière' }, 'pets', BAGS_20,
    { en: 'Throw away used litter, tightly closed', fr: 'Jeter la litière usagée, bien fermée' },
    { kind: 'consumable', daily: 0.05, per: 'cat', keeps: COMPOSTABLE, starter: 'essential', need: 'cat' }),
  // A medium dog (20 to 25 kg): about 0.15 kg for a small dog, 0.45 kg for a large one.
  item('dog-food', { en: 'Dry dog food', fr: 'Croquettes pour chien' }, 'pets', KG, { en: 'The dog’s full meal', fr: 'Repas complet du chien' },
    { daily: 0.3, per: 'dog', shelfLife: 12, care: FEED, starter: 'essential', need: 'dog' }),
  // Two bags a day: a dog usually has one or two bowel movements a day.
  item('dog-waste-bags', { en: 'Dog waste bags', fr: 'Sacs à déjections' }, 'pets', BAGS_20,
    { en: 'Pick up on walks, throw away cleanly', fr: 'Ramasser en promenade, jeter proprement' },
    { kind: 'consumable', daily: 0.1, per: 'dog', keeps: COMPOSTABLE, starter: 'essential', need: 'dog' }),
  item('daily-medicine', { en: 'Daily medicine', fr: 'Traitement quotidien' }, 'medical', TABLET,
    { en: 'Never interrupt a treatment', fr: 'Ne pas interrompre un traitement' },
    {
      daily: 1,
      per: 'household',
      shelfLife: 24,
      keeps: { en: 'depends on the medicine: see the box', fr: 'selon le médicament : voir la boîte' },
      care: STRICT,
      starter: 'essential',
      need: 'treatment',
    }),

  // Hygiene.
  item('toilet-paper', { en: 'Toilet paper', fr: 'Papier toilette' }, 'hygiene', ROLL, { en: 'Basic hygiene', fr: 'Hygiène de base' },
    { daily: 0.2, care: DRY, starter: 'essential' }),
  item('soap', { en: 'Soap', fr: 'Savon' }, 'hygiene', BAR, { en: 'Washing hands limits illness', fr: 'Se laver les mains limite les maladies' },
    { daily: 0.03, shelfLife: 36, keeps: { en: 'then it only loses its scent', fr: 'puis il perd seulement son parfum' }, starter: 'essential' }),
  item('toothpaste', { en: 'Toothpaste', fr: 'Dentifrice' }, 'hygiene', sized({ en: 'tube', fr: 'tube' }, { en: '75 ml', fr: '75 ml' }),
    { en: 'Dental hygiene', fr: 'Hygiène des dents' },
    {
      daily: 0.015,
      shelfLife: 24,
      care: { en: 'Replace it at the date: the fluoride works less', fr: 'Remplacer à la date : le fluor agit moins' },
      starter: 'essential',
    }),
  item('bin-bags', { en: 'Bin bags', fr: 'Sacs poubelle' }, 'hygiene', BAGS_20, { en: 'Waste and emergency toilets', fr: 'Déchets et toilettes de secours' },
    { daily: 0.05, per: 'household', starter: 'essential' }),

  // Health and first aid.
  item('first-aid-kit', { en: 'First aid kit', fr: 'Trousse de secours' }, 'medical', UNIT, { en: 'Treat small injuries', fr: 'Soigner les petites blessures' },
    {
      kind: 'gear',
      target: 1,
      per: 'household',
      keeps: { en: 'but its contents have dates', fr: 'mais son contenu a des dates' },
      care: { en: 'Check its contents every year', fr: 'Vérifier son contenu chaque année' },
      starter: 'essential',
    }),
  item('paracetamol', { en: 'Paracetamol', fr: 'Paracétamol' }, 'medical', sized(BOX, { en: '500 mg tablets', fr: 'comprimés de 500 mg' }),
    { en: 'For pain and fever', fr: 'Contre la douleur et la fièvre' }, { target: 2, per: 'household', shelfLife: 36, care: STRICT, starter: 'essential' }),

  // Energy and light.
  item('aa-batteries', { en: 'AA batteries', fr: 'Piles AA' }, 'energy', UNIT, { en: 'For the headlamp and the radio', fr: 'Pour la lampe et la radio' },
    {
      target: 12,
      per: 'household',
      shelfLife: 120,
      keeps: { en: 'lithium: about 20 years', fr: 'lithium : environ 20 ans' },
      care: { en: 'Replace them at the date', fr: 'Remplacer à la date' },
      starter: 'essential',
    }),
  item('candles', { en: 'Candles', fr: 'Bougies' }, 'energy', UNIT, { en: 'Backup light, mind the fire', fr: 'Lumière d’appoint, attention au feu' },
    { daily: 0.2, per: 'household', starter: 'essential' }),
  item('gas-cartridge', { en: 'Gas cartridge', fr: 'Cartouche de gaz' }, 'energy', CARTRIDGE, { en: 'Fuel for the stove', fr: 'Carburant du réchaud' },
    {
      daily: 0.2,
      keeps: { en: 'but the seals age', fr: 'mais les joints vieillissent' },
      care: {
        en: 'Replace it after about 7 years, sooner if rusty or dented',
        fr: 'Remplacer au bout de 7 ans environ, plus tôt si rouillée ou cabossée',
      },
      starter: 'essential',
      habits: NEEDS_STOVE,
    }),
  item('matches', { en: 'Matches', fr: 'Allumettes' }, 'energy', BOX, { en: 'Light the stove and the candles', fr: 'Allumer le réchaud et les bougies' },
    { target: 3, per: 'household', care: DRY, starter: 'essential' }),
  item('power-bank', { en: 'Power bank', fr: 'Batterie externe' }, 'energy', UNIT, { en: 'Recharge the phone', fr: 'Recharger le téléphone' },
    {
      kind: 'gear',
      target: 1,
      per: 'household',
      care: { en: 'Recharge it every 3 months, store it half charged', fr: 'Recharger tous les 3 mois, ranger à moitié chargée' },
      starter: 'optional',
    }),

  // Gear.
  item('headlamp', { en: 'Headlamp', fr: 'Lampe frontale' }, 'tools', UNIT, { en: 'Hands-free light, no fire risk', fr: 'Lumière mains libres, sans risque de feu' },
    { target: 1, care: { en: 'Store it without batteries: they can leak', fr: 'Ranger sans les piles : elles peuvent couler' }, starter: 'essential' }),
  item('radio', { en: 'Hand-crank radio', fr: 'Radio à dynamo' }, 'tools', UNIT,
    { en: 'Official instructions without a network', fr: 'Les consignes officielles sans réseau' },
    {
      target: 1,
      per: 'household',
      care: {
        en: 'Store it without batteries, recharge a built-in battery every 3 months',
        fr: 'Ranger sans les piles, recharger une batterie intégrée tous les 3 mois',
      },
      starter: 'essential',
    }),
  item('stove', { en: 'Camping stove', fr: 'Réchaud à gaz' }, 'tools', UNIT,
    { en: 'Cook and boil water without electricity', fr: 'Cuire et faire bouillir sans électricité' },
    {
      target: 1,
      per: 'household',
      care: { en: 'Check the seals before using it', fr: 'Vérifier les joints avant usage' },
      starter: 'essential',
      habits: NEEDS_STOVE,
    }),
  item('can-opener', { en: 'Manual can opener', fr: 'Ouvre-boîte manuel' }, 'tools', UNIT,
    { en: 'Open cans without electricity', fr: 'Ouvrir les conserves sans électricité' }, { target: 1, per: 'household', starter: 'essential' }),
  item('multitool', { en: 'Multi-tool knife', fr: 'Couteau multifonction' }, 'tools', UNIT, { en: 'Cut, open, repair', fr: 'Couper, ouvrir, réparer' },
    { target: 1, per: 'household', starter: 'essential' }),
  item('survival-blanket', { en: 'Survival blanket', fr: 'Couverture de survie' }, 'tools', UNIT, { en: 'Keeps body heat in', fr: 'Garde la chaleur du corps' },
    { target: 1, starter: 'essential' }),
  item('jerrycan', { en: 'Empty jerrycan', fr: 'Jerrican vide' }, 'tools', sized(UNIT, { en: '20 L', fr: '20 L' }),
    { en: 'Carry or store water', fr: 'Transporter ou stocker de l’eau' },
    {
      target: 1,
      per: 'household',
      care: {
        en: 'Wash and disinfect it before filling, never use one that held a toxic product',
        fr: 'Laver et désinfecter avant de remplir, jamais un bidon qui a contenu un produit toxique',
      },
    }),
];

/** Catalog entry whose name matches in any language, if any. */
export function findCatalogItem(name: string): CatalogItem | undefined {
  return CATALOG.find((entry) => translations(entry.name).some((translation) => sameName(translation, name)));
}

/** A product ready to add to the shelf, named in the given language. */
export function productFromCatalog(entry: CatalogItem, lang: Lang): Product {
  return {
    name: inLang(entry.name, lang),
    kind: entry.kind,
    category: entry.category,
    unit: inLang(entry.unit, lang),
    kcal: entry.kcal,
    water: entry.water,
    daily: entry.daily,
    per: entry.per,
    target: entry.target,
    notes: '',
    extra: {},
  };
}
