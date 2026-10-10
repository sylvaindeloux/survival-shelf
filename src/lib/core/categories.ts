import { normalizeKey } from './text';

export interface Category {
  key: string;
  icon: string;
  label: { en: string; fr: string };
  /** Extra names accepted when reading the file. */
  aliases?: string[];
  /** Eaten or drunk: part of the rotation plan. */
  consumable?: boolean;
}

export const CATEGORIES: Category[] = [
  { key: 'water', icon: '💧', label: { en: 'Water', fr: 'Eau' }, consumable: true },
  {
    key: 'water-treatment',
    icon: '🚰',
    label: { en: 'Water treatment', fr: 'Traitement de l’eau' },
    aliases: ['water-filter', 'filter', 'filters', 'filtre', 'filtres', 'purification', 'traitement-eau', 'traitement de l eau'],
  },
  { key: 'grains', icon: '🌾', label: { en: 'Grains & starches', fr: 'Féculents' }, aliases: ['starches', 'cereals', 'cereales'], consumable: true },
  { key: 'legumes', icon: '🫘', label: { en: 'Legumes', fr: 'Légumineuses' }, aliases: ['pulses', 'beans'], consumable: true },
  { key: 'canned', icon: '🥫', label: { en: 'Canned food', fr: 'Conserves' }, aliases: ['cans'], consumable: true },
  { key: 'ready-meals', icon: '🍲', label: { en: 'Ready meals', fr: 'Plats préparés' }, aliases: ['meals', 'freeze-dried', 'lyophilises'], consumable: true },
  { key: 'dairy', icon: '🥛', label: { en: 'Dairy', fr: 'Produits laitiers' }, aliases: ['milk', 'lait'], consumable: true },
  { key: 'fats', icon: '🫒', label: { en: 'Oils & fats', fr: 'Matières grasses' }, aliases: ['oil', 'huile'], consumable: true },
  { key: 'sweets', icon: '🍫', label: { en: 'Sugar & snacks', fr: 'Sucré & en-cas' }, aliases: ['sugar', 'snacks', 'sucre'], consumable: true },
  { key: 'drinks', icon: '☕', label: { en: 'Drinks', fr: 'Boissons' }, consumable: true },
  { key: 'condiments', icon: '🧂', label: { en: 'Condiments & spices', fr: 'Condiments & épices' }, aliases: ['spices', 'epices'], consumable: true },
  { key: 'baby', icon: '🍼', label: { en: 'Baby', fr: 'Bébé' }, consumable: true },
  { key: 'pets', icon: '🐾', label: { en: 'Pets', fr: 'Animaux' }, consumable: true },
  { key: 'hygiene', icon: '🧼', label: { en: 'Hygiene', fr: 'Hygiène' } },
  { key: 'medical', icon: '🩹', label: { en: 'Health & first aid', fr: 'Santé & secours' }, aliases: ['health', 'first-aid', 'sante', 'medicaments'] },
  { key: 'energy', icon: '🔋', label: { en: 'Energy & light', fr: 'Énergie & éclairage' }, aliases: ['batteries', 'piles', 'fuel'] },
  { key: 'tools', icon: '🛠️', label: { en: 'Tools & gear', fr: 'Outils & matériel' }, aliases: ['gear', 'equipment', 'materiel'] },
  { key: 'other', icon: '📦', label: { en: 'Other', fr: 'Divers' }, aliases: ['misc'] },
];

const BY_ALIAS = new Map<string, Category>();
for (const category of CATEGORIES) {
  for (const name of [category.key, category.label.en, category.label.fr, ...(category.aliases ?? [])]) {
    BY_ALIAS.set(normalizeKey(name), category);
  }
}

/** Finds a known category from its key, its English or French label, or an alias. */
export function findCategory(text: string): Category | undefined {
  return BY_ALIAS.get(normalizeKey(text));
}

type Nature = { category: string; kcal: number | null; water: number | null };

/** Filters and tablets: their water is the volume they can make drinkable, not stored water. */
export function isWaterTreatment(product: { category: string }): boolean {
  return findCategory(product.category)?.key === 'water-treatment';
}

/** Stored drinking water: bottles, jerrycans… Counted in liters against the water need. */
export function isStoredWater(product: Nature): boolean {
  return (product.water ?? 0) > 0 && !isWaterTreatment(product);
}

/** True for food and water: things that are eaten and can be rotated. */
export function isConsumable(product: Nature): boolean {
  if (isWaterTreatment(product)) return false;
  return (product.kcal ?? 0) > 0 || (product.water ?? 0) > 0 || findCategory(product.category)?.consumable === true;
}

/** Canonical key for a known category, or the trimmed text for a custom one. */
export function normalizeCategory(text: string): string {
  const trimmed = text.trim();
  if (trimmed === '') return 'other';
  return findCategory(trimmed)?.key ?? trimmed;
}
