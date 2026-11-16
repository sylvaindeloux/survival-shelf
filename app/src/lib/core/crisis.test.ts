import { describe, expect, it } from 'vitest';
import { addBag } from './bags';
import { CATALOG, productFromCatalog } from './catalog';
import { drinkWater, eatFirst, waterToday } from './crisis';
import { dayFromParts } from './dates';
import { emptyShelf } from './defaults';
import { addLot, upsertProduct } from './stock';
import type { Shelf } from './types';

const TODAY = dayFromParts(2026, 11, 15);

/** Two people in French, with the products of the catalog these ids name. */
function household(...ids: string[]): Shelf {
  let shelf = emptyShelf('fr');
  shelf.settings.people = 2;
  for (const id of ids) shelf = upsertProduct(shelf, productFromCatalog(CATALOG.find((entry) => entry.id === id)!, 'fr'));
  return shelf;
}

function lot(shelf: Shelf, product: string, qty: number, expires: string, location = 'Cellier'): Shelf {
  return addLot(shelf, { product, qty, expires, location }, TODAY);
}

describe('the water of the day', () => {
  it('counts the bottles the household needs, from the water out of the go-bags that expires first', () => {
    let shelf = household('water-bottle');
    shelf = lot(shelf, 'Bouteille d’eau 1,5 L', 10, '2027-06', 'Garage');
    shelf = lot(shelf, 'Bouteille d’eau 1,5 L', 4, '2027-01', 'Sac 72h');
    shelf = lot(shelf, 'Bouteille d’eau 1,5 L', 6, '2026-10', 'Garage');
    shelf = addBag(shelf, { name: 'Sac 72h', stored: '' }, 'fr');
    const water = waterToday(shelf, TODAY);
    // 2 people × 3 L: four bottles of 1.5 L. The expired lot is left aside, the bag's lot kept for an evacuation.
    expect(water).toMatchObject({ need: 6, drunk: 0, boxLiters: 1.5, boxQty: 1, boxes: 4, done: 0 });
    expect(water.lot).toMatchObject({ qty: 10, location: 'Garage' });
  });

  it('takes a bottle from the stock and logs it each time one is drunk', () => {
    let shelf = lot(household('water-bottle'), 'Bouteille d’eau 1,5 L', 10, '2027-06');
    shelf = drinkWater(shelf, TODAY).shelf;
    shelf = drinkWater(shelf, TODAY).shelf;
    expect(waterToday(shelf, TODAY)).toMatchObject({ drunk: 3, done: 2, boxes: 4 });
    expect(shelf.lots[0].qty).toBe(8);
    expect(shelf.log.map((entry) => [entry.date, entry.product, entry.qty, entry.action])).toEqual([
      ['2026-11-15', 'Bouteille d’eau 1,5 L', 1, 'consumed'],
      ['2026-11-15', 'Bouteille d’eau 1,5 L', 1, 'consumed'],
    ]);
    // The next day starts again from zero.
    expect(waterToday(shelf, TODAY + 1)).toMatchObject({ drunk: 0, done: 0 });
  });

  it('ticks bigger water liter by liter, a pack of six bottles too', () => {
    let shelf = lot(household('water-can'), 'Bidon d’eau 5 L', 2, '2027-06');
    expect(waterToday(shelf, TODAY)).toMatchObject({ boxLiters: 1, boxQty: 0.2, boxes: 6 });
    shelf = drinkWater(shelf, TODAY).shelf;
    expect(shelf.lots[0].qty).toBe(1.8);
    expect(waterToday(shelf, TODAY).done).toBe(1);

    let pack = lot(household('water-pack'), 'Pack d’eau 6 × 1,5 L', 1, '2027-06');
    for (let i = 0; i < 6; i++) pack = drinkWater(pack, TODAY).shelf;
    expect(waterToday(pack, TODAY)).toMatchObject({ boxes: 6, done: 6 });
  });

  it('has nothing to tick without stored water', () => {
    const shelf = lot(household('water-bottle', 'rice'), 'Riz', 2, '2027-06');
    expect(waterToday(shelf, TODAY)).toMatchObject({ need: 6, lot: null, boxes: 0, done: 0 });
    expect(drinkWater(shelf, TODAY)).toEqual({ shelf, taken: 0 });
  });
});

describe('what to eat first', () => {
  it('lists the food that expires first, out of the go-bags, without water, pet food or expired lots', () => {
    let shelf = household('rice', 'pasta', 'tuna', 'water-bottle', 'cat-food');
    shelf = lot(shelf, 'Riz', 2, '2027-03');
    shelf = lot(shelf, 'Pâtes', 1, '2026-12-10');
    shelf = lot(shelf, 'Thon en boîte 140 g', 3, '2026-11-01');
    shelf = lot(shelf, 'Thon en boîte 140 g', 2, '2026-12-01', 'Sac 72h');
    shelf = lot(shelf, 'Bouteille d’eau 1,5 L', 6, '2026-11-20');
    shelf = lot(shelf, 'Croquettes pour chat', 1, '2026-11-25');
    shelf = lot(shelf, 'Thon en boîte 140 g', 4, '2027-09');
    shelf = addBag(shelf, { name: 'Sac 72h', stored: '' }, 'fr');
    expect(eatFirst(shelf, TODAY).map((lot) => [lot.product, lot.expires])).toEqual([
      ['Pâtes', '2026-12-10'],
      ['Riz', '2027-03'],
      ['Thon en boîte 140 g', '2027-09'],
    ]);
    expect(eatFirst(shelf, TODAY, 10).at(-1)).toMatchObject({ product: 'Thon en boîte 140 g', location: 'Sac 72h' });
  });
});
