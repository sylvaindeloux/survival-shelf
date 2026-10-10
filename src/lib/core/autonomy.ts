import { isStoredWater, isWaterTreatment } from './categories';
import type { Day } from './dates';
import { findProduct, lotExpiry } from './stock';
import type { Shelf } from './types';

export interface ResourceAutonomy {
  /** Household need per day (kcal or liters). */
  dailyNeed: number;
  /** Amount in stock that is not expired yet. */
  usable: number;
  /** Amount already expired. */
  expired: number;
  /** Days of autonomy if nothing ever expired: usable / dailyNeed. */
  naiveDays: number;
  /** Days of autonomy when consuming oldest first and losing what expires on the way. */
  days: number;
  /** Amount that would expire before being consumed. */
  lost: number;
}

export interface Autonomy {
  food: ResourceAutonomy;
  /** Stored drinking water only: treating water needs time, gear and a source. */
  water: ResourceAutonomy;
  /** Liters that water treatment in stock (filters, tablets) can make drinkable. */
  treatmentLiters: number;
  /** Overall autonomy: the weakest of food and water. */
  days: number;
  limitedBy: 'food' | 'water' | null;
}

interface Portion {
  amount: number;
  /** Day offset (from today) after which the portion is no longer usable. */
  end: number;
}

/**
 * Simulates a constant daily consumption, oldest expiry first (which is the
 * order that wastes the least). Returns how many days the stock lasts and
 * how much is lost because it expires before its turn comes.
 */
export function simulate(portions: Portion[], dailyNeed: number): { days: number; lost: number } {
  if (dailyNeed <= 0) return { days: Number.POSITIVE_INFINITY, lost: 0 };
  let time = 0;
  let lost = 0;
  for (const portion of [...portions].sort((a, b) => a.end - b.end)) {
    if (portion.end <= time) {
      lost += portion.amount;
      continue;
    }
    const duration = portion.amount / dailyNeed;
    if (time + duration <= portion.end) {
      time += duration;
    } else {
      lost += portion.amount - (portion.end - time) * dailyNeed;
      time = portion.end;
    }
  }
  return { days: time, lost };
}

function resource(shelf: Shelf, today: Day, field: 'kcal' | 'water', dailyNeed: number): ResourceAutonomy {
  const portions: Portion[] = [];
  let expired = 0;
  for (const lot of shelf.lots) {
    const product = findProduct(shelf, lot.product);
    if (!product || (field === 'water' && !isStoredWater(product))) continue;
    const amount = lot.qty * (product[field] ?? 0);
    if (amount <= 0) continue;
    // A lot expiring on day D can still be used on day D.
    const end = lotExpiry(lot) - today + 1;
    if (end <= 0) expired += amount;
    else portions.push({ amount, end });
  }
  const usable = portions.reduce((sum, portion) => sum + portion.amount, 0);
  const { days, lost } = simulate(portions, dailyNeed);
  return {
    dailyNeed,
    usable,
    expired,
    naiveDays: dailyNeed > 0 ? usable / dailyNeed : Number.POSITIVE_INFINITY,
    days,
    lost,
  };
}

export function computeAutonomy(shelf: Shelf, today: Day): Autonomy {
  const { people, kcalPerPersonPerDay, waterPerPersonPerDay } = shelf.settings;
  const food = resource(shelf, today, 'kcal', people * kcalPerPersonPerDay);
  const water = resource(shelf, today, 'water', people * waterPerPersonPerDay);
  let treatmentLiters = 0;
  for (const lot of shelf.lots) {
    const product = findProduct(shelf, lot.product);
    if (product && isWaterTreatment(product) && lotExpiry(lot) >= today) treatmentLiters += lot.qty * (product.water ?? 0);
  }
  const days = Math.min(food.days, water.days);
  let limitedBy: Autonomy['limitedBy'] = null;
  if (Number.isFinite(days)) limitedBy = food.days <= water.days ? 'food' : 'water';
  return { food, water, treatmentLiters, days, limitedBy };
}
