import { normalizeCategory } from './categories';
import { SECTION_ORDER, defaultLayout, defaultSectionLayout, defaultSettings } from './defaults';
import { isValidDate, normalizeDate } from './dates';
import { newLotId } from './ids';
import { formatTable, isSeparatorRow, isTableLine, splitRow } from './table';
import { formatNumber, normalizeKey, parseNumber, sameName } from './text';
import type {
  Extra,
  LogAction,
  LogEntry,
  Lot,
  ParseIssue,
  Per,
  ParseResult,
  Product,
  Rhythm,
  SectionLayout,
  SectionName,
  Settings,
  SettingRow,
  Shelf,
  TableLayout,
} from './types';

interface ColumnDef {
  key: string;
  label: string;
  aliases: string[];
  /** Written even when no row has a value. */
  always?: boolean;
}

const SECTION_ALIASES: Record<string, SectionName> = Object.fromEntries(
  (
    [
      ['settings', ['settings', 'parameters', 'parametres', 'reglages', 'configuration', 'config']],
      ['products', ['products', 'produits', 'catalog', 'catalogue']],
      ['stock', ['stock', 'stocks', 'inventory', 'inventaire', 'lots']],
      ['log', ['log', 'journal', 'history', 'historique']],
    ] as [SectionName, string[]][]
  ).flatMap(([name, aliases]) => aliases.map((alias) => [alias, name])),
);

const SETTINGS_COLUMNS: ColumnDef[] = [
  { key: 'label', label: 'Setting', aliases: ['setting', 'parameter', 'name', 'key', 'parametre', 'reglage', 'nom', 'cle'], always: true },
  { key: 'value', label: 'Value', aliases: ['value', 'valeur'], always: true },
];

const PRODUCT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Product', aliases: ['product', 'name', 'produit', 'nom', 'item', 'article'], always: true },
  { key: 'category', label: 'Category', aliases: ['category', 'categorie', 'cat'], always: true },
  { key: 'unit', label: 'Unit', aliases: ['unit', 'unite', 'units', 'unites'], always: true },
  {
    key: 'kcal',
    label: 'Kcal/unit',
    aliases: ['kcalunit', 'kcal', 'calories', 'kcalperunit', 'kcalparunite', 'kcalunite', 'energy', 'energie'],
    always: true,
  },
  {
    key: 'water',
    label: 'Water L/unit',
    aliases: ['waterlunit', 'water', 'waterl', 'waterperunit', 'eau', 'eaul', 'eaulunite', 'eauunite'],
    always: true,
  },
  {
    key: 'daily',
    label: 'Daily use',
    aliases: ['dailyuse', 'daily', 'perday', 'useperday', 'dailyusage', 'consojour', 'consoparjour', 'conso', 'consommation', 'consommationjour', 'consommationparjour', 'parjour'],
    always: true,
  },
  { key: 'per', label: 'Per', aliases: ['per', 'par', 'basis', 'base', 'pour', 'for'], always: true },
  { key: 'target', label: 'Target', aliases: ['target', 'objectif', 'cible', 'goal', 'min', 'minimum', 'own', 'avoir'], always: true },
  { key: 'notes', label: 'Notes', aliases: ['notes', 'note', 'remarques', 'remarque', 'comment', 'comments', 'commentaire', 'commentaires'] },
];

const PER_ALIASES: Record<string, Per> = {
  person: 'person',
  persons: 'person',
  people: 'person',
  pers: 'person',
  each: 'person',
  personne: 'person',
  personnes: 'person',
  chacun: 'person',
  household: 'household',
  home: 'household',
  family: 'household',
  fixed: 'household',
  total: 'household',
  foyer: 'household',
  maison: 'household',
  famille: 'household',
  fixe: 'household',
};

const STOCK_COLUMNS: ColumnDef[] = [
  { key: 'product', label: 'Product', aliases: ['product', 'produit', 'name', 'nom', 'item', 'article'], always: true },
  { key: 'qty', label: 'Qty', aliases: ['qty', 'quantity', 'quantite', 'qte', 'qt'], always: true },
  {
    key: 'expires',
    label: 'Expires',
    aliases: ['expires', 'expiry', 'expiration', 'bestbefore', 'useby', 'peremption', 'dlc', 'ddm', 'dluo', 'exp'],
    always: true,
  },
  { key: 'location', label: 'Location', aliases: ['location', 'emplacement', 'lieu', 'place', 'where', 'ou'], always: true },
  { key: 'added', label: 'Added', aliases: ['added', 'ajoute', 'ajout', 'purchased', 'bought', 'achat', 'achete'] },
];

