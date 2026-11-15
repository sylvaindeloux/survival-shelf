import { categoryLabel, normalizeCategory } from './categories';
import {
  DEFAULT_PREAMBLE,
  SECTION_COMMENTS,
  SECTION_HEADINGS,
  SECTION_ORDER,
  defaultLayout,
  defaultSectionLayout,
  defaultSettings,
  translateDefault,
} from './defaults';
import { isValidDate, normalizeDate } from './dates';
import { inLang, LANGUAGES, translations } from './languages';
import { newLotId } from './ids';
import { formatTable, isSeparatorRow, isTableLine, splitRow } from './table';
import { formatNumber, normalizeKey, parseNumber, sameName } from './text';
import {
  LANGS,
  type Extra,
  type LogAction,
  type LogEntry,
  type Lot,
  type ParseIssue,
  type Per,
  type ParseResult,
  type Product,
  type Rhythm,
  type SectionLayout,
  type SectionName,
  type Settings,
  type SettingRow,
  type Shelf,
  type TableLayout,
  type Lang,
  type Translated,
} from './types';

interface ColumnDef {
  key: string;
  /** Header written by the app, in each language. */
  label: Translated;
  /** Other headers accepted when reading (normalized). */
  aliases: string[];
  /** Written even when no row has a value. */
  always?: boolean;
}

/** True when `text` is what the app writes, in any language. */
function isCanonical(text: string, label: Translated): boolean {
  const key = normalizeKey(text);
  return translations(label).some((translation) => normalizeKey(translation) === key);
}

const SECTION_ALIASES: Record<string, SectionName> = Object.fromEntries(
  (
    [
      ['settings', ['parameters', 'reglages', 'configuration', 'config']],
      ['products', ['catalog', 'catalogue']],
      ['stock', ['stocks', 'inventory', 'inventaire', 'lots']],
      ['log', ['history', 'historique']],
    ] as [SectionName, string[]][]
  ).flatMap(([name, aliases]) =>
    [...translations(SECTION_HEADINGS[name]).map(normalizeKey), ...aliases].map((alias) => [alias, name]),
  ),
);

const SETTINGS_COLUMNS: ColumnDef[] = [
  { key: 'label', label: { en: 'Setting', fr: 'Paramètre' }, aliases: ['parameter', 'name', 'key', 'reglage', 'nom', 'cle'], always: true },
  { key: 'value', label: { en: 'Value', fr: 'Valeur' }, aliases: [], always: true },
];

const PRODUCT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: { en: 'Product', fr: 'Produit' }, aliases: ['name', 'nom', 'item', 'article'], always: true },
  { key: 'category', label: { en: 'Category', fr: 'Catégorie' }, aliases: ['cat'], always: true },
  { key: 'unit', label: { en: 'Unit', fr: 'Unité' }, aliases: ['units', 'unites'], always: true },
  {
    key: 'kcal',
    label: { en: 'Kcal/unit', fr: 'Kcal/unité' },
    aliases: ['kcal', 'calories', 'kcalperunit', 'kcalparunite', 'energy', 'energie'],
    always: true,
  },
  {
    key: 'water',
    label: { en: 'Water L/unit', fr: 'Eau L/unité' },
    aliases: ['water', 'waterl', 'waterperunit', 'eau', 'eaul', 'eauunite'],
    always: true,
  },
  {
    key: 'daily',
    label: { en: 'Daily use', fr: 'Conso/jour' },
    aliases: ['daily', 'perday', 'useperday', 'dailyusage', 'consoparjour', 'conso', 'consommation', 'consommationjour', 'consommationparjour', 'parjour'],
    always: true,
  },
  { key: 'per', label: { en: 'Per', fr: 'Par' }, aliases: ['basis', 'base', 'pour', 'for'], always: true },
  { key: 'target', label: { en: 'Target', fr: 'Objectif' }, aliases: ['cible', 'goal', 'min', 'minimum', 'own', 'avoir'], always: true },
  { key: 'notes', label: { en: 'Notes', fr: 'Notes' }, aliases: ['note', 'remarques', 'remarque', 'comment', 'comments', 'commentaire', 'commentaires'] },
];

/** Values of the Per column written by the app. */
const PER_LABELS: Record<Per, Translated> = {
  person: { en: 'person', fr: 'personne' },
  household: { en: 'household', fr: 'foyer' },
  cat: { en: 'cat', fr: 'chat' },
  dog: { en: 'dog', fr: 'chien' },
};

