import type { ReplaceItem } from './checkin';
import type { GearStatus } from './plan';
import type { ProductSummary } from './status';
import type { Kind } from './types';

/** What needs a look in one part of the stock: food, consumables or gear. */
export interface KindOverview {
  products: number;
  /** Products with something in stock, expired or not. */
  stocked: number;
  expired: number;
  /** Products expiring within the warning days. */
  soon: number;
  /** Lots already within their rotation margin: to use up and replace now. */
  replace: number;
  /** Gear of the plan (zero for the other parts): owned in the planned quantity, out of how many. */
  ready: number;
  total: number;
  missing: number;
}

/** Sums up a part of the stock from what the app already computed: its summaries, replacements and gear. */
export function kindOverview(kind: Kind, summaries: ProductSummary[], replace: ReplaceItem[], gear: GearStatus): KindOverview {
  const list = summaries.filter((summary) => summary.product.kind === kind);
  const isGear = kind === 'gear';
  return {
    products: list.length,
    stocked: list.filter((summary) => summary.qty > 0).length,
    expired: list.filter((summary) => summary.status === 'expired').length,
    soon: list.filter((summary) => summary.status === 'soon').length,
    replace: replace.filter((item) => item.due && item.product.kind === kind).length,
    ready: isGear ? gear.ready : 0,
    total: isGear ? gear.total : 0,
    missing: isGear ? gear.missing.length : 0,
  };
}
