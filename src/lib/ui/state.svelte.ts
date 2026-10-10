import type { LogAction } from '../core/types';

export type Route = 'home' | 'stock' | 'rotation' | 'shopping' | 'settings';
const ROUTES: Route[] = ['home', 'stock', 'rotation', 'shopping', 'settings'];

function routeFromHash(): Route {
  const name = location.hash.replace(/^#\/?/, '').split('?')[0];
  return (ROUTES as string[]).includes(name) ? (name as Route) : 'home';
}

/** Hash based routing: works offline, from file:// and keeps the back button. */
class Router {
  route = $state<Route>(routeFromHash());

  constructor() {
    window.addEventListener('hashchange', () => {
      this.route = routeFromHash();
      window.scrollTo({ top: 0 });
    });
  }

  go(route: Route) {
    location.hash = route === 'home' ? '/' : `/${route}`;
  }
}

export const router = new Router();

export interface LotDialogState {
  /** Lot to edit; absent to add a new lot. */
  lotId?: string;
  product?: string;
  qty?: number;
}

export interface TakeDialogState {
  action: LogAction;
  product?: string;
  lotId?: string;
}

/** Which dialog is open, shared by all views. */
class Dialogs {
  lot = $state<LotDialogState | null>(null);
  product = $state<{ name: string } | null>(null);
  take = $state<TakeDialogState | null>(null);
}

export const dialogs = new Dialogs();

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

class Preferences {
  theme = $state<Theme>(readTheme());

  setTheme(theme: Theme) {
    this.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Applied for this session only.
    }
  }
}

export const preferences = new Preferences();