const LOG_COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Date', aliases: ['date', 'jour', 'day'], always: true },
  { key: 'product', label: 'Product', aliases: ['product', 'produit', 'name', 'nom', 'item', 'article'], always: true },
  { key: 'qty', label: 'Qty', aliases: ['qty', 'quantity', 'quantite', 'qte', 'qt'], always: true },
  { key: 'action', label: 'Action', aliases: ['action', 'type', 'event', 'evenement'], always: true },
  { key: 'note', label: 'Note', aliases: ['note', 'notes', 'comment', 'commentaire', 'remarque'] },
];

const COLUMNS: Record<SectionName, ColumnDef[]> = {
  settings: SETTINGS_COLUMNS,
  products: PRODUCT_COLUMNS,
  stock: STOCK_COLUMNS,
  log: LOG_COLUMNS,
};

const RHYTHM_ALIASES: Record<string, Rhythm> = {
  weekly: 'weekly',
  week: 'weekly',
  hebdo: 'weekly',
  hebdomadaire: 'weekly',
  semaine: 'weekly',
  monthly: 'monthly',
  month: 'monthly',
  mensuel: 'monthly',
  mois: 'monthly',
  quarterly: 'quarterly',
  quarter: 'quarterly',
  '3months': 'quarterly',
  trimestriel: 'quarterly',
  trimestre: 'quarterly',
  '3mois': 'quarterly',
  semiannual: 'semiannual',
  halfyearly: 'semiannual',
  halfyear: 'semiannual',
  '6months': 'semiannual',
  semestriel: 'semiannual',
  semestre: 'semiannual',
  '6mois': 'semiannual',
};

interface SettingDef {
  field: keyof Settings;
  label: string;
  aliases: string[];
  /** Parsed value, or undefined when the text is invalid. */
  read: (text: string) => Settings[keyof Settings] | undefined;
  write: (settings: Settings) => string;
}

function numberSetting(field: keyof Settings, label: string, aliases: string[], min: number): SettingDef {
  return {
    field,
    label,
    aliases,
    read: (text) => {
      const value = parseNumber(text);
      return value === null || Number.isNaN(value) || value < min ? undefined : value;
    },
    write: (settings) => formatNumber(settings[field] as number),
  };
}

/** "7, 30, 365": positive whole numbers of days, any separator. */
export function parseTiers(text: string): number[] | undefined {
  const parts = text.split(/[\s,;/]+/).filter((part) => part !== '');
  const days = parts.map((part) => parseNumber(part));
  if (days.length === 0 || days.some((day) => day === null || !Number.isInteger(day) || day <= 0)) return undefined;
  return [...new Set(days as number[])].sort((a, b) => a - b);
}

const SETTING_DEFS: SettingDef[] = [
  numberSetting('people', 'People', ['people', 'persons', 'personnes', 'household', 'foyer', 'nbpersonnes'], 1),
  numberSetting(
    'kcalPerPersonPerDay',
    'Kcal per person per day',
    ['kcalperpersonperday', 'kcalperperson', 'kcalparpersonneparjour', 'kcalparpersonne', 'caloriesperpersonperday'],
    1,
  ),
  numberSetting(
    'waterPerPersonPerDay',
    'Water L per person per day',
    ['waterlperpersonperday', 'waterperpersonperday', 'eaulparpersonneparjour', 'eauparpersonneparjour'],
    0,
  ),
  {
    field: 'tiers',
    label: 'Tiers (days)',
    aliases: ['tiers', 'tiersdays', 'autonomytiers', 'paliers', 'paliersjours', 'paliersdautonomie', 'niveaux'],
    read: parseTiers,
    write: (settings) => settings.tiers.join(', '),
  },
  {
    field: 'rhythm',
    label: 'Check-in',
    aliases: ['checkin', 'rhythm', 'frequency', 'rendezvous', 'rythme', 'frequence'],
    read: (text) => RHYTHM_ALIASES[normalizeKey(text)],
    write: (settings) => settings.rhythm,
  },
  numberSetting(
    'warningDays',
    'Expiry warning days',
    ['expirywarningdays', 'warningdays', 'expirywarning', 'alerteperemptionjours', 'alerteperemption', 'alertejours'],
    0,
  ),
  numberSetting(
    'rotationMarginDays',
    'Rotation margin days',
    ['rotationmargindays', 'rotationmargin', 'margerotationjours', 'margederotationjours', 'margerotation', 'margederotation'],
    0,
  ),
];

const SETTING_BY_ALIAS = new Map<string, SettingDef>(
  SETTING_DEFS.flatMap((def) => [normalizeKey(def.label), ...def.aliases].map((alias) => [alias, def] as const)),
);

