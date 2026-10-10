import { describe, expect, it } from 'vitest';
import { parseShelf, serializeShelf } from './document';
import { emptyShelf } from './defaults';
import { emptyProduct } from './stock';

const SAMPLE = `# My stock

Some notes about my cellar.

## Settings

| Setting | Value |
|---|---|
| People | 4 |
| Kcal per person per day | 2000 |
| Favourite colour | green |

## Products

| Product | Category | Unit | Kcal/unit | Water L/unit | Target | Brand |
|---|---|---|---|---|---|---|
| Rice | grains | kg | 3600 | | 10 | Taureau Ailé |
| Water | Eau | L | | 1 | 100 | |

## Stock

<!-- one row per lot -->

| Product | Qty | Expires | Location |
|---|---|---|---|
| Rice | 5 | 2027-03 | Cellar |
| Water | 2,5 | 2026-12-31 | Garage |
| Sardines | 3 | 2028-01-15 | Cellar |

Text after the table.

## Recipes

Keep this section as is.
`;

describe('parseShelf', () => {
  it('reads settings, products, lots and keeps unknown settings', () => {
    const { shelf, issues } = parseShelf(SAMPLE);
    expect(shelf.settings.people).toBe(4);
    expect(shelf.settings.kcalPerPersonPerDay).toBe(2000);
    expect(shelf.settings.waterPerPersonPerDay).toBe(3);
    expect(shelf.settingsExtra).toEqual([{ label: 'Favourite colour', value: 'green' }]);
    expect(shelf.products.map((p) => p.name)).toEqual(['Rice', 'Water', 'Sardines']);
    expect(shelf.products[1].category).toBe('water');
    expect(shelf.products[0].extra).toEqual({ Brand: 'Taureau Ailé' });
    expect(shelf.lots.map((l) => [l.product, l.qty, l.expires, l.location])).toEqual([
      ['Rice', 5, '2027-03', 'Cellar'],
      ['Water', 2.5, '2026-12-31', 'Garage'],
      ['Sardines', 3, '2028-01-15', 'Cellar'],
    ]);
    expect(issues).toEqual([{ level: 'info', line: 28, code: 'productCreated', params: { product: 'Sardines' } }]);
  });

  it('matches columns by header whatever their order, language or case', () => {
    const { shelf } = parseShelf(`## Stock

| Péremption | QUANTITÉ | Produit |
|-|-|-|
| 2027-01-01 | 3 | Pâtes |
`);
    expect(shelf.lots[0]).toMatchObject({ product: 'Pâtes', qty: 3, expires: '2027-01-01' });
  });

  it('accepts rows without outer pipes and escaped pipes in cells', () => {
    const { shelf } = parseShelf(`## Products

Product | Unit | Notes
--- | --- | ---
Beans | can | red \\| white
`);
    expect(shelf.products[0]).toMatchObject({ name: 'Beans', unit: 'can', notes: 'red | white' });
  });

  it('reports invalid rows with their line number and skips them', () => {
    const { shelf, issues } = parseShelf(`## Stock

| Product | Qty | Expires |
|---|---|---|
| Rice | lots | 2027-01-01 |
| Rice | 2 | 2027-13-01 |
| | 1 | |
| Rice | 1 | |
`);
    expect(shelf.lots).toHaveLength(1);
    expect(issues.filter((issue) => issue.level === 'error').map((issue) => [issue.line, issue.code])).toEqual([
      [5, 'invalidNumber'],
      [6, 'invalidExpiry'],
      [7, 'missingValue'],
    ]);
  });

  it('ignores headings inside code blocks', () => {
    const { shelf } = parseShelf(`Intro

\`\`\`
## Stock
\`\`\`

## Products

| Product |
|---|
| Salt |
`);
    expect(shelf.products.map((p) => p.name)).toEqual(['Salt']);
    expect(shelf.layout.blocks[0]).toEqual({ type: 'raw', text: 'Intro\n\n```\n## Stock\n```' });
  });

  it('flags duplicate products and duplicate sections', () => {
    const { issues } = parseShelf(`## Products

| Product |
|---|
| Rice |
| rice |

## Products
`);
    expect(issues.map((issue) => issue.code)).toEqual(['duplicateSection', 'duplicateProduct']);
  });

  it('reads daily use, per, tiers and check-in rhythm', () => {
    const { shelf, issues } = parseShelf(`## Paramètres

| Réglage | Valeur |
|---|---|
| Paliers | 3; 90, 7 |
| Rendez-vous | mensuel |

## Produits

| Produit | Unité | Conso/jour | Par | Objectif |
|---|---|---|---|---|
| Riz | kg | 0,08 | personne | |
| Couches | pièce | 6 | foyer | |
| Lampe | pièce | | | 1 |
| Savon | pièce | 0.03 | everyone | |
`);
    expect(shelf.settings.tiers).toEqual([3, 7, 90]);
    expect(shelf.settings.rhythm).toBe('monthly');
    expect(shelf.products.map((p) => [p.name, p.daily, p.per, p.target])).toEqual([
      ['Riz', 0.08, 'person', null],
      ['Couches', 6, 'household', null],
      ['Lampe', null, 'person', 1],
      ['Savon', 0.03, 'person', null],
    ]);
    expect(issues).toEqual([{ level: 'warning', line: 15, code: 'invalidPer', params: { value: 'everyone' } }]);
    const text = serializeShelf(shelf);
    expect(text).toContain('| Paliers                    | 3, 7, 90 |');
    expect(text).toContain('| Rendez-vous                | monthly  |');
    expect(text).toContain('| Couches | pièce | 6          | household |          |');
    expect(text).toContain('| Lampe   | pièce |            | person    | 1        |');
    expect(parseShelf(text).shelf.products).toEqual(shelf.products);
  });

  it('keeps the default tiers when the setting is invalid', () => {
    const { shelf, issues } = parseShelf(`## Settings

| Setting | Value |
|---|---|
| Tiers (days) | 7, one month |
| Check-in | daily |
`);
    expect(shelf.settings.tiers).toEqual([7, 30, 365]);
    expect(shelf.settings.rhythm).toBe('weekly');
    expect(issues.map((issue) => issue.code)).toEqual(['invalidSetting', 'invalidSetting']);
  });

  it('returns a default shelf for an empty file', () => {
    const { shelf, issues } = parseShelf('');
    expect(issues).toEqual([]);
    expect(shelf.layout.blocks).toHaveLength(5);
  });
});

