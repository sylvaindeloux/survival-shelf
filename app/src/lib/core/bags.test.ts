import { describe, expect, it } from 'vitest';
import {
  addBag,
  BAG_GROUPS,
  BAG_TEMPLATE,
  bagStatus,
  deleteBag,
  localizedItemName,
  markBagChecked,
  saveBag,
  setItemReady,
} from './bags';
import { dayFromParts } from './dates';
import { emptyShelf } from './defaults';
import { addLot, deleteProduct, emptyProduct, upsertProduct } from './stock';
import type { Shelf } from './types';

const TODAY = dayFromParts(2026, 11, 15);

/** A French household with a headlamp and paracetamol already stored in "Sac 72h", batteries and a radio in the garage. */
function household(): Shelf {
  let shelf = emptyShelf('fr');
  shelf = addLot(shelf, { product: 'Lampe frontale', qty: 1, expires: '', location: 'Sac 72h' }, TODAY);
  shelf = addLot(shelf, { product: 'Paracétamol 500 mg', qty: 1, expires: '2026-12-05', location: 'sac 72H' }, TODAY);
  shelf = addLot(shelf, { product: 'Piles AA', qty: 12, expires: '2034-01', location: 'Garage' }, TODAY);
  shelf = addLot(shelf, { product: 'Radio à dynamo', qty: 1, expires: '', location: 'Garage' }, TODAY);
  shelf = addLot(shelf, { product: 'Bougies', qty: 10, expires: '', location: 'Sac 72h' }, TODAY);
  return shelf;
}