const PER_ALIASES: Record<string, Per> = {
  persons: 'person',
  people: 'person',
  pers: 'person',
  each: 'person',
  personnes: 'person',
  chacun: 'person',
  home: 'household',
  family: 'household',
  fixed: 'household',
  total: 'household',
  maison: 'household',
  famille: 'household',
  fixe: 'household',
  cats: 'cat',
  percat: 'cat',
  chats: 'cat',
  parchat: 'cat',
  dogs: 'dog',
  perdog: 'dog',
  chiens: 'dog',
  parchien: 'dog',
};

const STOCK_COLUMNS: ColumnDef[] = [
  { key: 'product', label: { en: 'Product', fr: 'Produit' }, aliases: ['name', 'nom', 'item', 'article'], always: true },
  { key: 'qty', label: { en: 'Qty', fr: 'Quantité' }, aliases: ['quantity', 'qte', 'qt'], always: true },
  {
    key: 'expires',
    label: { en: 'Expires', fr: 'Péremption' },
    aliases: ['expiry', 'expiration', 'bestbefore', 'useby', 'dlc', 'ddm', 'dluo', 'exp'],
    always: true,
  },
  { key: 'location', label: { en: 'Location', fr: 'Emplacement' }, aliases: ['lieu', 'place', 'where', 'ou'], always: true },
  { key: 'added', label: { en: 'Added', fr: 'Ajouté' }, aliases: ['ajout', 'purchased', 'bought', 'achat', 'achete'] },
];

const LOG_COLUMNS: ColumnDef[] = [
  { key: 'date', label: { en: 'Date', fr: 'Date' }, aliases: ['jour', 'day'], always: true },
  { key: 'product', label: { en: 'Product', fr: 'Produit' }, aliases: ['name', 'nom', 'item', 'article'], always: true },
  { key: 'qty', label: { en: 'Qty', fr: 'Quantité' }, aliases: ['quantity', 'qte', 'qt'], always: true },
  { key: 'action', label: { en: 'Action', fr: 'Action' }, aliases: ['type', 'event', 'evenement'], always: true },
  { key: 'note', label: { en: 'Note', fr: 'Note' }, aliases: ['notes', 'comment', 'commentaire', 'remarque'] },
];

const COLUMNS: Record<SectionName, ColumnDef[]> = {
  settings: SETTINGS_COLUMNS,
  products: PRODUCT_COLUMNS,
  stock: STOCK_COLUMNS,
  log: LOG_COLUMNS,
};

/** Check-in values written by the app. */
const RHYTHM_LABELS: Record<Rhythm, Translated> = {
  monthly: { en: 'monthly', fr: 'mensuel' },
  quarterly: { en: 'quarterly', fr: 'trimestriel' },
  semiannual: { en: 'semiannual', fr: 'semestriel' },
};

const RHYTHM_ALIASES: Record<string, Rhythm> = {
  month: 'monthly',
  mois: 'monthly',
  quarter: 'quarterly',
  '3months': 'quarterly',
  trimestre: 'quarterly',
  '3mois': 'quarterly',
  halfyearly: 'semiannual',
  halfyear: 'semiannual',
  '6months': 'semiannual',
  semestre: 'semiannual',
  '6mois': 'semiannual',
};

/** Names of the languages accepted in the Language setting, besides their codes. */
const LANG_ALIASES: Record<string, Lang> = Object.fromEntries(
  LANGS.flatMap((lang) => [LANGUAGES[lang].name, ...LANGUAGES[lang].aliases].map((name) => [normalizeKey(name), lang])),
);

/**
 * Reads a value written with one of the app's labels (any language) or an alias.
 * Returns undefined when the text is not recognized.
 */
function readValue<T extends string>(text: string, labels: Record<T, Translated>, aliases: Record<string, T>): T | undefined {
  const key = normalizeKey(text);
  const known = (Object.keys(labels) as T[]).find((value) => isCanonical(text, labels[value]) || normalizeKey(value) === key);
  return known ?? aliases[key];
}

interface SettingDef {
  field: keyof Settings;
  /** Label written by the app, in each language. */
  label: Translated;
  /** Other labels accepted when reading (normalized). */
  aliases: string[];
  /** Parsed value, or undefined when the text is invalid. */
  read: (text: string) => Settings[keyof Settings] | undefined;
  write: (settings: Settings, lang: Lang) => string;
}

