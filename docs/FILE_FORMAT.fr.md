# Le format du fichier `survival-shelf.md`

*[English version](FILE_FORMAT.md)*

Survival Shelf garde toutes vos données dans **un seul fichier Markdown**. C'est du texte brut : vous pouvez le
lire, l'imprimer, le modifier avec n'importe quel éditeur de texte (Bloc-notes, TextEdit, VS Code,
Obsidian…), le garder dans un dossier synchronisé ou dans git. Il s'affiche aussi sous forme de jolis
tableaux sur GitHub ou dans n'importe quel lecteur Markdown.

Un exemple complet se trouve dans [`examples/survival-shelf.fr.md`](examples/survival-shelf.fr.md) (en
anglais : [`examples/survival-shelf.md`](examples/survival-shelf.md)).

> **Vous êtes responsable de ce que vous saisissez.** L'application est tolérante, mais une ligne qu'elle ne
> comprend pas est ignorée (et signalée). Quand l'application est liée à votre fichier, elle **arrête d'y
> enregistrer** dès qu'elle trouve une erreur : rien n'est perdu tant que vous n'avez pas corrigé le fichier
> ou choisi de l'écraser.

## Langue

Le fichier est écrit dans la **langue de l'application**, français ou anglais : titres des sections, en-têtes
des tableaux, noms des paramètres, commentaires d'aide et valeurs (catégories, `personne`/`foyer`, rythme du
rendez-vous, actions du journal). La langue est enregistrée dans le paramètre `Langue` (`fr` ou `en`) :

- quand l'application ouvre un fichier, elle passe dans la langue du fichier ;
- quand vous changez la langue dans les réglages de l'application, le prochain enregistrement réécrit le fichier
  dans cette langue.

Quelle que soit sa langue, l'application lit les fichiers écrits en français ou en anglais, et même un mélange
des deux. Seul ce que l'application écrit elle-même est traduit : les noms de produits, unités, emplacements,
notes, vos propres sections et colonnes, et tout titre ou en-tête que vous avez renommé à la main restent tels
quels.

## Structure

Le fichier contient jusqu'à sept sections, chacune commence par un titre de niveau 2 (`## `) suivi d'un
tableau :

| Section       | Titre anglais | Aussi accepté                          | Contenu                            |
|---------------|---------------|----------------------------------------|------------------------------------|
| `Paramètres`  | `Settings`    | Réglages, Configuration                | Réglages du foyer et de l'application |
| `Infos d’urgence` | `Emergency info` | Urgence, Plan du foyer, Plan familial | Le plan du foyer : numéros, contacts, rendez-vous… |
| `Sacs`        | `Go-bags`     | Sacs d’évacuation, Sacs d’urgence, Kits d’urgence, Bags | Une ligne par sac d'évacuation |
| `Contenu des sacs` | `Go-bag contents` | Contenu du sac, Liste des sacs, Bag contents, Packing list | Une ligne par article et par sac |
| `Produits`    | `Products`    | Catalogue, Catalog                     | Une ligne par sorte de produit     |
| `Stock`       | `Stock`       | Inventaire, Inventory, Lots            | Une ligne par lot de votre stock   |
| `Journal`     | `Log`         | Historique, History                    | Ce qui a été consommé ou jeté      |

Les titres de sections ne tiennent compte ni des majuscules ni des accents. Les sections peuvent venir
dans n'importe quel ordre. Les sections manquantes sont ajoutées par l'application quand elle enregistre.

## Règles générales

- **Les tableaux** utilisent la syntaxe Markdown habituelle : une ligne d'en-tête, une ligne de séparation
  (`|---|---|`), puis une ligne par entrée. Les `|` du bord sont facultatifs et **les colonnes n'ont pas
  besoin d'être alignées** (l'application les aligne quand elle enregistre).
- **Les colonnes sont reconnues par leur en-tête**, pas par leur position : vous pouvez les réordonner, et les
  en-têtes ne tiennent compte ni des majuscules ni des accents (`Quantité`, `quantite`, `Qty` marchent
  tous). Les noms acceptés sont listés plus bas, avec l'en-tête que l'application écrit dans les fichiers en
  anglais.
