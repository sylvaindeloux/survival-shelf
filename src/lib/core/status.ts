import type { Day } from './dates';
import { byExpiry, lotExpiry } from './stock';
import { sameName } from './text';
import type { Lot, Product, Settings, Shelf } from './types';

export type ExpiryStatus = 'expired' | 'soon' | 'ok' | 'none';

export function expiryStatus(lot: Lot, settings: Settings, today: Day): ExpiryStatus {
  const expiry = lotExpiry(lot);
  if (!Number.isFinite(expiry)) return 'none';
  if (expiry < today) return 'expired';
  if (expiry - today <= settings.warningDays) return 'soon';
  return 'ok';
}

/** Days left before a lot expires (negative when expired), or null when it never expires. */
export function daysLeft(lot: Lot, today: Day): number | null {
  const expiry = lotExpiry(lot);
  return Number.isFinite(expiry) ? expiry - today : null;
}

const STATUS_RANK: Record<ExpiryStatus, number> = { expired: 0, soon: 1, ok: 2, none: 3 };

export interface ProductSummary {
  product: Product;
  /** Lots of the product, oldest expiry first. */
  lots: Lot[];
  qty: number;
  /** Quantity that is not expired yet. */
  usableQty: number;
  /** Worst status among the lots. */
  status: ExpiryStatus;
  nextExpiry: Day | null;
}

export function summarizeProducts(shelf: Shelf, today: Day): ProductSummary[] {
  return shelf.products.map((product) => {
    const lots = shelf.lots.filter((lot) => sameName(lot.product, product.name)).sort(byExpiry);
    let status: ExpiryStatus = 'none';
    let qty = 0;
    let usableQty = 0;
    for (const lot of lots) {
      const lotStatus = expiryStatus(lot, shelf.settings, today);
      if (STATUS_RANK[lotStatus] < STATUS_RANK[status]) status = lotStatus;
      qty += lot.qty;
      if (lotStatus !== 'expired') usableQty += lot.qty;
    }
    const next = lots.map(lotExpiry).find((expiry) => Number.isFinite(expiry) && expiry >= today);
    return { product, lots, qty: round(qty), usableQty: round(usableQty), status, nextExpiry: next ?? null };
  });
}

export interface ExpiryAlerts {
  expired: Lot[];
  soon: Lot[];
}

export function expiryAlerts(shelf: Shelf, today: Day): ExpiryAlerts {
  const sorted = [...shelf.lots].sort(byExpiry);
  return {
    expired: sorted.filter((lot) => expiryStatus(lot, shelf.settings, today) === 'expired'),
    soon: sorted.filter((lot) => expiryStatus(lot, shelf.settings, today) === 'soon'),
  };
}

export function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