function numberSetting(field: keyof Settings, label: Translated, aliases: string[], min: number): SettingDef {
  return {
    field,
    label,
    aliases,
    read: (text) => {
      const value = parseNumber(text);
      return value === null || Number.isNaN(value) || value < min ? undefined : value;
    },
    write: (settings, lang) => formatNumber(settings[field] as number, lang),
  };
}

/** "3, 7, 30, 365": positive whole numbers of days, any separator. */
export function parseTiers(text: string): number[] | undefined {
  const parts = text.split(/[\s,;/]+/).filter((part) => part !== '');
  const days = parts.map((part) => parseNumber(part));
  if (days.length === 0 || days.some((day) => day === null || !Number.isInteger(day) || day <= 0)) return undefined;
  return [...new Set(days as number[])].sort((a, b) => a - b);
}

const SETTING_DEFS: SettingDef[] = [
  {
    field: 'lang',
    label: { en: 'Language', fr: 'Langue' },
    aliases: ['lang'],
    read: (text) => {
      const key = normalizeKey(text);
      return (LANGS as string[]).includes(key) ? (key as Lang) : LANG_ALIASES[key];
    },
    write: (settings) => settings.lang,
  },
  numberSetting('people', { en: 'People', fr: 'Personnes' }, ['persons', 'household', 'foyer', 'nbpersonnes'], 1),
  numberSetting('cats', { en: 'Cats', fr: 'Chats' }, ['cat', 'chat', 'nbchats'], 0),
  numberSetting('dogs', { en: 'Dogs', fr: 'Chiens' }, ['dog', 'chien', 'nbchiens'], 0),
  numberSetting(
    'kcalPerPersonPerDay',
    { en: 'Kcal per person per day', fr: 'Kcal par personne par jour' },
    ['kcalperperson', 'kcalparpersonne', 'caloriesperpersonperday', 'kcalparpersonneetparjour'],
    1,
  ),
  numberSetting(
    'waterPerPersonPerDay',
    { en: 'Water L per person per day', fr: 'Eau L par personne par jour' },
    ['waterperpersonperday', 'eauparpersonneparjour', 'eaulparpersonneetparjour'],
    0,
  ),
  {
    field: 'tiers',
    label: { en: 'Tiers (days)', fr: 'Paliers (jours)' },
    aliases: ['tiers', 'autonomytiers', 'paliers', 'paliersdautonomie', 'niveaux'],
    read: parseTiers,
    write: (settings) => settings.tiers.join(', '),
  },
  {
    field: 'rhythm',
    label: { en: 'Check-in', fr: 'Rendez-vous' },
    aliases: ['rhythm', 'frequency', 'rythme', 'frequence'],
    read: (text) => readValue(text, RHYTHM_LABELS, RHYTHM_ALIASES),
    write: (settings, lang) => inLang(RHYTHM_LABELS[settings.rhythm], lang),
  },
  numberSetting(
    'warningDays',
    { en: 'Expiry warning days', fr: 'Alerte péremption (jours)' },
    ['warningdays', 'expirywarning', 'alerteperemption', 'alertejours'],
    0,
  ),
  numberSetting(
    'rotationMarginDays',
    { en: 'Rotation margin days', fr: 'Marge de rotation (jours)' },
    ['rotationmargin', 'margerotationjours', 'margerotation', 'margederotation'],
    0,
  ),
];

const SETTING_BY_ALIAS = new Map<string, SettingDef>(
  SETTING_DEFS.flatMap((def) =>
    [...translations(def.label).map(normalizeKey), ...def.aliases].map((alias) => [alias, def] as const),
  ),
);

/** Log actions written by the app. */
const ACTION_LABELS: Record<LogAction, Translated> = {
  consumed: { en: 'consumed', fr: 'consommé' },
  discarded: { en: 'discarded', fr: 'jeté' },
};

const ACTION_ALIASES: Record<string, LogAction> = {
  consume: 'consumed',
  eaten: 'consumed',
  used: 'consumed',
  mange: 'consumed',
  utilise: 'consumed',
  discard: 'discarded',
  wasted: 'discarded',
  thrown: 'discarded',
  lost: 'discarded',
  perdu: 'discarded',
  gaspille: 'discarded',
};

interface Chunk {
  /** Heading text, null for the content before the first `##` heading. */
  heading: string | null;
  /** 1-based line number of the heading (or of the first line for the preamble). */
  line: number;
  lines: string[];
}

