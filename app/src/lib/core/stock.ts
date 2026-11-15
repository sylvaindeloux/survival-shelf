import { normalizeCategory } from './categories';
import { formatDay, normalizeDate, parseDay, type Day } from './dates';
import { newLotId } from './ids';
import { sameName } from './text';
import type { LogAction, Lot, Product, Settings, Shelf } from './types';

export function findProduct(shelf: Shelf, name: string): Product | undefined {
  return shelf.products.find((product) => sameName(product.name, name));
}

export function lotsOf(shelf: Shelf, productName: string): Lot[] {
  return shelf.lots.filter((lot) => sameName(lot.product, productName));
}

/** Expiry of a lot as a day number, or Infinity when it never expires. */
export function lotExpiry(lot: Lot): Day {
  if (lot.expires === '') return Number.POSITIVE_INFINITY;
  return parseDay(lot.expires) ?? Number.POSITIVE_INFINITY;
}

/** First expired, first out. Lots without expiry come last. */
export function byExpiry(a: Lot, b: Lot): number {
  const diff = lotExpiry(a) - lotExpiry(b);
  return Number.isNaN(diff) ? 0 : diff;
}

export function emptyProduct(name: string): Product {
  return {
    name,
    category: 'other',
    unit: '',
    kcal: null,
    water: null,
    daily: null,
    per: 'person',
    target: null,
    notes: '',
    extra: {},
  };
}

/**
 * Creates or updates a product. When `previousName` is given and differs, the
 * product is renamed everywhere (lots and log).
 */
export function upsertProduct(shelf: Shelf, product: Product, previousName?: string): Shelf {
  const cleaned: Product = { ...product, name: product.name.trim(), category: normalizeCategory(product.category) };
  const key = previousName ?? cleaned.name;
  const index = shelf.products.findIndex((existing) => sameName(existing.name, key));
  const products = [...shelf.products];
  if (index === -1) products.push(cleaned);
  else products[index] = cleaned;

  const renamed = previousName !== undefined && previousName !== cleaned.name;
  return {
    ...shelf,
    products,
    lots: renamed
      ? shelf.lots.map((lot) => (sameName(lot.product, previousName) ? { ...lot, product: cleaned.name } : lot))
      : shelf.lots,
    log: renamed
      ? shelf.log.map((entry) => (sameName(entry.product, previousName) ? { ...entry, product: cleaned.name } : entry))
      : shelf.log,
  };
}

/** Removes a product and all its lots. The log is kept as history. */
export function deleteProduct(shelf: Shelf, name: string): Shelf {
  return {
    ...shelf,
    products: shelf.products.filter((product) => !sameName(product.name, name)),
    lots: shelf.lots.filter((lot) => !sameName(lot.product, name)),
  };
}

export interface LotInput {
  product: string;
  qty: number;
  expires: string;
  location: string;
  added?: string;
}

/**
 * Adds a lot. A lot with the same product, expiry and location is merged into
 * the existing one. New lots are placed right after the other lots of the same
 * product so the file stays grouped.
 */
export function addLot(shelf: Shelf, input: LotInput, today: Day): Shelf {
  let next = shelf;
  let product = findProduct(next, input.product);
  if (!product) {
    product = emptyProduct(input.product.trim());
    next = { ...next, products: [...next.products, product] };
  }
  const expires = input.expires.trim() === '' ? '' : normalizeDate(input.expires);
  const location = input.location.trim();
  const twin = next.lots.find(
    (lot) => sameName(lot.product, product.name) && lot.expires === expires && sameName(lot.location, location),
  );
  if (twin) {
    return { ...next, lots: next.lots.map((lot) => (lot === twin ? { ...lot, qty: lot.qty + input.qty } : lot)) };
  }
  const lot: Lot = {
    id: newLotId(),
    product: product.name,
    qty: input.qty,
    expires,
    location,
    added: input.added ?? formatDay(today),
    extra: {},
  };
  const lots = [...next.lots];
  let lastIndex = -1;
  lots.forEach((existing, i) => {
    if (sameName(existing.product, product.name)) lastIndex = i;
  });
  if (lastIndex === -1) lots.push(lot);
  else lots.splice(lastIndex + 1, 0, lot);
  return { ...next, lots };
}

export function updateLot(shelf: Shelf, id: string, changes: Partial<Omit<Lot, 'id'>>): Shelf {
  return {
    ...shelf,
    lots: shelf.lots
      .map((lot) => {
        if (lot.id !== id) return lot;
        const updated = { ...lot, ...changes };
        if (changes.expires !== undefined) updated.expires = changes.expires.trim() === '' ? '' : normalizeDate(changes.expires);
        return updated;
      })
      .filter((lot) => lot.qty > 0),
  };
}

export function deleteLot(shelf: Shelf, id: string): Shelf {
  return { ...shelf, lots: shelf.lots.filter((lot) => lot.id !== id) };
}

export interface TakeResult {
  shelf: Shelf;
  /** Quantity actually taken (can be less than asked when the stock is short). */
  taken: number;
}

function take(shelf: Shelf, lots: Lot[], qty: number, action: LogAction, today: Day, note: string, productName: string): TakeResult {
  let remaining = qty;
  const changes = new Map<string, number>();
  for (const lot of lots) {
    if (remaining <= 0) break;
    const used = Math.min(lot.qty, remaining);
    changes.set(lot.id, lot.qty - used);
    remaining -= used;
  }
  const taken = Math.round((qty - remaining) * 1000) / 1000;
  if (taken <= 0) return { shelf, taken: 0 };
  return {
    taken,
    shelf: {
      ...shelf,
      lots: shelf.lots
        .map((lot) => (changes.has(lot.id) ? { ...lot, qty: Math.round(changes.get(lot.id)! * 1000) / 1000 } : lot))
        .filter((lot) => lot.qty > 0),
      log: [...shelf.log, { date: formatDay(today), product: productName, qty: taken, action, note, extra: {} }],
    },
  };
}

/** Takes a quantity of a product, oldest expiry first (FEFO), and logs it. */
export function takeFromProduct(
  shelf: Shelf,
  productName: string,
  qty: number,
  action: LogAction,
  today: Day,
  note = '',
): TakeResult {
  const product = findProduct(shelf, productName);
  const lots = lotsOf(shelf, productName).sort(byExpiry);
  return take(shelf, lots, qty, action, today, note, product?.name ?? productName);
}

/** Takes a quantity from one specific lot and logs it. */
export function takeFromLot(shelf: Shelf, lotId: string, qty: number, action: LogAction, today: Day, note = ''): TakeResult {
  const lot = shelf.lots.find((candidate) => candidate.id === lotId);
  if (!lot) return { shelf, taken: 0 };
  return take(shelf, [lot], qty, action, today, note, lot.product);
}

export function updateSettings(shelf: Shelf, settings: Settings): Shelf {
  return { ...shelf, settings: { ...settings } };
}
