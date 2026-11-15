# The `survival-shelf.md` file format

*[Version française](FILE_FORMAT.fr.md)*

Survival Shelf keeps all your data in **one Markdown file**. It is plain text: you can read it, print it,
edit it with any text editor (Notepad, TextEdit, VS Code, Obsidian…), keep it in a synced folder or in git.
It also renders as nice tables on GitHub or in any Markdown viewer.

A complete example lives in [`examples/survival-shelf.md`](../examples/survival-shelf.md) (in French:
[`examples/survival-shelf.fr.md`](../examples/survival-shelf.fr.md)).

> **You are responsible for what you type.** The app is tolerant, but a row it cannot understand is
> ignored (and reported). When the app is linked to your file, it **stops saving into it** as soon as
> it finds an error, so nothing gets lost until you fix the file or choose to overwrite it.

## Language

The file is written in the **language of the app**, English or French: section titles, table headers,
setting names, help comments and values (categories, `person`/`household`, check-in rhythm, log actions).
The language is saved in the `Language` setting (`en` or `fr`):

- when the app opens a file, it switches to the file's language;
- when you change the language in the app settings, the next save rewrites the file in that language.

Whatever the language of the app, it reads files written in English or in French, and even a mix of both.
Only what the app writes itself is translated: product names, units, locations, notes, your own sections
and columns, and any title or header you renamed by hand are kept as they are.

## Structure

The file contains up to four sections, each one starting with a level-2 title (`## `) followed by a table:

| Section     | French title  | Also accepted                          | Content                          |
|-------------|---------------|----------------------------------------|----------------------------------|
| `Settings`  | `Paramètres`  | Réglages, Configuration                | Household and app settings       |
| `Products`  | `Produits`    | Catalog, Catalogue                     | One row per kind of product      |
| `Stock`     | `Stock`       | Inventory, Inventaire, Lots            | One row per lot in your stock    |
| `Log`       | `Journal`     | History, Historique                    | What was consumed or discarded   |

Section titles are case and accent insensitive. Sections can come in any order. Missing sections are
added by the app when it saves.

## General rules

- **Tables** use the usual Markdown syntax: a header row, a separator row (`|---|---|`), then one row per
  line. The outer `|` are optional and **columns do not need to be aligned** (the app aligns them when it
  saves).
- **Columns are found by their header**, not by their position: you can reorder them, and headers are case
  and accent insensitive (`Qty`, `qty`, `Quantité` all work). Accepted names are listed below, with the
  French header the app writes in French files.
- **Your own content is kept**: text before the first section, text around a table, unknown sections
  (like `## Notes`) and unknown columns (like a `Brand` column) are written back as they were.
- **Dates** are `YYYY-MM-DD` (`2027-03-15`). For an expiry date you can write just `YYYY-MM` (`2027-03`),
  which means the last day of that month, like on most packaging. `/` and `.` are accepted as separators.
- **Numbers** use a dot or a comma as decimal separator (`2.5` or `2,5`). The app writes them with a dot
  in English files and with a comma in French files.
- **Empty cells** mean "unknown" or "none" (for instance no expiry date).
- A `|` inside a cell must be written `\|`.
- Product names are compared without case and accents: `Riz` and `riz` are the same product.
- **Version line**: when it saves, the app writes a line like `_Survival Shelf v12_` under the title, with
  the version of the app that saved the file. It is informative only: the app ignores it when reading and
  rewrites it at each save.

## Settings

A two-column table: `Setting | Value` (`Paramètre | Valeur` in French).

| Setting                      | Default         | Meaning                                                                 |
|------------------------------|-----------------|-------------------------------------------------------------------------|
| `Language`                   | app language    | Language of the file and of the app: `en` or `fr` (`English`, `Français` work too) |
| `People`                     | 1               | Number of people living on the stock                                    |
| `Cats`                       | 0               | Number of cats: products planned `cat` count once per cat               |
| `Dogs`                       | 0               | Number of dogs: products planned `dog` count once per dog               |
| `Kcal per person per day`    | 2200            | Daily energy need of one person                                         |
| `Water L per person per day` | 3               | Liters of water per person per day (drinking, cooking, hygiene)         |
| `Tiers (days)`               | `3, 7, 30, 365` | Autonomy tiers to build, in days, separated by commas or spaces         |
| `Check-in`                   | `monthly`       | How often the app lists what to discard, eat and buy: `monthly`, `quarterly` or `semiannual` |
| `Expiry warning days`        | 60              | Lots expiring within this delay are flagged as "expiring soon"          |
| `Rotation margin days`       | 30              | The rotation aims to finish each lot this long before it expires        |