function splitChunks(text: string): Chunk[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const chunks: Chunk[] = [{ heading: null, line: 1, lines: [] }];
  let fence: string | null = null;
  lines.forEach((line, index) => {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
    }
    const heading = fence === null ? /^##\s+(.+?)\s*#*\s*$/.exec(line) : null;
    if (heading) {
      chunks.push({ heading: heading[1], line: index + 1, lines: [] });
    } else {
      chunks[chunks.length - 1].lines.push(line);
    }
  });
  return chunks;
}

// --- Version line -----------------------------------------------------------

/** Line written under the title with the version of the app that saved the file. Informative only. */
const VERSION_LINE = /^_Survival Shelf v[^\s_]+_\s*$/;

export function versionLine(version: string): string {
  return `_Survival Shelf v${version}_`;
}

/** Removes the first version line, and the blank line after it, so that it never piles up. */
function withoutVersionLine(lines: string[]): string[] {
  const index = lines.findIndex((line) => VERSION_LINE.test(line));
  if (index === -1) return lines;
  const end = lines[index + 1]?.trim() === '' ? index + 2 : index + 1;
  return [...lines.slice(0, index), ...lines.slice(end)];
}

/** Puts the version line under the title that opens the preamble, or above the preamble. */
function withVersionLine(preamble: string, version: string): string {
  const lines = preamble.split('\n');
  const title = lines.findIndex((line) => line.trim() !== '');
  if (title === -1 || !/^#\s/.test(lines[title])) return `${versionLine(version)}\n\n${preamble}`;
  const rest = lines.slice(title + 1);
  while (rest.length > 0 && rest[0].trim() === '') rest.shift();
  return [...lines.slice(0, title + 1), '', versionLine(version), ...(rest.length > 0 ? ['', ...rest] : [])].join('\n');
}

/** True when two files have the same content, whatever the app version that saved them. */
export function sameContent(a: string, b: string): boolean {
  return a === b || withoutVersionLine(a.split('\n')).join('\n') === withoutVersionLine(b.split('\n')).join('\n');
}

function trimBlankLines(lines: string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end).join('\n');
}

interface RawRow {
  line: number;
  values: Record<string, string>;
  extra: Extra;
}

interface ParsedSection {
  layout: SectionLayout;
  rows: RawRow[];
}

function parseSection(
  name: SectionName,
  chunk: Chunk & { heading: string },
  issues: ParseIssue[],
): ParsedSection {
  const { lines } = chunk;
  const columns = COLUMNS[name];
  const firstLine = chunk.line + 1;
  const start = lines.findIndex((line, i) => isTableLine(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1]));
  if (start === -1) {
    return { layout: { heading: chunk.heading, before: trimBlankLines(lines), after: '', table: null }, rows: [] };
  }

  const headers = splitRow(lines[start]);
  const keys: (string | null)[] = [];
  headers.forEach((header, i) => {
    const normalized = normalizeKey(header);
    const def = columns.find((column) => column.aliases.includes(normalized) || isCanonical(header, column.label));
    if (def && keys.includes(def.key)) {
      issues.push({ level: 'warning', line: firstLine + start, code: 'duplicateColumn', params: { column: header } });
      keys.push(null);
    } else if (def) {
      keys.push(def.key);
    } else if (name === 'settings' && i < 2 && !keys.includes(i === 0 ? 'label' : 'value')) {
      // Settings tables are plain key/value pairs: accept any header for the first two columns.
      keys.push(i === 0 ? 'label' : 'value');
    } else {
      keys.push(null);
    }
  });

  let end = start + 2;
  const rows: RawRow[] = [];
  while (end < lines.length && lines[end].trim() !== '' && isTableLine(lines[end])) {
    const cells = splitRow(lines[end]);
    if (cells.some((cell) => cell !== '')) {
      const row: RawRow = { line: firstLine + end, values: {}, extra: {} };
      if (cells.length > headers.length) {
        issues.push({ level: 'warning', line: row.line, code: 'tooManyCells' });
      }
      headers.forEach((header, i) => {
        const key = keys[i];
        const value = cells[i] ?? '';
        if (key) row.values[key] = value;
        else if (header !== '' && value !== '') row.extra[header] = value;
      });
      rows.push(row);
    }
    end++;
  }

  return {
    layout: {
      heading: chunk.heading,
      before: trimBlankLines(lines.slice(0, start)),
      after: trimBlankLines(lines.slice(end)),
      table: { headers, keys } satisfies TableLayout,
    },
    rows,
  };
}

