/**
 * Dates are handled as day numbers (days since 1970-01-01) to avoid any
 * timezone or daylight saving surprises.
 */
export type Day = number;

const MS_PER_DAY = 86_400_000;

export function dayFromParts(year: number, month: number, day: number): Day {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

/** Today in the user's local calendar. */
export function today(now: Date = new Date()): Day {
  return dayFromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function formatDay(day: Day): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const DATE_RE = /^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/;

/**
 * Parses an expiry-style date: `YYYY-MM-DD`, or `YYYY-MM` meaning the last day
 * of that month (like most packaging). `/` and `.` separators are accepted.
 * Returns null when the text is not a valid date.
 */
export function parseDay(text: string): Day | null {
  const match = DATE_RE.exec(text.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  const day = match[3] === undefined ? maxDay : Number(match[3]);
  if (day < 1 || day > maxDay) return null;
  return dayFromParts(year, month, day);
}

/** The month `months` months after a day, as `YYYY-MM` (end of that month). */
export function monthsLater(day: Day, months: number): string {
  const date = new Date(day * MS_PER_DAY);
  const total = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export function isValidDate(text: string): boolean {
  return parseDay(text) !== null;
}

/** Normalizes a date to its canonical text, keeping month precision when given. */
export function normalizeDate(text: string): string {
  const match = DATE_RE.exec(text.trim());
  if (!match || parseDay(text) === null) return text.trim();
  const year = match[1];
  const month = match[2].padStart(2, '0');
  return match[3] === undefined ? `${year}-${month}` : `${year}-${month}-${match[3].padStart(2, '0')}`;
}
