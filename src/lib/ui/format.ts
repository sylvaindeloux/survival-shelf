import { findCategory } from '../core/categories';
import { daysLeft, expiryStatus, type ExpiryStatus } from '../core/status';
import type { Day } from '../core/dates';
import type { Lot, Product, Rhythm, Settings } from '../core/types';
import { formatDate, formatNumber, formatRelative, i18n, t, type MessageKey } from '../i18n/index.svelte';

export function categoryIcon(category: string): string {
  return findCategory(category)?.icon ?? '📦';
}

export function categoryLabel(category: string): string {
  return findCategory(category)?.label[i18n.lang] ?? category;
}

/** Plurals of the usual units (units are free text, others are shown as written). */
const UNIT_PLURALS: Record<string, string> = {
  can: 'cans',
  jar: 'jars',
  pack: 'packs',
  unit: 'units',
  pouch: 'pouches',
  bottle: 'bottles',
  roll: 'rolls',
  bar: 'bars',
  box: 'boxes',
  bag: 'bags',
  boîte: 'boîtes',
  pot: 'pots',
  paquet: 'paquets',
  pièce: 'pièces',
  sachet: 'sachets',
  bouteille: 'bouteilles',
  rouleau: 'rouleaux',
  tablette: 'tablettes',
  sac: 'sacs',
  bocal: 'bocaux',
  brique: 'briques',
  cartouche: 'cartouches',
};

function unitFor(qty: number, unit: string): string {
  if (new Intl.PluralRules(i18n.lang).select(qty) === 'one') return unit;
  return UNIT_PLURALS[unit.toLocaleLowerCase()] ?? unit;
}

/** "3 kg", "12 cans", "80 g": quantity with the product unit, small weights and volumes in g and mL. */
export function quantity(qty: number, product: Pick<Product, 'unit'> | undefined): string {
  const unit = product?.unit ?? '';
  const lower = unit.toLowerCase();
  if (qty > 0 && qty < 1 && (lower === 'kg' || lower === 'l')) {
    return `${formatNumber(qty * 1000, 0)} ${lower === 'kg' ? 'g' : 'mL'}`;
  }
  return unit === '' ? formatNumber(qty, 2) : `${formatNumber(qty, 2)} ${unitFor(qty, unit)}`;
}

/** "0.1 kg per person per day", "6 per day for the household". */
export function dailyLabel(product: Product): string {
  if (product.daily === null) return '';
  const what = quantity(product.daily, product);
  return product.per === 'household' ? t('plan.perDayHousehold', { qty: what }) : t('plan.perDayPerson', { qty: what });
}

/** "own 1", "own 1 per person". */
export function targetLabel(product: Product): string {
  if (product.target === null) return '';
  const what = quantity(product.target, product);
  return product.per === 'household' ? t('plan.ownHousehold', { qty: what }) : t('plan.ownPerson', { qty: what });
}

/** A tier's duration in words: "1 week", "1 month", "1 year", "10 days". */
export function tierLabel(days: number): string {
  const format = (value: number, unit: 'day' | 'week' | 'month' | 'year') =>
    new Intl.NumberFormat(i18n.lang, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
  if (days % 365 === 0) return format(days / 365, 'year');
  if (days % 30 === 0) return format(days / 30, 'month');
  if (days % 7 === 0) return format(days / 7, 'week');
  return format(days, 'day');
}

/** Texts that depend on the check-in rhythm. */
export const RHYTHM_TEXTS = {
  weekly: {
    choice: 'settings.weekly',
    nav: 'nav.checkinWeekly',
    title: 'checkin.titleWeekly',
    subtitle: 'checkin.subtitleWeekly',
    consume: 'checkin.consumeTextWeekly',
  },
  monthly: {
    choice: 'settings.monthly',
    nav: 'nav.checkinMonthly',
    title: 'checkin.titleMonthly',
    subtitle: 'checkin.subtitleMonthly',
    consume: 'checkin.consumeTextMonthly',
  },
  quarterly: {
    choice: 'settings.quarterly',
    nav: 'nav.checkinQuarterly',
    title: 'checkin.titleQuarterly',
    subtitle: 'checkin.subtitleQuarterly',
    consume: 'checkin.consumeTextQuarterly',
  },
  semiannual: {
    choice: 'settings.semiannual',
    nav: 'nav.checkinSemiannual',
    title: 'checkin.titleSemiannual',
    subtitle: 'checkin.subtitleSemiannual',
    consume: 'checkin.consumeTextSemiannual',
  },
} satisfies Record<Rhythm, Record<string, MessageKey>>;

/** "This week", "This month"…, depending on the check-in rhythm. */
export function checkinTitle(rhythm: Rhythm): string {
  return t(RHYTHM_TEXTS[rhythm].title);
}

/** Rotation pace, per week, month or year depending on what reads best. */
export function formatPace(perWeek: number, product: Product): string {
  if (perWeek >= 0.5) return t('rotation.perWeek', { qty: quantity(round1(perWeek), product) });
  const perMonth = (perWeek * 365.25) / 12 / 7;
  if (perMonth >= 0.5) return t('rotation.perMonth', { qty: quantity(round1(perMonth), product) });
  return t('rotation.perYear', { qty: quantity(round1((perWeek * 365.25) / 7), product) });
}

function round1(value: number): number {
  return value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
}

export interface ExpiryLabel {
  status: ExpiryStatus;
  text: string;
  title: string;
}

export function expiryLabel(lot: Lot, settings: Settings, today: Day): ExpiryLabel {
  const status = expiryStatus(lot, settings, today);
  const left = daysLeft(lot, today);
  if (status === 'none' || left === null) return { status, text: t('expiry.none'), title: t('expiry.none') };
  const date = formatDate(lot.expires);
  if (status === 'ok') return { status, text: date, title: formatRelative(left) };
  return { status, text: formatRelative(left), title: date };
}

/** A number to put in an input: decimal separator of the language, no grouping (parseNumber reads it back). */
export function inputNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat(i18n.lang, { useGrouping: false, maximumFractionDigits: 3 }).format(value);
}

/** Big numbers in kcal: "12 400 kcal" or "1.2 M kcal". */
export function formatKcal(kcal: number): string {
  if (kcal >= 1_000_000) return `${formatNumber(kcal / 1_000_000, 1)} M kcal`;
  return `${formatNumber(Math.round(kcal), 0)} kcal`;
}

export function formatLiters(liters: number): string {
  return `${formatNumber(liters, 1)} L`;
}

/** Whole days, rounded down: "23". */
export function wholeDays(days: number): string {
  return Number.isFinite(days) ? formatNumber(Math.floor(days), 0) : '∞';
}
