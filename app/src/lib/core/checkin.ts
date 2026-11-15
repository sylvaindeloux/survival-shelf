import { isFood } from './categories';
import type { Day } from './dates';
import type { TierStatus } from './plan';
import type { RotationPlan } from './rotation';
import { expiryAlerts } from './status';
import { byExpiry, findProduct, lotExpiry } from './stock';
import { roundQuantity } from './text';
import type { Lot, Product, Rhythm, Shelf } from './types';

export const PERIOD_DAYS: Record<Rhythm, number> = { monthly: 30, quarterly: 91, semiannual: 182 };

/** Check-in rhythms, from the most to the least frequent. */
export const RHYTHMS = Object.keys(PERIOD_DAYS) as Rhythm[];

export interface ConsumeItem {
  product: Product;
  /** Quantity to eat during the period to keep the steady rotation pace. */
  qty: number;
  /** Next lot to take from (oldest expiry first). */
  lot: Lot;
  /** The lot is already within the rotation margin. */
  due: boolean;
}

export interface ReplaceItem {
  product: Product;
  lot: Lot;
  /** Date by which to replace it: its expiry minus the rotation margin. */
  replaceBy: Day;
  /** The lot is already within the rotation margin. */
  due: boolean;
}

/** The regular check-in: what to discard, consume, replace and buy until the next one. */
export interface CheckIn {
  periodDays: number;
  /** Expired lots. */
  discard: Lot[];
  consume: ConsumeItem[];
  /** Consumables (and dated gear) reaching their rotation margin before the next check-in. */
  replace: ReplaceItem[];
  /** The tier being built, with what it is missing; null when every tier is complete. */
  buy: TierStatus | null;
}

/** Water to buy that no product stands for yet (no water product in the list), in liters. */
export function waterWithoutProduct(tier: TierStatus): { stored: number; treatment: number } {
  return {
    stored: tier.water.storedProduct ? 0 : tier.water.missingStored,
    treatment: tier.water.treatmentProduct ? 0 : tier.water.missingTreatment,
  };
}

/** Number of lines on the shopping list of a tier. */
export function buyCount(tier: TierStatus | null): number {
  if (!tier) return 0;
  const water = waterWithoutProduct(tier);
  return tier.missing.length + (water.stored > 0 ? 1 : 0) + (water.treatment > 0 ? 1 : 0);
}

/**
 * What is not eaten (batteries, medicine, tablets…) cannot be rotated by eating
 * it: each lot is replaced when it reaches the rotation margin before its date,
 * here when that happens before the next check-in. Expired lots are discarded instead.
 */
export function replacements(shelf: Shelf, today: Day, periodDays: number): ReplaceItem[] {
  const margin = shelf.settings.rotationMarginDays;
  const items: ReplaceItem[] = [];
  for (const lot of [...shelf.lots].sort(byExpiry)) {
    const product = findProduct(shelf, lot.product);
    const expiry = lotExpiry(lot);
    if (!product || isFood(product) || lot.qty <= 0 || !Number.isFinite(expiry) || expiry < today) continue;
    const replaceBy = expiry - margin;
    if (replaceBy > today + periodDays) continue;
    items.push({ product, lot, replaceBy, due: replaceBy <= today });
  }
  return items;
}

export function checkIn(shelf: Shelf, today: Day, rotation: RotationPlan, current: TierStatus | null): CheckIn {
  const periodDays = PERIOD_DAYS[shelf.settings.rhythm];
  const consume: ConsumeItem[] = [];
  for (const item of rotation.items) {
    const exact = (item.perWeek * periodDays) / 7;
    let qty = Math.min(roundQuantity(exact, item.product.unit), item.qty);
    // Something due must go now, even when the steady pace rounds to nothing.
    if (qty === 0 && item.due) qty = Math.min(roundQuantity(exact, item.product.unit, 'up'), item.qty);
    if (qty > 0) consume.push({ product: item.product, qty, lot: item.nextLot, due: item.due });
  }
  return {
    periodDays,
    discard: expiryAlerts(shelf, today).expired,
    consume,
    replace: replacements(shelf, today, periodDays),
    buy: current,
  };
}
