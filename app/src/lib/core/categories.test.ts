import { describe, expect, it } from 'vitest';
import { CATEGORIES, defaultKind, findCategory, isFood } from './categories';
import { normalizeKey } from './text';

describe('categories', () => {
  it('finds every category from its key and its labels', () => {
    for (const category of CATEGORIES) {
      for (const name of [category.key, category.label.en, category.label.fr]) {
        expect(findCategory(name)?.key).toBe(category.key);
      }
    }
  });

  it('never gives the same name to two categories', () => {
    const owners = new Map<string, string>();
    for (const category of CATEGORIES) {
      for (const name of new Set([category.key, category.label.en, category.label.fr, ...(category.aliases ?? [])].map(normalizeKey))) {
        expect(owners.get(name) ?? category.key, name).toBe(category.key);
        owners.set(name, category.key);
      }
    }
  });

  it('guesses the kind of a product from its calories, water and category', () => {
    expect(defaultKind({ category: 'grains', kcal: null, water: null })).toBe('food');
    expect(defaultKind({ category: 'My things', kcal: 950, water: null })).toBe('food');
    expect(defaultKind({ category: 'My things', kcal: null, water: 1.5 })).toBe('food');
    expect(defaultKind({ category: 'water-treatment', kcal: null, water: 50 })).toBe('consumable');
    expect(defaultKind({ category: 'energy', kcal: null, water: null })).toBe('consumable');
    expect(defaultKind({ category: 'tools', kcal: null, water: null })).toBe('gear');
    expect(defaultKind({ category: 'My things', kcal: null, water: null })).toBe('consumable');
  });

  it('only rotates food, never water treatment', () => {
    expect(isFood({ kind: 'food', category: 'grains' })).toBe(true);
    expect(isFood({ kind: 'food', category: 'water-treatment' })).toBe(false);
    expect(isFood({ kind: 'consumable', category: 'grains' })).toBe(false);
    expect(isFood({ kind: 'gear', category: 'tools' })).toBe(false);
  });
});
