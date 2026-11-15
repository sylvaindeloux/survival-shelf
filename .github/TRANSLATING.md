# Translating Survival Shelf

Survival Shelf speaks English and French. Every new language makes it useful to more people when they need
it most, so thank you for helping!

You do not need to be a developer to translate: most of the work is replacing English sentences in text
files. A few small code changes are also needed to plug the language in; they are listed below, and if you
are not at ease with them, translate the texts and say so in your pull request: a maintainer will do the rest.

## Before you start

- **Open an issue** with the [*New language* form](https://github.com/sylvaindeloux/survival-shelf/issues/new?template=new_language.yml),
  so two people do not translate the same language at the same time and we can agree on what you will cover.
- **Be fluent in the language.** Machine translation can give you a first draft, but read and fix every line
  yourself: people may follow these words in an emergency.
- **Translate from English**, the reference language. The French version can help you understand the context.
- **Language code:** the two-letter [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes)
  code, like `de`, `es`, `it` or `pt`. Regional variants (like `pt-BR`) are not supported yet.
- **Alphabet:** the data file reader only compares Latin letters (accents are fine). A language written in
  another alphabet (Cyrillic, Greek, Arabic, Chinese…) needs code changes first: say so in the issue.
  The bundled Barlow font also covers basic Latin only: other characters (like `ł`, `ș` or `ğ`) show in the
  device's own font, which works but looks slightly different.

The steps below use `de` (German) as an example. Read [CONTRIBUTING.md](CONTRIBUTING.md) to install the
project and open a pull request.

## 1. The app's texts

Copy `app/src/lib/i18n/en.ts` to `app/src/lib/i18n/de.ts` and change its first lines like in `fr.ts`:

```ts
import type { en } from './en';

export const de: Record<keyof typeof en, string> = {
```

Then translate every text on the right. Keep the keys on the left as they are.

- **Placeholders** like `{days}`, `{count}` or `{date}` are replaced by the app: keep them, you can move them
  within the sentence.
- **Plurals:** keys ending in `_one` and `_other` are the singular and plural of the same message. The app
  picks `_one` when your language's grammar says "one", `_other` otherwise. If your language has more plural
  forms (Polish, Czech, Russian…), `_other` is used for all of them for now: tell us in the issue.
- **Tone:** short, calm and practical. Talk to the reader informally where your language makes the
  difference (like the French "tu").
- **Length:** phone screens are narrow (390 px). Prefer short words for buttons and tabs, and check them in
  the app.

## 2. The data file

The app writes the user's data file in the app's language: section titles, column headers, setting names,
values (like *person* / *household*), category names and the help comments at the top. People read and edit
this file by hand, so choose clear words, and make each header and value distinct from the others.

These texts are `{ en: '…', fr: '…' }` objects: add your language to each one in

- `app/src/lib/core/document.ts` (column headers, settings, values, log actions),
- `app/src/lib/core/defaults.ts` (section titles and help comments),
- `app/src/lib/core/categories.ts` (category names).

In `document.ts`, also add the name of your language to `LANG_ALIASES` (in English, French and your
language, lowercase and without accents, like `german`, `allemand` and `deutsch`), so people can write it in
the *Language* setting of the file.

Reading accepts every language, so a file written in one language still opens in any other.

## 3. The built-in catalog and the sample data

- `app/src/lib/core/catalog.ts`: the names, units and advice of the products the app suggests. Use the names
  people find in shops in your country.
- `app/src/lib/demo.ts`: the place names of the sample stock (`LOCATIONS`).
- `docs/examples/survival-shelf.de.md`: an example file written by the app in your language. Once the
  language is plugged in (step 4), start the app with *Try with sample data*, switch to your language, export
  the file, and add it to `EXAMPLES` and to the two language lists of `app/src/lib/core/examples.test.ts`.

## 4. Plugging the language in

1. `app/src/lib/core/types.ts`: add your code to `Lang` and `LANGS`.
2. `app/src/lib/i18n/index.svelte.ts`: import your dictionary and add it to `DICTIONARIES`.
3. Run `npm run check`: TypeScript lists every remaining place that needs your language. Fix them until it
   reports no error. Errors in the screens or in `format.ts` come from the catalog and category types: add
   your language to the `{ en: string; fr: string }` types at the top of `catalog.ts` and `categories.ts`, and
   to the `lang` parameter of `productFromCatalog`.

Then the few places TypeScript cannot see:

- The language lists in `app/src/views/Welcome.svelte` and `app/src/views/Settings.svelte`: add an option
  with the name of your language written in your language, like `<option value="de">Deutsch</option>`.
- `app/src/lib/core/categories.ts`: the loop that builds `BY_ALIAS` reads the English and French labels;
  add yours.
- `app/src/lib/core/text.ts`: `formatNumber` writes numbers in the file, with a decimal comma in French. Add
  your language if it uses a decimal comma too. On screen, numbers and dates already follow your language.
- If you translate the README or the file format (step 5), point the app's links to your files: the file
  format link in `app/src/views/Settings.svelte` and the README link in `app/src/lib/ui/OnlineWarning.svelte`.
  Otherwise they show the English version.

## 5. Docs and practical guides (welcome, not required)

- `README.de.md`, a translation of `README.md`. Add it to the language line at the top of every README.
- `docs/FILE_FORMAT.de.md`, a translation of `docs/FILE_FORMAT.md`.
- The practical guides in [`guides/de/`](../guides/), following
  [`guides/CONTRIBUTING.md`](../guides/CONTRIBUTING.md). They are a big job: one pull request per theme is
  fine. Until they exist, the app shows the English guides.

README screenshots are taken by a maintainer once the language is in.

## 6. Check your work

1. `npm run check`, `npm test` and `npm run build:all` pass.
2. `npm run dev`, then switch to your language and go through every screen: welcome, setup, overview, stock,
   check-in, plan, settings, and the printable inventory. Check a phone-sized window and the dark theme too.
3. Export the data file and read it: it should make sense to someone who never saw the app.

## After your language is in

New features bring new texts. When a pull request adds some, its author may ask for your help to translate
them: please keep an eye on the repository (*Watch* → *Custom* → *Issues* and *Pull requests*) if you can.
