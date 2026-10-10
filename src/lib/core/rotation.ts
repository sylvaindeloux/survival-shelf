import { isConsumable } from './categories';
import type { Day } from './dates';
import { byExpiry, lotExpiry } from './stock';
import { round } from './status';
import { sameName } from './text';
import type { Lot, Product, Shelf } from './types';

export interface RotationItem {
  product: Product;
  /**
   * Smallest steady pace (units per week) that finishes every lot before its
   * expiry minus the rotation margin.
   */
  perWeek: number;
  /** Lot to take next (oldest expiry first, not expired). */
  nextLot: Lot;
  /** Date by which the next lot should be consumed (expiry minus margin). */
  consumeBy: Day;
  /** True when the next lot is already within the rotation margin. */
  due: boolean;
}

export interface RotationPlan {
  items: RotationItem[];
  /** Kcal per day the household has to eat from the stock to follow the plan. */
  kcalPerDay: number;
  /** kcalPerDay as a share of the household needs (1 = 100 %). */
  shareOfNeeds: number;
}

/**
 * Progressive rotation: instead of eating everything right before it expires,
 * consume each product at a steady pace and replace it as you go.
 *
 * For lots sorted by deadline, the minimal steady rate that avoids any waste
 * is max over k of (quantity of the first k lots / time until the k-th deadline).
 */
export function rotationPlan(shelf: Shelf, today: Day): RotationPlan {
  const margin = shelf.settings.rotationMarginDays;
  const items: RotationItem[] = [];

  for (const product of shelf.products) {
    // Medicine, batteries… are replaced, not eaten: the expiry alerts cover them.
    if (!isConsumable(product)) continue;
    const lots = shelf.lots
      .filter((lot) => sameName(lot.product, product.name) && lot.qty > 0)
      .filter((lot) => Number.isFinite(lotExpiry(lot)) && lotExpiry(lot) >= today)
      .sort(byExpiry);
    if (lots.length === 0) continue;

    let cumulative = 0;
    let perWeek = 0;
    for (const lot of lots) {
      cumulative += lot.qty;
      // Days available, counting today; anything due now must go within a week.
      const available = Math.max(lotExpiry(lot) - margin - today + 1, 7);
      perWeek = Math.max(perWeek, (cumulative / available) * 7);
    }
    const consumeBy = lotExpiry(lots[0]) - margin;
    items.push({ product, perWeek: round(perWeek, 2), nextLot: lots[0], consumeBy, due: consumeBy <= today });
  }

  items.sort((a, b) => a.consumeBy - b.consumeBy);
  const kcalPerDay = items.reduce((sum, item) => sum + (item.perWeek / 7) * (item.product.kcal ?? 0), 0);
  const needs = shelf.settings.people * shelf.settings.kcalPerPersonPerDay;
  return { items, kcalPerDay, shareOfNeeds: needs > 0 ? kcalPerDay / needs : 0 };
}
