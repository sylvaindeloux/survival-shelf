import { waterNeed } from './autonomy';
import { isFood, isStoredWater } from './categories';
import { formatDay, type Day } from './dates';
import { expiryStatus } from './status';
import { byExpiry, findProduct, takeFromLot, type TakeResult } from './stock';
import { sameName } from './text';
import type { Lot, Product, Shelf } from './types';

/**
 * A bottle of this size or less is ticked bottle by bottle. Bigger water (a 5 L can, a pack of six) is
 * ticked liter by liter.
 */
const BOTTLE_LITERS = 2;

/** Rounding of the quantities taken (thousandths of a unit), so 9 × 1/9 of a pack still makes a liter. */
const TOLERANCE = 0.01;

/** Lots of the go-bags stay packed for an evacuation: at home, the rest of the stock goes first. */
function inBag(shelf: Shelf, lot: Lot): boolean {
  return shelf.bags.some((bag) => sameName(bag.name, lot.location));
}

/** Lots that are not expired, out of the go-bags first, the one that expires first first. */
function usableLots(shelf: Shelf, today: Day, keep: (product: Product) => boolean): Lot[] {
  const lots = shelf.lots
    .filter((lot) => {
      const product = findProduct(shelf, lot.product);
      return lot.qty > 0 && product !== undefined && keep(product) && expiryStatus(lot, shelf.settings, today) !== 'expired';
    })
    .sort(byExpiry);
  return [...lots.filter((lot) => !inBag(shelf, lot)), ...lots.filter((lot) => inBag(shelf, lot))];
}

export interface WaterToday {
  /** Liters the household needs per day, from the settings. */
  need: number;
  /** Liters of stored water drunk today, from the log. */
  drunk: number;
  /** The water to drink next, and its product; null when there is no stored water left. */
  lot: Lot | null;
  product: Product | null;
  /** Liters of each box to tick: a bottle, or a liter of bigger water. */
  boxLiters: number;
  /** Quantity of the product a box takes from the stock. */
  boxQty: number;
  /** Boxes for the day's need, and how many of them are drunk. */
  boxes: number;
  done: number;
}

/** The water of the day in crisis mode: the household's need, in bottles of the water to drink next. */
export function waterToday(shelf: Shelf, today: Day): WaterToday {
  const need = waterNeed(shelf.settings);
  const day = formatDay(today);
  let drunk = 0;
  for (const entry of shelf.log) {
    const product = findProduct(shelf, entry.product);
    if (entry.date === day && entry.action === 'consumed' && product && isStoredWater(product)) drunk += entry.qty * (product.water ?? 0);
  }
  const lot = usableLots(shelf, today, isStoredWater)[0] ?? null;
  const product = lot ? (findProduct(shelf, lot.product) ?? null) : null;
  const liters = product?.water ?? 0;
  if (!lot || liters <= 0) return { need, drunk, lot: null, product: null, boxLiters: 0, boxQty: 0, boxes: 0, done: 0 };
  const boxLiters = liters <= BOTTLE_LITERS ? liters : 1;
  const boxes = Math.ceil(need / boxLiters - TOLERANCE);
  return {
    need,
    drunk,
    lot,
    product,
    boxLiters,
    boxQty: boxLiters / liters,
    boxes,
    done: Math.min(boxes, Math.floor(drunk / boxLiters + TOLERANCE)),
  };
}

/** Drinks one box of the water of the day: it leaves the stock and goes to the log. */
export function drinkWater(shelf: Shelf, today: Day): TakeResult {
  const { lot, boxQty } = waterToday(shelf, today);
  if (!lot) return { shelf, taken: 0 };
  return takeFromLot(shelf, lot.id, Math.min(boxQty, lot.qty), 'consumed', today);
}

/** Food to eat first: the lots that expire first, out of the go-bags, not expired, pet food left aside. */
export function eatFirst(shelf: Shelf, today: Day, count = 3): Lot[] {
  const forPeople = (product: Product) => isFood(product) && !isStoredWater(product) && product.per !== 'cat' && product.per !== 'dog';
  return usableLots(shelf, today, forPeople).slice(0, count);
}
