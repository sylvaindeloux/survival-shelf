import { app } from '../app.svelte';
import { today as dayOf } from '../core/dates';
import { formatDate, formatTime, t } from '../i18n/index.svelte';
import { preferences, router } from './state.svelte';

/** "since 14:05", "since yesterday", "since 12 Nov 2026": when crisis mode was turned on. */
export function crisisSince(since: number): string {
  const day = dayOf(new Date(since));
  if (day >= app.today) return t('crisis.sinceTime', { time: formatTime(since) });
  if (day === app.today - 1) return t('crisis.sinceYesterday');
  return t('crisis.sinceDate', { date: formatDate(day) });
}

/** Turns crisis mode on: the home tab becomes the crisis screen. */
export function startCrisis() {
  preferences.startCrisis();
  router.go('home');
}

/** Turns crisis mode off, with a way back that keeps the time it started. */
export function quitCrisis() {
  const since = preferences.crisisSince;
  preferences.endCrisis();
  if (since === null) return;
  app.toast(t('crisis.quitToast'), 'success', { label: t('action.undo'), run: () => preferences.startCrisis(since) });
}
