import type { Day } from './dates';

/** How long "Later" hides the online-copy warning. */
export const ONLINE_WARNING_SNOOZE_DAYS = 30;

/**
 * Whether the app runs from the public copy on GitHub Pages (or a fork there). That copy needs internet
 * and GitHub: fine to try the app, not something to rely on in a crisis. A copy opened from a file or
 * hosted at home is not one.
 */
export function isPublicCopy(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'github.io' || host.endsWith('.github.io');
}

/** Whether to show the "keep your own copy" warning, given the day it is hidden until (if any). */
export function showOnlineWarning(hostname: string, hiddenUntil: Day | null, today: Day): boolean {
  return isPublicCopy(hostname) && (hiddenUntil === null || today >= hiddenUntil);
}
