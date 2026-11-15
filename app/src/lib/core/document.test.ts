import { describe, expect, it } from 'vitest';
import { parseShelf, sameContent, serializeShelf } from './document';
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
    expect([shelf.settings.cats, shelf.settings.dogs]).toEqual([0, 0]);
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
| Croquettes | kg | 0,06 | foyer | |
| Lampe | pièce | | | 1 |
| Savon | pièce | 0.03 | everyone | |
`);
    expect(shelf.settings.tiers).toEqual([3, 7, 90]);
    expect(shelf.settings.rhythm).toBe('monthly');
    expect(shelf.products.map((p) => [p.name, p.daily, p.per, p.target])).toEqual([
      ['Riz', 0.08, 'person', null],
      ['Croquettes', 0.06, 'household', null],
      ['Lampe', null, 'person', 1],
      ['Savon', 0.03, 'person', null],
    ]);
    expect(issues).toEqual([{ level: 'warning', line: 15, code: 'invalidPer', params: { value: 'everyone' } }]);
    const text = serializeShelf({ ...shelf, settings: { ...shelf.settings, lang: 'fr' } });
    expect(text).toMatch(/\| Paliers +\| 3, 7, 90 \|/);
    expect(text).toMatch(/\| Rendez-vous +\| mensuel +\|/);
    expect(text).toMatch(/\| Croquettes \| kg +\| 0,06 +\| foyer +\| +\|/);
    expect(text).toMatch(/\| Lampe +\| pièce +\| +\| personne +\| 1 +\|/);
    expect(parseShelf(text).shelf.products).toEqual(shelf.products);
  });

  it('reads the type of each product, or guesses it from its calories, water and category', () => {
    const { shelf, issues } = parseShelf(`## Products

| Product | Type | Category | Kcal/unit | Water L/unit |
|---|---|---|---|---|
| Rice | food | grains | 3600 | |
| Batteries | consommable | energy | | |
| Stove | Matériel | tools | | |
| Headlamp | | tools | | |
| Biscuits | | My things | 950 | |
| Bottle | | My things | | 1.5 |
| Tablets | | Water treatment | | 50 |
| Soap | | hygiene | | |
| Knife | outils | | | |
| Rope | sturdy | tools | | |
`);
    expect(shelf.products.map((p) => [p.name, p.kind])).toEqual([
      ['Rice', 'food'],
      ['Batteries', 'consumable'],
      ['Stove', 'gear'],
      ['Headlamp', 'gear'],
      ['Biscuits', 'food'],
      ['Bottle', 'food'],
      ['Tablets', 'consumable'],
      ['Soap', 'consumable'],
      ['Knife', 'gear'],
      ['Rope', 'gear'],
    ]);
    expect(issues).toEqual([{ level: 'warning', line: 14, code: 'invalidKind', params: { value: 'sturdy' } }]);
    expect(serializeShelf(shelf)).toMatch(/\| Batteries \| consumable \| Energy & light +\|/);
    const text = serializeShelf({ ...shelf, settings: { ...shelf.settings, lang: 'fr' } });
    expect(text).toMatch(/\| Produit +\| Type +\| Catégorie +\|/);
    expect(text).toMatch(/\| Rice +\| vivres +\| Féculents +\|/);
    expect(text).toMatch(/\| Headlamp +\| matériel +\| Outils & matériel +\|/);
    expect(text).toMatch(/\| Soap +\| consommable \| Hygiène +\|/);
    expect(parseShelf(text).shelf.products).toEqual(shelf.products);
  });

  it('reads the number of cats and dogs, and products per cat or per dog', () => {
    const { shelf, issues } = parseShelf(`## Réglages

| Réglage | Valeur |
|---|---|
| Personnes | 2 |
| Chats | 2 |
| Chiens | 1 |

## Produits