French names work too (`Langue`, `Personnes`, `Chats`, `Chiens`, `Paliers (jours)`, `Rendez-vous`…), as do French values for
the check-in (`mensuel`, `trimestriel`, `semestriel` or `6 mois`). Unknown settings are kept as is. An invalid
value is reported and the default is used. A file without a `Language` setting is taken as written in the
current language of the app.

## Products

| Column         | French header  | Also accepted                  | Required | Content                                                      |
|----------------|----------------|--------------------------------|----------|--------------------------------------------------------------|
| `Product`      | `Produit`      | Name, Nom, Item                | yes      | Unique name of the product                                   |
| `Category`     | `Catégorie`    | Cat                            |          | One of the categories below, or any text                     |
| `Unit`         | `Unité`        | Units                          |          | Free text: `kg`, `L`, `can`, `pack`…                         |
| `Kcal/unit`    | `Kcal/unité`   | Kcal, Calories, Energy         |          | Energy of one unit, used for the food autonomy               |
| `Water L/unit` | `Eau L/unité`  | Water, Eau                     |          | Liters of drinkable water in one unit, used for water autonomy |
| `Daily use`    | `Conso/jour`   | Daily, Per day, Conso          |          | Units used per day: sets what each tier needs                |
| `Per`          | `Par`          | Pour, Basis                    |          | `person` (default), `household`, `cat` or `dog`: see below   |
| `Target`       | `Objectif`     | Minimum, Min, Avoir            |          | Minimum to own whatever the tier (gear, first aid…)          |
| `Notes`        | `Notes`        | Note, Remarques, Commentaire   |          | Anything you want                                            |

Categories, as written in English and French files:

| English               | French                 | Key               |
|-----------------------|------------------------|-------------------|
| `Water`               | `Eau`                  | `water`           |
| `Water treatment`     | `Traitement de l’eau`  | `water-treatment` |
| `Grains & starches`   | `Féculents`            | `grains`          |
| `Legumes`             | `Légumineuses`         | `legumes`         |
| `Canned food`         | `Conserves`            | `canned`          |
| `Ready meals`         | `Plats préparés`       | `ready-meals`     |
| `Dairy`               | `Produits laitiers`    | `dairy`           |
| `Oils & fats`         | `Matières grasses`     | `fats`            |
| `Sugar & snacks`      | `Sucré & en-cas`       | `sweets`          |
| `Drinks`              | `Boissons`             | `drinks`          |
| `Condiments & spices` | `Condiments & épices`  | `condiments`      |
| `Pets`                | `Animaux`              | `pets`            |
| `Hygiene`             | `Hygiène`              | `hygiene`         |
| `Health & first aid`  | `Santé & secours`      | `medical`         |
| `Energy & light`      | `Énergie & éclairage`  | `energy`          |
| `Tools & gear`        | `Outils & matériel`    | `tools`           |
| `Other`               | `Divers`               | `other`           |

The key is accepted too, as is any other text for a category of your own. Food and water categories, and
any product with calories or water, are part of the rotation.

### The plan: daily use, per and target

A product with a `Daily use` or a `Target` is **part of the plan**; the others are just tracked in the stock.
For each tier (see `Tiers (days)` in the settings), the app works out what a product needs:

```
needed = max(Daily use × days, Target) × people     when Per is "person"
needed = max(Daily use × days, Target)              when Per is "household"
needed = max(Daily use × days, Target) × cats       when Per is "cat"
needed = max(Daily use × days, Target) × dogs       when Per is "dog"
```

rounded up to whole units for counted things (cans, rolls…), to 10 g or 10 mL for `kg`, `L` and other
weights or volumes. For example, rice with `Daily use` 0.1 kg per person, for 2 people, needs 1.4 kg for
the 1-week tier, 6 kg for the 1-month tier and 73 kg for the 1-year tier. A headlamp with `Target` 1 per
person needs 2 for every tier.

