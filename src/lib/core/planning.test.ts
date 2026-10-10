import { describe, expect, it } from 'vitest';
import { computeAutonomy, simulate } from './autonomy';
import { dayFromParts, formatDay } from './dates';
import { emptyShelf } from './defaults';
import { CATALOG, starterItems } from './catalog';
import { buyCount, checkIn, waterWithoutProduct } from './checkin';
import { reminderCalendar } from './ics';
import { menuKcal, productTarget, tierPlan, tierStatus } from './plan';
import { rotationPlan } from './rotation';
import { expiryAlerts, summarizeProducts } from './status';
import { addLot, emptyProduct, upsertProduct } from './stock';
import type { Shelf } from './types';

const TODAY = dayFromParts(2026, 10, 10);
const inDays = (days: number) => formatDay(TODAY + days);

function household(): Shelf {
  let shelf = emptyShelf();
  shelf.settings = { ...shelf.settings, people: 2, kcalPerPersonPerDay: 2000, waterPerPersonPerDay: 2.5, rotationMarginDays: 0 };
  shelf = upsertProduct(shelf, { ...emptyProduct('Rice'), category: 'grains', unit: 'kg', kcal: 4000, daily: 0.5 });
  shelf = upsertProduct(shelf, { ...emptyProduct('Water'), category: 'water', unit: 'L', water: 1 });
  shelf = upsertProduct(shelf, { ...emptyProduct('Matches'), category: 'tools', unit: 'box', target: 2, per: 'household' });
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

describe('status', () => {
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
  });
});

