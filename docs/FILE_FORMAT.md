# The `survival-shelf.md` file format

Survival Shelf keeps all your data in **one Markdown file**. It is plain text: you can read it, print it,
edit it with any text editor (Notepad, TextEdit, VS Code, Obsidian…), keep it in a synced folder or in git.
It also renders as nice tables on GitHub or in any Markdown viewer.

A complete example lives in [`examples/survival-shelf.md`](../examples/survival-shelf.md).

> **You are responsible for what you type.** The app is tolerant, but a row it cannot understand is
> ignored (and reported). When the app is linked to your file, it **stops saving into it** as soon as
> it finds an error, so nothing gets lost until you fix the file or choose to overwrite it.

## Structure

The file contains up to four sections, each one starting with a level-2 title (`## `) followed by a table:

| Section     | Accepted titles                                     | Content                          |
|-------------|-----------------------------------------------------|----------------------------------|
| `Settings`  | Settings, Paramètres, Réglages, Configuration       | Household and app settings       |
| `Products`  | Products, Produits, Catalog, Catalogue              | One row per kind of product      |
| `Stock`     | Stock, Inventory, Inventaire, Lots                  | One row per lot in your stock    |
| `Log`       | Log, Journal, History, Historique                   | What was consumed or discarded   |

Section titles are case and accent insensitive. Sections can come in any order. Missing sections are
added by the app when it saves.

## General rules

- **Tables** use the usual Markdown syntax: a header row, a separator row (`|---|---|`), then one row per
  line. The outer `|` are optional and **columns do not need to be aligned** (the app aligns them when it
  saves).
- **Columns are found by their header**, not by their position: you can reorder them, and headers are case
  and accent insensitive (`Qty`, `qty`, `Quantité` all work). Accepted names are listed below.
- **Your own content is kept**: text before the first section, text around a table, unknown sections
  (like `## Notes`) and unknown columns (like a `Brand` column) are written back as they were.
- **Dates** are `YYYY-MM-DD` (`2027-03-15`). For an expiry date you can write just `YYYY-MM` (`2027-03`),
  which means the last day of that month, like on most packaging. `/` and `.` are accepted as separators.
- **Numbers** use a dot or a comma as decimal separator (`2.5` or `2,5`). The app writes them with a dot.
- **Empty cells** mean "unknown" or "none" (for instance no expiry date).
- A `|` inside a cell must be written `\|`.
- Product names are compared without case and accents: `Riz` and `riz` are the same product.

## Settings

A two-column table: `Setting | Value`.

| Setting                      | Default | Meaning                                                              |
|------------------------------|---------|----------------------------------------------------------------------|
| `People`                     | 2       | Number of people living on the stock                                 |
| `Kcal per person per day`    | 2200    | Daily energy need of one person                                      |
| `Water L per person per day` | 3       | Liters of water per person per day (drinking, cooking, hygiene)      |
| `Target autonomy days`       | 30      | Your autonomy goal, used by the overview and the shopping list       |
| `Expiry warning days`        | 60      | Lots expiring within this delay are flagged as "expiring soon"       |
| `Rotation margin days`       | 30      | The rotation plan aims to finish each lot this long before it expires |

Unknown settings are kept as is. An invalid value is reported and the default is used.

## Products

| Column         | Also accepted                          | Required | Content                                                      |
|----------------|----------------------------------------|----------|--------------------------------------------------------------|
| `Product`      | Name, Produit, Nom, Item               | yes      | Unique name of the product                                   |
| `Category`     | Catégorie                              |          | One of the categories below, or any text                     |
| `Unit`         | Unité                                  |          | Free text: `kg`, `L`, `can`, `pack`…                         |
| `Kcal/unit`    | Kcal, Calories, Energy                 |          | Energy of one unit, used for the food autonomy               |
| `Water L/unit` | Water, Eau                             |          | Liters of drinkable water in one unit, used for water autonomy |
| `Target`       | Objectif, Goal, Min                    |          | Quantity (in units) you want to keep in stock                |
| `Notes`        | Note, Remarques, Commentaire           |          | Anything you want                                            |

Categories: `water`, `grains`, `legumes`, `canned`, `ready-meals`, `dairy`, `fats`, `sweets`, `drinks`,
`condiments`, `baby`, `pets`, `hygiene`, `medical`, `energy`, `tools`, `other`. Their English or French
labels are accepted too (`Eau`, `Conserves`…). Food and water categories, and any product with calories or
water, are part of the rotation plan.

## Stock

One row per **lot**: a quantity of one product sharing the same expiry date and location.

| Column     | Also accepted                                  | Required | Content                                       |
|------------|------------------------------------------------|----------|-----------------------------------------------|
| `Product`  | Produit, Name, Nom                             | yes      | Name of the product                           |
| `Qty`      | Quantity, Quantité, Qté                        | yes      | Quantity, in the unit of the product          |
| `Expires`  | Expiry, Expiration, Best before, DLC, DDM      |          | `YYYY-MM-DD`, `YYYY-MM`, or empty for none    |
| `Location` | Emplacement, Lieu, Place                       |          | Where the lot is stored                       |
| `Added`    | Ajouté, Purchased, Achat                       |          | Date the lot was added                        |

A product used in the stock but missing from the `Products` section is created automatically.

## Log

Written by the app each time you consume or discard something. You can leave it as is, clean it, or delete
old rows.

| Column    | Also accepted        | Content                                     |
|-----------|----------------------|---------------------------------------------|
| `Date`    | Jour                 | `YYYY-MM-DD`                                |
| `Product` | Produit              | Name of the product                         |
| `Qty`     | Quantity, Quantité   | Quantity taken                              |
| `Action`  | Type                 | `consumed` or `discarded`                   |
| `Note`    | Notes, Commentaire   | Optional reason                             |

## Minimal example

This is enough for the app:

```markdown
## Stock

| Product | Qty | Expires |
|---|---|---|
| Rice | 5 | 2027-03 |
| Canned tuna | 12 | 2028-06-30 |
```

The app will add the missing sections and columns the first time it saves the file.

## Tips

- Keep the file in a folder synchronized between your devices (Syncthing, Nextcloud, Dropbox…) to share
  it with your household.
- Put it in a git repository to keep a full history of your stock.
- Print it, or use the **Print** button of the Stock screen, to keep a paper copy for when there is no power.