- **Votre propre contenu est gardé** : le texte avant la première section, le texte autour d'un tableau, les
  sections inconnues (comme `## Notes`) et les colonnes inconnues (comme une colonne `Marque`) sont
  réécrits tels quels.
- **Les dates** s'écrivent `AAAA-MM-JJ` (`2027-03-15`). Pour une date de péremption, vous pouvez écrire juste
  `AAAA-MM` (`2027-03`), qui veut dire le dernier jour de ce mois, comme sur la plupart des emballages.
  `/` et `.` sont acceptés comme séparateurs.
- **Les nombres** prennent une virgule ou un point comme séparateur décimal (`2,5` ou `2.5`). L'application les
  écrit avec une virgule dans les fichiers en français et avec un point dans les fichiers en anglais.
- **Une cellule vide** veut dire « inconnu » ou « aucun » (par exemple pas de date de péremption).
- Un `|` dans une cellule doit s'écrire `\|`.
- Les noms de produits sont comparés sans majuscules ni accents : `Riz` et `riz` sont le même produit.
- **Ligne de version** : quand elle enregistre, l'application écrit sous le titre une ligne comme
  `_Survival Shelf v12_`, avec la version de l'application qui a enregistré le fichier. Elle est juste
  informative : l'application l'ignore à la lecture et la réécrit à chaque enregistrement.

## Paramètres

Un tableau à deux colonnes : `Paramètre | Valeur` (`Setting | Value` en anglais).

| Paramètre                     | Par défaut         | Signification                                                        |
|-------------------------------|--------------------|----------------------------------------------------------------------|
| `Langue`                      | langue de l'application | Langue du fichier et de l'application : `fr` ou `en` (`Français`, `English` marchent aussi) |
| `Personnes`                   | 1                  | Nombre de personnes qui vivent sur le stock                          |
| `Chats`                       | 0                  | Nombre de chats : les produits prévus `chat` comptent une fois par chat |
| `Chiens`                      | 0                  | Nombre de chiens : les produits prévus `chien` comptent une fois par chien |
| `Kcal par personne par jour`  | 2200               | Besoin d'énergie quotidien d'une personne                            |
| `Eau L par personne par jour` | 3                  | Litres d'eau par personne et par jour (boire, cuisiner, hygiène)     |
| `Paliers (jours)`             | `3, 7, 30, 365`    | Paliers d'autonomie à construire, en jours, séparés par des virgules ou des espaces |
| `Rendez-vous`                 | `mensuel`          | À quelle fréquence l'application liste quoi jeter, manger, remplacer et acheter : `mensuel`, `trimestriel` ou `semestriel` |
| `Alerte péremption (jours)`   | 60                 | Les lots qui périment dans ce délai sont signalés « bientôt périmés » |
| `Marge de rotation (jours)`   | 30                 | La rotation vise à finir chaque lot ce nombre de jours avant sa péremption |
| `Infos d’urgence relues le`   | vide               | Jour où le foyer a relu ses infos d'urgence, `AAAA-MM-JJ` : voir plus bas |

Les noms anglais marchent aussi (`Language`, `People`, `Cats`, `Dogs`, `Tiers (days)`, `Check-in`…), tout comme les valeurs
anglaises du rendez-vous (`monthly`, `quarterly`, `semiannual`) ou abrégées (`trimestre`, `6 mois`).
Les paramètres inconnus sont gardés tels quels. Une valeur invalide est signalée et la valeur par défaut est
utilisée. Un fichier sans paramètre `Langue` est lu comme s'il était écrit dans la langue actuelle de
l'application.

## Infos d'urgence

Le plan du foyer de l'onglet **Urgence**, comme le conseille la fiche
[Préparer un plan pour le foyer](../guides/fr/les-bases/preparer-un-plan-pour-le-foyer.md) : une ligne par
info du plan.

