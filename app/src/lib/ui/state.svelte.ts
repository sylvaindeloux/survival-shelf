import { KINDS } from '../core/categories';
import { formatDay, parseDay, type Day } from '../core/dates';
import type { Kind, LogAction } from '../core/types';

export type Route = 'home' | 'checkin' | 'stock' | 'emergency' | 'guides' | 'settings';
const ROUTES: Route[] = ['home', 'checkin', 'stock', 'emergency', 'guides', 'settings'];

/** `#/guides/fr/eau/stocker-de-l-eau` is the route `guides` with the path `fr/eau/stocker-de-l-eau`. */
function readHash(): { route: Route; path: string } {
  const [name = '', ...rest] = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
  if (!(ROUTES as string[]).includes(name)) return { route: 'home', path: '' };
  return { route: name as Route, path: rest.filter(Boolean).join('/') };
}

/** Hash based routing: works offline, from file:// and keeps the back button. */
class Router {
  route = $state<Route>(readHash().route);
  /** What follows the route in the address, for the pages that have sub-pages. */
  path = $state(readHash().path);

  constructor() {
    window.addEventListener('hashchange', () => {
      ({ route: this.route, path: this.path } = readHash());
      window.scrollTo({ top: 0 });
    });
  }

  go(route: Route, path = '') {
    location.hash = route === 'home' ? '/' : `/${route}${path ? `/${path}` : ''}`;
  }
}

export const router = new Router();

export interface LotDialogState {
  /** Lot to edit; absent to add a new lot. */
  lotId?: string;
  product?: string;
  qty?: number;
  /** Kind of a new product, until its catalog entry or category says otherwise. */
  kind?: Kind;
  /** Lot replaced by the new one: it is logged as used when the new lot is saved. */
  replaces?: string;
  /** Location of a new lot, such as the bag it goes in. */
  location?: string;
}

export interface TakeDialogState {
  action: LogAction;
  product?: string;
  lotId?: string;
  /** Suggested quantity. */
  qty?: number;
}

export interface BagDialogState {
  /** Bag to edit; absent to add a new one with the list of the guide. */
  bag?: string;
}

export interface EmergencyDialogState {
  /** Topic to show first, with a new line to fill in when it has none. */
  topic?: string;
}

export interface ProductDialogState {
  /** Product to edit; absent to create one. */
  name?: string;
  /** Kind of a new product, until its catalog entry or category says otherwise. */
  kind?: Kind;
}

/** Which dialog is open, shared by all views. */
class Dialogs {
  lot = $state<LotDialogState | null>(null);
  product = $state<ProductDialogState | null>(null);
  take = $state<TakeDialogState | null>(null);
  emergency = $state<EmergencyDialogState | null>(null);
  bag = $state<BagDialogState | null>(null);
}

export const dialogs = new Dialogs();

/** `#/stock/gear` opens the gear of the stock: the Stocks tab has one sub-page per kind. */
export function kindOfPath(path: string): Kind | null {
  return (KINDS as string[]).includes(path) ? (path as Kind) : null;
}

export type Theme = 'auto' | 'light' | 'dark';
const THEME_KEY = 'survival-shelf:theme';

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage unavailable.
  }
  return 'auto';
}

const ONLINE_WARNING_KEY = 'survival-shelf:online-warning-until';

function readOnlineWarningUntil(): Day | null {
  try {
    return parseDay(localStorage.getItem(ONLINE_WARNING_KEY) ?? '');
  } catch {
    return null;
  }
}

const CRISIS_KEY = 'survival-shelf:crisis-since';

function readCrisisSince(): number | null {
  try {
    const since = Number(localStorage.getItem(CRISIS_KEY));
    return Number.isFinite(since) && since > 0 ? since : null;
  } catch {
    return null;
  }
}

class Preferences {
  theme = $state<Theme>(readTheme());
  /** Day until which the online-copy warning stays hidden ("Later"). */
  onlineWarningUntil = $state<Day | null>(readOnlineWarningUntil());
  /**
   * When crisis mode was turned on (a timestamp), null while it is off. It belongs to this device, not
   * to the data file: a crisis is lived on the phone at hand, and the file may be shared.
   */
  crisisSince = $state<number | null>(readCrisisSince());

  setTheme(theme: Theme) {
    this.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Applied for this session only.
    }
  }

  startCrisis(since = Date.now()) {
    this.crisisSince = since;
    try {
      localStorage.setItem(CRISIS_KEY, String(since));
    } catch {
      // On for this session only.
    }
  }

  endCrisis() {
    this.crisisSince = null;
    try {
      localStorage.removeItem(CRISIS_KEY);
    } catch {
      // Off for this session only.
    }
  }

  hideOnlineWarningUntil(day: Day) {
    this.onlineWarningUntil = day;
    try {
      localStorage.setItem(ONLINE_WARNING_KEY, formatDay(day));
    } catch {
      // Hidden for this session only.
    }
  }
}

export const preferences = new Preferences();
