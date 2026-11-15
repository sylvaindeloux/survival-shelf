import { inLang, translations, type Lang, type Translated } from './languages';
import { normalizeKey } from './text';
import type { Kind } from './types';

/** Kinds of products, in the order the app shows them. */
export const KINDS: Kind[] = ['food', 'consumable', 'gear'];

export interface Category {
  key: string;
  label: Translated;
  /** Extra names accepted when reading the file. */
  aliases?: string[];
  /** Kind of a product of this category, unless it says otherwise. */
  kind: Kind;
}

export const CATEGORIES: Category[] = [
  { key: 'water', label: { en: 'Water', fr: 'Eau' }, kind: 'food' },
  {
    key: 'water-treatment',
    label: { en: 'Water treatment', fr: 'Traitement de l’eau' },
    aliases: ['water-filter', 'filter', 'filters', 'filtre', 'filtres', 'purification', 'traitement-eau', 'traitement de l eau'],
    kind: 'consumable',
  },
  { key: 'grains', label: { en: 'Grains & starches', fr: 'Féculents' }, aliases: ['starches', 'cereals', 'cereales'], kind: 'food' },
  { key: 'legumes', label: { en: 'Legumes', fr: 'Légumineuses' }, aliases: ['pulses', 'beans'], kind: 'food' },
  { key: 'canned', label: { en: 'Canned food', fr: 'Conserves' }, aliases: ['cans'], kind: 'food' },
  { key: 'ready-meals', label: { en: 'Ready meals', fr: 'Plats préparés' }, aliases: ['meals', 'freeze-dried', 'lyophilises'], kind: 'food' },
  { key: 'dairy', label: { en: 'Dairy', fr: 'Produits laitiers' }, aliases: ['milk', 'lait'], kind: 'food' },
  { key: 'fats', label: { en: 'Oils & fats', fr: 'Matières grasses' }, aliases: ['oil', 'huile'], kind: 'food' },
  { key: 'sweets', label: { en: 'Sugar & snacks', fr: 'Sucré & en-cas' }, aliases: ['sugar', 'snacks', 'sucre'], kind: 'food' },
  { key: 'drinks', label: { en: 'Drinks', fr: 'Boissons' }, kind: 'food' },
  { key: 'condiments', label: { en: 'Condiments & spices', fr: 'Condiments & épices' }, aliases: ['spices', 'epices'], kind: 'food' },
  { key: 'pets', label: { en: 'Pets', fr: 'Animaux' }, kind: 'food' },
  { key: 'hygiene', label: { en: 'Hygiene', fr: 'Hygiène' }, kind: 'consumable' },
  {
    key: 'medical',
    label: { en: 'Health & first aid', fr: 'Santé & secours' },
    aliases: ['health', 'first-aid', 'sante', 'medicaments'],
    kind: 'consumable',
  },
  { key: 'energy', label: { en: 'Energy & light', fr: 'Énergie & éclairage' }, aliases: ['batteries', 'piles', 'fuel'], kind: 'consumable' },
  { key: 'tools', label: { en: 'Tools & gear', fr: 'Outils & matériel' }, aliases: ['gear', 'equipment', 'materiel'], kind: 'gear' },
  { key: 'other', label: { en: 'Other', fr: 'Divers' }, aliases: ['misc'], kind: 'consumable' },
];

const BY_ALIAS = new Map<string, Category>();
for (const category of CATEGORIES) {
  for (const name of [category.key, ...translations(category.label), ...(category.aliases ?? [])]) {
    BY_ALIAS.set(normalizeKey(name), category);
  }
}

/** Finds a known category from its key, its label in any language, or an alias. */
export function findCategory(text: string): Category | undefined {
  return BY_ALIAS.get(normalizeKey(text));
}

/** Label of a category in `lang`, or the text as is for a category the app does not know. */
export function categoryLabel(category: string, lang: Lang): string {
  const found = findCategory(category);
  return found ? inLang(found.label, lang) : category;
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

/** Kind of the products of a category: consumable for a category the app does not know. */
export function categoryKind(category: string): Kind {
  return findCategory(category)?.kind ?? 'consumable';
}

/**
 * Kind of a product that does not say it: what has calories or drinking water is
 * food, the rest follows its category.
 */
export function defaultKind(product: Nature): Kind {
  if (!isWaterTreatment(product) && ((product.kcal ?? 0) > 0 || (product.water ?? 0) > 0)) return 'food';
  return categoryKind(product.category);
}

/** Food and water: eaten and replaced as you go, so part of the rotation. */
export function isFood(product: { kind: Kind; category: string }): boolean {
  return product.kind === 'food' && !isWaterTreatment(product);
}

/** Canonical key for a known category, or the trimmed text for a custom one. */
export function normalizeCategory(text: string): string {
  const trimmed = text.trim();
  if (trimmed === '') return 'other';
  return findCategory(trimmed)?.key ?? trimmed;
}
