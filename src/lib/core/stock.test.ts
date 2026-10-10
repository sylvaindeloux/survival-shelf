import { describe, expect, it } from 'vitest';
import { dayFromParts } from './dates';
import { emptyShelf } from './defaults';
import { addLot, deleteProduct, emptyProduct, takeFromLot, takeFromProduct, upsertProduct } from './stock';

const TODAY = dayFromParts(2026, 10, 10);

function shelfWithRice() {
  let shelf = upsertProduct(emptyShelf(), { ...emptyProduct('Rice'), category: 'grains', unit: 'kg', kcal: 3600 });
  shelf = addLot(shelf, { product: 'Rice', qty: 2, expires: '2027-06-01', location: 'Cellar' }, TODAY);
  shelf = addLot(shelf, { product: 'Rice', qty: 3, expires: '2027-01', location: 'Cellar' }, TODAY);
  return shelf;
}

describe('stock operations', () => {
  it('adds lots, merging identical ones and grouping by product', () => {
    let shelf = shelfWithRice();
    shelf = addLot(shelf, { product: 'Pasta', qty: 1, expires: '', location: '' }, TODAY);
    shelf = addLot(shelf, { product: 'rice', qty: 1, expires: '2027-06-01', location: 'cellar' }, TODAY);
    shelf = addLot(shelf, { product: 'Rice', qty: 4, expires: '2028-01-01', location: 'Cellar' }, TODAY);
    expect(shelf.lots.map((lot) => [lot.product, lot.qty, lot.expires])).toEqual([
      ['Rice', 3, '2027-06-01'],
      ['Rice', 3, '2027-01'],
      ['Rice', 4, '2028-01-01'],
      ['Pasta', 1, ''],
    ]);
    expect(shelf.lots[0].added).toBe('2026-10-10');
    expect(shelf.products.map((product) => product.name)).toEqual(['Rice', 'Pasta']);
  });

  it('consumes the oldest expiry first and logs it', () => {
    const { shelf, taken } = takeFromProduct(shelfWithRice(), 'rice', 4, 'consumed', TODAY);
    expect(taken).toBe(4);
    expect(shelf.lots.map((lot) => [lot.expires, lot.qty])).toEqual([['2027-06-01', 1]]);
    expect(shelf.log).toEqual([{ date: '2026-10-10', product: 'Rice', qty: 4, action: 'consumed', note: '', extra: {} }]);
  });

  it('never takes more than available', () => {
    const { shelf, taken } = takeFromProduct(shelfWithRice(), 'Rice', 10, 'consumed', TODAY);
    expect(taken).toBe(5);
    expect(shelf.lots).toEqual([]);
  });

  it('discards a specific lot', () => {
    const start = shelfWithRice();
    const { shelf } = takeFromLot(start, start.lots[0].id, 2, 'discarded', TODAY, 'mice');
    expect(shelf.lots.map((lot) => lot.expires)).toEqual(['2027-01']);
    expect(shelf.log[0]).toMatchObject({ action: 'discarded', qty: 2, note: 'mice' });
  });

  it('renames a product everywhere', () => {
    let shelf = takeFromProduct(shelfWithRice(), 'Rice', 1, 'consumed', TODAY).shelf;
    shelf = upsertProduct(shelf, { ...shelf.products[0], name: 'Basmati rice' }, 'Rice');
    expect(shelf.products.map((product) => product.name)).toEqual(['Basmati rice']);
    expect(new Set(shelf.lots.map((lot) => lot.product))).toEqual(new Set(['Basmati rice']));
    expect(shelf.log[0].product).toBe('Basmati rice');
  });

  it('deletes a product with its lots', () => {
    const shelf = deleteProduct(shelfWithRice(), 'Rice');
    expect(shelf.products).toEqual([]);
    expect(shelf.lots).toEqual([]);
  });
});
