# Survival Shelf

> Fichier de données de [Survival Shelf](https://github.com/sylvaindeloux/survival-shelf).
> Tu peux le modifier avec n'importe quel éditeur de texte : garde les titres `## Section` et les lignes d'en-tête des tableaux.
> Les dates s'écrivent `AAAA-MM-JJ`, ou `AAAA-MM` pour « fin de ce mois ». Les décimales prennent une virgule.
> Syntaxe complète : https://github.com/sylvaindeloux/survival-shelf/blob/master/docs/FILE_FORMAT.fr.md

## Paramètres

| Paramètre                   | Valeur        |
|-----------------------------|---------------|
| Langue                      | fr            |
| Personnes                   | 2             |
| Chats                       | 0             |
| Chiens                      | 0             |
| Kcal par personne par jour  | 2200          |
| Eau L par personne par jour | 3             |
| Paliers (jours)             | 3, 7, 30, 365 |
| Rendez-vous                 | mensuel       |
| Alerte péremption (jours)   | 60            |
| Marge de rotation (jours)   | 30            |

## Produits

<!-- Une ligne par produit. Kcal et Eau sont par unité. Conso/jour fixe ce qu’il faut pour chaque palier, Objectif est un minimum à avoir. Par : personne, foyer, chat ou chien. -->

| Produit                       | Catégorie           | Unité     | Kcal/unité | Eau L/unité | Conso/jour | Par      | Objectif |
|-------------------------------|---------------------|-----------|------------|-------------|------------|----------|----------|
| Bouteille d’eau 1,5 L         | Eau                 | bouteille |            | 1,5         |            |          |          |
| Filtre à eau (1500 L)         | Traitement de l’eau | pièce     |            | 1500        |            |          |          |
| Riz                           | Féculents           | kg        | 3600       |             | 0,1        | personne |          |
| Pâtes                         | Féculents           | kg        | 3550       |             | 0,09       | personne |          |
| Flocons d’avoine              | Féculents           | kg        | 3800       |             | 0,055      | personne |          |
| Lentilles sèches              | Légumineuses        | kg        | 3500       |             | 0,04       | personne |          |
| Thon en boîte 140 g           | Conserves           | boîte     | 150        |             | 0,25       | personne |          |
| Légumes en conserve 400 g     | Conserves           | boîte     | 120        |             | 0,5        | personne |          |
| Fruits au sirop 400 g         | Conserves           | boîte     | 250        |             | 0,15       | personne |          |
| Plat cuisiné en boîte 800 g   | Plats préparés      | boîte     | 700        |             | 0,15       | personne |          |
| Lait en poudre                | Produits laitiers   | kg        | 4900       |             | 0,025      | personne |          |
| Huile végétale                | Matières grasses    | L         | 8200       |             | 0,03       | personne |          |
| Beurre de cacahuète 350 g     | Matières grasses    | pot       | 2100       |             | 0,04       | personne |          |
| Sucre                         | Sucré & en-cas      | kg        | 4000       |             | 0,03       | personne |          |
| Confiture 370 g               | Sucré & en-cas      | pot       | 900        |             | 0,05       | personne |          |
| Chocolat 100 g                | Sucré & en-cas      | tablette  | 550        |             | 0,1        | personne |          |
| Biscuits 200 g                | Sucré & en-cas      | paquet    | 950        |             | 0,15       | personne |          |
| Fruits secs (noix, amandes)   | Sucré & en-cas      | kg        | 6000       |             | 0,02       | personne |          |
| Sel                           | Condiments & épices | kg        |            |             | 0,005      | personne |          |
| Papier toilette               | Hygiène             | rouleau   |            |             | 0,2        | personne |          |
| Savon                         | Hygiène             | tablette  |            |             | 0,03       | personne |          |
| Dentifrice 75 ml              | Hygiène             | tube      |            |             | 0,015      | personne |          |
| Sacs poubelle (rouleau de 20) | Hygiène             | rouleau   |            |             | 0,05       | foyer    |          |
| Trousse de secours            | Santé & secours     | pièce     |            |             |            | foyer    | 1        |
| Paracétamol 500 mg            | Santé & secours     | boîte     |            |             |            | foyer    | 2        |
| Piles AA                      | Énergie & éclairage | pièce     |            |             |            | foyer    | 12       |
| Bougies                       | Énergie & éclairage | pièce     |            |             | 0,2        | foyer    |          |
| Cartouche de gaz              | Énergie & éclairage | cartouche |            |             | 0,2        | personne |          |
| Allumettes                    | Énergie & éclairage | boîte     |            |             |            | foyer    | 3        |
| Lampe frontale                | Outils & matériel   | pièce     |            |             |            | personne | 1        |
| Radio à dynamo                | Outils & matériel   | pièce     |            |             |            | foyer    | 1        |
| Réchaud à gaz                 | Outils & matériel   | pièce     |            |             |            | foyer    | 1        |
| Ouvre-boîte manuel            | Outils & matériel   | pièce     |            |             |            | foyer    | 1        |
| Couteau multifonction         | Outils & matériel   | pièce     |            |             |            | foyer    | 1        |
| Couverture de survie          | Outils & matériel   | pièce     |            |             |            | personne | 1        |

## Stock

<!-- Une ligne par lot : même produit, même date de péremption, même emplacement. -->

| Produit                       | Quantité | Péremption | Emplacement | Ajouté     |
|-------------------------------|----------|------------|-------------|------------|
| Bouteille d’eau 1,5 L         | 24       | 2027-08-06 | Garage      | 2026-09-10 |
| Bouteille d’eau 1,5 L         | 12       | 2028-02-22 | Garage      | 2026-09-10 |
| Riz                           | 2        | 2026-11-19 | Cuisine     | 2026-09-10 |
| Riz                           | 5        | 2028-09-09 | Cellier     | 2026-09-10 |
| Pâtes                         | 2        | 2026-11-04 | Cuisine     | 2026-09-10 |
| Pâtes                         | 4        | 2027-08-26 | Cellier     | 2026-09-10 |
| Flocons d’avoine              | 1        | 2027-03-09 | Cuisine     | 2026-09-10 |
| Lentilles sèches              | 2        | 2028-04-02 | Cellier     | 2026-09-10 |
| Thon en boîte 140 g           | 4        | 2026-11-24 | Cuisine     | 2026-09-10 |
| Thon en boîte 140 g           | 12       | 2029-03-28 | Cellier     | 2026-09-10 |
| Légumes en conserve 400 g     | 4        | 2026-09-28 | Cellier     | 2026-09-10 |
| Légumes en conserve 400 g     | 8        | 2027-11-14 | Cellier     | 2026-09-10 |
| Fruits au sirop 400 g         | 3        | 2027-04-28 | Cellier     | 2026-09-10 |
| Plat cuisiné en boîte 800 g   | 4        | 2028-06-01 | Cellier     | 2026-09-10 |
| Lait en poudre                | 0,5      | 2027-06-17 | Cuisine     | 2026-09-10 |
| Huile végétale                | 2        | 2027-03-09 | Cuisine     | 2026-09-10 |
| Beurre de cacahuète 350 g     | 1        | 2027-02-07 | Cuisine     | 2026-09-10 |
| Sucre                         | 2        |            | Cellier     | 2026-09-10 |
| Confiture 370 g               | 2        | 2027-11-14 | Cellier     | 2026-09-10 |
| Chocolat 100 g                | 4        | 2026-12-29 | Cuisine     | 2026-09-10 |
| Biscuits 200 g                | 3        | 2027-01-18 | Cuisine     | 2026-09-10 |
| Fruits secs (noix, amandes)   | 0,5      | 2027-03-19 | Cuisine     | 2026-09-10 |
| Sel                           | 1        |            | Cuisine     | 2026-09-10 |
| Papier toilette               | 12       |            | Garage      | 2026-09-10 |
| Savon                         | 2        | 2029-07-06 | Garage      | 2026-09-10 |
| Dentifrice 75 ml              | 2        | 2028-02-22 | Garage      | 2026-09-10 |
| Sacs poubelle (rouleau de 20) | 1        |            | Garage      | 2026-09-10 |
| Trousse de secours            | 1        |            | Sac 72h     | 2026-09-10 |
| Paracétamol 500 mg            | 1        | 2026-10-30 | Sac 72h     | 2026-09-10 |
| Piles AA                      | 16       | 2034-09-18 | Garage      | 2026-09-10 |
| Bougies                       | 18       |            | Garage      | 2026-09-10 |
| Cartouche de gaz              | 4        |            | Garage      | 2026-09-10 |
| Allumettes                    | 3        |            | Garage      | 2026-09-10 |
| Lampe frontale                | 1        |            | Sac 72h     | 2026-09-10 |
| Radio à dynamo                | 1        |            | Garage      | 2026-09-10 |
| Réchaud à gaz                 | 1        |            | Garage      | 2026-09-10 |
| Ouvre-boîte manuel            | 1        |            | Cuisine     | 2026-09-10 |
| Couverture de survie          | 2        |            | Sac 72h     | 2026-09-10 |

## Journal

<!-- Ce qui a été consommé ou jeté. Action vaut « consommé » ou « jeté ». -->

| Date       | Produit             | Quantité | Action   |
|------------|---------------------|----------|----------|
| 2026-10-03 | Riz                 | 1        | consommé |
| 2026-10-07 | Thon en boîte 140 g | 2        | consommé |
| 2026-10-07 | Bougies             | 2        | consommé |
