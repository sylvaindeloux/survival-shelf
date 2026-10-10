# Survival Shelf

> Data file of [Survival Shelf](https://github.com/sylvaindeloux/survival-shelf).
> You can edit it with any text editor: keep the `## Section` titles and the table header rows.
> Dates are written `YYYY-MM-DD`, or `YYYY-MM` for "end of that month". Decimals use a dot.
> Full syntax: https://github.com/sylvaindeloux/survival-shelf/blob/master/docs/FILE_FORMAT.md

## Settings

| Setting                    | Value |
|----------------------------|-------|
| People                     | 2     |
| Kcal per person per day    | 2200  |
| Water L per person per day | 3     |
| Target autonomy days       | 30    |
| Expiry warning days        | 60    |
| Rotation margin days       | 30    |

## Products

<!-- One row per product. Kcal and Water are per unit. Target is the quantity you want to keep in stock. -->

| Product                 | Category    | Unit   | Kcal/unit | Water L/unit | Target |
|-------------------------|-------------|--------|-----------|--------------|--------|
| Water pack 6 × 1.5 L    | water       | pack   |           | 9            | 10     |
| Water bottle 1.5 L      | water       | bottle |           | 1.5          | 4      |
| Rice                    | grains      | kg     | 3600      |              | 10     |
| Pasta                   | grains      | kg     | 3550      |              | 8      |
| Dried lentils           | legumes     | kg     | 3500      |              | 4      |
| Canned tuna 140 g       | canned      | can    | 150       |              | 24     |
| Canned vegetables 400 g | canned      | can    | 120       |              | 20     |
| Freeze-dried meal       | ready-meals | pouch  | 500       |              | 12     |
| Vegetable oil           | fats        | L      | 8200      |              | 3      |
| Sugar                   | sweets      | kg     | 4000      |              | 2      |
| Chocolate 100 g         | sweets      | bar    | 550       |              | 10     |
| AA batteries            | energy      | unit   |           |              | 24     |
| First aid kit           | medical     | unit   |           |              | 2      |
| Paracetamol             | medical     | pack   |           |              | 2      |
| Candles                 | energy      | unit   |           |              | 20     |

## Stock

<!-- One row per lot: same product, same expiry date, same location. -->

| Product                 | Qty | Expires    | Location | Added      |
|-------------------------|-----|------------|----------|------------|
| Water pack 6 × 1.5 L    | 4   | 2027-04-28 | Garage   | 2026-09-10 |
| Water pack 6 × 1.5 L    | 3   | 2028-02-02 | Garage   | 2026-09-10 |
| Water bottle 1.5 L      | 4   | 2027-08-06 | 72h bag  | 2026-09-10 |
| Rice                    | 2.5 | 2026-11-19 | Kitchen  | 2026-09-10 |
| Rice                    | 5   | 2028-09-09 | Cellar   | 2026-09-10 |
| Pasta                   | 2   | 2026-11-04 | Kitchen  | 2026-09-10 |
| Pasta                   | 4   | 2027-08-26 | Cellar   | 2026-09-10 |
| Dried lentils           | 2   | 2028-04-02 | Cellar   | 2026-09-10 |
| Canned tuna 140 g       | 4   | 2026-11-24 | Kitchen  | 2026-09-10 |
| Canned tuna 140 g       | 12  | 2029-03-28 | Cellar   | 2026-09-10 |
| Canned vegetables 400 g | 4   | 2026-09-28 | Cellar   | 2026-09-10 |
| Canned vegetables 400 g | 8   | 2027-11-14 | Cellar   | 2026-09-10 |
| Freeze-dried meal       | 6   | 2033-05-06 | Cellar   | 2026-09-10 |
| Freeze-dried meal       | 3   | 2033-05-06 | 72h bag  | 2026-09-10 |
| Vegetable oil           | 2   | 2027-03    | Kitchen  | 2026-09-10 |
| Sugar                   | 2   |            | Cellar   | 2026-09-10 |
| Chocolate 100 g         | 4   | 2026-12-29 | Kitchen  | 2026-09-10 |
| AA batteries            | 16  | 2034-09-18 | Garage   | 2026-09-10 |
| First aid kit           | 1   |            | 72h bag  | 2026-09-10 |
| Paracetamol             | 1   | 2026-10-30 | 72h bag  | 2026-09-10 |
| Candles                 | 20  |            | Garage   | 2026-09-10 |

## Log

<!-- What was consumed or discarded. Action is "consumed" or "discarded". -->

| Date       | Product           | Qty | Action   |
|------------|-------------------|-----|----------|
| 2026-10-07 | Rice              | 0.5 | consumed |
| 2026-10-09 | Canned tuna 140 g | 2   | consumed |
