import { describe, expect, it } from 'vitest';
import { replacements } from './checkin';
import { dayFromParts, formatDay } from './dates';
import { emptyShelf } from './defaults';
import { kindOverview } from './overview';
import { gearStatus } from './plan';
import { summarizeProducts } from './status';
import { addLot, emptyProduct, upsertProduct } from './stock';
import type { Kind, Shelf } from './types';

const TODAY = dayFromParts(2026, 11, 15);
const inDays = (days: number) => formatDay(TODAY + days);

function lot(shelf: Shelf, product: string, qty: number, expires: string): Shelf {
  return addLot(shelf, { product, qty, expires, location: '' }, TODAY);
}

describe('the overview of a part of the stock', () => {
  it('counts the products, what expired, what expires soon, what to replace and the gear to complete', () => {
    let shelf = emptyShelf('en');
    shelf = upsertProduct(shelf, { ...emptyProduct('Rice'), kind: 'food', category: 'grains', unit: 'kg' });
    shelf = upsertProduct(shelf, { ...emptyProduct('Pasta'), kind: 'food', category: 'grains', unit: 'kg' });
    shelf = upsertProduct(shelf, { ...emptyProduct('Beans'), kind: 'food', category: 'legumes', unit: 'kg' });
    shelf = upsertProduct(shelf, { ...emptyProduct('Batteries'), kind: 'consumable', category: 'energy', unit: 'pcs' });
    shelf = upsertProduct(shelf, { ...emptyProduct('Matches'), kind: 'gear', category: 'tools', unit: 'box', target: 2, per: 'household' });
    shelf = upsertProduct(shelf, { ...emptyProduct('Headlamp'), kind: 'gear', category: 'light', unit: 'pcs', target: 1, per: 'household' });
    shelf = upsertProduct(shelf, { ...emptyProduct('Radio'), kind: 'gear', category: 'communication', unit: 'pcs', target: 1, per: 'household' });
    shelf = lot(shelf, 'Rice', 2, inDays(-3));
    shelf = lot(shelf, 'Rice', 1, inDays(400));
    shelf = lot(shelf, 'Pasta', 1, inDays(20));
    shelf = lot(shelf, 'Beans', 1, inDays(700));
    // Within the 30-day rotation margin: to replace now. The second lot is for a later check-in.
    shelf = lot(shelf, 'Batteries', 4, inDays(25));
    shelf = lot(shelf, 'Batteries', 8, inDays(50));
    shelf = lot(shelf, 'Matches', 1, '');
    shelf = lot(shelf, 'Headlamp', 1, '');

    const summaries = summarizeProducts(shelf, TODAY);
    const replace = replacements(shelf, TODAY, 30);
    const gear = gearStatus(shelf, TODAY);
    const overview = (kind: Kind) => kindOverview(kind, summaries, replace, gear);

    expect(overview('food')).toEqual({ products: 3, stocked: 3, expired: 1, soon: 1, replace: 0, ready: 0, total: 0, missing: 0 });
    expect(overview('consumable')).toEqual({ products: 1, stocked: 1, expired: 0, soon: 1, replace: 1, ready: 0, total: 0, missing: 0 });
    // The radio is planned but not bought yet.
    expect(overview('gear')).toEqual({ products: 3, stocked: 2, expired: 0, soon: 0, replace: 0, ready: 1, total: 3, missing: 2 });
  });
});
