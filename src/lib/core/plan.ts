import type { Autonomy } from './autonomy';
import { isStoredWater, isWaterTreatment } from './categories';
import type { Day } from './dates';
import { round, summarizeProducts } from './status';
import { roundQuantity } from './text';
import type { Product, Settings, Shelf } from './types';

/**
 * Up to this many days, only stored water counts. Beyond, water treatment
 * (filters, tablets) counts too: it needs a source, but a year of bottled
 * water is not realistic.
 */
export const STORED_WATER_DAYS = 30;

/** How many times a product's quantities apply: once per person, or once for the household. */
export function headcount(product: Product, settings: Settings): number {
  return product.per === 'household' ? 1 : settings.people;
}

/** Water products are planned in liters from the water need, not with their own daily use or target. */
export function isWaterProduct(product: Product): boolean {
  return isStoredWater(product) || isWaterTreatment(product);
}

/** Part of the plan: a daily use or a minimum to own (water products are always planned through the water need). */
export function isPlanned(product: Product): boolean {
  return !isWaterProduct(product) && (product.daily !== null || product.target !== null);
}

/**
 * Quantity of a product a tier of `days` needs, or null when it is not part of
 * the plan. Rounded up to what can be bought: whole units for counted things.
 */
export function productTarget(product: Product, settings: Settings, days: number): number | null {
  if (!isPlanned(product)) return null;
  const count = headcount(product, settings);
  const fromDaily = (product.daily ?? 0) * count * days;
  const fromTarget = (product.target ?? 0) * count;
  return roundQuantity(Math.max(fromDaily, fromTarget), product.unit, 'up');
}

/** Calories per person per day planned by the food daily uses ("the menu"). */
export function menuKcal(shelf: Shelf): number {
  return shelf.products
    .filter((product) => product.per === 'person' && product.daily !== null && (product.kcal ?? 0) > 0)
    .reduce((sum, product) => sum + (product.daily ?? 0) * (product.kcal ?? 0), 0);
}

export interface TierLine {
  product: Product;
  /** Quantity the tier needs. */
  target: number;
  /** Usable quantity in stock (expired lots do not count). */
  have: number;
  /** Quantity to buy, rounded up to whole units for counted things. */
  missing: number;
  /** For water lines: the liters this line stands for. */
  liters?: number;
}

export interface TierWater {
  /** Household need in liters per day. */
  dailyNeed: number;
  /** Days covered by stored water (oldest first, losing what expires on the way). */
  storedDays: number;
  /** Days covered by water treatment, counted for tiers beyond STORED_WATER_DAYS only. */
  treatmentDays: number;
  days: number;
  /** Liters of stored water missing. */
  missingStored: number;
  /** Liters of water treatment capacity missing. */
  missingTreatment: number;
  /** Product used to buy stored water / treatment: the first of its kind in the product list. */
  storedProduct?: Product;
  treatmentProduct?: Product;
}

export interface TierStatus {
  days: number;
  /** Days of food (calories), oldest first, losing what expires on the way. */
  foodDays: number;
  water: TierWater;
  /** One line per planned product, plus the water products to buy. */
  lines: TierLine[];
  /** Lines with something to buy. */
  missing: TierLine[];
  /** Overall progress, 0 to 1. */
  progress: number;
  complete: boolean;
}

function waterStatus(shelf: Shelf, autonomy: Autonomy, days: number): TierWater {
  const dailyNeed = autonomy.water.dailyNeed;
  const storedDays = autonomy.water.days;
  const counted = days > STORED_WATER_DAYS && dailyNeed > 0;
  const treatmentDays = counted ? autonomy.treatmentLiters / dailyNeed : 0;
  const storedGoal = Math.min(days, STORED_WATER_DAYS);
  const missingStored = Math.max(0, storedGoal - storedDays) * dailyNeed;
  const extraStored = Math.max(0, storedDays - STORED_WATER_DAYS);
  const missingTreatment = counted ? Math.max(0, days - STORED_WATER_DAYS - extraStored - treatmentDays) * dailyNeed : 0;
  return {
    dailyNeed,
    storedDays,
    treatmentDays,
    days: storedDays + treatmentDays,
    missingStored: Math.ceil(round(missingStored)),
    missingTreatment: Math.ceil(round(missingTreatment)),
    storedProduct: shelf.products.find(isStoredWater),
    treatmentProduct: shelf.products.find(isWaterTreatment),
  };
}

function waterLine(product: Product | undefined, liters: number, have: number): TierLine | null {
  if (!product || liters <= 0 || !product.water) return null;
  const missing = roundQuantity(liters / product.water, product.unit, 'up');
  return { product, target: round(have + missing), have, missing, liters };
}

/** What a tier of `days` needs, what is there and what is missing. */
export function tierStatus(shelf: Shelf, autonomy: Autonomy, today: Day, days: number): TierStatus {
  const summaries = summarizeProducts(shelf, today);
  const lines: TierLine[] = [];
  for (const { product, usableQty } of summaries) {
    const target = productTarget(product, shelf.settings, days);
    if (target === null || target === 0) continue;
    const missing = usableQty >= target ? 0 : roundQuantity(target - usableQty, product.unit, 'up');
    lines.push({ product, target, have: usableQty, missing });
  }

  const water = waterStatus(shelf, autonomy, days);
  const usable = (product: Product | undefined) => summaries.find((summary) => summary.product === product)?.usableQty ?? 0;
  for (const line of [
    waterLine(water.storedProduct, water.missingStored, usable(water.storedProduct)),
    waterLine(water.treatmentProduct, water.missingTreatment, usable(water.treatmentProduct)),
  ]) {
    if (line) lines.push(line);
  }

  const foodDays = autonomy.food.days;
  const ratio = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value / days)) : 1);
  const lineRatios = lines.filter((line) => line.liters === undefined).map((line) => Math.min(1, line.have / line.target));
  const gauges = [ratio(foodDays), ratio(water.days)];
  if (lineRatios.length > 0) gauges.push(lineRatios.reduce((sum, value) => sum + value, 0) / lineRatios.length);
  const missing = lines.filter((line) => line.missing > 0);
  const complete =
    foodDays >= days && water.days >= days && missing.length === 0 && water.missingStored === 0 && water.missingTreatment === 0;

  return {
    days,
    foodDays,
    water,
    lines,
    missing,
    progress: complete ? 1 : Math.min(0.99, gauges.reduce((sum, value) => sum + value, 0) / gauges.length),
    complete,
  };
}

export interface TierPlan {
  tiers: TierStatus[];
  /** First tier that is not complete, null when they all are. */
  current: TierStatus | null;
}

export function tierPlan(shelf: Shelf, autonomy: Autonomy, today: Day): TierPlan {
  const tiers = shelf.settings.tiers.map((days) => tierStatus(shelf, autonomy, today, days));
  return { tiers, current: tiers.find((tier) => !tier.complete) ?? null };
}
