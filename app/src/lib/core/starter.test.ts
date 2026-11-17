import { describe, expect, it } from 'vitest';
import type { Habits } from './catalog';
import { DEFAULT_HABITS, spreadCalories, starterList, starterProducts } from './starter';

const ids = (needs: Parameters<typeof starterList>[0], habits: Partial<Habits> = {}, essential = true) =>
  starterList(needs, { ...DEFAULT_HABITS, ...habits })
    .filter((item) => item.essential === essential)
    .map((item) => item.entry.id);

/** Calories a person eats in a day with these products. */
const kcalOf = (products: ReturnType<typeof starterProducts>) =>
  products.reduce((sum, product) => sum + (product.per === 'person' ? (product.daily ?? 0) * (product.kcal ?? 0) : 0), 0);

describe('starter list', () => {
  it('checks the essentials and offers sweets, salt, coffee and tea unchecked', () => {
    const essentials = ids({});
    expect(essentials).toEqual(expect.arrayContaining(['water-bottle', 'rice', 'tuna', 'nuts', 'fruit', 'water-filter', 'stove', 'gas-cartridge']));
    expect(ids({}, {}, false)).toEqual(['purification-tablets', 'sugar', 'jam', 'chocolate', 'biscuits', 'coffee', 'tea', 'salt', 'power-bank']);
    for (const id of ['sugar', 'jam', 'chocolate', 'biscuits', 'salt']) expect(essentials).not.toContain(id);
  });

  it('only proposes specific needs when asked', () => {
    expect(starterList({}, DEFAULT_HABITS).some((item) => item.entry.need)).toBe(false);
    const pets = (needs: Parameters<typeof starterList>[0]) =>
      starterList(needs, DEFAULT_HABITS)
        .filter((item) => item.entry.need)
        .map((item) => item.entry.id);
    expect(pets({ cat: 0, dog: 1 })).toEqual(['dog-food', 'dog-waste-bags']);
    expect(pets({ cat: 2 })).toEqual(['cat-food', 'cat-litter', 'litter-bags']);
    expect(pets({ treatment: 1 })).toEqual(['daily-medicine']);
  });

  it('proposes the water the household stores', () => {
    const water = (habit: Habits['water']) => ids({}, { water: habit }).filter((id) => id === 'water-bottle' || id === 'tap-water');
    expect(water('bottles')).toEqual(['water-bottle']);
    expect(water('tap')).toEqual(['tap-water']);
    // Bottles first: the first stored water product buys the first tier.
    expect(water('both')).toEqual(['water-bottle', 'tap-water']);
  });

  it('only proposes water treatment to a household that will treat water after a month', () => {
    const treatment = (beyond: Habits['beyond']) =>
      starterList({}, { ...DEFAULT_HABITS, beyond })
        .filter((item) => item.entry.category === 'water-treatment')
        .map((item) => [item.entry.id, item.essential]);
    expect(treatment('treatment')).toEqual([
      ['water-filter', true],
      ['purification-tablets', false],
    ]);
    expect(treatment('stored')).toEqual([]);
  });

  it('follows how the household cooks', () => {
    const cooking = ['rice', 'pasta', 'lentils', 'oil', 'stove', 'gas-cartridge', 'rusks', 'sardines', 'canned-beans'];
    const pick = (habit: Habits['cooking']) => ids({}, { cooking: habit }).filter((id) => cooking.includes(id));
    expect(pick('stove')).toEqual(['rice', 'pasta', 'lentils', 'oil', 'gas-cartridge', 'stove']);
    expect(pick('ready')).toEqual(['rice', 'pasta', 'lentils', 'oil']);
    expect(pick('none')).toEqual(['rusks', 'sardines', 'canned-beans']);
    // Oats are eaten soaked: they stay without cooking.
    expect(ids({}, { cooking: 'none' })).toContain('oats');
  });
});

describe('calories of the starter list', () => {
  const habitsCases: Partial<Habits>[] = [{}, { cooking: 'ready' }, { cooking: 'none' }, { water: 'both', beyond: 'stored' }];

  it('spreads the calories of a day over the chosen foods, whatever the habits', () => {
    for (const habits of habitsCases) {
      const entries = starterList({ cat: 1, dog: 1 }, { ...DEFAULT_HABITS, ...habits })
        .filter((item) => item.essential)
        .map((item) => item.entry);
      const kcal = kcalOf(starterProducts(entries, 'en', 2200));
      expect(kcal, JSON.stringify(habits)).toBeGreaterThan(2150);
      expect(kcal, JSON.stringify(habits)).toBeLessThan(2250);
    }
  });

  it('gives more of the other foods when optional ones are left out, and less when they are added', () => {
    const list = starterList({}, DEFAULT_HABITS);
    const essentials = list.filter((item) => item.essential).map((item) => item.entry);
    const everything = list.map((item) => item.entry);
    const rice = (entries: typeof everything) => spreadCalories(entries, 2200).get('rice') ?? 0;
    expect(rice(essentials)).toBe(0.12);
    expect(rice(everything)).toBe(0.1);
    expect(kcalOf(starterProducts(everything, 'en', 2200))).toBeCloseTo(2200, -2);
  });

  it('keeps the amounts of what is not eaten by people', () => {
    const list = starterList({ cat: 1 }, DEFAULT_HABITS).map((item) => item.entry);
    const products = starterProducts(list, 'fr', 2200);
    const daily = (name: string) => products.find((product) => product.name === name)?.daily;
    expect(daily('Croquettes pour chat')).toBe(0.06);
    expect(daily('Papier toilette')).toBe(0.2);
    expect(daily('Sel')).toBe(0.005);
    expect(products.find((product) => product.name === 'Lampe frontale')?.target).toBe(1);
  });

  it('rounds daily amounts to two significant digits', () => {
    const dailies = [...spreadCalories(starterList({}, DEFAULT_HABITS).map((item) => item.entry), 2000).values()];
    expect(dailies.length).toBeGreaterThan(5);
    for (const daily of dailies) expect(Number(daily.toPrecision(2))).toBe(daily);
  });

  it('spreads nothing without food', () => {
    expect(spreadCalories([], 2200).size).toBe(0);
  });
});
