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

const BULK_UNITS = new Set(['kg', 'g', 'l', 'cl', 'ml', 'lb', 'oz', 'gal']);

/** Units that can be bought in any amount (weights, volumes); others are counted (cans, rolls…). */
export function isBulkUnit(unit: string): boolean {
  return BULK_UNITS.has(unit.trim().toLowerCase());
}

/** Rounds a quantity to buy or take: whole units for counted things, 10 g / 10 mL steps for bulk. */
export function roundQuantity(qty: number, unit: string, mode: 'up' | 'nearest' = 'nearest'): number {
  const step = isBulkUnit(unit) ? 0.01 : 1;
  const scaled = qty / step;
  // Tolerate floating point noise before rounding up (0.7000000001 kg stays 0.7 kg).
  const rounded = mode === 'up' ? Math.ceil(scaled - 1e-9) : Math.round(scaled);
  return Math.round(rounded * step * 1000) / 1000;
}