function readNumber(
  row: RawRow,
  key: string,
  issues: ParseIssue[],
  options: { required?: boolean; min?: number } = {},
): number | null | undefined {
  const text = row.values[key] ?? '';
  const value = parseNumber(text);
  if (value === null) {
    if (options.required) {
      issues.push({ level: 'error', line: row.line, code: 'missingValue', params: { column: key } });
      return undefined;
    }
    return null;
  }
  if (Number.isNaN(value) || (options.min !== undefined && value < options.min)) {
    issues.push({ level: 'error', line: row.line, code: 'invalidNumber', params: { column: key, value: text } });
    return undefined;
  }
  return value;
}

/** Reads the settings table and returns the fields it sets. */
function readSettings(rows: RawRow[], shelf: Shelf, issues: ParseIssue[]): Set<keyof Settings> {
  const found = new Set<keyof Settings>();
  for (const row of rows) {
    const label = row.values.label ?? '';
    const value = row.values.value ?? '';
    const def = SETTING_BY_ALIAS.get(normalizeKey(label));
    if (!def) {
      shelf.settingsExtra.push({ label, value });
      continue;
    }
    const parsed = def.read(value);
    if (parsed === undefined) {
      issues.push({ level: 'warning', line: row.line, code: 'invalidSetting', params: { setting: label, value } });
      continue;
    }
    (shelf.settings as unknown as Record<string, unknown>)[def.field] = parsed;
    shelf.layout.settingsLabels[def.field] = label;
    found.add(def.field);
  }
  return found;
}

function readProducts(rows: RawRow[], shelf: Shelf, issues: ParseIssue[]) {
  for (const row of rows) {
    const name = (row.values.name ?? '').trim();
    if (name === '') {
      issues.push({ level: 'error', line: row.line, code: 'missingValue', params: { column: 'name' } });
      continue;
    }
    if (shelf.products.some((product) => sameName(product.name, name))) {
      issues.push({ level: 'error', line: row.line, code: 'duplicateProduct', params: { product: name } });
      continue;
    }
    const kcal = readNumber(row, 'kcal', issues, { min: 0 });
    const water = readNumber(row, 'water', issues, { min: 0 });
    const daily = readNumber(row, 'daily', issues, { min: 0 });
    const target = readNumber(row, 'target', issues, { min: 0 });
    if (kcal === undefined || water === undefined || daily === undefined || target === undefined) continue;
    const perText = (row.values.per ?? '').trim();
    let per: Per = 'person';
    if (perText !== '') {
      const known = readValue(perText, PER_LABELS, PER_ALIASES);
      if (known) per = known;
      else issues.push({ level: 'warning', line: row.line, code: 'invalidPer', params: { value: perText } });
    }
    shelf.products.push({
      name,
      category: normalizeCategory(row.values.category ?? ''),
      unit: (row.values.unit ?? '').trim(),
      kcal,
      water,
      daily,
      per,
      target,
      notes: (row.values.notes ?? '').trim(),
      extra: row.extra,
    });
  }
}

function findOrCreateProduct(shelf: Shelf, name: string, line: number, issues: ParseIssue[]): Product {
  const existing = shelf.products.find((product) => sameName(product.name, name));
  if (existing) return existing;
  const product: Product = {
    name,
    category: 'other',
    unit: '',
    kcal: null,
    water: null,
    daily: null,
    per: 'person',
    target: null,
    notes: '',
    extra: {},
  };
  shelf.products.push(product);
  issues.push({ level: 'info', line, code: 'productCreated', params: { product: name } });
  return product;
}

function readStock(rows: RawRow[], shelf: Shelf, issues: ParseIssue[]) {
  for (const row of rows) {
    const name = (row.values.product ?? '').trim();
    if (name === '') {
      issues.push({ level: 'error', line: row.line, code: 'missingValue', params: { column: 'product' } });
      continue;
    }
    const qty = readNumber(row, 'qty', issues, { required: true, min: 0 });
    if (qty === undefined || qty === null) continue;
    const expires = (row.values.expires ?? '').trim();
    if (expires !== '' && !isValidDate(expires)) {
      issues.push({ level: 'error', line: row.line, code: 'invalidExpiry', params: { value: expires } });
      continue;
    }
    const added = (row.values.added ?? '').trim();
    if (added !== '' && !isValidDate(added)) {
      issues.push({ level: 'warning', line: row.line, code: 'invalidDate', params: { column: 'added', value: added } });
    }
    const product = findOrCreateProduct(shelf, name, row.line, issues);
    shelf.lots.push({
      id: newLotId(),
      product: product.name,
      qty,
      expires: expires === '' ? '' : normalizeDate(expires),
      location: (row.values.location ?? '').trim(),
      added: added !== '' && isValidDate(added) ? normalizeDate(added) : added,
      extra: row.extra,
    });
  }
}

