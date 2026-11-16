/**
 * Shares cards between two columns, for the card pages on wide screens, the way a newspaper fills its
 * columns: the first cards go down the left column and the others down the right one, so the cards still
 * read from top to bottom. The split is the one that makes the longest column the shortest; on a tie, the
 * left column takes more cards, as CSS columns would.
 *
 * @param weights About how tall each card is, in any unit (rows of a list, for example).
 * @returns How many of the first cards go in the left column: all of them when there are fewer than two,
 *   and otherwise at least one card in each column.
 */
export function leftColumnCount(weights: readonly number[]): number {
  // A weight that is not a positive number adds nothing, rather than spoiling the sums.
  const sizes = weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 0));
  if (sizes.length < 2) return sizes.length;
  const total = sizes.reduce((sum, size) => sum + size, 0);
  let best = 1;
  let shortest = Number.POSITIVE_INFINITY;
  let left = 0;
  for (let count = 1; count < sizes.length; count++) {
    left += sizes[count - 1];
    const height = Math.max(left, total - left);
    // Sums of decimals are not exact: columns this close are as long as each other.
    if (height <= shortest + TIE) {
      best = count;
      shortest = Math.min(shortest, height);
    }
  }
  return best;
}

const TIE = 1e-9;