describe('the list of the guide', () => {
  it('has about twenty items in the six groups of the guide, in English and French', () => {
    expect(BAG_TEMPLATE).toHaveLength(22);
    expect([...new Set(BAG_TEMPLATE.map((item) => item.group))]).toEqual(BAG_GROUPS);
    for (const lang of ['en', 'fr'] as const) {
      const names = BAG_TEMPLATE.map((item) => item.name[lang]);
      expect(names.every((name) => name !== undefined && name !== '')).toBe(true);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('translates the items the app wrote, and keeps the others', () => {
    expect(localizedItemName('Sifflet', 'en')).toBe('Whistle');
    expect(localizedItemName('whistle', 'fr')).toBe('Sifflet');
    expect(localizedItemName('Couches', 'en')).toBe('Couches');
  });
});

describe('bags', () => {
  it('adds a bag with the list of the guide, following the products stored in it and the stock of what expires', () => {
    const shelf = addBag(household(), { name: ' Sac 72h ', stored: 'entrée' }, 'fr');
    expect(shelf.bags).toEqual([{ name: 'Sac 72h', stored: 'entrée', checked: '', notes: '', extra: {} }]);
    expect(shelf.bagItems).toHaveLength(22);
    expect(shelf.bagItems[0]).toEqual({
      bag: 'Sac 72h',
      group: 'water-food',
      name: 'Eau pour 3 jours, en petites bouteilles',
      ready: false,
      product: '',
      extra: {},
    });
    const followed = shelf.bagItems.filter((item) => item.product !== '').map((item) => [item.name, item.product]);
    // The batteries expire: they follow the stock while still in the garage. The radio does not expire, and
    // stays to tick by hand until one is stored in the bag. Candles are not on the list.
    expect(followed).toEqual([
      ['Lampe de poche', 'Lampe frontale'],
      ['Piles de rechange', 'Piles AA'],
      ['Médicaments et ordonnances', 'Paracétamol 500 mg'],
    ]);
  });

  it('counts what is ready: ticked by hand, or a lot of its product in the bag that is not expired', () => {
    let shelf = addBag(household(), { name: 'Sac 72h', stored: '' }, 'fr');
    const whistle = shelf.bagItems.find((item) => item.name === 'Sifflet')!;
    shelf = setItemReady(shelf, whistle, true);
    const status = bagStatus(shelf, shelf.bags[0], TODAY);
    expect(status.total).toBe(22);
    expect(status.ready).toBe(3);
    const states = Object.fromEntries(status.groups.flatMap((group) => group.items).map(({ item, state }) => [item.name, state]));
    expect(states['Lampe de poche']).toBe('ready');
    // Expires within the 60 days of warning: still ready, but soon.
    expect(states['Médicaments et ordonnances']).toBe('soon');
    expect(states['Sifflet']).toBe('ready');
    expect(states['Couteau multifonction']).toBe('missing');
    expect(status.groups.map((group) => [group.group, group.ready, group.items.length])).toEqual([
      ['water-food', 0, 3],
      ['light', 1, 4],
      ['health', 1, 3],
      ['protection', 0, 4],
      ['tools', 1, 4],
      ['papers', 0, 4],
    ]);
    // The candles are in the bag without being on its list.
    expect(status.others.map((lot) => lot.product)).toEqual(['Bougies']);
  });

  it('tells an item whose lots in the bag are all expired, and one whose product is stored elsewhere', () => {
    const shelf = addBag(household(), { name: 'Sac 72h', stored: '' }, 'fr');
    const later = dayFromParts(2027, 1, 10);
    const items = Object.fromEntries(bagStatus(shelf, shelf.bags[0], later).groups.flatMap((group) => group.items).map((status) => [status.item.name, status]));
    expect(items['Médicaments et ordonnances'].state).toBe('expired');
    expect(items['Médicaments et ordonnances'].lot?.expires).toBe('2026-12-05');
    const batteries = bagStatus(shelf, shelf.bags[0], TODAY).groups[1].items.find(({ item }) => item.product === 'Piles AA');
    expect(batteries?.state).toBe('missing');
  });

  it('asks for a check a year after the last one', () => {
    let shelf = addBag(household(), { name: 'Sac 72h', stored: '' }, 'fr');
    expect(bagStatus(shelf, shelf.bags[0], TODAY)).toMatchObject({ checkBy: null, checkDue: false });
    shelf = markBagChecked(shelf, 'sac 72h', dayFromParts(2025, 11, 16));
    expect(shelf.bags[0].checked).toBe('2025-11-16');
    expect(bagStatus(shelf, shelf.bags[0], TODAY)).toMatchObject({ checkBy: dayFromParts(2026, 11, 16), checkDue: false });
    expect(bagStatus(shelf, shelf.bags[0], dayFromParts(2026, 11, 16)).checkDue).toBe(true);
  });

  it('renames a bag everywhere: its list and the location of its lots, and keeps the list in its place', () => {
    let shelf = addBag(household(), { name: 'Sac 72h', stored: '' }, 'fr');
    shelf = addBag(shelf, { name: 'Sac de Sam', stored: '' }, 'fr');
    const bag = shelf.bags[0];
    const items = shelf.bagItems.filter((item) => item.bag === 'Sac 72h').slice(0, 2);
    shelf = saveBag(shelf, 'Sac 72h', { ...bag, name: "Sac d'Alex", stored: ' entrée ' }, [...items, { group: 'Bébé', name: ' Couches ', ready: true, product: '', extra: {} }]);
    expect(shelf.bags.map((candidate) => [candidate.name, candidate.stored])).toEqual([["Sac d'Alex", 'entrée'], ['Sac de Sam', '']]);
    expect(shelf.bagItems.slice(0, 3).map((item) => [item.bag, item.name])).toEqual([
      ["Sac d'Alex", 'Eau pour 3 jours, en petites bouteilles'],
      ["Sac d'Alex", 'Nourriture sans cuisson'],
      ["Sac d'Alex", 'Couches'],
    ]);
    expect(shelf.bagItems.slice(3).every((item) => item.bag === 'Sac de Sam')).toBe(true);
    expect(shelf.lots.map((lot) => lot.location)).toEqual(["Sac d'Alex", "Sac d'Alex", 'Garage', 'Garage', "Sac d'Alex"]);
  });

  it('deletes a bag and its list, and leaves its lots in the stock', () => {
    const shelf = deleteBag(addBag(household(), { name: 'Sac 72h', stored: '' }, 'fr'), 'SAC 72H');
    expect(shelf.bags).toEqual([]);
    expect(shelf.bagItems).toEqual([]);
    expect(shelf.lots).toHaveLength(5);
  });

  it('follows a product renamed in the stock, and goes back to a tick when the product is deleted', () => {
    let shelf = addBag(household(), { name: 'Sac 72h', stored: '' }, 'fr');
    shelf = upsertProduct(shelf, { ...emptyProduct('Lampe torche') }, 'Lampe frontale');
    expect(shelf.bagItems.find((item) => item.name === 'Lampe de poche')?.product).toBe('Lampe torche');
    shelf = deleteProduct(shelf, 'Lampe torche');
    expect(shelf.bagItems.find((item) => item.name === 'Lampe de poche')).toMatchObject({ product: '', ready: false });
  });
});
