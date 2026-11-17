# Writing a practical guide

The guides are plain Markdown files that anyone can read without the app. The app builds its "Guides" page from this same folder, and `npm test` checks every rule marked **(tested)** below.

## Where things go

```text
guides/
  README.md               language chooser
  CONTRIBUTING.md         this file
  fr/
    README.md             French table of contents
    eau/
      rendre-l-eau-potable.md
  en/
    README.md             English table of contents
    water/
      make-water-safe-to-drink.md
```

- One folder per language, one folder per theme, one file per guide. **(tested)**
- Folder and file names are localized, lowercase, without accents, with hyphens: `rendre-l-eau-potable.md`. **(tested)**
- Every guide exists in both languages and ends with a link to its other-language version. **(tested)**
- Every guide is listed once in the `README.md` of its language, under the heading of its theme, as `- [Title](theme/file.md): one-line description`. Themes and guides come in the same order in both languages. **(tested)**

## Rules

- **One guide, one question.** Someone stressed and in a hurry must find the answer in the first lines.
- **Plain Markdown, readable as raw text**: no HTML, no front matter, no images for now, as few tables as possible. **(tested)**
- **French guides say "vous", never "tu"**, in a calm and plain tone: someone may read them in a crisis. They are written for France first. English guides are international: metric units first, imperial units in brackets.
- **The two versions are not word-for-word translations.** Adapt products, units and rules to the readers.
- **At least two official sources per guide** (civil protection, health agencies, Red Cross, WHO...), opened and read, listed under "Sources". **(tested: two links)**
- **Survivalist and outdoor blogs** are welcome for ideas and practical tips, but only after cross-checking with official sources. List them apart, under the official sources.
- **When sources differ, keep the most cautious advice and say so** in a short note at the end of "Sources".
- **Write in your own words.** Do not copy text from the sources: the guides stay under the MIT license.
- **Left out on purpose**: identifying wild plants and mushrooms, fighting and weapons, medical acts beyond lay first aid.

## Template

Sections always come in this order. Drop the ones a guide does not need, but keep the summary, the steps and the sources. **(tested)** For a disaster, replace "Étapes" / "Steps" with the three sections "Avant", "Pendant", "Après" / "Before", "During", "After". Sub-headings (`###`) are free inside a section.

### French

```markdown
# Titre de la fiche

> **En bref** : l'essentiel en deux ou trois phrases.

## Quand s'en servir

## Ce qu'il vous faut

## Étapes

## À ne jamais faire

## Sans matériel

## Selon l'endroit

## Voir aussi

## Sources

---

Fiche et sources vérifiées en novembre 2026. Elle ne remplace ni les consignes des autorités ni une formation.

English version: [Guide title](../../en/theme/guide-file.md)
```

### English

```markdown
# Guide title

> **In short**: the essentials in two or three sentences.

## When to use it

## What you need

## Steps

## Never do this

## Without equipment

## Depending on where you are

## See also

## Sources

---

Guide and sources checked in November 2026. It does not replace instructions from the authorities or proper training.

Version française : [Titre de la fiche](../../fr/theme/fichier-de-la-fiche.md)
```

## Before opening a pull request

1. Write or update the guide in both languages.
2. Add it to `guides/fr/README.md` and `guides/en/README.md`.
3. Update the "checked in" line at the bottom of the guide.
4. Run `npm test` at the root of the repository.
