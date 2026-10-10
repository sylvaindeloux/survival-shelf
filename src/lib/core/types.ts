/** Values of columns the app does not know about, keyed by their header text. */
export type Extra = Record<string, string>;

/** How often the app prepares the list of what to consume, buy and discard. */
export type Rhythm = 'weekly' | 'monthly' | 'quarterly' | 'semiannual';

export interface Settings {
  /** Number of people living on the stock. */
  people: number;
  kcalPerPersonPerDay: number;
  /** Liters of water per person per day (drinking + cooking + minimal hygiene). */
  waterPerPersonPerDay: number;
  /** Autonomy tiers to build up, in days, ascending (1 week, 1 month, 1 year by default). */
  tiers: number[];
  rhythm: Rhythm;
  /** A lot is "expiring soon" when it expires within this many days. */
  warningDays: number;
  /** Rotation aims to consume each lot this many days before it expires. */
  rotationMarginDays: number;
}

/** Whether a product's quantities are per person or for the whole household. */
export type Per = 'person' | 'household';

export interface Product {
  name: string;
  /** Category key (see categories.ts) or any free text. */
  category: string;
  unit: string;
  /** Energy per unit. */
  kcal: number | null;
  /** Liters of drinkable water per unit (or liters it can make drinkable, for water treatment). */
  water: number | null;
  /** Units used per day, per person or for the household (see `per`). Sets the target of each tier. */
  daily: number | null;
  per: Per;
  /** Minimum quantity to own whatever the tier (gear, first aid…), per person or for the household. */
  target: number | null;
  notes: string;
  extra: Extra;
}

/** A batch of one product sharing the same expiry date and location. */
export interface Lot {
  /** Runtime identifier, not stored in the file. */
  id: string;
  product: string;
  qty: number;
  /** Expiry as written: YYYY-MM-DD, YYYY-MM (end of month) or empty (no expiry). */
  expires: string;
  location: string;
  /** Date the lot was added, YYYY-MM-DD. */
  added: string;
  extra: Extra;
}

export type LogAction = 'consumed' | 'discarded';

export interface LogEntry {
  date: string;
  product: string;
  qty: number;
  action: LogAction;
  note: string;
  extra: Extra;
}

export type SectionName = 'settings' | 'products' | 'stock' | 'log';

/** How a table was laid out in the file, so it can be written back the same way. */
export interface TableLayout {
  /** Header cells as written by the user. */
  headers: string[];
  /** Canonical column key for each header, or null for a column the app does not know. */
  keys: (string | null)[];
}

export interface SectionLayout {
  heading: string;
  /** Markdown between the heading and the table. */
  before: string;
  /** Markdown after the table, up to the next section. */
  after: string;
  table: TableLayout | null;
}

/** Top-level blocks of the file, in order. Unknown content is kept verbatim. */
export type Block = { type: 'raw'; text: string } | { type: 'section'; name: SectionName };

export interface Layout {
  blocks: Block[];
  sections: Partial<Record<SectionName, SectionLayout>>;
  /** Labels used in the file for known settings, keyed by settings field. */
  settingsLabels: Partial<Record<keyof Settings, string>>;
}

export interface SettingRow {
  label: string;
  value: string;
}

export interface Shelf {
  settings: Settings;
  /** Settings rows the app does not know about. */
  settingsExtra: SettingRow[];
  products: Product[];
  lots: Lot[];
  log: LogEntry[];
  layout: Layout;
}

export type IssueLevel = 'error' | 'warning' | 'info';

/** A problem found while reading the file. `code` is translated by the UI. */
export interface ParseIssue {
  level: IssueLevel;
  /** 1-based line number in the file. */
  line: number;
  code: string;
  params?: Record<string, string | number>;
}

export interface ParseResult {
  shelf: Shelf;
  issues: ParseIssue[];
}