| Colonne     | En-tête anglais | Aussi accepté                         | Contenu                                                 |
|-------------|-----------------|---------------------------------------|---------------------------------------------------------|
| `Rubrique`  | `Topic`         | Type, Catégorie, Thème                | Une des rubriques ci-dessous, ou n'importe quel texte pour votre propre rubrique |
| `Nom`       | `Name`          | Qui, Quoi                             | Une personne, un lieu, un numéro, un robinet…           |
| `Détail`    | `Details`       | Description, Info, Notes, Où, Précisions | Où, comment, ce qu'il faut savoir                    |
| `Téléphone` | `Phone`         | Tél, Numéro, Portable, Appeler        | Un numéro de téléphone, écrit librement                 |

| Rubrique           | Anglais               | Ce qu'on y met                                                       | Chaque ligne demande |
|--------------------|-----------------------|----------------------------------------------------------------------|----------------------|
| `Numéro d’urgence` | `Emergency number`    | Le 112 et les numéros de votre pays                                  | un numéro de téléphone       |
| `Contact éloigné`  | `Out-of-area contact` | Quelqu'un d'assez loin pour ne pas être touché, que chacun appelle ou prévient par SMS | un numéro de téléphone |
| `Contact`          | `Contact`             | Médecin, école, voisin, assurance…                                   | un numéro de téléphone       |
| `Rendez-vous`      | `Meeting point`       | Un juste devant chez vous, un hors du quartier                       | un détail                    |
| `Qui fait quoi`    | `Who does what`       | Qui prend les sacs, les animaux, aide les personnes fragiles, suit les infos | un détail            |
| `Couper`           | `Shut-off`            | Gaz, eau, électricité : où et comment                                | un détail                    |
| `Santé`            | `Health`              | Traitements et allergies de chacun                                   | un détail                    |

- Les titres affichés dans l'application marchent aussi (`Numéros d’urgence`, `Lieux de rendez-vous`,
  `Meeting points`…), avec une apostrophe droite ou courbe. Une ligne sans rubrique est un `Contact`. Toute
  autre rubrique vous appartient : elle est gardée telle que vous l'avez écrite et affichée à la fin de la
  fiche, et ses lignes demandent un détail ou un numéro.
- Une ligne sans ce que demande sa rubrique est affichée **à remplir**. Une rubrique du plan est remplie
  quand elle a des lignes et qu'aucune n'est à remplir. Les numéros d'urgence sont à part et ne comptent pas
  dans les six rubriques.
