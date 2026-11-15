# The `survival-shelf.md` file format

*[Version française](FILE_FORMAT.fr.md)*

Survival Shelf keeps all your data in **one Markdown file**. It is plain text: you can read it, print it,
edit it with any text editor (Notepad, TextEdit, VS Code, Obsidian…), keep it in a synced folder or in git.
It also renders as nice tables on GitHub or in any Markdown viewer.

A complete example lives in [`examples/survival-shelf.md`](examples/survival-shelf.md) (in French:
[`examples/survival-shelf.fr.md`](examples/survival-shelf.fr.md)).

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

The file contains up to seven sections, each one starting with a level-2 title (`## `) followed by a table:

| Section     | French title  | Also accepted                          | Content                          |
|-------------|---------------|----------------------------------------|----------------------------------|
| `Settings`  | `Paramètres`  | Réglages, Configuration                | Household and app settings       |
| `Emergency info` | `Infos d’urgence` | Emergency plan, Household plan, Urgence | The household plan: numbers, contacts, meeting points… |
| `Go-bags`   | `Sacs`        | Bags, Evacuation bags, Emergency kits, Sacs d’évacuation | One row per go-bag |
| `Go-bag contents` | `Contenu des sacs` | Bag contents, Bag items, Packing list, Contenu du sac | One row per item and per bag |
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
| `Check-in`                   | `monthly`       | How often the app lists what to discard, eat, replace and buy: `monthly`, `quarterly` or `semiannual` |
| `Expiry warning days`        | 60              | Lots expiring within this delay are flagged as "expiring soon"          |
| `Rotation margin days`       | 30              | The rotation aims to finish each lot this long before it expires        |
| `Emergency info reviewed`    | empty           | Day the household last went through its emergency info, `YYYY-MM-DD`: see below |

French names work too (`Langue`, `Personnes`, `Chats`, `Chiens`, `Paliers (jours)`, `Rendez-vous`…), as do French values for
the check-in (`mensuel`, `trimestriel`, `semestriel` or `6 mois`). Unknown settings are kept as is. An invalid
value is reported and the default is used. A file without a `Language` setting is taken as written in the
current language of the app.

## Emergency info

The household plan of the **Emergency** tab, as advised by the guide
[Make a household plan](../guides/en/basics/make-a-household-plan.md): one row per line of the plan.

| Column    | French header | Also accepted                        | Content                                                  |
|-----------|---------------|--------------------------------------|----------------------------------------------------------|
| `Topic`   | `Rubrique`    | Type, Category, Kind, Theme          | One of the topics below, or any text for a topic of your own |
| `Name`    | `Nom`         | Who, What, Item                      | A person, a place, a number, a valve…                    |
| `Details` | `Détail`      | Description, Info, Notes, Where      | Where, how, what to know                                 |
| `Phone`   | `Téléphone`   | Tel, Number, Mobile, Call            | A phone number, written as you like                      |

| Topic                 | French             | What goes in it                                                      | Each row needs |
|-----------------------|--------------------|----------------------------------------------------------------------|----------------|
| `Emergency number`    | `Numéro d’urgence` | 112 and the numbers of your country                                  | a phone number              |
| `Out-of-area contact` | `Contact éloigné`  | Someone far enough away not to be affected, whom everyone calls or texts | a phone number          |
| `Contact`             | `Contact`          | Doctor, school, neighbor, insurance…                                 | a phone number              |
| `Meeting point`       | `Rendez-vous`      | One right outside your home, one outside your neighborhood           | details                     |
| `Who does what`       | `Qui fait quoi`    | Who takes the bags, the pets, helps the vulnerable, follows the news | details                     |
| `Shut-off`            | `Couper`           | Gas, water, electricity: where and how                               | details                     |
| `Health`              | `Santé`            | Treatments and allergies of each person                              | details                     |

- The titles shown in the app work too (`Emergency numbers`, `Meeting points`, `Lieux de rendez-vous`…). A row
  without a topic is a `Contact`. Any other topic is yours: it is kept as you wrote it and shown at the end of
  the sheet, and its rows need details or a phone number.
- A row without what its topic needs is shown as **to fill in**. A topic of the plan is filled in when it has
  rows and none is left to fill in. The emergency numbers are shown apart and do not count in the six topics.
- **Phone numbers** are called by their digits: spaces, dots and dashes do not matter (`06 12 34 56 78`,
  `+33 6.12.34.56.78`). Write `SMS` before a number that only takes text messages, like `SMS 114` (the French
  emergency number by text): the app texts it instead of calling it.
- A file without this section gets the European emergency number, 112, like a new file. If you do not want it,
  keep the section and delete its rows: an empty section stays empty.
- The `Emergency info reviewed` setting is set to the day you tap **I reviewed it** or save the emergency info.
  Six months later, the to-do list asks you to go through it again with your household. When it is empty, the
  app never asks.

## Go-bags

The go-bags of the **Emergency** tab, as advised by the guide [Pack a go-bag](../guides/en/basics/pack-a-go-bag.md):
one bag per person, with enough for 3 days. One section lists the bags, the next one what goes in them.

| Column    | French header | Also accepted                                  | Content                                              |
|-----------|---------------|------------------------------------------------|------------------------------------------------------|
| `Bag`     | `Sac`         | Name, Nom, Kit                                 | Unique name of the bag, like `Alex’s bag`            |
| `Stored`  | `Rangé`       | Where, Place, Location, Emplacement, Lieu      | Where the bag is kept: hall, closet, car…            |
| `Checked` | `Vérifié le`  | Checked on, Last check, Vérifié, Vérification  | Day of the last check, `YYYY-MM-DD`                  |
| `Notes`   | `Notes`       | Note, Remarques, Commentaire                   | Anything you want                                    |

