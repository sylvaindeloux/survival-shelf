import BookUser from '@lucide/svelte/icons/book-user';
import HeartPulse from '@lucide/svelte/icons/heart-pulse';
import Info from '@lucide/svelte/icons/info';
import MapPin from '@lucide/svelte/icons/map-pin';
import Phone from '@lucide/svelte/icons/phone';
import Power from '@lucide/svelte/icons/power';
import Siren from '@lucide/svelte/icons/siren';
import Users from '@lucide/svelte/icons/users';
import type { Component } from 'svelte';
import { app } from '../app.svelte';
import { formatDay, monthsLater } from '../core/dates';
import { COUNTRY_NUMBERS, isTopic, localizedEntry, REVIEW_MONTHS, type CountryNumbers } from '../core/emergency';
import type { EmergencyEntry, EmergencyTopic } from '../core/types';
import { formatDate, i18n, t } from '../i18n/index.svelte';

const ICONS: Record<EmergencyTopic, Component> = {
  number: Siren,
  remote: Phone,
  contact: BookUser,
  meeting: MapPin,
  role: Users,
  shutoff: Power,
  health: HeartPulse,
};

export function topicIcon(topic: string): Component {
  return isTopic(topic) ? ICONS[topic] : Info;
}

/** Title of a topic on the sheet; a topic of the user's own is shown as they wrote it. */
export function topicTitle(topic: string): string {
  return isTopic(topic) ? t(`emergency.topic.${topic}`) : topic;
}

/** What a topic holds, from the guide "Make a household plan". */
export function topicHint(topic: string): string {
  return isTopic(topic) ? t(`emergency.hint.${topic}`) : '';
}

/** Placeholder of the name or details of a line, which says what goes in it for its topic. */
export function fieldLabel(topic: string, field: 'name' | 'details'): string {
  return t(`emergency.field.${isTopic(topic) ? topic : 'other'}.${field}`);
}

/** The lines of a topic, with the texts the app wrote in the language of the app. */
export function linesOf(entries: EmergencyEntry[], topic: string): EmergencyEntry[] {
  return entries.filter((entry) => entry.topic === topic).map((entry) => localizedEntry(entry, i18n.lang));
}

/** Topics of the user's own, in the order they first appear. */
export function ownTopics(entries: EmergencyEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.topic).filter((topic) => !isTopic(topic)))];
}

/** Name of a country or region in the language of the app, its code when the browser cannot name it. */
export function regionName(region: string): string {
  try {
    return new Intl.DisplayNames([i18n.lang], { type: 'region' }).of(region) ?? region;
  } catch {
    return region;
  }
}

/** Countries with numbers to suggest, by name. */
export function countries(): CountryNumbers[] {
  return [...COUNTRY_NUMBERS].sort((a, b) => regionName(a.region).localeCompare(regionName(b.region), i18n.lang));
}

/** "4 of 6 filled in · reviewed on 15 Nov 2026": how far the household plan is. */
export function reviewText(): string {
  const { reviewBy, reviewDue } = app.emergency;
  const reviewed = app.shelf.settings.emergencyReviewed;
  if (reviewBy === null) return t('emergency.reviewEvery');
  return t(reviewDue ? 'emergency.reviewDue' : 'emergency.reviewedOn', { date: formatDate(reviewed) });
}

/** Records that the household went through its emergency info today. */
export function markReviewed() {
  const today = app.today;
  app.update(
    (shelf) => ({ ...shelf, settings: { ...shelf.settings, emergencyReviewed: formatDay(today) } }),
    t('emergency.reviewedToast', { month: formatDate(monthsLater(today, REVIEW_MONTHS)) }),
  );
}
