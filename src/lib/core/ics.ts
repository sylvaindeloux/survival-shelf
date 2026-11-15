import type { Rhythm } from './types';

/**
 * Calendar file (.ics) with a recurring reminder for the check-in. Without a
 * server the app cannot send notifications, the user's calendar does it.
 */
export interface ReminderOptions {
  /** Local date and time of the first reminder: "YYYY-MM-DDTHH:MM". */
  start: string;
  rhythm: Rhythm;
  title: string;
  description: string;
  /** Address of the app, when it has one. */
  url?: string;
  /** Creation time, for the DTSTAMP field. */
  now: Date;
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds a content line at 75 octets, as RFC 5545 requires. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // Continuation lines start with a space, which counts.
    if (size + bytes > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

const MONTHS: Record<Exclude<Rhythm, 'weekly'>, number> = { monthly: 1, quarterly: 3, semiannual: 6 };

/**
 * Recurrence: every week, or every 1, 3 or 6 months on the same weekday of the
 * month ("2nd Saturday", "last Sunday").
 */
function recurrence(year: number, month: number, day: number, rhythm: Rhythm): string {
  if (rhythm === 'weekly') return 'FREQ=WEEKLY';
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const nth = Math.ceil(day / 7);
  const interval = MONTHS[rhythm] > 1 ? `;INTERVAL=${MONTHS[rhythm]}` : '';
  return `FREQ=MONTHLY${interval};BYDAY=${nth >= 5 ? -1 : nth}${weekday}`;
}

export function reminderCalendar(options: ReminderOptions): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(options.start);
  if (!match) throw new Error(`Invalid start: ${options.start}`);
  const [, year, month, day, hour, minute] = match;
  const description = options.url ? `${options.description}\n${options.url}` : options.description;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Survival Shelf//Check-in reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // Same UID every time: importing a new file updates the reminder instead of adding one.
    'UID:check-in@survival-shelf',
    `DTSTAMP:${utcStamp(options.now)}`,
    // Floating local time: the reminder follows the user's time zone.
    `DTSTART:${year}${month}${day}T${hour}${minute}00`,
    'DURATION:PT15M',
    `RRULE:${recurrence(Number(year), Number(month), Number(day), options.rhythm)}`,
    `SUMMARY:${escapeText(options.title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    ...(options.url ? [`URL:${options.url}`] : []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${escapeText(options.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
