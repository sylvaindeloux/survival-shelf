import { CATALOG, findCatalogItem } from './catalog';
import { addMonths, formatDay, parseDay, type Day } from './dates';
import { inLang, translations, type Lang, type Translated } from './languages';
import { expiryStatus } from './status';
import { byExpiry } from './stock';
import { sameName } from './text';
import type { Bag, BagGroup, BagItem, Lot, Shelf } from './types';

/** Groups of the list, in the order of the guide "Pack a go-bag". */
export const BAG_GROUPS: BagGroup[] = ['water-food', 'light', 'health', 'protection', 'tools', 'papers'];

export function isBagGroup(group: string): group is BagGroup {
  return (BAG_GROUPS as string[]).includes(group);
}

/** The guide "Pack a go-bag" says to check the bag once a year. */
export const CHECK_MONTHS = 12;

interface TemplateItem {
  group: BagGroup;
  name: Translated;
  /** Catalog products that can stand for the item, when one of their lots is already in the bag. */
  products?: string[];
}

/**
 * What goes in a new bag: steps 1 to 6 of the guide "Pack a go-bag" (guides/en/basics/pack-a-go-bag.md,
 * guides/fr/les-bases/preparer-un-sac-d-evacuation.md) and their sources, keeping what both languages list.
 * The water says "for 3 days" without an amount: the official amounts differ between countries, and the
 * guides give them.
 */
export const BAG_TEMPLATE: TemplateItem[] = [
  {
    group: 'water-food',
    name: { en: 'Water for 3 days, in small bottles', fr: 'Eau pour 3 jours, en petites bouteilles' },
    products: ['water-bottle', 'water-pack', 'water-can', 'water'],
  },
  {
    group: 'water-food',
    name: { en: 'Food that needs no cooking', fr: 'Nourriture sans cuisson' },
    products: ['ration', 'nuts', 'dried-fruit', 'biscuits'],
  },
  { group: 'water-food', name: { en: 'Can opener', fr: 'Ouvre-boîte' }, products: ['can-opener'] },
  { group: 'light', name: { en: 'Battery or hand-crank radio', fr: 'Radio à piles ou à manivelle' }, products: ['radio'] },
  { group: 'light', name: { en: 'Flashlight', fr: 'Lampe de poche' }, products: ['headlamp'] },
  { group: 'light', name: { en: 'Spare batteries', fr: 'Piles de rechange' }, products: ['aa-batteries'] },
  { group: 'light', name: { en: 'Phone charger and backup battery', fr: 'Chargeur et batterie externe' }, products: ['power-bank'] },
  { group: 'health', name: { en: 'First aid kit', fr: 'Trousse de secours' }, products: ['first-aid-kit'] },
  {
    group: 'health',
    name: { en: 'Medicines and prescriptions', fr: 'Médicaments et ordonnances' },
    products: ['daily-medicine', 'paracetamol'],
  },
  { group: 'health', name: { en: 'Spare glasses', fr: 'Lunettes de secours' } },
  { group: 'protection', name: { en: 'Warm clothes', fr: 'Vêtements chauds' } },
  { group: 'protection', name: { en: 'Emergency blanket', fr: 'Couverture de survie' }, products: ['survival-blanket'] },
  { group: 'protection', name: { en: 'Rain gear', fr: 'Vêtement de pluie' } },
  { group: 'protection', name: { en: 'Sturdy shoes', fr: 'Chaussures solides' } },
  { group: 'tools', name: { en: 'Multi-purpose tool', fr: 'Couteau multifonction' }, products: ['multitool'] },
  { group: 'tools', name: { en: 'Lighter or matches', fr: 'Briquet ou allumettes' }, products: ['matches'] },
  { group: 'tools', name: { en: 'Whistle', fr: 'Sifflet' } },
  { group: 'tools', name: { en: 'Masks', fr: 'Masques' } },
  { group: 'papers', name: { en: 'Copies of documents', fr: 'Copies des papiers' } },
  { group: 'papers', name: { en: 'Cash', fr: 'Argent liquide' } },
  { group: 'papers', name: { en: 'Spare keys', fr: 'Double des clés' } },
  { group: 'papers', name: { en: 'Contact list on paper', fr: 'Contacts sur papier' } },
];