- **Les numéros de téléphone** sont appelés par leurs chiffres : les espaces, points et tirets ne comptent
  pas (`06 12 34 56 78`, `+33 6.12.34.56.78`). Écrivez `SMS` devant un numéro qui ne prend que les SMS, comme
  `SMS 114` (le numéro d'urgence français par SMS) : l'application lui envoie un SMS au lieu de l'appeler.
- Un fichier sans cette section reçoit le numéro d'urgence européen, le 112, comme un nouveau fichier. Si vous
  n'en voulez pas, gardez la section et supprimez ses lignes : une section vide reste vide.
- Le paramètre `Infos d’urgence relues le` prend la date du jour quand vous touchez **J'ai relu** ou que vous
  enregistrez les infos d'urgence. Six mois plus tard, la liste À faire vous propose de les relire avec votre
  foyer. Quand il est vide, l'application ne demande jamais.

## Sacs

Les sacs d'évacuation de l'onglet **Urgence**, comme le conseille la fiche
[Préparer un sac d'évacuation](../guides/fr/les-bases/preparer-un-sac-d-evacuation.md) : un sac par personne,
de quoi tenir 3 jours. Une section liste les sacs, la suivante ce qu'on met dedans.

| Colonne      | En-tête anglais | Aussi accepté                                 | Contenu                                         |
|--------------|-----------------|-----------------------------------------------|-------------------------------------------------|
| `Sac`        | `Bag`           | Nom, Name, Kit                                | Nom unique du sac, comme `Sac d’Alex`           |
| `Rangé`      | `Stored`        | Où, Lieu, Emplacement, Place, Location        | Où le sac est rangé : entrée, placard, voiture… |
| `Vérifié le` | `Checked`       | Vérifié, Vérification, Last check, Checked on | Jour de la dernière vérification, `AAAA-MM-JJ`  |
| `Notes`      | `Notes`         | Note, Remarques, Commentaire                  | Ce que vous voulez                              |

### Contenu des sacs

| Colonne    | En-tête anglais | Aussi accepté                              | Contenu                                                   |
|------------|-----------------|--------------------------------------------|-----------------------------------------------------------|
| `Sac`      | `Bag`           | Kit                                        | Nom du sac où va l'article                                |
| `Rubrique` | `Group`         | Catégorie, Thème, Section, Topic, Category | Une des rubriques ci-dessous, ou n'importe quel texte pour votre propre rubrique |
| `Article`  | `Item`          | Nom, Quoi, Objet, Name, What               | Ce qui va dans le sac                                     |
| `Prêt`     | `Ready`         | Fait, Coché, OK, Packed, Done, Check       | `oui` ou `non`, pour un article coché à la main           |
| `Produit`  | `Product`       | Stock, Produit du stock                    | Un produit du stock que l'article suit : voir plus bas    |

| Rubrique                   | Anglais                 | Articles de la fiche                                             |
|----------------------------|-------------------------|------------------------------------------------------------------|
| `Eau et nourriture`        | `Water and food`        | Eau pour 3 jours, nourriture sans cuisson, ouvre-boîte           |
| `S’informer et s’éclairer` | `Information and light` | Radio, lampe de poche, piles de rechange, chargeur               |
| `Se soigner`               | `Health`                | Trousse de secours, médicaments et ordonnances, lunettes de secours |
| `Se protéger`              | `Protection`            | Vêtements chauds, couverture de survie, vêtement de pluie, chaussures solides |
| `Outils`                   | `Tools`                 | Couteau multifonction, briquet ou allumettes, sifflet, masques   |
| `Papiers et argent`        | `Documents and money`   | Copies des papiers, argent liquide, double des clés, contacts sur papier |

- **Un lot est dans un sac** quand son `Emplacement` dans le stock est le nom du sac. Ses dates sont suivies
  comme celles de n'importe quel lot : la liste À faire dit quand le manger, le remplacer ou le jeter.
  Renommer un sac dans l'application renomme aussi cet emplacement ; supprimer un sac garde ses lots dans le
  stock.
- **Un article qui suit un produit** est prêt quand un lot de ce produit est dans le sac et n'est pas périmé,
  et le sac montre sa date. Sa case `Prêt` reste vide. **Les autres articles se cochent à la main** : `Prêt`
  vaut `oui` (`x` et `✓` marchent aussi) ou `non`, et une case vide vaut `non`.
- **Ajouter un sac** dans l'application écrit les articles de la fiche, dans la langue de l'application : ce
  qui se périme (eau, nourriture, piles de rechange, médicaments) suit le produit correspondant du stock, et
  n'importe quel article suit le produit d'un lot déjà rangé dans le sac. Renommez, retirez ou ajoutez des
  articles librement : ceux que l'application a écrits sont traduits quand la langue change, les vôtres sont
  gardés tels que vous les avez écrits. Une ligne sans rubrique prend celle de l'article de la fiche du même
  nom.
- Les lots rangés dans un sac qu'aucun article ne suit sont affichés à part, sous **Aussi dans le sac**.
- `Vérifié le` prend la date du jour quand vous touchez **J'ai vérifié**. Un an plus tard, la liste À faire vous
  propose de vérifier le sac : dates, piles, taille des vêtements des enfants. Un sac jamais vérifié n'est pas
  demandé.
- Un fichier sans ces sections marche comme avant : l'application les ajoute, vides, quand elle enregistre.
  Une ligne de `Contenu des sacs` dont le sac manque dans `Sacs` ajoute le sac, et l'application vous le
  signale.

## Produits

| Colonne        | En-tête anglais | Aussi accepté                  | Obligatoire | Contenu                                                     |
|----------------|-----------------|--------------------------------|-------------|-------------------------------------------------------------|
| `Produit`      | `Product`       | Nom, Name, Article             | oui         | Nom unique du produit                                       |
| `Type`         | `Type`          | Famille, Nature, Genre, Kind, Family |       | `vivres`, `consommable` ou `matériel` : voir plus bas       |
| `Catégorie`    | `Category`      | Cat                            |             | Une des catégories ci-dessous, ou n'importe quel texte      |
| `Unité`        | `Unit`          | Unités                         |             | Texte libre : `kg`, `L`, `boîte`, `boîte (400 g)`, `paquet`… |
| `Kcal/unité`   | `Kcal/unit`     | Kcal, Calories, Énergie        |             | Énergie d'une unité, pour l'autonomie en nourriture         |
| `Eau L/unité`  | `Water L/unit`  | Eau, Water                     |             | Litres d'eau potable dans une unité, pour l'autonomie en eau |
| `Conso/jour`   | `Daily use`     | Conso, Consommation, Par jour  |             | Unités utilisées par jour : fixe ce qu'il faut à chaque palier |
| `Par`          | `Per`           | Pour, Base                     |             | `personne` (par défaut), `foyer`, `chat` ou `chien` : voir plus bas |
| `Objectif`     | `Target`        | Minimum, Min, Avoir            |             | Minimum à avoir quel que soit le palier (matériel, secours…) |
| `Notes`        | `Notes`         | Note, Remarques, Commentaire   |             | Ce que vous voulez                                          |

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

La clé est acceptée aussi, tout comme n'importe quel autre texte pour votre propre catégorie.

### Type : vivres, consommables et matériel

| Français      | Anglais      | Ce que c'est                                     | Comment l'application s'en occupe                     |
|---------------|--------------|--------------------------------------------------|-------------------------------------------------|
| `vivres`      | `food`       | Eau, nourriture, croquettes                      | Mangé et remplacé au fur et à mesure (rotation) |
| `consommable` | `consumable` | Piles, gaz, bougies, médicaments, hygiène…       | S'use ou vieillit : remplacé avant sa date      |
| `matériel`    | `gear`       | Outils, lampes, réchaud, radio, trousse de secours… | Durable : il suffit de l'avoir               |

Aussi acceptés : `nourriture`, `aliment`, `denrée`, `water`, `food and water` pour les vivres ;
`consommables`, `consumables` ; `équipement`, `outil`, `durable`, `equipment`, `tool` pour le matériel. Une
valeur inconnue est signalée et la valeur par défaut est utilisée.

Un `Type` vide suit le produit : tout ce qui a des calories ou de l'eau potable est `vivres`, le reste suit
sa catégorie. `Outils & matériel` donne `matériel` ; `Traitement de l'eau`, `Hygiène`, `Santé & secours`,
`Énergie & éclairage`, `Divers` et vos propres catégories donnent `consommable` ; les catégories de
nourriture, `Eau` et `Animaux` donnent `vivres`.

Ce que le type change :

- Les **vivres** suivent la rotation : le rendez-vous liste quoi manger depuis le stock puis racheter, pour
  que chaque lot soit fini `Marge de rotation (jours)` avant sa date.
- Les **consommables** ne se mangent pas : le rendez-vous les liste dans « À remplacer » quand un lot
  atteint `Marge de rotation (jours)` avant sa date d'ici le prochain rendez-vous. Utilisez-le au quotidien,
  puis marquez-le comme remplacé : l'ancien lot est noté `consommé` et le nouveau est ajouté. Un consommable
  qui a une `Conso/jour` (gaz, bougies) indique combien de jours il tient, à part des jours d'autonomie.
- Le **matériel** avec un `Objectif` est prêt ou manquant, pareil pour tous les paliers. Le matériel qui a
  une date (une trousse de secours) est aussi listé dans « À remplacer ».

Les produits de traitement de l'eau comptent en litres avec l'eau, quel que soit leur type.

### Le plan : conso par jour, par et objectif

Un produit qui a une `Conso/jour` ou un `Objectif` **fait partie du plan** ; les autres sont juste suivis
dans le stock. Pour chaque palier (voir `Paliers (jours)` dans les paramètres), l'application calcule ce qu'il
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
`famille`, `fixe`, `total`), `chat` (`cat` en anglais) et `chien` (`dog` en anglais). Utilisez `foyer` pour
ce qui ne dépend pas du nombre de personnes : une radio, une trousse de secours. Utilisez `chat` et `chien`
pour la nourriture et la litière des animaux : quand le paramètre `Chats` ou `Chiens` change, le plan suit.
Sans chat dans les paramètres, un produit prévu `chat` ne demande rien.

**L'eau** est prévue à partir du paramètre `Eau L par personne par jour`, plus ce que boivent les animaux,
pas avec sa propre conso. Un chat compte pour 0,25 L par jour : environ 50 mL par kg pour un chat de 4 kg
([Royal Canin Academy](https://academy.royalcanin.com/en/veterinary/the-water-requirements-and-drinking-habits-of-cats)),
presque tout bu quand il mange des croquettes. Un chien compte pour 1,5 L par jour : un chien moyen (20 à
25 kg) nourri aux croquettes boit environ 63 à 73 mL par kg
([Zanghi & Gardner, 2018](https://doi.org/10.3389/fvets.2018.00317)).


- jusqu'à 30 jours, le palier demande de **l'eau stockée** : les produits qui ont une `Eau L/unité`
  (bouteilles, jerricans…) ;
- au-delà de 30 jours, le reste peut venir du **traitement de l'eau** : les produits de la catégorie
  `Traitement de l’eau` (filtres, pastilles de purification), dont l'`Eau L/unité` est le volume qu'ils
  peuvent rendre potable. Il leur faut une source d'eau, donc ils ne comptent jamais pour le premier mois ;
- avec de l'eau stockée et aucun produit de traitement de l'eau, le foyer compte sur l'eau stockée
  seulement : chaque palier, même au-delà de 30 jours, demande de l'eau stockée ;
- avec deux produits d'eau stockée, le premier de la section `Produits` achète le premier palier (par
  exemple des bouteilles), le second le reste (par exemple de l'eau du robinet en jerricans).

Le **menu** est la somme des `Conso/jour × Kcal/unité` de la nourriture prévue par personne : l'application
vous prévient quand il est bien en dessous de `Kcal par personne par jour`.

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

Écrit par l'application à chaque fois que vous consommez ou jetez quelque chose. Vous pouvez le laisser tel
quel, le nettoyer ou supprimer les vieilles lignes.

| Colonne    | En-tête anglais | Aussi accepté        | Contenu                                              |
|------------|-----------------|----------------------|------------------------------------------------------|
| `Date`     | `Date`          | Jour                 | `AAAA-MM-JJ`                                         |
| `Produit`  | `Product`       |                      | Nom du produit                                       |
| `Quantité` | `Qty`           | Qté, Quantity        | Quantité prise                                       |
| `Action`   | `Action`        | Type                 | `consommé` ou `jeté` (`consumed` ou `discarded`)     |
| `Note`     | `Note`          | Notes, Commentaire   | Raison, facultative                                  |

## Exemples minimaux

Ceci suffit à l'application :

```markdown
## Stock

| Produit | Quantité | Péremption |
|---|---|---|
| Riz | 5 | 2027-03 |
| Thon en boîte | 12 | 2028-06-30 |
```

L'application ajoutera les sections et colonnes manquantes la première fois qu'elle enregistrera le fichier.
Pour prévoir aussi quoi acheter, donnez une conso par jour à vos produits :

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

- Gardez le fichier dans un dossier synchronisé entre vos appareils (Syncthing, Nextcloud, Dropbox…) pour le
  partager avec votre foyer.
- Mettez-le dans un dépôt git pour garder tout l'historique de votre stock.
- Imprimez-le, ou utilisez le bouton **Imprimer** de l'écran Stock, pour garder une copie papier pour quand
  il n'y a plus de courant.
