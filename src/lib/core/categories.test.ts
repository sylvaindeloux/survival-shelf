import { describe, expect, it } from 'vitest';
import { CATEGORIES, findCategory } from './categories';
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
});