function templateItem(name: string): TemplateItem | undefined {
  return BAG_TEMPLATE.find((item) => translations(item.name).some((text) => sameName(text, name)));
}

/** The group of an item of the guide's list, whatever the language it is written in. */
export function templateGroup(name: string): BagGroup | undefined {
  return templateItem(name)?.group;
}

/** The name of an item in `lang` when the app wrote it from the guide's list, as written otherwise. */
export function localizedItemName(name: string, lang: Lang): string {
  const item = templateItem(name);
  return item ? inLang(item.name, lang) : name;
}

export function findBag(shelf: Shelf, name: string): Bag | undefined {
  return shelf.bags.find((bag) => sameName(bag.name, name));
}

/** Lots stored in a bag: their location is the bag's name. */
export function lotsInBag(shelf: Shelf, bag: string): Lot[] {
  return shelf.lots.filter((lot) => lot.qty > 0 && sameName(lot.location, bag)).sort(byExpiry);
}

/**
 * - ready: ticked by hand, or a lot of its product in the bag is not expired;
 * - soon: ready, but that lot expires within the warning delay;
 * - expired: the lots of its product in the bag are all expired;
 * - missing: not ticked, or no lot of its product in the bag.
 */
export type ItemState = 'ready' | 'soon' | 'expired' | 'missing';

export interface ItemStatus {
  item: BagItem;
  state: ItemState;
  /** The lot of its product in the bag that expires first, not expired if there is one. */
  lot: Lot | null;
}

export interface GroupStatus {
  /** Group key, or the group of the user's own as written. */
  group: string;
  items: ItemStatus[];
  ready: number;
}

export interface BagStatus {
  bag: Bag;
  /** The groups of the guide first, in its order, then the user's own. Empty groups are left out. */
  groups: GroupStatus[];
  ready: number;
  total: number;
  /** Lots stored in the bag that no item follows. */
  others: Lot[];
  /** Day the next check is due, null when the bag was never checked. */
  checkBy: Day | null;
  checkDue: boolean;
}

export function isReady(state: ItemState): boolean {
  return state === 'ready' || state === 'soon';
}

function itemStatus(shelf: Shelf, item: BagItem, inBag: Lot[], today: Day): ItemStatus {
  if (item.product === '') return { item, state: item.ready ? 'ready' : 'missing', lot: null };
  const lots = inBag.filter((lot) => sameName(lot.product, item.product));
  const usable = lots.filter((lot) => expiryStatus(lot, shelf.settings, today) !== 'expired');
  if (usable.length > 0) {
    const lot = usable[0];
    return { item, state: expiryStatus(lot, shelf.settings, today) === 'soon' ? 'soon' : 'ready', lot };
  }
  return lots.length > 0 ? { item, state: 'expired', lot: lots[0] } : { item, state: 'missing', lot: null };
}

export function itemsOf(shelf: Shelf, bag: string): BagItem[] {
  return shelf.bagItems.filter((item) => sameName(item.bag, bag));
}

export function bagStatus(shelf: Shelf, bag: Bag, today: Day): BagStatus {
  const inBag = lotsInBag(shelf, bag.name);
  const items = itemsOf(shelf, bag.name).map((item) => itemStatus(shelf, item, inBag, today));
  const own = [...new Set(items.map(({ item }) => item.group).filter((group) => !isBagGroup(group)))];
  const groups = [...BAG_GROUPS, ...own]
    .map((group) => {
      const inGroup = items.filter(({ item }) => item.group === group);
      return { group, items: inGroup, ready: inGroup.filter(({ state }) => isReady(state)).length };
    })
    .filter((group) => group.items.length > 0);
  const followed = items.map(({ item }) => item.product).filter((product) => product !== '');
  const checked = parseDay(bag.checked);
  const checkBy = checked === null ? null : addMonths(checked, CHECK_MONTHS);
  return {
    bag,
    groups,
    ready: items.filter(({ state }) => isReady(state)).length,
    total: items.length,
    others: inBag.filter((lot) => !followed.some((product) => sameName(product, lot.product))),
    checkBy,
    checkDue: checkBy !== null && checkBy <= today,
  };
}