function readLog(rows: RawRow[], shelf: Shelf, issues: ParseIssue[]) {
  for (const row of rows) {
    const qty = readNumber(row, 'qty', issues, { required: true, min: 0 });
    if (qty === undefined || qty === null) continue;
    const date = (row.values.date ?? '').trim();
    if (!isValidDate(date)) {
      issues.push({ level: 'warning', line: row.line, code: 'invalidDate', params: { column: 'date', value: date } });
    }
    const actionText = row.values.action ?? '';
    let action = readValue(actionText, ACTION_LABELS, ACTION_ALIASES);
    if (!action) {
      issues.push({ level: 'warning', line: row.line, code: 'invalidAction', params: { value: actionText } });
      action = 'consumed';
    }
    shelf.log.push({
      date: isValidDate(date) ? normalizeDate(date) : date,
      product: (row.values.product ?? '').trim(),
      qty,
      action,
      note: (row.values.note ?? '').trim(),
      extra: row.extra,
    });
  }
}

export interface ParseOptions {
  /** Language of a file that does not say which one it is written in. */
  lang?: Lang;
}

/**
 * Reads a Survival Shelf Markdown file, written in any supported language.
 * Never throws: problems are reported as issues.
 */
export function parseShelf(text: string, options: ParseOptions = {}): ParseResult {
  const issues: ParseIssue[] = [];
  const shelf: Shelf = {
    settings: defaultSettings(),
    settingsExtra: [],
    products: [],
    lots: [],
    log: [],
    layout: { blocks: [], sections: {}, settingsLabels: {} },
  };
  const parsed: Partial<Record<SectionName, RawRow[]>> = {};

  for (const chunk of splitChunks(text)) {
    if (chunk.heading === null) {
      const preamble = trimBlankLines(withoutVersionLine(chunk.lines));
      if (preamble !== '') shelf.layout.blocks.push({ type: 'raw', text: preamble });
      continue;
    }
    const name = SECTION_ALIASES[normalizeKey(chunk.heading)];
    if (!name || parsed[name]) {
      if (name) issues.push({ level: 'warning', line: chunk.line, code: 'duplicateSection', params: { section: chunk.heading } });
      shelf.layout.blocks.push({ type: 'raw', text: trimBlankLines([`## ${chunk.heading}`, ...chunk.lines]) });
      continue;
    }
    const section = parseSection(name, chunk as Chunk & { heading: string }, issues);
    shelf.layout.sections[name] = section.layout;
    shelf.layout.blocks.push({ type: 'section', name });
    parsed[name] = section.rows;
  }

  // Products first, so that stock rows can refer to them whatever the section order.
  const found = readSettings(parsed.settings ?? [], shelf, issues);
  if (!found.has('lang')) shelf.settings.lang = options.lang ?? 'en';
  readProducts(parsed.products ?? [], shelf, issues);
  readStock(parsed.stock ?? [], shelf, issues);
  readLog(parsed.log ?? [], shelf, issues);

  if (shelf.layout.blocks.length === 0) shelf.layout = defaultLayout(shelf.settings.lang);
  return { shelf, issues };
}

function settingsRows(shelf: Shelf, lang: Lang): Record<string, string>[] {
  const known = SETTING_DEFS.map((def) => {
    // A label written by hand is kept, the app's own labels follow the file language.
    const label = shelf.layout.settingsLabels[def.field];
    return {
      label: label !== undefined && !isCanonical(label, def.label) ? label : inLang(def.label, lang),
      value: def.write(shelf.settings, lang),
    };
  });
  return [...known, ...shelf.settingsExtra.map((row: SettingRow) => ({ ...row }))];
}

