# Survival Shelf

> Data file of [Survival Shelf](https://github.com/sylvaindeloux/survival-shelf).
> You can edit it with any text editor: keep the `## Section` titles and the table header rows.
> Dates are written `YYYY-MM-DD`, or `YYYY-MM` for "end of that month". Decimals use a dot.
> Full syntax: https://github.com/sylvaindeloux/survival-shelf/blob/master/docs/FILE_FORMAT.md

## Settings

| Setting                    | Value         |
|----------------------------|---------------|
| Language                   | en            |
| People                     | 2             |
| Cats                       | 0             |
| Dogs                       | 0             |
| Kcal per person per day    | 2200          |
| Water L per person per day | 3             |
| Tiers (days)               | 3, 7, 30, 365 |
| Check-in                   | monthly       |
| Expiry warning days        | 60            |
| Rotation margin days       | 30            |
| Emergency info reviewed    | 2026-09-10    |

## Emergency info

<!-- The household plan, one row per line. Topic: emergency number, out-of-area contact, contact, meeting point, who does what, shut-off or health. Write SMS before a number that only takes text messages. -->

| Topic               | Name                     | Details                                           | Phone          |
|---------------------|--------------------------|---------------------------------------------------|----------------|
| Emergency number    | Emergencies              | all emergencies, everywhere in the EU             | 112            |
| Emergency number    | SAMU                     | medical emergency                                 | 15             |
| Emergency number    | Police                   | police or gendarmerie                             | 17             |
| Emergency number    | Fire brigade             | fire, accident, person in danger                  | 18             |
| Emergency number    | By text                  | deaf or hard of hearing, or when you cannot speak | SMS 114        |
| Out-of-area contact | Claire, Alex’s sister    | in Lyon                                           | 06 00 00 00 00 |
| Contact             | Dr Martin                | family doctor                                     | 01 00 00 00 00 |
| Meeting point       | Outside our home         | the gate, street side                             |                |
| Meeting point       | Outside the neighborhood |                                                   |                |
| Who does what       | Alex                     | takes the bags, shuts off the gas                 |                |
| Who does what       | Sam                      | follows the radio, warns the neighbor             |                |
| Shut-off            | Gas                      | valve under the sink                              |                |
| Shut-off            | Water                    | meter in the garage                               |                |
| Shut-off            | Electricity              | panel in the hall                                 |                |
| Health              | Alex                     | allergic to penicillin                            |                |

## Go-bags

<!-- One row per bag, one per person. Its name is also the location of its lots in the stock. Checked: day of the last check, once a year. -->

| Bag     | Stored | Checked    | Notes |
|---------|--------|------------|-------|
| 72h bag | Hall   | 2026-09-10 |       |

## Go-bag contents

<!-- One row per item and per bag. Ready: yes or no, ticked by hand. Product: a product of the stock, ready when one of its lots is stored in the bag. -->

| Bag     | Group                 | Item                               | Ready | Product            |
|---------|-----------------------|------------------------------------|-------|--------------------|
| 72h bag | Water and food        | Water for 3 days, in small bottles | no    |                    |
| 72h bag | Water and food        | Food that needs no cooking         | no    |                    |
| 72h bag | Water and food        | Can opener                         | yes   |                    |
| 72h bag | Information and light | Battery or hand-crank radio        | no    |                    |
| 72h bag | Information and light | Flashlight                         |       | Headlamp           |
| 72h bag | Information and light | Spare batteries                    | yes   |                    |
| 72h bag | Information and light | Phone charger and backup battery   | no    |                    |
| 72h bag | Health                | First aid kit                      |       | First aid kit      |
| 72h bag | Health                | Medicines and prescriptions        |       | Paracetamol 500 mg |
| 72h bag | Health                | Spare glasses                      | no    |                    |
| 72h bag | Protection            | Warm clothes                       | yes   |                    |
| 72h bag | Protection            | Emergency blanket                  |       | Survival blanket   |
| 72h bag | Protection            | Rain gear                          | yes   |                    |
| 72h bag | Protection            | Sturdy shoes                       | no    |                    |
| 72h bag | Tools                 | Multi-purpose tool                 | no    |                    |
| 72h bag | Tools                 | Lighter or matches                 | yes   |                    |
| 72h bag | Tools                 | Whistle                            | yes   |                    |
| 72h bag | Tools                 | Masks                              | no    |                    |
| 72h bag | Documents and money   | Copies of documents                | yes   |                    |
| 72h bag | Documents and money   | Cash                               | no    |                    |
| 72h bag | Documents and money   | Spare keys                         | no    |                    |
| 72h bag | Documents and money   | Contact list on paper              | yes   |                    |

## Products

<!-- One row per product. Type: food, consumable or gear. Kcal and Water are per unit. Daily use sets what each tier needs, Target is a minimum to own. Per: person, household, cat or dog. -->

| Product                 | Type       | Category            | Unit      | Kcal/unit | Water L/unit | Daily use | Per       | Target |
|-------------------------|------------|---------------------|-----------|-----------|--------------|-----------|-----------|--------|
| Water bottle 1.5 L      | food       | Water               | bottle    |           | 1.5          |           |           |        |
| Water filter (1500 L)   | gear       | Water treatment     | unit      |           | 1500         |           |           |        |
| Rice                    | food       | Grains & starches   | kg        | 3600      |              | 0.1       | person    |        |
| Pasta                   | food       | Grains & starches   | kg        | 3550      |              | 0.09      | person    |        |
| Oats                    | food       | Grains & starches   | kg        | 3800      |              | 0.055     | person    |        |
| Dried lentils           | food       | Legumes             | kg        | 3500      |              | 0.04      | person    |        |
| Canned tuna 140 g       | food       | Canned food         | can       | 150       |              | 0.25      | person    |        |
| Canned vegetables 400 g | food       | Canned food         | can       | 120       |              | 0.5       | person    |        |
| Canned fruit 400 g      | food       | Canned food         | can       | 250       |              | 0.15      | person    |        |
| Canned ready meal 800 g | food       | Ready meals         | can       | 700       |              | 0.15      | person    |        |
| Milk powder             | food       | Dairy               | kg        | 4900      |              | 0.025     | person    |        |
| Vegetable oil           | food       | Oils & fats         | L         | 8200      |              | 0.03      | person    |        |
| Peanut butter 350 g     | food       | Oils & fats         | jar       | 2100      |              | 0.04      | person    |        |
| Sugar                   | food       | Sugar & snacks      | kg        | 4000      |              | 0.03      | person    |        |
| Jam 370 g               | food       | Sugar & snacks      | jar       | 900       |              | 0.05      | person    |        |
| Chocolate 100 g         | food       | Sugar & snacks      | bar       | 550       |              | 0.1       | person    |        |
| Biscuits 200 g          | food       | Sugar & snacks      | pack      | 950       |              | 0.15      | person    |        |
| Nuts                    | food       | Sugar & snacks      | kg        | 6000      |              | 0.02      | person    |        |
| Salt                    | food       | Condiments & spices | kg        |           |              | 0.005     | person    |        |
| Toilet paper            | consumable | Hygiene             | roll      |           |              | 0.2       | person    |        |
| Soap                    | consumable | Hygiene             | bar       |           |              | 0.03      | person    |        |
| Toothpaste 75 ml        | consumable | Hygiene             | tube      |           |              | 0.015     | person    |        |
| Bin bags (roll of 20)   | consumable | Hygiene             | roll      |           |              | 0.05      | household |        |
| First aid kit           | gear       | Health & first aid  | unit      |           |              |           | household | 1      |
| Paracetamol 500 mg      | consumable | Health & first aid  | box       |           |              |           | household | 2      |
| AA batteries            | consumable | Energy & light      | unit      |           |              |           | household | 12     |
| Candles                 | consumable | Energy & light      | unit      |           |              | 0.2       | household |        |
| Gas cartridge           | consumable | Energy & light      | cartridge |           |              | 0.2       | person    |        |
| Matches                 | consumable | Energy & light      | box       |           |              |           | household | 3      |
| Headlamp                | gear       | Tools & gear        | unit      |           |              |           | person    | 1      |
| Hand-crank radio        | gear       | Tools & gear        | unit      |           |              |           | household | 1      |
| Camping stove           | gear       | Tools & gear        | unit      |           |              |           | household | 1      |
| Manual can opener       | gear       | Tools & gear        | unit      |           |              |           | household | 1      |
| Multi-tool knife        | gear       | Tools & gear        | unit      |           |              |           | household | 1      |
| Survival blanket        | gear       | Tools & gear        | unit      |           |              |           | person    | 1      |

## Stock

<!-- One row per lot: same product, same expiry date, same location. -->

| Product                 | Qty | Expires    | Location | Added      |
|-------------------------|-----|------------|----------|------------|
| Water bottle 1.5 L      | 24  | 2027-08-06 | Garage   | 2026-09-10 |
| Water bottle 1.5 L      | 12  | 2028-02-22 | Garage   | 2026-09-10 |
| Rice                    | 2   | 2026-11-19 | Kitchen  | 2026-09-10 |
| Rice                    | 5   | 2028-09-09 | Cellar   | 2026-09-10 |
| Pasta                   | 2   | 2026-11-04 | Kitchen  | 2026-09-10 |
| Pasta                   | 4   | 2027-08-26 | Cellar   | 2026-09-10 |
| Oats                    | 1   | 2027-03-09 | Kitchen  | 2026-09-10 |
| Dried lentils           | 2   | 2028-04-02 | Cellar   | 2026-09-10 |
| Canned tuna 140 g       | 4   | 2026-11-24 | Kitchen  | 2026-09-10 |
| Canned tuna 140 g       | 12  | 2029-03-28 | Cellar   | 2026-09-10 |
| Canned vegetables 400 g | 4   | 2026-09-28 | Cellar   | 2026-09-10 |
| Canned vegetables 400 g | 8   | 2027-11-14 | Cellar   | 2026-09-10 |
| Canned fruit 400 g      | 3   | 2027-04-28 | Cellar   | 2026-09-10 |
| Canned ready meal 800 g | 4   | 2028-06-01 | Cellar   | 2026-09-10 |
| Milk powder             | 0.5 | 2027-06-17 | Kitchen  | 2026-09-10 |
| Vegetable oil           | 2   | 2027-03-09 | Kitchen  | 2026-09-10 |
| Peanut butter 350 g     | 1   | 2027-02-07 | Kitchen  | 2026-09-10 |
| Sugar                   | 2   |            | Cellar   | 2026-09-10 |
| Jam 370 g               | 2   | 2027-11-14 | Cellar   | 2026-09-10 |
| Chocolate 100 g         | 4   | 2026-12-29 | Kitchen  | 2026-09-10 |
| Biscuits 200 g          | 3   | 2027-01-18 | Kitchen  | 2026-09-10 |
| Nuts                    | 0.5 | 2027-03-19 | Kitchen  | 2026-09-10 |
| Salt                    | 1   |            | Kitchen  | 2026-09-10 |
| Toilet paper            | 12  |            | Garage   | 2026-09-10 |
| Soap                    | 2   | 2029-07-06 | Garage   | 2026-09-10 |
| Toothpaste 75 ml        | 2   | 2028-02-22 | Garage   | 2026-09-10 |
| Bin bags (roll of 20)   | 1   |            | Garage   | 2026-09-10 |
| First aid kit           | 1   |            | 72h bag  | 2026-09-10 |
| Paracetamol 500 mg      | 1   | 2026-10-30 | 72h bag  | 2026-09-10 |
| AA batteries            | 16  | 2034-09-18 | Garage   | 2026-09-10 |
| Candles                 | 18  |            | Garage   | 2026-09-10 |
| Gas cartridge           | 4   |            | Garage   | 2026-09-10 |
| Matches                 | 3   |            | Garage   | 2026-09-10 |
| Headlamp                | 1   |            | 72h bag  | 2026-09-10 |
| Hand-crank radio        | 1   |            | Garage   | 2026-09-10 |
| Camping stove           | 1   |            | Garage   | 2026-09-10 |
| Manual can opener       | 1   |            | Kitchen  | 2026-09-10 |
| Survival blanket        | 2   |            | 72h bag  | 2026-09-10 |

## Log

<!-- What was consumed or discarded. Action is "consumed" or "discarded". -->

| Date       | Product           | Qty | Action   |
|------------|-------------------|-----|----------|
| 2026-10-03 | Rice              | 1   | consumed |
| 2026-10-07 | Canned tuna 140 g | 2   | consumed |
| 2026-10-07 | Candles           | 2   | consumed |
