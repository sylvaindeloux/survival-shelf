import type { Autonomy } from './autonomy';
import type { Day } from './dates';
import { round, summarizeProducts } from './status';
import type { Product, Shelf } from './types';

export interface ShoppingItem {
  product: Product;
  /** Usable (not expired) quantity in stock. */
  have: number;
  missing: number;
}

/** Products below their target quantity. Expired lots do not count. */
export function shoppingList(shelf: Shelf, today: Day): ShoppingItem[] {
  return summarizeProducts(shelf, today)
    .filter(({ product, usableQty }) => product.target !== null && usableQty < product.target)
    .map(({ product, usableQty }) => ({ product, have: usableQty, missing: round((product.target ?? 0) - usableQty) }))
    .sort((a, b) => a.product.category.localeCompare(b.product.category) || a.product.name.localeCompare(b.product.name));
}

export interface AutonomyGap {
  /** Kcal missing to reach the autonomy goal (0 when reached). */
  kcal: number;
  /** Liters of water missing to reach the autonomy goal (0 when reached). */
  water: number;
}

/** What is missing to reach the target autonomy, assuming new items keep longer than the goal. */
export function autonomyGap(shelf: Shelf, autonomy: Autonomy): AutonomyGap {
  const target = shelf.settings.targetDays;
  const missing = (days: number, dailyNeed: number) =>
    Number.isFinite(days) && days < target ? Math.ceil((target - days) * dailyNeed) : 0;
  return {
    kcal: missing(autonomy.food.days, autonomy.food.dailyNeed),
    water: missing(autonomy.water.days, autonomy.water.dailyNeed),
  };
}
