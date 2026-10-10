import { findCategory } from '../core/categories';
import { daysLeft, expiryStatus, type ExpiryStatus } from '../core/status';
import type { Day } from '../core/dates';
import type { Lot, Product, Settings } from '../core/types';
import { formatDate, formatNumber, formatRelative, i18n, t } from '../i18n/index.svelte';

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

/** "3 kg", "12 cans": quantity with the product unit. */
export function quantity(qty: number, product: Product | undefined): string {
  const unit = product?.unit ?? '';
  return unit === '' ? formatNumber(qty, 2) : `${formatNumber(qty, 2)} ${unitFor(qty, unit)}`;
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
