export { LANGS, type Lang, type Translated } from './languages';
import type { Lang } from './languages';

/** Values of columns the app does not know about, keyed by their header text. */
export type Extra = Record<string, string>;

/** How often the app prepares the list of what to consume, buy and discard. */
export type Rhythm = 'monthly' | 'quarterly' | 'semiannual';

export interface Settings {
  /** Language the file is written in, also applied to the app when the file is opened. */
  lang: Lang;
  /** Number of people living on the stock. */
  people: number;
  /** Number of cats and dogs: products planned "per cat" or "per dog" count once per animal. */
  cats: number;
  dogs: number;
  kcalPerPersonPerDay: number;
  /** Liters of water per person per day (drinking + cooking + minimal hygiene). */
  waterPerPersonPerDay: number;
  /** Autonomy tiers to build up, in days, ascending (3 days, 1 week, 1 month, 1 year by default). */
  tiers: number[];
  rhythm: Rhythm;
  /** A lot is "expiring soon" when it expires within this many days. */
  warningDays: number;
  /** Rotation aims to consume each lot this many days before it expires. */
  rotationMarginDays: number;
  /** Day the emergency info was last reviewed, `YYYY-MM-DD`, or empty when it never was. */
  emergencyReviewed: string;
}

/** Who a product's quantities are for: each person, the whole household, each cat or each dog. */
export type Per = 'person' | 'household' | 'cat' | 'dog';

/**
 * How a product is looked after:
 * - food: food and water, eaten and replaced as you go (rotation), counted in the autonomy;
 * - consumable: not eaten but used up or aging (batteries, medicine, gas…), replaced before its date;
 * - gear: durable things you only need to own (tools, lamp, stove…), nothing to rotate.
 */
export type Kind = 'food' | 'consumable' | 'gear';

export interface Product {
  name: string;
  kind: Kind;
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

/**
 * Topics of the household plan: emergency numbers, the out-of-area contact everybody calls, other
 * contacts (doctor, school, neighbor…), meeting points, who does what, how to shut off gas, water and
 * electricity, and each person's health needs.
 */
export type EmergencyTopic = 'number' | 'remote' | 'contact' | 'meeting' | 'role' | 'shutoff' | 'health';

/** One line of the emergency info: a number to call, a contact, a place, a role… */
export interface EmergencyEntry {
  /** Topic key (see EmergencyTopic) or any free text, for a topic of the user's own. */
  topic: string;
  /** Who or what: a person, a service, a place, a meter. */
  name: string;
  /** Free text: where, what to do. */
  details: string;
  /** Number to call, as written; `SMS 114` for a number that only takes text messages. */
  phone: string;
  extra: Extra;
}

/** An evacuation bag. Its name is also the location of its lots in the stock. */
export interface Bag {
  name: string;
  /** Where the bag is kept: the hall, a closet… */
  stored: string;
  /** Day the bag was last checked, `YYYY-MM-DD`, or empty when it never was. */
  checked: string;
  notes: string;
  extra: Extra;
}

/**
 * Groups of the list of a bag, from the guide "Pack a go-bag": water and food, to keep informed and lit,
 * to keep healthy, to keep protected, tools, documents and money.
 */
export type BagGroup = 'water-food' | 'light' | 'health' | 'protection' | 'tools' | 'papers';

/** One thing to pack in a bag. */
export interface BagItem {
  /** Name of the bag. */
  bag: string;
  /** Group key (see BagGroup) or any free text, for a group of the user's own. */
  group: string;
  name: string;
  /** Packed, ticked by hand. An item that follows a product of the stock is packed when a lot is in the bag. */
  ready: boolean;
  /** Product of the stock that tells whether the item is in the bag and until when, or empty. */
  product: string;
  extra: Extra;
}

export type SectionName = 'settings' | 'emergency' | 'bags' | 'bagItems' | 'products' | 'stock' | 'log';

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
  /** The household's emergency info, in the order of the file. */
  emergency: EmergencyEntry[];
  bags: Bag[];
  /** What goes in each bag, in the order of the file. */
  bagItems: BagItem[];
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
