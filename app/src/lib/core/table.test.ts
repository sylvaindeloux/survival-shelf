import { describe, expect, it } from 'vitest';
import { escapeCell, formatTable, splitRow } from './table';

/** Writes `value` in the first, middle and last column of a row, then reads the row back. */
function roundTrip(value: string): string[] {
  const table = formatTable(['A', 'B', 'C'], [[value, value, value]]);
  return splitRow(table.split('\n')[2]);
}

/** Every string of `length` characters taken from `alphabet`. */
function allStrings(alphabet: string[], length: number): string[] {
  let strings = [''];
  for (let i = 0; i < length; i++) strings = strings.flatMap((text) => alphabet.map((char) => text + char));
  return strings;
}

describe('table cells', () => {
  it('escapes pipes, flattens newlines and keeps backslashes readable', () => {
    expect(escapeCell('A | B')).toBe('A \\| B');
    expect(escapeCell('line 1\r\nline 2')).toBe('line 1 line 2');
    expect(escapeCell('C:\\Docs')).toBe('C:\\Docs');
  });

  it('reads back backslashes next to pipes exactly', () => {
    for (const value of ['a\\|b', 'a\\\\|b', 'ends with \\', '\\', '\\|', '|\\', 'C:\\Docs | D:\\']) {
      expect(roundTrip(value), JSON.stringify(value)).toEqual([value, value, value]);
    }
  });

  it('reads back every short mix of letters, backslashes, pipes and spaces exactly', () => {
    for (let length = 0; length <= 6; length++) {
      for (const value of allStrings(['a', '\\', '|', ' '], length)) {
        const expected = value.trim();
        expect(roundTrip(value), JSON.stringify(value)).toEqual([expected, expected, expected]);
      }
    }
  });
});