describe('serializeShelf', () => {
  it('round-trips the file, keeping unknown content, columns and labels', () => {
    const { shelf } = parseShelf(SAMPLE);
    const text = serializeShelf(shelf);
    expect(text).toContain('# My stock\n\nSome notes about my cellar.');
    expect(text).toContain('| Favourite colour           | green      |');
    expect(text).toContain('| Brand        |');
    expect(text).toContain('<!-- one row per lot -->');
    expect(text).toContain('Text after the table.');
    expect(text).toContain('## Recipes\n\nKeep this section as is.');
    expect(text).toContain('## Log');
    // Reading it again gives the same data.
    const again = parseShelf(text);
    expect(again.issues).toEqual([]);
    expect(again.shelf.lots.map(({ id: _id, ...lot }) => lot)).toEqual(shelf.lots.map(({ id: _id, ...lot }) => lot));
    expect(again.shelf.products).toEqual(shelf.products);
    expect(again.shelf.settings).toEqual(shelf.settings);
    // And writing it again is stable.
    expect(serializeShelf(again.shelf)).toBe(text);
  });

  it('writes a complete commented template for a new shelf', () => {
    const text = serializeShelf(emptyShelf());
    expect(text).toMatchSnapshot();
  });

  it('adds an optional column back only when a row uses it', () => {
    const { shelf } = parseShelf(`## Stock

| Product | Qty | Expires | Location |
|---|---|---|---|
| Rice | 1 | | |
`);
    expect(serializeShelf(shelf)).not.toContain('Added');
    shelf.lots[0].added = '2026-10-10';
    expect(serializeShelf(shelf)).toContain('| Product | Qty | Expires | Location | Added      |');
  });

  it('escapes pipes and newlines in cells', () => {
    const shelf = emptyShelf();
    shelf.products.push({ ...emptyProduct('A | B'), notes: 'line 1\nline 2' });
    const text = serializeShelf(shelf);
    expect(text).toContain('A \\| B');
    expect(parseShelf(text).shelf.products[0]).toMatchObject({ name: 'A | B', notes: 'line 1 line 2' });
  });
});