`Per` accepts `person` (`personne` in French, also `each`), `household` (`foyer` in French, also `fixed`,
`total`), `cat` (`chat` in French) and `dog` (`chien` in French). Use `household` for what does not depend
on the number of people: a radio, a first aid kit. Use `cat` and `dog` for pet food and litter: when the
`Cats` or `Dogs` setting changes, the plan follows. With no cat in the settings, a product planned `cat`
needs nothing.

**Water** is planned from the `Water L per person per day` setting, plus what pets drink, not with its own
daily use. A cat counts for 0.25 L per day: about 50 mL per kg for a 4 kg cat
([Royal Canin Academy](https://academy.royalcanin.com/en/veterinary/the-water-requirements-and-drinking-habits-of-cats)),
nearly all of it drunk on dry food. A dog counts for 1.5 L per day: a medium dog (20 to 25 kg) on dry food drinks
about 63 to 73 mL per kg ([Zanghi & Gardner, 2018](https://doi.org/10.3389/fvets.2018.00317)).

- up to 30 days, the tier needs **stored water**: products with `Water L/unit` (bottles, cans…);
- beyond 30 days, the rest can come from **water treatment**: products of the `Water treatment` category
  (filters, purification tablets), whose `Water L/unit` is the volume they can make drinkable. They need a
  water source, so they never count for the first month.

The **menu** is the sum of `Daily use × Kcal/unit` of the food planned per person: the app warns you when it
is well below `Kcal per person per day`.

## Stock

One row per **lot**: a quantity of one product sharing the same expiry date and location.

| Column     | French header  | Also accepted                       | Required | Content                                       |
|------------|----------------|-------------------------------------|----------|-----------------------------------------------|
| `Product`  | `Produit`      | Name, Nom                           | yes      | Name of the product                           |
| `Qty`      | `Quantité`     | Quantity, Qté                       | yes      | Quantity, in the unit of the product          |
| `Expires`  | `Péremption`   | Expiry, Expiration, Best before, DLC, DDM |    | `YYYY-MM-DD`, `YYYY-MM`, or empty for none    |
| `Location` | `Emplacement`  | Lieu, Place                         |          | Where the lot is stored                       |
| `Added`    | `Ajouté`       | Purchased, Achat                    |          | Date the lot was added                        |

A product used in the stock but missing from the `Products` section is created automatically.

## Log

Written by the app each time you consume or discard something. You can leave it as is, clean it, or delete
old rows.

| Column    | French header | Also accepted        | Content                                              |
|-----------|---------------|----------------------|------------------------------------------------------|
| `Date`    | `Date`        | Jour                 | `YYYY-MM-DD`                                         |
| `Product` | `Produit`     |                      | Name of the product                                  |
| `Qty`     | `Quantité`    | Quantity, Qté        | Quantity taken                                       |
| `Action`  | `Action`      | Type                 | `consumed` or `discarded` (`consommé` or `jeté`)     |
| `Note`    | `Note`        | Notes, Commentaire   | Optional reason                                      |

## Minimal examples

This is enough for the app:

```markdown
## Stock

| Product | Qty | Expires |
|---|---|---|
| Rice | 5 | 2027-03 |
| Canned tuna | 12 | 2028-06-30 |
```

The app will add the missing sections and columns the first time it saves the file. To also plan what to
buy, give your products a daily use:

```markdown
## Settings

| Setting | Value |
|---|---|
| People | 2 |
| Tiers (days) | 7, 30, 365 |

## Products

| Product | Unit | Kcal/unit | Daily use | Per | Target |
|---|---|---|---|---|---|
| Rice | kg | 3600 | 0.1 | person | |
| Toilet paper | roll | | 0.2 | person | |
| Radio | unit | | | household | 1 |
```

## Tips

- Keep the file in a folder synchronized between your devices (Syncthing, Nextcloud, Dropbox…) to share
  it with your household.
- Put it in a git repository to keep a full history of your stock.
- Print it, or use the **Print** button of the Stock screen, to keep a paper copy for when there is no power.
