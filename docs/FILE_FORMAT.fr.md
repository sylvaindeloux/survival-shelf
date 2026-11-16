# Le format du fichier `survival-shelf.md`

*[English version](FILE_FORMAT.md)*

Survival Shelf garde toutes tes données dans **un seul fichier Markdown**. C'est du texte brut : tu peux le
lire, l'imprimer, le modifier avec n'importe quel éditeur de texte (Bloc-notes, TextEdit, VS Code,
Obsidian…), le garder dans un dossier synchronisé ou dans git. Il s'affiche aussi sous forme de jolis
tableaux sur GitHub ou dans n'importe quel lecteur Markdown.

Un exemple complet se trouve dans [`examples/survival-shelf.fr.md`](examples/survival-shelf.fr.md) (en
anglais : [`examples/survival-shelf.md`](examples/survival-shelf.md)).

> **Tu es responsable de ce que tu tapes.** L'appli est tolérante, mais une ligne qu'elle ne comprend pas
> est ignorée (et signalée). Quand l'appli est liée à ton fichier, elle **arrête d'y enregistrer** dès
> qu'elle trouve une erreur : rien n'est perdu tant que tu n'as pas corrigé le fichier ou choisi de
> l'écraser.

## Langue

Le fichier est écrit dans la **langue de l'appli**, français ou anglais : titres des sections, en-têtes des
tableaux, noms des paramètres, commentaires d'aide et valeurs (catégories, `personne`/`foyer`, rythme du
rendez-vous, actions du journal). La langue est enregistrée dans le paramètre `Langue` (`fr` ou `en`) :

- quand l'appli ouvre un fichier, elle passe dans la langue du fichier ;
- quand tu changes la langue dans les réglages de l'appli, le prochain enregistrement réécrit le fichier
  dans cette langue.

Quelle que soit sa langue, l'appli lit les fichiers écrits en français ou en anglais, et même un mélange
des deux. Seul ce que l'appli écrit elle-même est traduit : les noms de produits, unités, emplacements,
notes, tes propres sections et colonnes, et tout titre ou en-tête que tu as renommé à la main restent tels
quels.

## Structure

Le fichier contient jusqu'à cinq sections, chacune commence par un titre de niveau 2 (`## `) suivi d'un
tableau :

| Section       | Titre anglais | Aussi accepté                          | Contenu                            |
|---------------|---------------|----------------------------------------|------------------------------------|
| `Paramètres`  | `Settings`    | Réglages, Configuration                | Réglages du foyer et de l'appli    |
| `Infos d’urgence` | `Emergency info` | Urgence, Plan du foyer, Plan familial | Le plan du foyer : numéros, contacts, rendez-vous… |
| `Produits`    | `Products`    | Catalogue, Catalog                     | Une ligne par sorte de produit     |
| `Stock`       | `Stock`       | Inventaire, Inventory, Lots            | Une ligne par lot de ton stock     |
| `Journal`     | `Log`         | Historique, History                    | Ce qui a été consommé ou jeté      |

Les titres de sections ne tiennent compte ni des majuscules ni des accents. Les sections peuvent venir
dans n'importe quel ordre. Les sections manquantes sont ajoutées par l'appli quand elle enregistre.

## Règles générales

- **Les tableaux** utilisent la syntaxe Markdown habituelle : une ligne d'en-tête, une ligne de séparation
  (`|---|---|`), puis une ligne par entrée. Les `|` du bord sont facultatifs et **les colonnes n'ont pas
  besoin d'être alignées** (l'appli les aligne quand elle enregistre).
- **Les colonnes sont reconnues par leur en-tête**, pas par leur position : tu peux les réordonner, et les
  en-têtes ne tiennent compte ni des majuscules ni des accents (`Quantité`, `quantite`, `Qty` marchent
  tous). Les noms acceptés sont listés plus bas, avec l'en-tête que l'appli écrit dans les fichiers en
  anglais.
- **Ton propre contenu est gardé** : le texte avant la première section, le texte autour d'un tableau, les
  sections inconnues (comme `## Notes`) et les colonnes inconnues (comme une colonne `Marque`) sont
  réécrits tels quels.
- **Les dates** s'écrivent `AAAA-MM-JJ` (`2027-03-15`). Pour une date de péremption, tu peux écrire juste
  `AAAA-MM` (`2027-03`), qui veut dire le dernier jour de ce mois, comme sur la plupart des emballages.
  `/` et `.` sont acceptés comme séparateurs.