### Go-bag contents

| Column    | French header | Also accepted                              | Content                                                   |
|-----------|---------------|--------------------------------------------|-----------------------------------------------------------|
| `Bag`     | `Sac`         | Kit                                        | Name of the bag the item goes in                          |
| `Group`   | `Rubrique`    | Topic, Category, Catégorie, Theme, Section | One of the groups below, or any text for a group of your own |
| `Item`    | `Article`     | Name, Nom, What, Quoi, Objet               | What goes in the bag                                      |
| `Ready`   | `Prêt`        | Packed, Done, OK, Fait, Check, Coché       | `yes` or `no`, for an item ticked by hand                 |
| `Product` | `Produit`     | Stock, Produit du stock                    | A product of the stock the item follows: see below        |

| Group                   | French                     | Items of the guide                                              |
|-------------------------|----------------------------|-----------------------------------------------------------------|
| `Water and food`        | `Eau et nourriture`        | Water for 3 days, food that needs no cooking, can opener        |
| `Information and light` | `S’informer et s’éclairer` | Radio, flashlight, spare batteries, phone charger               |
| `Health`                | `Se soigner`               | First aid kit, medicines and prescriptions, spare glasses       |
| `Protection`            | `Se protéger`              | Warm clothes, emergency blanket, rain gear, sturdy shoes        |
| `Tools`                 | `Outils`                   | Multi-purpose tool, lighter or matches, whistle, masks          |
| `Documents and money`   | `Papiers et argent`        | Copies of documents, cash, spare keys, contact list on paper    |

- **A lot is in a bag** when its `Location` in the stock is the name of the bag. Its dates are followed like
  any other lot: the to-do list tells when to eat, replace or discard it. Renaming a bag in the app renames that
  location too; deleting a bag keeps its lots in the stock.
- **An item that follows a product** is ready when a lot of that product is in the bag and not expired, and the
  bag shows its date. Its `Ready` cell stays empty. **Any other item is ticked by hand**: `Ready` is `yes`
  (`x` and `✓` work too) or `no`, and an empty cell is `no`.
- **Add a bag** in the app writes the items of the guide, in the language of the app: the things that expire
  (water, food, spare batteries, medicines) follow a matching product of the stock, and any item follows the
  product of a lot already stored in the bag. Rename, remove or add items as you like: the items the app wrote
  are translated when the language changes, yours are kept as you wrote them. A row without a group takes the
  group of the guide's item of the same name.
- The lots stored in a bag that no item follows are shown apart, under **Also in the bag**.
- `Checked` is set to the day you tap **I checked it**. A year later, the to-do list asks you to check the bag:
  dates, batteries, children’s clothing sizes. A bag never checked is not asked for.
- A file without these sections works as before: the app adds them, empty, when it saves. A row of
  `Go-bag contents` whose bag is missing from `Go-bags` adds the bag, and the app tells you.

## Products

| Column         | French header  | Also accepted                  | Required | Content                                                      |
|----------------|----------------|--------------------------------|----------|--------------------------------------------------------------|
| `Product`      | `Produit`      | Name, Nom, Item                | yes      | Unique name of the product                                   |
| `Type`         | `Type`         | Kind, Family, Famille, Nature, Genre |    | `food`, `consumable` or `gear`: see below                    |
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

The key is accepted too, as is any other text for a category of your own.

### Type: food, consumables and gear

| English      | French        | What it is                                       | How the app looks after it                  |
|--------------|---------------|--------------------------------------------------|---------------------------------------------|
| `food`       | `vivres`      | Water, food, pet food                            | Eaten and replaced as you go (rotation)     |
| `consumable` | `consommable` | Batteries, gas, candles, medicine, hygiene…      | Used up or aging: replaced before its date  |
| `gear`       | `matériel`    | Tools, lamps, stove, radio, first aid kit…       | Durable: you only need to own it            |

Also accepted: `water`, `food and water`, `nourriture`, `aliment`, `denrée` for food; `consumables`,
`consommables`; `equipment`, `tool`, `durable`, `équipement`, `outil` for gear. An unknown value is reported
and the default is used.

An empty `Type` follows the product: anything with calories or drinking water is `food`, the rest follows
its category. `Tools & gear` is `gear`; `Water treatment`, `Hygiene`, `Health & first aid`, `Energy & light`,
`Other` and categories of your own are `consumable`; the food categories, `Water` and `Pets` are `food`.

What the type changes:

- **Food** follows the rotation: the check-in lists what to eat from the stock and buy again, so that each lot
  is finished `Rotation margin days` before its date.
- **Consumables** are not eaten: the check-in lists them under "To replace" when a lot reaches
  `Rotation margin days` before its date by the next check-in. Use it up in daily life, then mark it as
  replaced: the old lot is logged as `consumed` and the new one is added. A consumable with a `Daily use`
  (gas, candles) shows how many days it lasts, apart from the autonomy days.
- **Gear** with a `Target` is ready or missing, the same for every tier. Gear with an expiry date (a first aid
  kit) is listed under "To replace" too.

Water treatment products count in liters with the water, whatever their type.

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

| Product | Type | Unit | Kcal/unit | Daily use | Per | Target |
|---|---|---|---|---|---|---|
| Rice | food | kg | 3600 | 0.1 | person | |
| Toilet paper | consumable | roll | | 0.2 | person | |
| Radio | gear | unit | | | household | 1 |
```

## Tips

- Keep the file in a folder synchronized between your devices (Syncthing, Nextcloud, Dropbox…) to share
  it with your household.
- Put it in a git repository to keep a full history of your stock.
- Print it, or use the **Print** button of the Stock screen, to keep a paper copy for when there is no power.