/** The bags with what they hold, in the order of the file. */
export function bagsStatus(shelf: Shelf, today: Day): BagStatus[] {
  return shelf.bags.map((bag) => bagStatus(shelf, bag, today));
}

/**
 * The product of the stock an item of the guide's list follows: the product of a lot already in the bag
 * (a location used before the bag was created), or, for the things that expire (water, food, batteries,
 * medicines), a product of the stock, so that the bag shows their dates and the stock says when to replace
 * them. The others are ticked by hand.
 */
function productFor(shelf: Shelf, inBag: Lot[], template: TemplateItem): string {
  const ids = template.products ?? [];
  const lot = inBag.find((candidate) => ids.includes(findCatalogItem(candidate.product)?.id ?? ''));
  if (lot) return lot.product;
  for (const id of ids) {
    const entry = CATALOG.find((candidate) => candidate.id === id);
    if (!entry || entry.shelfLife === null) continue;
    const product = shelf.products.find((candidate) => findCatalogItem(candidate.name)?.id === id);
    if (product) return product.name;
  }
  return '';
}

/** Adds a bag with the list of the guide, in `lang`. */
export function addBag(shelf: Shelf, bag: Pick<Bag, 'name' | 'stored'>, lang: Lang): Shelf {
  const name = bag.name.trim();
  const inBag = lotsInBag(shelf, name);
  const items = BAG_TEMPLATE.map((template): BagItem => {
    const product = productFor(shelf, inBag, template);
    return { bag: name, group: template.group, name: inLang(template.name, lang), ready: false, product, extra: {} };
  });
  return {
    ...shelf,
    bags: [...shelf.bags, { name, stored: bag.stored.trim(), checked: '', notes: '', extra: {} }],
    bagItems: [...shelf.bagItems, ...items],
  };
}

/**
 * Saves a bag and its list, under its previous name. A new name follows everywhere: the list and the
 * location of the lots in the bag. The list keeps its place in the file.
 */
export function saveBag(shelf: Shelf, previous: string, bag: Bag, items: Omit<BagItem, 'bag'>[]): Shelf {
  const name = bag.name.trim();
  const saved = { ...bag, name, stored: bag.stored.trim(), notes: bag.notes.trim() };
  const list = items.map((item): BagItem => ({ ...item, bag: name, name: item.name.trim(), product: item.product.trim() }));
  let at = shelf.bagItems.findIndex((item) => sameName(item.bag, previous));
  const kept = shelf.bagItems.filter((item) => !sameName(item.bag, previous));
  if (at === -1) at = kept.length;
  else at = shelf.bagItems.slice(0, at).filter((item) => !sameName(item.bag, previous)).length;
  const renamed = name !== previous;
  return {
    ...shelf,
    bags: shelf.bags.map((existing) => (sameName(existing.name, previous) ? saved : existing)),
    bagItems: [...kept.slice(0, at), ...list, ...kept.slice(at)],
    lots: renamed ? shelf.lots.map((lot) => (sameName(lot.location, previous) ? { ...lot, location: name } : lot)) : shelf.lots,
  };
}

/** Removes a bag and its list. Its lots stay in the stock, where they are. */
export function deleteBag(shelf: Shelf, name: string): Shelf {
  return {
    ...shelf,
    bags: shelf.bags.filter((bag) => !sameName(bag.name, name)),
    bagItems: shelf.bagItems.filter((item) => !sameName(item.bag, name)),
  };
}

/** Ticks or unticks an item packed by hand. */
export function setItemReady(shelf: Shelf, item: BagItem, ready: boolean): Shelf {
  return { ...shelf, bagItems: shelf.bagItems.map((existing) => (existing === item ? { ...existing, ready } : existing)) };
}

/** Records that a bag was checked today: the next check is due a year later. */
export function markBagChecked(shelf: Shelf, name: string, today: Day): Shelf {
  return {
    ...shelf,
    bags: shelf.bags.map((bag) => (sameName(bag.name, name) ? { ...bag, checked: formatDay(today) } : bag)),
  };
}