- **Les nombres** prennent une virgule ou un point comme séparateur décimal (`2,5` ou `2.5`). L'appli les
  écrit avec une virgule dans les fichiers en français et avec un point dans les fichiers en anglais.
- **Une cellule vide** veut dire « inconnu » ou « aucun » (par exemple pas de date de péremption).
- Un `|` dans une cellule doit s'écrire `\|`.
- Les noms de produits sont comparés sans majuscules ni accents : `Riz` et `riz` sont le même produit.
- **Ligne de version** : quand elle enregistre, l'appli écrit sous le titre une ligne comme
  `_Survival Shelf v12_`, avec la version de l'appli qui a enregistré le fichier. Elle est juste informative :
  l'appli l'ignore à la lecture et la réécrit à chaque enregistrement.

## Paramètres

Un tableau à deux colonnes : `Paramètre | Valeur` (`Setting | Value` en anglais).

| Paramètre                     | Par défaut         | Signification                                                        |
|-------------------------------|--------------------|----------------------------------------------------------------------|
| `Langue`                      | langue de l'appli  | Langue du fichier et de l'appli : `fr` ou `en` (`Français`, `English` marchent aussi) |
| `Personnes`                   | 1                  | Nombre de personnes qui vivent sur le stock                          |
| `Chats`                       | 0                  | Nombre de chats : les produits prévus `chat` comptent une fois par chat |
| `Chiens`                      | 0                  | Nombre de chiens : les produits prévus `chien` comptent une fois par chien |
| `Kcal par personne par jour`  | 2200               | Besoin d'énergie quotidien d'une personne                            |
| `Eau L par personne par jour` | 3                  | Litres d'eau par personne et par jour (boire, cuisiner, hygiène)     |
| `Paliers (jours)`             | `3, 7, 30, 365`    | Paliers d'autonomie à construire, en jours, séparés par des virgules ou des espaces |
| `Rendez-vous`                 | `mensuel`          | À quelle fréquence l'appli liste quoi jeter, manger, remplacer et acheter : `mensuel`, `trimestriel` ou `semestriel` |
| `Alerte péremption (jours)`   | 60                 | Les lots qui périment dans ce délai sont signalés « bientôt périmés » |
| `Marge de rotation (jours)`   | 30                 | La rotation vise à finir chaque lot ce nombre de jours avant sa péremption |
| `Infos d’urgence relues le`   | vide               | Jour où le foyer a relu ses infos d'urgence, `AAAA-MM-JJ` : voir plus bas |

Les noms anglais marchent aussi (`Language`, `People`, `Cats`, `Dogs`, `Tiers (days)`, `Check-in`…), tout comme les valeurs
anglaises du rendez-vous (`monthly`, `quarterly`, `semiannual`) ou abrégées (`trimestre`, `6 mois`).
Les paramètres inconnus sont gardés tels quels. Une valeur invalide est signalée et la valeur par défaut est
utilisée. Un fichier sans paramètre `Langue` est lu comme s'il était écrit dans la langue actuelle de
l'appli.

## Infos d'urgence

Le plan du foyer de l'onglet **Urgence**, comme le conseille la fiche
[Préparer un plan pour le foyer](../guides/fr/les-bases/preparer-un-plan-pour-le-foyer.md) : une ligne par
info du plan.

| Colonne     | En-tête anglais | Aussi accepté                         | Contenu                                                 |
|-------------|-----------------|---------------------------------------|---------------------------------------------------------|
| `Rubrique`  | `Topic`         | Type, Catégorie, Thème                | Une des rubriques ci-dessous, ou n'importe quel texte pour une rubrique à toi |
| `Nom`       | `Name`          | Qui, Quoi                             | Une personne, un lieu, un numéro, un robinet…           |
| `Détail`    | `Details`       | Description, Info, Notes, Où, Précisions | Où, comment, ce qu'il faut savoir                    |
| `Téléphone` | `Phone`         | Tél, Numéro, Portable, Appeler        | Un numéro de téléphone, écrit comme tu veux             |

| Rubrique           | Anglais               | Ce qu'on y met                                                       | Chaque ligne demande |
|--------------------|-----------------------|----------------------------------------------------------------------|----------------------|
| `Numéro d’urgence` | `Emergency number`    | Le 112 et les numéros de ton pays                                    | un numéro de téléphone       |
| `Contact éloigné`  | `Out-of-area contact` | Quelqu'un d'assez loin pour ne pas être touché, que chacun appelle ou prévient par SMS | un numéro de téléphone |
| `Contact`          | `Contact`             | Médecin, école, voisin, assurance…                                   | un numéro de téléphone       |
| `Rendez-vous`      | `Meeting point`       | Un juste devant chez toi, un hors du quartier                        | un détail                    |
| `Qui fait quoi`    | `Who does what`       | Qui prend les sacs, les animaux, aide les personnes fragiles, suit les infos | un détail            |
| `Couper`           | `Shut-off`            | Gaz, eau, électricité : où et comment                                | un détail                    |
| `Santé`            | `Health`              | Traitements et allergies de chacun                                   | un détail                    |

