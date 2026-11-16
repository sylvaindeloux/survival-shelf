import BriefcaseMedical from '@lucide/svelte/icons/briefcase-medical';
import FileText from '@lucide/svelte/icons/file-text';
import Package from '@lucide/svelte/icons/package';
import Radio from '@lucide/svelte/icons/radio';
import Shirt from '@lucide/svelte/icons/shirt';
import Utensils from '@lucide/svelte/icons/utensils';
import Wrench from '@lucide/svelte/icons/wrench';
import type { Component } from 'svelte';
import { app } from '../app.svelte';
import { CHECK_MONTHS, isBagGroup, markBagChecked, type BagStatus } from '../core/bags';
import { monthsLater } from '../core/dates';
import type { BagGroup } from '../core/types';
import { formatDate, t } from '../i18n/index.svelte';

const ICONS: Record<BagGroup, Component> = {
  'water-food': Utensils,
  light: Radio,
  health: BriefcaseMedical,
  protection: Shirt,
  tools: Wrench,
  papers: FileText,
};

export function groupIcon(group: string): Component {
  return isBagGroup(group) ? ICONS[group] : Package;
}

/** Title of a group of the list; a group of the user's own is shown as they wrote it. */
export function groupTitle(group: string): string {
  if (isBagGroup(group)) return t(`bags.group.${group}`);
  return group === '' ? t('bags.group.other') : group;
}

/** Address of a bag's page: its name, which can hold any character. */
export function bagHref(name: string): string {
  return `#/emergency/bags/${encodeURIComponent(name)}`;
}

/** "checked on 10 Sep 2026, next check in Sep 2027", or what is due. */
export function checkText({ bag, checkBy, checkDue }: BagStatus): string {
  if (checkBy === null) return t('bags.neverChecked');
  if (checkDue) return t('bags.checkDue', { date: formatDate(bag.checked) });
  return t('bags.checkedOn', { date: formatDate(bag.checked), month: formatDate(monthsLater(checkBy, 0)) });
}

/** Records that a bag was checked today. */
export function markChecked(name: string) {
  const today = app.today;
  app.update(
    (shelf) => markBagChecked(shelf, name, today),
    t('bags.checkedToast', { bag: name, month: formatDate(monthsLater(today, CHECK_MONTHS)) }),
  );
}