function productRow(product: Product, lang: Lang): Record<string, string> {
  return {
    name: product.name,
    category: categoryLabel(product.category, lang),
    unit: product.unit,
    kcal: formatNumber(product.kcal, lang),
    water: formatNumber(product.water, lang),
    daily: formatNumber(product.daily, lang),
    // "person" is the default: only spelled out when it matters.
    per: product.per !== 'person' || product.daily !== null || product.target !== null ? inLang(PER_LABELS[product.per], lang) : '',
    target: formatNumber(product.target, lang),
    notes: product.notes,
  };
}

function lotRow(lot: Lot, lang: Lang): Record<string, string> {
  return { product: lot.product, qty: formatNumber(lot.qty, lang), expires: lot.expires, location: lot.location, added: lot.added };
}

function logRow(entry: LogEntry, lang: Lang): Record<string, string> {
  return {
    date: entry.date,
    product: entry.product,
    qty: formatNumber(entry.qty, lang),
    action: inLang(ACTION_LABELS[entry.action], lang),
    note: entry.note,
  };
}

function renderTable(
  name: SectionName,
  layout: TableLayout | null,
  rows: { values: Record<string, string>; extra: Extra }[],
  lang: Lang,
): string {
  const columns = COLUMNS[name];
  const headers: string[] = [];
  const keys: (string | null)[] = [];
  // Known columns written with the app's header are translated, hand-written headers are kept.
  layout?.headers.forEach((header, i) => {
    const key = layout.keys[i];
    const column = columns.find((candidate) => candidate.key === key);
    headers.push(column && isCanonical(header, column.label) ? inLang(column.label, lang) : header);
    keys.push(key);
  });
  const extraHeaders = layout ? layout.headers : [];
  for (const column of columns) {
    if (keys.includes(column.key)) continue;
    const used = column.always || rows.some((row) => (row.values[column.key] ?? '') !== '');
    if (used) {
      headers.push(inLang(column.label, lang));
      keys.push(column.key);
    }
  }
  const cells = rows.map((row) => keys.map((key, i) => (key ? (row.values[key] ?? '') : (row.extra[extraHeaders[i]] ?? ''))));
  return formatTable(headers, cells);
}

function renderSection(name: SectionName, shelf: Shelf, lang: Lang): string {
  const layout = shelf.layout.sections[name] ?? defaultSectionLayout(name, lang);
  let rows: { values: Record<string, string>; extra: Extra }[];
  switch (name) {
    case 'settings':
      rows = settingsRows(shelf, lang).map((values) => ({ values, extra: {} }));
      break;
    case 'products':
      rows = shelf.products.map((product) => ({ values: productRow(product, lang), extra: product.extra }));
      break;
    case 'stock':
      rows = shelf.lots.map((lot) => ({ values: lotRow(lot, lang), extra: lot.extra }));
      break;
    case 'log':
      rows = shelf.log.map((entry) => ({ values: logRow(entry, lang), extra: entry.extra }));
      break;
  }
  const heading = isCanonical(layout.heading, SECTION_HEADINGS[name]) ? inLang(SECTION_HEADINGS[name], lang) : layout.heading;
  return [
    `## ${heading}`,
    translateDefault(layout.before, SECTION_COMMENTS[name], lang),
    renderTable(name, layout.table, rows, lang),
    layout.after,
  ]
    .filter((part) => part !== '')
    .join('\n\n');
}

/**
 * Writes the shelf back to Markdown in the language of its settings. What the app
 * wrote itself (titles, headers, labels, help comments, values) follows that
 * language; the user's own content and hand-written headers are kept as they are.
 * With `version`, a line under the title tells which app version saved the file.
 */
export function serializeShelf(shelf: Shelf, version?: string): string {
  const lang = shelf.settings.lang;
  const blocks = [...shelf.layout.blocks];
  for (const name of SECTION_ORDER) {
    if (!blocks.some((block) => block.type === 'section' && block.name === name)) {
      blocks.push({ type: 'section', name });
    }
  }
  const parts = blocks.map((block) =>
    block.type === 'raw' ? translateDefault(block.text, DEFAULT_PREAMBLE, lang) : renderSection(block.name, shelf, lang),
  );
  if (version !== undefined) {
    // The preamble is the raw block before the first section, if any: unknown sections start with `## `.
    const first = blocks[0];
    if (first.type === 'raw' && !/^##\s/.test(first.text)) parts[0] = withVersionLine(parts[0], version);
    else parts.unshift(versionLine(version));
  }
  return `${parts.join('\n\n')}\n`;
}
