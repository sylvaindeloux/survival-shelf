import type { Day } from './dates';
import type { TierStatus } from './plan';
import type { RotationPlan } from './rotation';
import { expiryAlerts } from './status';
import { roundQuantity } from './text';
import type { Lot, Product, Rhythm, Shelf } from './types';

export const PERIOD_DAYS: Record<Rhythm, number> = { weekly: 7, monthly: 30 };

export interface ConsumeItem {
  product: Product;
  /** Quantity to eat during the period to keep the steady rotation pace. */
  qty: number;
  /** Next lot to take from (oldest expiry first). */
  lot: Lot;
  /** The lot is already within the rotation margin. */
  due: boolean;
}

/** The regular check-in: what to discard, consume and buy this week or this month. */
export interface CheckIn {
  periodDays: number;
  /** Expired lots. */
  discard: Lot[];
  consume: ConsumeItem[];
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
  return { periodDays, discard: expiryAlerts(shelf, today).expired, consume, buy: current };
}
