/** Lowercases, strips accents and anything that is not a letter or a digit. */
export function normalizeKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Case and accent insensitive comparison of product names. */
export function sameName(a: string, b: string): boolean {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: 'base' }) === 0;
}

const NUMBER_RE = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

/**
 * Parses a number written by a human: accepts `,` as decimal separator and
 * spaces as thousands separator. Returns null for empty text, NaN when invalid.
 */
export function parseNumber(text: string): number | null {
  const compact = text.replace(/[\s  ]/g, '');
  if (compact === '') return null;
  if (!NUMBER_RE.test(compact)) return Number.NaN;
  return Number(compact.replace(',', '.'));
}

/** Formats a number for the file: dot decimal separator, at most 3 decimals. */
export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  return String(Math.round(value * 1000) / 1000);
}
