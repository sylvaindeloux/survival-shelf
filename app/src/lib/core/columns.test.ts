import { describe, expect, it } from 'vitest';
import { leftColumnCount } from './columns';

/** How long the left and right columns are when the first `count` cards go left. */
function heights(weights: number[], count: number): [number, number] {
  const sum = (list: number[]) => list.reduce((total, weight) => total + weight, 0);
  return [sum(weights.slice(0, count)), sum(weights.slice(count))];
}

/** The same pseudo-random weights on every run, between 1 and 8. */
function weightsFrom(seed: number, count: number): number[] {
  let state = seed;
  return Array.from({ length: count }, () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return 1 + Math.round((state / 2147483648) * 70) / 10;
  });
}

describe('sharing cards between two columns', () => {
  it('puts two cards side by side', () => {
    expect(leftColumnCount([3, 3])).toBe(1);
    expect(leftColumnCount([1, 9])).toBe(1);
    expect(leftColumnCount([9, 1])).toBe(1);
  });

  it('fills the left column with the first cards, as long as the columns get closer', () => {
    // The to-do page: what to throw away, a long list to eat, then shorter cards on the right.
    expect(leftColumnCount([3, 14, 2, 4.6, 1.6, 1.6])).toBe(2);
    // A long first card stays alone on the left.
    expect(leftColumnCount([10, 1, 1, 1])).toBe(1);
    expect(leftColumnCount([1, 1, 1, 1, 1, 1, 1])).toBe(4);
  });

  it('gives the left column more cards when both ways are as even, as CSS columns do', () => {
    expect(leftColumnCount([2, 9, 2])).toBe(2);
    // The same tie, with sums of decimals that are not exact.
    expect(leftColumnCount([0.1, 1.8, 0.1])).toBe(2);
  });

  it('makes the longest column the shortest it can be, with the cards in their order', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const weights = weightsFrom(seed, 2 + (seed % 13));
      const count = leftColumnCount(weights);
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThan(weights.length);
      const longest = Math.max(...heights(weights, count));
      for (let other = 1; other < weights.length; other++) {
        expect(longest).toBeLessThanOrEqual(Math.max(...heights(weights, other)) + 1e-9);
      }
      // So the columns end no further apart than the tallest card.
      const [left, right] = heights(weights, count);
      expect(Math.abs(left - right)).toBeLessThanOrEqual(Math.max(...weights) + 1e-9);
    }
  });

  it('works with no card or a single one', () => {
    expect(leftColumnCount([])).toBe(0);
    expect(leftColumnCount([4])).toBe(1);
  });

  it('counts a weight that is not a positive number as nothing', () => {
    // The third card weighs nothing: the columns are as long with it on either side, so it goes left.
    expect(leftColumnCount([Number.NaN, 2, -1, 2])).toBe(3);
    expect(leftColumnCount([Number.POSITIVE_INFINITY, 2, 2])).toBe(2);
  });
});