const ACTION_ALIASES: Record<string, LogAction> = {
  consumed: 'consumed',
  consume: 'consumed',
  eaten: 'consumed',
  used: 'consumed',
  consomme: 'consumed',
  mange: 'consumed',
  utilise: 'consumed',
  discarded: 'discarded',
  discard: 'discarded',
  wasted: 'discarded',
  thrown: 'discarded',
  lost: 'discarded',
  jete: 'discarded',
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
    const def = columns.find((column) => column.aliases.includes(normalized) || normalizeKey(column.label) === normalized);
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

function readSettings(rows: RawRow[], shelf: Shelf, issues: ParseIssue[]) {
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
  }
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
      const known = PER_ALIASES[normalizeKey(perText)];
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
    let action = ACTION_ALIASES[normalizeKey(actionText)];
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

/** Reads a Survival Shelf Markdown file. Never throws: problems are reported as issues. */
export function parseShelf(text: string): ParseResult {
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
      const preamble = trimBlankLines(chunk.lines);
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
  readSettings(parsed.settings ?? [], shelf, issues);
  readProducts(parsed.products ?? [], shelf, issues);
  readStock(parsed.stock ?? [], shelf, issues);
  readLog(parsed.log ?? [], shelf, issues);

  if (shelf.layout.blocks.length === 0) shelf.layout = defaultLayout();
  return { shelf, issues };
}

function settingsRows(shelf: Shelf): Record<string, string>[] {
  const known = SETTING_DEFS.map((def) => ({
    label: shelf.layout.settingsLabels[def.field] ?? def.label,
    value: def.write(shelf.settings),
  }));
  return [...known, ...shelf.settingsExtra.map((row: SettingRow) => ({ ...row }))];
}

function productRow(product: Product): Record<string, string> {
  return {
    name: product.name,
    category: product.category,
    unit: product.unit,
    kcal: formatNumber(product.kcal),
    water: formatNumber(product.water),
    daily: formatNumber(product.daily),
    // "person" is the default: only spelled out when it matters.
    per: product.per === 'household' || product.daily !== null || product.target !== null ? product.per : '',
    target: formatNumber(product.target),
    notes: product.notes,
  };
}

function lotRow(lot: Lot): Record<string, string> {
  return { product: lot.product, qty: formatNumber(lot.qty), expires: lot.expires, location: lot.location, added: lot.added };
}

function logRow(entry: LogEntry): Record<string, string> {
  return { date: entry.date, product: entry.product, qty: formatNumber(entry.qty), action: entry.action, note: entry.note };
}

function renderTable(
  name: SectionName,
  layout: TableLayout | null,
  rows: { values: Record<string, string>; extra: Extra }[],
): string {
  const columns = COLUMNS[name];
  const headers = layout ? [...layout.headers] : [];
  const keys = layout ? [...layout.keys] : [];
  for (const column of columns) {
    if (keys.includes(column.key)) continue;
    const used = column.always || rows.some((row) => (row.values[column.key] ?? '') !== '');
    if (used) {
      headers.push(column.label);
      keys.push(column.key);
    }
  }
  const cells = rows.map((row) => keys.map((key, i) => (key ? (row.values[key] ?? '') : (row.extra[headers[i]] ?? ''))));
  return formatTable(headers, cells);
}

function renderSection(name: SectionName, shelf: Shelf): string {
  const layout = shelf.layout.sections[name] ?? defaultSectionLayout(name);
  let rows: { values: Record<string, string>; extra: Extra }[];
  switch (name) {
    case 'settings':
      rows = settingsRows(shelf).map((values) => ({ values, extra: {} }));
      break;
    case 'products':
      rows = shelf.products.map((product) => ({ values: productRow(product), extra: product.extra }));
      break;
    case 'stock':
      rows = shelf.lots.map((lot) => ({ values: lotRow(lot), extra: lot.extra }));
      break;
    case 'log':
      rows = shelf.log.map((entry) => ({ values: logRow(entry), extra: entry.extra }));
      break;
  }
  return [`## ${layout.heading}`, layout.before, renderTable(name, layout.table, rows), layout.after]
    .filter((part) => part !== '')
    .join('\n\n');
}

/** Writes the shelf back to Markdown, keeping the user's layout and unknown content. */
export function serializeShelf(shelf: Shelf): string {
  const blocks = [...shelf.layout.blocks];
  for (const name of SECTION_ORDER) {
    if (!blocks.some((block) => block.type === 'section' && block.name === name)) {
      blocks.push({ type: 'section', name });
    }
  }
  const parts = blocks.map((block) => (block.type === 'raw' ? block.text : renderSection(block.name, shelf)));
  return `${parts.join('\n\n')}\n`;
}