| Produit | Unité | Conso/jour | Par |
|---|---|---|---|
| Croquettes chat | kg | 0,06 | chat |
| Litière | kg | 0,4 | Chats |
| Croquettes chien | kg | 0,3 | dog |
`, { lang: 'fr' });
    expect(issues).toEqual([]);
    expect([shelf.settings.people, shelf.settings.cats, shelf.settings.dogs]).toEqual([2, 2, 1]);
    expect(shelf.products.map((p) => p.per)).toEqual(['cat', 'cat', 'dog']);
    const text = serializeShelf(shelf);
    expect(text).toMatch(/\| Chats +\| 2 +\|/);
    expect(text).toMatch(/\| Chiens +\| 1 +\|/);
    expect(text).toMatch(/\| Croquettes chien +\| kg +\| 0,3 +\| chien +\|/);
    expect(text).toMatch(/\| Litière +\| kg +\| 0,4 +\| chat +\|/);
    const english = serializeShelf({ ...shelf, settings: { ...shelf.settings, lang: 'en' } });
    expect(english).toMatch(/\| Cats +\| 2 +\|/);
    expect(english).toMatch(/\| Croquettes chien +\| kg +\| 0\.3 +\| dog +\|/);
    expect(parseShelf(text).shelf.settings).toEqual(shelf.settings);
    expect(parseShelf(text).shelf.products).toEqual(shelf.products);
  });

  it('reads the quarterly and half-yearly check-in in English or French', () => {
    const rhythmOf = (value: string) => parseShelf(`## Settings\n\n| Setting | Value |\n|---|---|\n| Check-in | ${value} |\n`).shelf.settings.rhythm;
    expect(['quarterly', 'Trimestriel', 'trimestre', '3 mois'].map(rhythmOf)).toEqual(Array(4).fill('quarterly'));
    expect(['semiannual', 'Semestriel', '6 mois', 'half-year', '6 months'].map(rhythmOf)).toEqual(Array(5).fill('semiannual'));

    const { shelf } = parseShelf('## Réglages\n\n| Réglage | Valeur |\n|---|---|\n| Rendez-vous | 6 mois |\n', { lang: 'fr' });
    expect(serializeShelf(shelf)).toMatch(/\| Rendez-vous +\| semestriel +\|/);
    expect(serializeShelf({ ...shelf, settings: { ...shelf.settings, lang: 'en' } })).toMatch(/\| Check-in +\| semiannual +\|/);
  });

  it('keeps the default tiers when the setting is invalid', () => {
    const { shelf, issues } = parseShelf(`## Settings

| Setting | Value |
|---|---|
| Tiers (days) | 7, one month |
| Check-in | weekly |
`);
    expect(shelf.settings.tiers).toEqual([3, 7, 30, 365]);
    // Weekly is not a choice any more: monthly is the most frequent check-in.
    expect(shelf.settings.rhythm).toBe('monthly');
    expect(issues.map((issue) => issue.code)).toEqual(['invalidSetting', 'invalidSetting']);
  });

  it("keeps a file's own tiers, even the former defaults", () => {
    const { shelf } = parseShelf('## Settings\n\n| Setting | Value |\n|---|---|\n| Tiers (days) | 7, 30, 365 |\n');
    expect(shelf.settings.tiers).toEqual([7, 30, 365]);
    expect(serializeShelf(shelf)).toMatch(/\| Tiers \(days\) +\| 7, 30, 365 +\|/);
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
    expect(text).toContain('| Favourite colour           | green         |');
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
    expect(serializeShelf(emptyShelf('en'))).toMatchSnapshot();
    expect(serializeShelf(emptyShelf('fr'))).toMatchSnapshot();
  });

  it('writes the app version under the title and reads it back without keeping it', () => {
    const text = serializeShelf(emptyShelf(), '12');
    expect(text.startsWith('# Survival Shelf\n\n_Survival Shelf v12_\n\n> Data file of')).toBe(true);
    const again = parseShelf(text);
    expect(again.shelf.layout.blocks[0]).toEqual(emptyShelf().layout.blocks[0]);
    // Saved by a newer version: the line is replaced, never duplicated.
    const newer = serializeShelf(again.shelf, '13');
    expect(newer).toBe(text.replace('v12', 'v13'));
    expect(sameContent(text, newer)).toBe(true);
    expect(sameContent(text, newer.replace('| People', '| Persons'))).toBe(false);
  });

  it('keeps the same version line in French, and still translates the preamble', () => {
    const text = serializeShelf(emptyShelf('fr'), '12');
    expect(text.startsWith('# Survival Shelf\n\n_Survival Shelf v12_\n\n> Fichier de données de')).toBe(true);
    const shelf = parseShelf(text).shelf;
    expect(serializeShelf(shelf, '12')).toBe(text);
    shelf.settings.lang = 'en';
    expect(serializeShelf(shelf, '12').startsWith('# Survival Shelf\n\n_Survival Shelf v12_\n\n> Data file of')).toBe(true);
  });

  it('puts the app version at the top when the file has no title', () => {
    const { shelf } = parseShelf('Notes first.\n\n## Stock\n\n| Product | Qty |\n|---|---|\n| Rice | 1 |\n');
    const text = serializeShelf(shelf, '5');
    expect(text.startsWith('_Survival Shelf v5_\n\nNotes first.\n\n## Stock')).toBe(true);
    expect(serializeShelf(parseShelf(text).shelf, '5')).toBe(text);

    const bare = serializeShelf(parseShelf('## Stock\n\n| Product | Qty |\n|---|---|\n| Rice | 1 |\n').shelf, '5');
    expect(bare.startsWith('_Survival Shelf v5_\n\n## Stock')).toBe(true);
    expect(serializeShelf(parseShelf(bare).shelf, '5')).toBe(bare);
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

describe('file language', () => {
  function sampleShelf(lang: 'en' | 'fr') {
    const shelf = emptyShelf(lang);
    shelf.settings.waterPerPersonPerDay = 2.5;
    shelf.settings.rhythm = 'quarterly';
    shelf.products.push(
      { ...emptyProduct('Riz'), kind: 'food', category: 'grains', unit: 'kg', kcal: 3600, daily: 0.08 },
      { ...emptyProduct('Filtre'), kind: 'gear', category: 'water-treatment', unit: 'pièce', water: 1500, per: 'household', target: 1 },
      { ...emptyProduct('Bougies'), category: 'Mes trucs', unit: 'pièce' },
    );
    shelf.lots.push({ id: 'a', product: 'Riz', qty: 2.5, expires: '2027-03', location: 'Cave', added: '2026-11-01', extra: {} });
    shelf.log.push(
      { date: '2026-11-02', product: 'Riz', qty: 0.2, action: 'consumed', note: '', extra: {} },
      { date: '2026-11-03', product: 'Riz', qty: 1, action: 'discarded', note: '', extra: {} },
    );
    return shelf;
  }

  it('writes titles, headers, labels, values and decimals in French', () => {
    const text = serializeShelf(sampleShelf('fr'));
    expect(text).toContain('> Fichier de données de [Survival Shelf]');
    expect(text).toContain('docs/FILE_FORMAT.fr.md');
    for (const heading of ['## Paramètres', '## Produits', '## Stock', '## Journal']) expect(text).toContain(heading);
    expect(text).toMatch(/\| Paramètre +\| Valeur +\|/);
    expect(text).toMatch(/\| Langue +\| fr +\|/);
    expect(text).toMatch(/\| Eau L par personne par jour \| 2,5 +\|/);
    expect(text).toMatch(/\| Rendez-vous +\| trimestriel +\|/);
    expect(text).toMatch(/\| Produit +\| Type +\| Catégorie +\| Unité +\| Kcal\/unité \| Eau L\/unité \| Conso\/jour \| Par +\| Objectif \|/);
    expect(text).toMatch(/\| Riz +\| vivres +\| Féculents +\| kg +\| 3600 +\| +\| 0,08 +\| personne \| +\|/);
    expect(text).toMatch(/\| Filtre +\| matériel +\| Traitement de l’eau \| pièce \| +\| 1500 +\| +\| foyer +\| 1 +\|/);
    expect(text).toMatch(/\| Bougies +\| consommable \| Mes trucs +\|/);
    expect(text).toMatch(/\| Produit \| Quantité \| Péremption \| Emplacement \| Ajouté +\|/);
    expect(text).toMatch(/\| Riz +\| 2,5 +\| 2027-03 +\| Cave +\| 2026-11-01 \|/);
    expect(text).toMatch(/\| 2026-11-02 \| Riz +\| 0,2 +\| consommé \|/);
    expect(text).toMatch(/\| 2026-11-03 \| Riz +\| 1 +\| jeté +\|/);
    expect(text).not.toMatch(/Settings|Products|Category|consumed|household/);
  });

  it('reads a file in any language, whatever the language of the app', () => {
    for (const lang of ['en', 'fr'] as const) {
      const shelf = sampleShelf(lang);
      const text = serializeShelf(shelf);
      const other = lang === 'en' ? 'fr' : 'en';
      const again = parseShelf(text, { lang: other });
      expect(again.issues).toEqual([]);
      expect(again.shelf.settings).toEqual(shelf.settings);
      expect(again.shelf.products).toEqual(shelf.products);
      expect(again.shelf.lots.map(({ id: _id, ...lot }) => lot)).toEqual(shelf.lots.map(({ id: _id, ...lot }) => lot));
      expect(again.shelf.log).toEqual(shelf.log);
      expect(serializeShelf(again.shelf)).toBe(text);
    }
  });

  it('translates what the app wrote and keeps what the user wrote', () => {
    const { shelf } = parseShelf(SAMPLE);
    const english = serializeShelf(shelf);
    const french = serializeShelf({ ...shelf, settings: { ...shelf.settings, lang: 'fr' } });
    expect(french).toContain('# My stock\n\nSome notes about my cellar.');
    expect(french).toContain('## Paramètres');
    expect(french).toMatch(/\| Personnes +\| 4 +\|/);
    expect(french).toMatch(/\| Favourite colour +\| green +\|/);
    expect(french).toMatch(/\| Produit +\| Catégorie \| Unité \| Kcal\/unité \| Eau L\/unité \| Objectif \| Brand +\|/);
    expect(french).toContain('<!-- one row per lot -->');
    expect(french).toContain('Text after the table.');
    expect(french).toContain('## Recipes\n\nKeep this section as is.');
    expect(french).toContain('## Journal\n\n<!-- Ce qui a été consommé ou jeté.');
    // Back to English gives the same file.
    const back = parseShelf(french).shelf;
    expect(back.settings.lang).toBe('fr');
    expect(serializeShelf({ ...back, settings: { ...back.settings, lang: 'en' } })).toBe(english);
  });

  it('reads the language setting, or falls back to the given language', () => {
    const langOf = (row: string, lang?: 'en' | 'fr') =>
      parseShelf(`## Settings\n\n| Setting | Value |\n|---|---|\n${row}\n`, { lang }).shelf.settings.lang;
    expect(langOf('| Langue | fr |')).toBe('fr');
    expect(langOf('| Language | Français |')).toBe('fr');
    expect(langOf('| Language | English |', 'fr')).toBe('en');
    expect(langOf('| People | 2 |', 'fr')).toBe('fr');
    expect(langOf('| People | 2 |')).toBe('en');
    const { shelf, issues } = parseShelf('## Settings\n\n| Setting | Value |\n|---|---|\n| Language | Klingon |\n', { lang: 'fr' });
    expect(shelf.settings.lang).toBe('fr');
    expect(issues.map((issue) => issue.code)).toEqual(['invalidSetting']);
  });
});
