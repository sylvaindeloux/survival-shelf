import { describe, expect, it } from 'vitest';
import { dayFromParts, formatDay, normalizeDate, parseDay, today } from './dates';
import { formatNumber, parseNumber } from './text';

describe('dates', () => {
  it('parses full dates and month precision as end of month', () => {
    expect(formatDay(parseDay('2027-03-15')!)).toBe('2027-03-15');
    expect(formatDay(parseDay('2027-02')!)).toBe('2027-02-28');
    expect(formatDay(parseDay('2028-02')!)).toBe('2028-02-29');
    expect(formatDay(parseDay('2027/4/5')!)).toBe('2027-04-05');
  });

  it('rejects invalid dates', () => {
    for (const text of ['', '2027', '2027-13', '2027-02-30', '15/03/2027', 'soon']) {
      expect(parseDay(text)).toBeNull();
    }
  });

  it('normalizes while keeping month precision', () => {
    expect(normalizeDate('2027/3')).toBe('2027-03');
    expect(normalizeDate('2027.3.5')).toBe('2027-03-05');
  });

  it('uses the local calendar day', () => {
    expect(today(new Date(2026, 9, 10, 23, 59))).toBe(dayFromParts(2026, 10, 10));
  });
});

describe('numbers', () => {
  it('accepts human formats', () => {
    expect(parseNumber('2,5')).toBe(2.5);
    expect(parseNumber('2 200')).toBe(2200);
    expect(parseNumber('.5')).toBe(0.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('5 kg')).toBeNaN();
  });

  it('formats without noise', () => {
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(null)).toBe('');
  });
});
