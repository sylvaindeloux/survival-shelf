import { describe, expect, it } from 'vitest';
import { computeAutonomy, simulate, suppliesAutonomy, waterNeed } from './autonomy';
import { dayFromParts, formatDay } from './dates';
import { emptyShelf } from './defaults';
import { CATALOG } from './catalog';
import { buyCount, checkIn, replacements, waterWithoutProduct } from './checkin';
import { reminderCalendar } from './ics';
import { gearStatus, menuKcal, productTarget, tierPlan, tierStatus, waterGoal } from './plan';
import { rotationPlan } from './rotation';
import { expiryAlerts, summarizeProducts } from './status';
import { addLot, emptyProduct, upsertProduct } from './stock';
import type { Shelf } from './types';

const TODAY = dayFromParts(2026, 10, 10);
const inDays = (days: number) => formatDay(TODAY + days);

function household(): Shelf {
  let shelf = emptyShelf();
  shelf.settings = { ...shelf.settings, people: 2, kcalPerPersonPerDay: 2000, waterPerPersonPerDay: 2.5, rotationMarginDays: 0 };
  shelf = upsertProduct(shelf, { ...emptyProduct('Rice'), kind: 'food', category: 'grains', unit: 'kg', kcal: 4000, daily: 0.5 });
  shelf = upsertProduct(shelf, { ...emptyProduct('Water'), kind: 'food', category: 'water', unit: 'L', water: 1 });
  shelf = upsertProduct(shelf, { ...emptyProduct('Matches'), kind: 'gear', category: 'tools', unit: 'box', target: 2, per: 'household' });
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

  it('adds what cats and dogs drink to the water need, not to the food need', () => {
    const shelf = household(); // 2 people × 2.5 L
    shelf.settings = { ...shelf.settings, cats: 2, dogs: 1 };
    expect(waterNeed(shelf.settings)).toBe(7); // 5 L + 2 × 0.25 L + 1.5 L
    const autonomy = computeAutonomy(shelf, TODAY);
    expect(autonomy.water.dailyNeed).toBe(7);
    expect(autonomy.food.dailyNeed).toBe(4000);
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

  it('counts pet products once per cat or per dog', () => {
    let shelf = household();
    shelf.settings = { ...shelf.settings, cats: 2 };
    shelf = upsertProduct(shelf, { ...emptyProduct('Cat food'), kind: 'food', category: 'pets', unit: 'kg', daily: 0.06, per: 'cat' });
    shelf = upsertProduct(shelf, { ...emptyProduct('Dog food'), kind: 'food', category: 'pets', unit: 'kg', daily: 0.3, per: 'dog' });
    const [catFood, dogFood] = shelf.products.slice(-2);
    expect(productTarget(catFood, shelf.settings, 30)).toBe(3.6); // 0.06 kg × 2 cats × 30 days
    expect(productTarget(dogFood, shelf.settings, 30)).toBe(0); // no dog
    const tier = tierStatus(shelf, computeAutonomy(shelf, TODAY), TODAY, 30);
    expect(tier.lines.map((line) => line.product.name)).toContain('Cat food');
    expect(tier.lines.map((line) => line.product.name)).not.toContain('Dog food');
  });

  it('lists what a tier misses, rounding counted things up', () => {
    let shelf = household();
    shelf = upsertProduct(shelf, { ...emptyProduct('Tuna'), kind: 'food', category: 'canned', unit: 'can', kcal: 150, daily: 0.3 });
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

  it('gives the water goal of a tier in liters, with treatment beyond a month', () => {
    let shelf = household(); // 5 L a day
    shelf = upsertProduct(shelf, { ...emptyProduct('Filter'), category: 'water-treatment', unit: 'unit', water: 1000 });
    shelf = addLot(shelf, { product: 'Water', qty: 54, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Water', qty: 10, expires: inDays(-1), location: '' }, TODAY); // expired: not counted
    let autonomy = computeAutonomy(shelf, TODAY);
    expect(waterGoal(shelf, autonomy, 7)).toEqual({ stored: { have: 54, target: 35 }, treatment: null });
    expect(waterGoal(shelf, autonomy, 30)).toEqual({ stored: { have: 54, target: 150 }, treatment: null });

    shelf = addLot(shelf, { product: 'Filter', qty: 1, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Water', qty: 146, expires: '', location: '' }, TODAY); // 200 L: 50 L beyond the month
    autonomy = computeAutonomy(shelf, TODAY);
    expect(waterGoal(shelf, autonomy, 365)).toEqual({ stored: { have: 200, target: 150 }, treatment: { have: 1050, target: 1675 } });
  });

  it('plans stored water for the whole tier when the list has no water treatment', () => {
    let shelf = household(); // 5 L a day, Water but no filter
    shelf = addLot(shelf, { product: 'Water', qty: 100, expires: '', location: '' }, TODAY); // 20 days
    const autonomy = computeAutonomy(shelf, TODAY);
    const year = tierStatus(shelf, autonomy, TODAY, 365);
    expect(year.water).toMatchObject({ days: 20, missingStored: 1725, missingTreatment: 0 });
    expect(year.missing.filter((line) => line.liters).map((line) => [line.product.name, line.missing])).toEqual([['Water', 1725]]);
    expect(waterGoal(shelf, autonomy, 365)).toEqual({ stored: { have: 100, target: 1825 }, treatment: null });

    // A year of stored water completes the water of the tier.
    shelf = addLot(shelf, { product: 'Water', qty: 1725, expires: '', location: '' }, TODAY);
    expect(tierStatus(shelf, computeAutonomy(shelf, TODAY), TODAY, 365).water).toMatchObject({ missingStored: 0, missingTreatment: 0 });
  });

  it('buys the first tier of water as the first stored water product, the rest as the second', () => {
    let shelf = household(); // 5 L a day, tiers of 3, 7, 30 and 365 days
    shelf = { ...shelf, products: shelf.products.filter((product) => product.name !== 'Water') };
    shelf = upsertProduct(shelf, { ...emptyProduct('Bottle'), kind: 'food', category: 'water', unit: 'bottle', water: 1.5 });
    shelf = upsertProduct(shelf, { ...emptyProduct('Tap water'), kind: 'food', category: 'water', unit: 'jerrican', water: 20 });
    const lines = (days: number) => {
      const tier = tierStatus(shelf, computeAutonomy(shelf, TODAY), TODAY, days);
      return tier.missing.filter((line) => line.liters).map((line) => [line.product.name, line.missing, line.liters]);
    };
    expect(lines(3)).toEqual([['Bottle', 10, 15]]);
    expect(lines(30)).toEqual([
      ['Bottle', 10, 15],
      ['Tap water', 7, 135],
    ]);

    // Bottles beyond the first tier lower what is left to store as tap water.
    shelf = addLot(shelf, { product: 'Bottle', qty: 20, expires: '', location: '' }, TODAY); // 30 L, 6 days
    expect(lines(3)).toEqual([]);
    expect(lines(30)).toEqual([['Tap water', 6, 120]]);
  });

  it('completes a tier when food, water and every planned product are there', () => {
    let shelf = household();
    shelf = addLot(shelf, { product: 'Rice', qty: 7, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Water', qty: 35, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Matches', qty: 2, expires: '', location: '' }, TODAY);
    const plan = tierPlan(shelf, computeAutonomy(shelf, TODAY), TODAY);
    expect(plan.tiers.map((tier) => [tier.days, tier.complete])).toEqual([
      [3, true],
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
    shelf = upsertProduct(shelf, { ...emptyProduct('Tuna'), kind: 'food', category: 'canned', unit: 'can', kcal: 150 });
    shelf = addLot(shelf, { product: 'Rice', qty: 10, expires: inDays(69), location: '' }, TODAY); // 1 kg per week
    shelf = addLot(shelf, { product: 'Tuna', qty: 3, expires: inDays(209), location: '' }, TODAY); // 0.1 can per week
    shelf = addLot(shelf, { product: 'Water', qty: 4, expires: inDays(-3), location: '' }, TODAY);
    const autonomy = computeAutonomy(shelf, TODAY);
    const plan = tierPlan(shelf, autonomy, TODAY);

    // Monthly by default.
    const month = checkIn(shelf, TODAY, rotationPlan(shelf, TODAY), plan.current);
    expect(month.periodDays).toBe(30);
    expect(month.discard.map((lot) => lot.product)).toEqual(['Water']);
    // Tuna's pace (0.4 can a month) rounds to nothing: it shows up when it is due.
    expect(month.consume.map((item) => [item.product.name, item.qty])).toEqual([['Rice', 4.29]]);
    expect(month.buy?.days).toBe(3); // Not even 3 days of water: the expired lot does not count.

    shelf.settings.rhythm = 'quarterly';
    const quarter = checkIn(shelf, TODAY, rotationPlan(shelf, TODAY), plan.current);
    expect(quarter.periodDays).toBe(91);
    // Rice expires before the next check-in: all of it goes now.
    expect(quarter.consume.map((item) => [item.product.name, item.qty])).toEqual([['Rice', 10], ['Tuna', 1]]);

    shelf.settings.rhythm = 'semiannual';
    const half = checkIn(shelf, TODAY, rotationPlan(shelf, TODAY), plan.current);
    expect(half.periodDays).toBe(182);
    expect(half.consume.map((item) => [item.product.name, item.qty])).toEqual([['Rice', 10], ['Tuna', 3]]);
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

describe('consumables and gear', () => {
  function equipped(): Shelf {
    let shelf = household(); // 2 people, Matches: gear, 2 for the household
    shelf.settings.rotationMarginDays = 30;
    shelf = upsertProduct(shelf, { ...emptyProduct('Gas'), kind: 'consumable', category: 'energy', unit: 'cartridge', daily: 0.2 });
    shelf = upsertProduct(shelf, {
      ...emptyProduct('Candles'),
      kind: 'consumable',
      category: 'energy',
      unit: 'unit',
      daily: 0.5,
      per: 'household',
    });
    shelf = upsertProduct(shelf, {
      ...emptyProduct('Batteries'),
      kind: 'consumable',
      category: 'energy',
      unit: 'unit',
      target: 12,
      per: 'household',
    });
    shelf = upsertProduct(shelf, { ...emptyProduct('Tablets'), kind: 'consumable', category: 'water-treatment', unit: 'box', water: 50, daily: 1 });
    shelf = upsertProduct(shelf, { ...emptyProduct('Headlamp'), kind: 'gear', category: 'tools', unit: 'unit', target: 1 });
    shelf = upsertProduct(shelf, { ...emptyProduct('Cat carrier'), kind: 'gear', category: 'tools', unit: 'unit', target: 1, per: 'cat' });
    return shelf;
  }

  it('tells how long each consumable used every day lasts, shortest first', () => {
    let shelf = equipped();
    shelf = addLot(shelf, { product: 'Gas', qty: 4, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Candles', qty: 6, expires: inDays(-1), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Candles', qty: 10, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Tablets', qty: 2, expires: '', location: '' }, TODAY);
    // Gas: 0.2 a day per person for 2 people. Expired candles do not count. Tablets count with the water.
    const supplies = suppliesAutonomy(shelf, TODAY);
    expect(supplies.map((supply) => [supply.product.name, supply.dailyNeed, supply.days])).toEqual([
      ['Gas', 0.4, 10],
      ['Candles', 0.5, 20],
    ]);
    const autonomy = computeAutonomy(shelf, TODAY);
    expect(autonomy.supplies).toEqual(supplies);
    // Running out of gas does not end the autonomy: no food and no water does.
    expect(autonomy.days).toBe(0);
    expect(autonomy.limitedBy).toBe('food');
  });

  it('counts the gear owned, whatever the tier', () => {
    let shelf = equipped();
    shelf = addLot(shelf, { product: 'Headlamp', qty: 2, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Matches', qty: 1, expires: '', location: '' }, TODAY);
    const gear = gearStatus(shelf, TODAY);
    // No cat in the settings: the cat carrier is not needed.
    expect([gear.total, gear.ready]).toEqual([2, 1]);
    expect(gear.missing.map((product) => product.name)).toEqual(['Matches']);
  });

  it('replaces what is not eaten when it reaches the rotation margin before the next check-in', () => {
    let shelf = equipped();
    shelf = addLot(shelf, { product: 'Batteries', qty: 2, expires: inDays(-2), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Batteries', qty: 4, expires: inDays(20), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Batteries', qty: 8, expires: inDays(50), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Batteries', qty: 12, expires: inDays(90), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Headlamp', qty: 1, expires: inDays(10), location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Gas', qty: 4, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'Rice', qty: 5, expires: inDays(40), location: '' }, TODAY);

    // Monthly with a 30-day margin: what expires within 60 days. Expired lots are discarded, food is eaten.
    const month = replacements(shelf, TODAY, 30);
    expect(month.map((item) => [item.product.name, item.lot.qty, item.due])).toEqual([
      ['Headlamp', 1, true],
      ['Batteries', 4, true],
      ['Batteries', 8, false],
    ]);
    expect(month[2].replaceBy).toBe(TODAY + 20);
    expect(replacements(shelf, TODAY, 91).map((item) => item.lot.qty)).toEqual([1, 4, 8, 12]);

    const autonomy = computeAutonomy(shelf, TODAY);
    const checkin = checkIn(shelf, TODAY, rotationPlan(shelf, TODAY), tierPlan(shelf, autonomy, TODAY).current);
    expect(checkin.replace).toEqual(month);
    expect(checkin.consume.map((item) => item.product.name)).toEqual(['Rice']);
    expect(checkin.discard.map((lot) => lot.product)).toEqual(['Batteries']);
  });
});

describe('reminder calendar', () => {
  const now = new Date(Date.UTC(2026, 9, 10, 8, 30));

  it('writes a monthly reminder at local time', () => {
    const ics = reminderCalendar({
      start: '2026-10-17T10:00',
      rhythm: 'monthly',
      title: 'Survival Shelf: check-in',
      description: 'Consume, buy, discard; see the app',
      url: 'https://example.org/survival-shelf/',
      now,
    });
    expect(ics).toContain('DTSTART:20261017T100000\r\n');
    expect(ics).toContain('RRULE:FREQ=MONTHLY;BYDAY=3SA\r\n');
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

  it('repeats every 3 or 6 months on the same weekday of the month', () => {
    const quarter = reminderCalendar({ start: '2026-10-10T09:30', rhythm: 'quarterly', title: 'x', description: 'y', now });
    expect(quarter).toContain('RRULE:FREQ=MONTHLY;INTERVAL=3;BYDAY=2SA\r\n');
    const half = reminderCalendar({ start: '2026-10-31T09:30', rhythm: 'semiannual', title: 'x', description: 'y', now });
    expect(half).toContain('RRULE:FREQ=MONTHLY;INTERVAL=6;BYDAY=-1SA\r\n');
  });
});

describe('catalog', () => {
  it('plans pet items per cat or per dog', () => {
    const pets = CATALOG.filter((entry) => entry.need === 'cat' || entry.need === 'dog');
    expect(pets.map((entry) => [entry.id, entry.per])).toEqual([
      ['cat-food', 'cat'],
      ['cat-litter', 'cat'],
      ['litter-bags', 'cat'],
      ['dog-food', 'dog'],
      ['dog-waste-bags', 'dog'],
    ]);
  });

  it('sorts every item into food, consumables or gear', () => {
    const kinds = (...ids: string[]) => ids.map((id) => CATALOG.find((entry) => entry.id === id)?.kind);
    expect(kinds('rice', 'water-bottle', 'cat-food')).toEqual(['food', 'food', 'food']);
    expect(kinds('aa-batteries', 'paracetamol', 'purification-tablets', 'cat-litter', 'litter-bags', 'dog-waste-bags', 'gas-cartridge')).toEqual(
      Array(7).fill('consumable'),
    );
    expect(kinds('headlamp', 'water-filter', 'first-aid-kit', 'power-bank')).toEqual(Array(4).fill('gear'));
    // Whatever has calories is eaten.
    for (const entry of CATALOG) if ((entry.kcal ?? 0) > 0) expect(entry.kind, entry.id).toBe('food');
  });

  it('uses unique ids and known categories', () => {
    expect(new Set(CATALOG.map((entry) => entry.id)).size).toBe(CATALOG.length);
  });

  it('keeps sizes out of the names: they go in the unit', () => {
    for (const entry of CATALOG) {
      for (const name of Object.values(entry.name)) expect(name, entry.id).not.toMatch(/\d/);
    }
    expect(CATALOG.find((entry) => entry.id === 'tuna')?.unit).toEqual({ en: 'can (140 g)', fr: 'boîte (140 g)' });
  });

  it('says what every item is for, in English and in French', () => {
    for (const entry of CATALOG) {
      expect(entry.use.en, entry.id).not.toBe('');
      expect(entry.use.fr, entry.id).not.toBe('');
      if (entry.care) expect([entry.care.en, entry.care.fr].every(Boolean), entry.id).toBe(true);
      if (entry.keeps) expect([entry.keeps.en, entry.keeps.fr].every(Boolean), entry.id).toBe(true);
    }
  });
});