- Les titres affichés dans l'appli marchent aussi (`Numéros d’urgence`, `Lieux de rendez-vous`,
  `Meeting points`…), avec une apostrophe droite ou courbe. Une ligne sans rubrique est un `Contact`. Toute
  autre rubrique est à toi : elle est gardée telle que tu l'as écrite et affichée à la fin de la fiche, et ses
  lignes demandent un détail ou un numéro.
- Une ligne sans ce que demande sa rubrique est affichée **à remplir**. Une rubrique du plan est remplie
  quand elle a des lignes et qu'aucune n'est à remplir. Les numéros d'urgence sont à part et ne comptent pas
  dans les six rubriques.
- **Les numéros de téléphone** sont appelés par leurs chiffres : les espaces, points et tirets ne comptent
  pas (`06 12 34 56 78`, `+33 6.12.34.56.78`). Écris `SMS` devant un numéro qui ne prend que les SMS, comme
  `SMS 114` (le numéro d'urgence français par SMS) : l'appli lui envoie un SMS au lieu de l'appeler.
- Un fichier sans cette section reçoit le numéro d'urgence européen, le 112, comme un nouveau fichier. Si tu
  n'en veux pas, garde la section et supprime ses lignes : une section vide reste vide.
- Le paramètre `Infos d’urgence relues le` prend la date du jour quand tu touches **J'ai relu** ou que tu
  enregistres les infos d'urgence. Six mois plus tard, la liste À faire te propose de les relire avec ton
  foyer. Quand il est vide, l'appli ne demande jamais.

## Produits

| Colonne        | En-tête anglais | Aussi accepté                  | Obligatoire | Contenu                                                     |
|----------------|-----------------|--------------------------------|-------------|-------------------------------------------------------------|
| `Produit`      | `Product`       | Nom, Name, Article             | oui         | Nom unique du produit                                       |
| `Type`         | `Type`          | Famille, Nature, Genre, Kind, Family |       | `vivres`, `consommable` ou `matériel` : voir plus bas       |
| `Catégorie`    | `Category`      | Cat                            |             | Une des catégories ci-dessous, ou n'importe quel texte      |
| `Unité`        | `Unit`          | Unités                         |             | Texte libre : `kg`, `L`, `boîte`, `paquet`…                 |
| `Kcal/unité`   | `Kcal/unit`     | Kcal, Calories, Énergie        |             | Énergie d'une unité, pour l'autonomie en nourriture         |
| `Eau L/unité`  | `Water L/unit`  | Eau, Water                     |             | Litres d'eau potable dans une unité, pour l'autonomie en eau |
| `Conso/jour`   | `Daily use`     | Conso, Consommation, Par jour  |             | Unités utilisées par jour : fixe ce qu'il faut à chaque palier |
| `Par`          | `Per`           | Pour, Base                     |             | `personne` (par défaut), `foyer`, `chat` ou `chien` : voir plus bas |
| `Objectif`     | `Target`        | Minimum, Min, Avoir            |             | Minimum à avoir quel que soit le palier (matériel, secours…) |
| `Notes`        | `Notes`         | Note, Remarques, Commentaire   |             | Ce que tu veux                                              |

Les catégories, telles qu'écrites dans les fichiers en français et en anglais :

| Français               | Anglais               | Clé               |
|------------------------|-----------------------|-------------------|
| `Eau`                  | `Water`               | `water`           |
| `Traitement de l’eau`  | `Water treatment`     | `water-treatment` |
| `Féculents`            | `Grains & starches`   | `grains`          |
| `Légumineuses`         | `Legumes`             | `legumes`         |
| `Conserves`            | `Canned food`         | `canned`          |
| `Plats préparés`       | `Ready meals`         | `ready-meals`     |
| `Produits laitiers`    | `Dairy`               | `dairy`           |
| `Matières grasses`     | `Oils & fats`         | `fats`            |
| `Sucré & en-cas`       | `Sugar & snacks`      | `sweets`          |
| `Boissons`             | `Drinks`              | `drinks`          |
| `Condiments & épices`  | `Condiments & spices` | `condiments`      |
| `Animaux`              | `Pets`                | `pets`            |
| `Hygiène`              | `Hygiene`             | `hygiene`         |
| `Santé & secours`      | `Health & first aid`  | `medical`         |
| `Énergie & éclairage`  | `Energy & light`      | `energy`          |
| `Outils & matériel`    | `Tools & gear`        | `tools`           |
| `Divers`               | `Other`               | `other`           |

La clé est acceptée aussi, tout comme n'importe quel autre texte pour une catégorie à toi.

### Type : vivres, consommables et matériel

| Français      | Anglais      | Ce que c'est                                     | Comment l'appli s'en occupe                     |
|---------------|--------------|--------------------------------------------------|-------------------------------------------------|
| `vivres`      | `food`       | Eau, nourriture, croquettes                      | Mangé et remplacé au fur et à mesure (rotation) |
| `consommable` | `consumable` | Piles, gaz, bougies, médicaments, hygiène…       | S'use ou vieillit : remplacé avant sa date      |
| `matériel`    | `gear`       | Outils, lampes, réchaud, radio, trousse de secours… | Durable : il suffit de l'avoir               |

Aussi acceptés : `nourriture`, `aliment`, `denrée`, `water`, `food and water` pour les vivres ;
`consommables`, `consumables` ; `équipement`, `outil`, `durable`, `equipment`, `tool` pour le matériel. Une
valeur inconnue est signalée et la valeur par défaut est utilisée.

Un `Type` vide suit le produit : tout ce qui a des calories ou de l'eau potable est `vivres`, le reste suit
sa catégorie. `Outils & matériel` donne `matériel` ; `Traitement de l'eau`, `Hygiène`, `Santé & secours`,
`Énergie & éclairage`, `Divers` et tes propres catégories donnent `consommable` ; les catégories de
nourriture, `Eau` et `Animaux` donnent `vivres`.

Ce que le type change :

- Les **vivres** suivent la rotation : le rendez-vous liste quoi manger depuis le stock puis racheter, pour
  que chaque lot soit fini `Marge de rotation (jours)` avant sa date.
- Les **consommables** ne se mangent pas : le rendez-vous les liste dans « À remplacer » quand un lot
  atteint `Marge de rotation (jours)` avant sa date d'ici le prochain rendez-vous. Utilise-le au quotidien,
  puis marque-le comme remplacé : l'ancien lot est noté `consommé` et le nouveau est ajouté. Un consommable
  qui a une `Conso/jour` (gaz, bougies) indique combien de jours il tient, à part des jours d'autonomie.
- Le **matériel** avec un `Objectif` est prêt ou manquant, pareil pour tous les paliers. Le matériel qui a
  une date (une trousse de secours) est aussi listé dans « À remplacer ».

Les produits de traitement de l'eau comptent en litres avec l'eau, quel que soit leur type.

### Le plan : conso par jour, par et objectif

Un produit qui a une `Conso/jour` ou un `Objectif` **fait partie du plan** ; les autres sont juste suivis
dans le stock. Pour chaque palier (voir `Paliers (jours)` dans les paramètres), l'appli calcule ce qu'il
faut d'un produit :

```
besoin = max(Conso/jour × jours, Objectif) × personnes     quand Par vaut « personne »
besoin = max(Conso/jour × jours, Objectif)                 quand Par vaut « foyer »
besoin = max(Conso/jour × jours, Objectif) × chats         quand Par vaut « chat »
besoin = max(Conso/jour × jours, Objectif) × chiens        quand Par vaut « chien »
```

arrondi à l'unité supérieure pour ce qui se compte (boîtes, rouleaux…), à 10 g ou 10 mL pour les `kg`, `L`
et autres poids ou volumes. Par exemple, du riz avec une `Conso/jour` de 0,1 kg par personne, pour 2
personnes, demande 1,4 kg pour le palier d'une semaine, 6 kg pour le palier d'un mois et 73 kg pour le
palier d'un an. Une lampe frontale avec un `Objectif` de 1 par personne en demande 2 à chaque palier.

`Par` accepte `personne` (`person` en anglais, aussi `chacun`), `foyer` (`household` en anglais, aussi
`famille`, `fixe`, `total`), `chat` (`cat` en anglais) et `chien` (`dog` en anglais). Utilise `foyer` pour
ce qui ne dépend pas du nombre de personnes : une radio, une trousse de secours. Utilise `chat` et `chien`
pour la nourriture et la litière des animaux : quand le paramètre `Chats` ou `Chiens` change, le plan suit.
Sans chat dans les paramètres, un produit prévu `chat` ne demande rien.

**L'eau** est prévue à partir du paramètre `Eau L par personne par jour`, plus ce que boivent les animaux,
pas avec sa propre conso. Un chat compte pour 0,25 L par jour : environ 50 mL par kg pour un chat de 4 kg
([Royal Canin Academy](https://academy.royalcanin.com/en/veterinary/the-water-requirements-and-drinking-habits-of-cats)),
presque tout bu quand il mange des croquettes. Un chien compte pour 1,5 L par jour : un chien moyen (20 à
25 kg) nourri aux croquettes boit environ 63 à 73 mL par kg
([Zanghi & Gardner, 2018](https://doi.org/10.3389/fvets.2018.00317)).


- jusqu'à 30 jours, le palier demande de **l'eau stockée** : les produits qui ont une `Eau L/unité`
  (bouteilles, bidons…) ;
- au-delà de 30 jours, le reste peut venir du **traitement de l'eau** : les produits de la catégorie
  `Traitement de l’eau` (filtres, pastilles de purification), dont l'`Eau L/unité` est le volume qu'ils
  peuvent rendre potable. Il leur faut une source d'eau, donc ils ne comptent jamais pour le premier mois.

Le **menu** est la somme des `Conso/jour × Kcal/unité` de la nourriture prévue par personne : l'appli te
prévient quand il est bien en dessous de `Kcal par personne par jour`.

## Stock

Une ligne par **lot** : une quantité d'un produit qui a la même date de péremption et le même emplacement.

| Colonne       | En-tête anglais | Aussi accepté                              | Obligatoire | Contenu                                       |
|---------------|-----------------|--------------------------------------------|-------------|-----------------------------------------------|
| `Produit`     | `Product`       | Nom, Name                                  | oui         | Nom du produit                                |
| `Quantité`    | `Qty`           | Qté, Quantity                              | oui         | Quantité, dans l'unité du produit             |
| `Péremption`  | `Expires`       | DLC, DDM, DLUO, Expiration                 |             | `AAAA-MM-JJ`, `AAAA-MM`, ou vide pour aucune  |
| `Emplacement` | `Location`      | Lieu, Place                                |             | Où le lot est rangé                           |
| `Ajouté`      | `Added`         | Achat, Acheté, Ajout                       |             | Date d'ajout du lot                           |

Un produit utilisé dans le stock mais absent de la section `Produits` est créé automatiquement.

## Journal

Écrit par l'appli à chaque fois que tu consommes ou jettes quelque chose. Tu peux le laisser tel quel, le
nettoyer ou supprimer les vieilles lignes.

| Colonne    | En-tête anglais | Aussi accepté        | Contenu                                              |
|------------|-----------------|----------------------|------------------------------------------------------|
| `Date`     | `Date`          | Jour                 | `AAAA-MM-JJ`                                         |
| `Produit`  | `Product`       |                      | Nom du produit                                       |
| `Quantité` | `Qty`           | Qté, Quantity        | Quantité prise                                       |
| `Action`   | `Action`        | Type                 | `consommé` ou `jeté` (`consumed` ou `discarded`)     |
| `Note`     | `Note`          | Notes, Commentaire   | Raison, facultative                                  |

## Exemples minimaux

Ceci suffit à l'appli :

```markdown
## Stock

| Produit | Quantité | Péremption |
|---|---|---|
| Riz | 5 | 2027-03 |
| Thon en boîte | 12 | 2028-06-30 |
```

L'appli ajoutera les sections et colonnes manquantes la première fois qu'elle enregistrera le fichier. Pour
prévoir aussi quoi acheter, donne une conso par jour à tes produits :

```markdown
## Paramètres

| Paramètre | Valeur |
|---|---|
| Langue | fr |
| Personnes | 2 |
| Paliers (jours) | 7, 30, 365 |

## Produits

| Produit | Type | Unité | Kcal/unité | Conso/jour | Par | Objectif |
|---|---|---|---|---|---|---|
| Riz | vivres | kg | 3600 | 0,1 | personne | |
| Papier toilette | consommable | rouleau | | 0,2 | personne | |
| Radio | matériel | pièce | | | foyer | 1 |
```

## Astuces

- Garde le fichier dans un dossier synchronisé entre tes appareils (Syncthing, Nextcloud, Dropbox…) pour le
  partager avec ton foyer.
- Mets-le dans un dépôt git pour garder tout l'historique de ton stock.
- Imprime-le, ou utilise le bouton **Imprimer** de l'écran Stock, pour garder une copie papier pour quand
  il n'y a plus de courant.
