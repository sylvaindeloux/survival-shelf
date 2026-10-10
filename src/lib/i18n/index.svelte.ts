import { formatDay, parseDay, type Day } from '../core/dates';
import { en } from './en';
import { fr } from './fr';

export type MessageKey = keyof typeof en;
export type Lang = 'en' | 'fr';
export type LangPreference = Lang | 'auto';
type PluralKey = { [K in MessageKey]: K extends `${infer Base}_one` ? Base : never }[MessageKey];

export const LANGS: Lang[] = ['en', 'fr'];
const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { en, fr };
const PREF_KEY = 'survival-shelf:lang';

function browserLang(): Lang {
  const languages = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language];
  for (const language of languages) {
    const short = language.slice(0, 2).toLowerCase();
    if ((LANGS as string[]).includes(short)) return short as Lang;
  }
  return 'en';
}

function readPreference(): LangPreference {
  try {
    const stored = localStorage.getItem(PREF_KEY);
    if (stored === 'auto' || (LANGS as string[]).includes(stored ?? '')) return stored as LangPreference;
  } catch {
    // Storage unavailable: fall back to the browser language.
  }
  return 'auto';
}

class I18n {
  preference = $state<LangPreference>(readPreference());
  lang = $derived<Lang>(this.preference === 'auto' ? browserLang() : this.preference);

  setPreference(preference: LangPreference) {
    this.preference = preference;
    try {
      localStorage.setItem(PREF_KEY, preference);
    } catch {
      // Not persisted, still applied for this session.
    }
  }
}

export const i18n = new I18n();

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === 'number' ? formatNumber(value) : value;
  });
}

/** Translates a message, replacing `{name}` placeholders. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return interpolate(DICTIONARIES[i18n.lang][key] ?? en[key], params);
}

/** Translates a message with a plural form (`key_one` / `key_other`), `{count}` is available. */
export function tn(key: PluralKey, count: number, params?: Record<string, string | number>): string {
  const rule = new Intl.PluralRules(i18n.lang).select(count);
  const full = (rule === 'one' ? `${key}_one` : `${key}_other`) as MessageKey;
  return t(full, { count, ...params });
}

export function formatNumber(value: number, maxDecimals = 1): string {
  if (!Number.isFinite(value)) return '∞';
  return new Intl.NumberFormat(i18n.lang, { maximumFractionDigits: maxDecimals }).format(value);
}

/** Formats an expiry date, keeping month precision ("March 2027") when that is all we know. */
export function formatDate(value: string | Day): string {
  const text = typeof value === 'number' ? formatDay(value) : value;
  const day = parseDay(text);
  if (day === null) return text;
  const monthOnly = /^\d{4}-\d{2}$/.test(text.trim());
  return new Intl.DateTimeFormat(i18n.lang, {
    timeZone: 'UTC',
    ...(monthOnly ? { month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }),
  }).format(new Date(day * 86_400_000));
}

/** "in 3 days", "2 months ago", "today". */
export function formatRelative(days: number): string {
  const format = new Intl.RelativeTimeFormat(i18n.lang, { numeric: 'auto' });
  const abs = Math.abs(days);
  if (abs < 45) return format.format(days, 'day');
  if (abs < 730) return format.format(Math.round(days / 30.4), 'month');
  return format.format(Math.round(days / 365.25), 'year');
}

/** "3 days", "5 months", "2 years" for a duration. */
export function formatDuration(days: number): string {
  if (!Number.isFinite(days)) return '∞';
  const unit = (value: number, kind: 'day' | 'month' | 'year') =>
    new Intl.NumberFormat(i18n.lang, { style: 'unit', unit: kind, unitDisplay: 'long', maximumFractionDigits: 0 }).format(
      value,
    );
  if (days < 60) return unit(Math.floor(days), 'day');
  if (days < 730) return unit(Math.floor(days / 30.4), 'month');
  return unit(Math.floor(days / 365.25), 'year');
}
