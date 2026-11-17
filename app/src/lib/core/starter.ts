import { CATALOG, productFromCatalog, type CatalogItem, type Habits, type Needs } from './catalog';
import type { Lang } from './languages';
import type { Product } from './types';

/** What the setup wizard proposes when nothing else is known: bottled water, a filter after a month, a stove to buy. */
export const DEFAULT_HABITS: Habits = { water: 'bottles', beyond: 'treatment', cooking: 'stove' };

export interface StarterItem {
  entry: CatalogItem;
  /** Checked from the start; the others are offered unchecked. */
  essential: boolean;
}

function fitsHabits(entry: CatalogItem, habits: Habits): boolean {
  if (!entry.habits) return true;
  return (Object.keys(entry.habits) as (keyof Habits)[]).every((habit) =>
    (entry.habits?.[habit] as string[] | undefined)?.includes(habits[habit]),
  );
}

/** The starter list for a household with these needs and habits, in catalog order. */
export function starterList(needs: Needs, habits: Habits): StarterItem[] {
  return CATALOG.filter(
    (entry) => entry.starter !== undefined && (entry.need === undefined || (needs[entry.need] ?? 0) > 0) && fitsHabits(entry, habits),
  ).map((entry) => ({ entry, essential: entry.starter === 'essential' }));
}

/** Two significant digits: 0.0657 kg a day becomes 0.066, enough for a plan and easy to read in the file. */
function roundDaily(value: number): number {
  if (value <= 0) return 0;
  const step = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Number((Math.round(value / step) * step).toPrecision(2));
}

/** Food eaten every day by each person, which shares the calories of a day. */
function sharesCalories(entry: CatalogItem): boolean {
  return entry.per === 'person' && (entry.kcal ?? 0) > 0 && (entry.daily ?? 0) > 0;
}

/**
 * Daily amounts of the chosen foods, by catalog id, scaled together so that one person eats `kcal` a day
 * whatever the foods chosen: the catalog only gives their proportions. Other items keep their own amount.
 */
export function spreadCalories(entries: CatalogItem[], kcal: number): Map<string, number> {
  const foods = entries.filter(sharesCalories);
  const total = foods.reduce((sum, entry) => sum + (entry.daily ?? 0) * (entry.kcal ?? 0), 0);
  const dailies = new Map<string, number>();
  if (total <= 0) return dailies;
  for (const entry of foods) dailies.set(entry.id, roundDaily(((entry.daily ?? 0) * kcal) / total));
  return dailies;
}

/** Products for the chosen catalog items, named in `lang`, with the calories of a day spread over the foods. */
export function starterProducts(entries: CatalogItem[], lang: Lang, kcal: number): Product[] {
  const dailies = spreadCalories(entries, kcal);
  return entries.map((entry) => ({ ...productFromCatalog(entry, lang), daily: dailies.get(entry.id) ?? entry.daily }));
}
