import { describe, expect, it } from 'vitest';
import { computeAutonomy, simulate } from './autonomy';
import { dayFromParts, formatDay } from './dates';
import { emptyShelf } from './defaults';
import { rotationPlan } from './rotation';
import { autonomyGap, shoppingList } from './shopping';
import { expiryAlerts, summarizeProducts } from './status';
import { addLot, emptyProduct, upsertProduct } from './stock';
import type { Shelf } from './types';

const TODAY = dayFromParts(2026, 10, 10);
const inDays = (days: number) => formatDay(TODAY + days);

function household(): Shelf {
  let shelf = emptyShelf();
  shelf.settings = { ...shelf.settings, people: 2, kcalPerPersonPerDay: 2000, waterPerPersonPerDay: 2.5, rotationMarginDays: 0 };
  shelf = upsertProduct(shelf, { ...emptyProduct('Rice'), category: 'grains', unit: 'kg', kcal: 4000, target: 10 });
  shelf = upsertProduct(shelf, { ...emptyProduct('Water'), category: 'water', unit: 'L', water: 1, target: 100 });
  shelf = upsertProduct(shelf, { ...emptyProduct('Matches'), category: 'tools' });
  return shelf;
}

describe('simulate', () => {
  it('lasts as long as the stock when nothing expires', () => {
    expect(simulate([{ amount: 100, end: Infinity }], 10)).toEqual({ days: 10, lost: 0 });
  });

  it('loses what expires before its turn', () => {
    // 50 units expiring after day 3 at 10/day: only 30 can be eaten in time.
    expect(simulate([{ amount: 50, end: 3 }, { amount: 20, end: Infinity }], 10)).toEqual({ days: 5, lost: 20 });
  });

  it('eats the earliest expiring portions first', () => {
    expect(simulate([{ amount: 20, end: Infinity }, { amount: 20, end: 2 }], 10)).toEqual({ days: 4, lost: 0 });
  });

  it('is infinite when nothing is needed', () => {
    expect(simulate([], 0).days).toBe(Infinity);
  });
});

describe('computeAutonomy', () => {
  it('computes food and water autonomy and the limiting factor', () => {
    let shelf = household();
    shelf = addLot(shelf, { product: 'Rice', qty: 10, expires: '', location: '' }, TODAY); // 40 000 kcal = 10 days
    shelf = addLot(shelf, { product: 'Water', qty: 30, expires: inDays(400), location: '' }, TODAY); // 30 L = 6 days
    shelf = addLot(shelf, { product: 'Water', qty: 100, expires: inDays(-1), location: '' }, TODAY); // expired
    const autonomy = computeAutonomy(shelf, TODAY);
    expect(autonomy.food.days).toBe(10);
    expect(autonomy.water.days).toBe(6);
    expect(autonomy.water.expired).toBe(100);
    expect(autonomy.days).toBe(6);
    expect(autonomy.limitedBy).toBe('water');
    expect(autonomyGap({ ...shelf, settings: { ...shelf.settings, targetDays: 30 } }, autonomy)).toEqual({
      kcal: 80_000,
      water: 120,
    });
  });

  it('accounts for food expiring before it can be eaten', () => {
    let shelf = household();
    // 10 kg of rice = 10 days, but it expires in 4 days (usable today included).
    shelf = addLot(shelf, { product: 'Rice', qty: 10, expires: inDays(3), location: '' }, TODAY);
    const { food } = computeAutonomy(shelf, TODAY);
    expect(food.naiveDays).toBe(10);
    expect(food.days).toBe(4);
    expect(food.lost).toBe(24_000);
  });
});

describe('rotationPlan', () => {
  it('finds the smallest steady pace that avoids waste', () => {
    let shelf = household();
    shelf = addLot(shelf, { product: 'Rice', qty: 10, expires: inDays(69), location: '' }, TODAY); // 10 weeks
    shelf = addLot(shelf, { product: 'Rice', qty: 10, expires: inDays(139), location: '' }, TODAY); // 20 weeks
    const plan = rotationPlan(shelf, TODAY);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].perWeek).toBe(1);
    expect(plan.items[0].due).toBe(false);
    expect(plan.kcalPerDay).toBeCloseTo(4000 / 7);
    expect(plan.shareOfNeeds).toBeCloseTo(4000 / 7 / 4000);
  });

  it('applies the rotation margin and flags lots that are due', () => {
    let shelf = household();
    shelf.settings.rotationMarginDays = 30;
    shelf = addLot(shelf, { product: 'Rice', qty: 3, expires: inDays(20), location: '' }, TODAY);
    const [item] = rotationPlan(shelf, TODAY).items;
    expect(item.due).toBe(true);
    expect(item.perWeek).toBe(3);
  });

  it('ignores lots without expiry or already expired, and non-food items', () => {
    let shelf = household();
    shelf = addLot(shelf, { product: 'Rice', qty: 3, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Water', qty: 3, expires: inDays(-5), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Matches', qty: 3, expires: inDays(100), location: '' }, TODAY);
    expect(rotationPlan(shelf, TODAY).items).toEqual([]);
  });
});

describe('status and shopping', () => {
  it('summarizes products and lists alerts', () => {
    let shelf = household();
    shelf = addLot(shelf, { product: 'Rice', qty: 2, expires: inDays(-1), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Rice', qty: 3, expires: inDays(30), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Water', qty: 50, expires: inDays(365), location: '' }, TODAY);
    const [rice, water, matches] = summarizeProducts(shelf, TODAY);
    expect(rice).toMatchObject({ qty: 5, usableQty: 3, status: 'expired', nextExpiry: TODAY + 30 });
    expect(water).toMatchObject({ qty: 50, status: 'ok' });
    expect(matches).toMatchObject({ qty: 0, status: 'none', nextExpiry: null });
    const alerts = expiryAlerts(shelf, TODAY);
    expect(alerts.expired.map((lot) => lot.qty)).toEqual([2]);
    expect(alerts.soon.map((lot) => lot.qty)).toEqual([3]);
    expect(shoppingList(shelf, TODAY).map((item) => [item.product.name, item.have, item.missing])).toEqual([
      ['Rice', 3, 7],
      ['Water', 50, 50],
    ]);
  });
});