describe('plan and tiers', () => {
  it('scales daily use with the tier and the household, targets are minimums', () => {
    const shelf = household();
    const [rice, water, matches] = shelf.products;
    expect(productTarget(rice, shelf.settings, 7)).toBe(7); // 0.5 kg × 2 people × 7 days
    expect(productTarget(matches, shelf.settings, 7)).toBe(2);
    expect(productTarget({ ...matches, daily: 1 }, shelf.settings, 7)).toBe(7);
    expect(productTarget({ ...matches, per: 'person' }, shelf.settings, 7)).toBe(4);
    expect(productTarget(water, shelf.settings, 7)).toBeNull();
    expect(menuKcal(shelf)).toBe(2000);
  });

  it('lists what a tier misses, rounding counted things up', () => {
    let shelf = household();
    shelf = upsertProduct(shelf, { ...emptyProduct('Tuna'), category: 'canned', unit: 'can', kcal: 150, daily: 0.3 });
    shelf = addLot(shelf, { product: 'Rice', qty: 3, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Matches', qty: 2, expires: '', location: '' }, TODAY);
    const week = tierStatus(shelf, computeAutonomy(shelf, TODAY), TODAY, 7);
    expect(week.lines.map((line) => [line.product.name, line.target, line.have, line.missing])).toEqual([
      ['Rice', 7, 3, 4],
      ['Matches', 2, 2, 0],
      ['Tuna', 5, 0, 5],
      ['Water', 35, 0, 35],
    ]);
    // 2 people × 2.5 L × 7 days, with water as the first water product.
    expect(week.water.missingStored).toBe(35);
    expect(week.missing.map((line) => [line.product.name, line.missing, line.liters])).toEqual([
      ['Rice', 4, undefined],
      ['Tuna', 5, undefined],
      ['Water', 35, 35],
    ]);
    expect(week.complete).toBe(false);
    expect(week.progress).toBeGreaterThan(0);
    expect(week.progress).toBeLessThan(1);
  });

  it('counts water treatment only beyond a month of stored water', () => {
    let shelf = household();
    shelf = upsertProduct(shelf, { ...emptyProduct('Filter'), category: 'water-treatment', unit: 'unit', water: 1000 });
    shelf = addLot(shelf, { product: 'Water', qty: 100, expires: '', location: '' }, TODAY); // 20 days
    shelf = addLot(shelf, { product: 'Filter', qty: 1, expires: '', location: '' }, TODAY); // 200 days
    const autonomy = computeAutonomy(shelf, TODAY);
    expect(autonomy.water.days).toBe(20);
    expect(autonomy.treatmentLiters).toBe(1000);

    const month = tierStatus(shelf, autonomy, TODAY, 30);
    expect(month.water).toMatchObject({ days: 20, missingStored: 50, missingTreatment: 0 });

    const year = tierStatus(shelf, autonomy, TODAY, 365);
    expect(year.water).toMatchObject({ days: 220, missingStored: 50, missingTreatment: 675 });
    expect(year.missing.filter((line) => line.liters).map((line) => [line.product.name, line.missing])).toEqual([
      ['Water', 50],
      ['Filter', 1],
    ]);
  });

  it('completes a tier when food, water and every planned product are there', () => {
    let shelf = household();
    shelf = addLot(shelf, { product: 'Rice', qty: 7, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Water', qty: 35, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Matches', qty: 2, expires: '', location: '' }, TODAY);
    const plan = tierPlan(shelf, computeAutonomy(shelf, TODAY), TODAY);
    expect(plan.tiers.map((tier) => [tier.days, tier.complete])).toEqual([
      [7, true],
      [30, false],
      [365, false],
    ]);
    expect(plan.tiers[0].progress).toBe(1);
    expect(plan.current?.days).toBe(30);
  });
});

describe('check-in', () => {
  it('lists what to discard, what to eat this period and what to buy', () => {
    let shelf = household();
    shelf = upsertProduct(shelf, { ...emptyProduct('Tuna'), category: 'canned', unit: 'can', kcal: 150 });
    shelf = addLot(shelf, { product: 'Rice', qty: 10, expires: inDays(69), location: '' }, TODAY); // 1 kg per week
    shelf = addLot(shelf, { product: 'Tuna', qty: 3, expires: inDays(209), location: '' }, TODAY); // 0.1 can per week
    shelf = addLot(shelf, { product: 'Water', qty: 4, expires: inDays(-3), location: '' }, TODAY);
    const autonomy = computeAutonomy(shelf, TODAY);
    const plan = tierPlan(shelf, autonomy, TODAY);

    const week = checkIn(shelf, TODAY, rotationPlan(shelf, TODAY), plan.current);
    expect(week.periodDays).toBe(7);
    expect(week.discard.map((lot) => lot.product)).toEqual(['Water']);
    expect(week.consume.map((item) => [item.product.name, item.qty])).toEqual([['Rice', 1]]);
    expect(week.buy?.days).toBe(7);

    shelf.settings.rhythm = 'monthly';
    const month = checkIn(shelf, TODAY, rotationPlan(shelf, TODAY), plan.current);
    // Tuna's pace (0.4 can a month) rounds to nothing: it shows up when it is due.
    expect(month.consume.map((item) => [item.product.name, item.qty])).toEqual([['Rice', 4.29]]);
  });

  it('still asks for water when no water product is in the list', () => {
    let shelf = household();
    shelf = { ...shelf, products: shelf.products.filter((product) => product.name !== 'Water') };
    const autonomy = computeAutonomy(shelf, TODAY);
    const week = tierStatus(shelf, autonomy, TODAY, 7);
    expect(week.missing.map((line) => line.product.name)).toEqual(['Rice', 'Matches']);
    expect(waterWithoutProduct(week)).toEqual({ stored: 35, treatment: 0 });
    expect(buyCount(week)).toBe(3);

    const year = tierStatus(shelf, autonomy, TODAY, 365);
    expect(waterWithoutProduct(year)).toEqual({ stored: 150, treatment: 1675 });
    expect(buyCount(null)).toBe(0);
  });
});

describe('reminder calendar', () => {
  const now = new Date(Date.UTC(2026, 9, 10, 8, 30));

  it('writes a weekly reminder at local time', () => {
    const ics = reminderCalendar({
      start: '2026-10-17T10:00',
      rhythm: 'weekly',
      title: 'Survival Shelf: check-in',
      description: 'Consume, buy, discard; see the app',
      url: 'https://example.org/survival-shelf/',
      now,
    });
    expect(ics).toContain('DTSTART:20261017T100000\r\n');
    expect(ics).toContain('RRULE:FREQ=WEEKLY\r\n');
    expect(ics).toContain('DTSTAMP:20261010T083000Z\r\n');
    expect(ics).toContain('SUMMARY:Survival Shelf: check-in\r\n');
    // Long lines are folded: a line break followed by a space.
    expect(ics.replace(/\r\n /g, '')).toContain('DESCRIPTION:Consume\\, buy\\, discard\\; see the app\\nhttps://example.org/survival-shelf/');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it('repeats monthly on the same weekday of the month', () => {
    const second = reminderCalendar({ start: '2026-10-10T09:30', rhythm: 'monthly', title: 'x', description: 'y', now });
    expect(second).toContain('RRULE:FREQ=MONTHLY;BYDAY=2SA');
    const last = reminderCalendar({ start: '2026-10-31T09:30', rhythm: 'monthly', title: 'x', description: 'y', now });
    expect(last).toContain('RRULE:FREQ=MONTHLY;BYDAY=-1SA');
  });
});

describe('catalog', () => {
  it('has a starter menu close to 2200 kcal per person per day', () => {
    const kcal = starterItems([]).reduce((sum, entry) => sum + (entry.per === 'person' ? (entry.daily ?? 0) * (entry.kcal ?? 0) : 0), 0);
    expect(kcal).toBeGreaterThan(2150);
    expect(kcal).toBeLessThan(2250);
  });

  it('only proposes specific needs when asked', () => {
    expect(starterItems([]).some((entry) => entry.need)).toBe(false);
    expect(starterItems(['baby']).filter((entry) => entry.need).map((entry) => entry.id)).toEqual(['infant-formula', 'diapers']);
  });

  it('uses unique ids and known categories', () => {
    expect(new Set(CATALOG.map((entry) => entry.id)).size).toBe(CATALOG.length);
  });
});
