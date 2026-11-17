# Translating Survival Shelf

Survival Shelf speaks English and French. Every new language makes it useful to more people when they need
it most, so thank you for helping!

You do not need to be a developer to translate: the work is replacing English sentences in text files, plus
a few lines to declare the language. If you are not at ease with that part, translate the texts and say so in
your pull request: a maintainer will do the rest.

## How translations work

- **English is the reference**, and English and French are always complete.
- **Other languages can be partial.** A text that is not translated yet shows in English, in the app and in
  the data file. So you can start with the main screens and finish later: a partial translation is welcome,
  and so is completing someone else's.
- **`npm test` helps you:** it lists the messages of your language still shown in English, and checks that
  your translations keep the placeholders of the English messages.

## Before you start

- **Open an issue** with the [*New language* form](https://github.com/sylvaindeloux/survival-shelf/issues/new?template=new_language.yml),
  so two people do not translate the same language at the same time and we can agree on what you will cover.
- **Be fluent in the language.** Machine translation can give you a first draft, but read and fix every line
  yourself: people may follow these words in an emergency.
- **Translate from English.** The French version can help you understand the context.
- **Language code:** the two-letter [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes)
  code, like `de`, `es`, `it` or `pt`. Regional variants (like `pt-BR`) are not supported yet.
- **Alphabet:** the data file reader only compares Latin letters (accents are fine). A language written in
  another alphabet (Cyrillic, Greek, Arabic, Chinese…) needs code changes first: say so in the issue.
  The bundled Barlow font also covers basic Latin only: other characters (like `ł`, `ș` or `ğ`) show in the
  device's own font, which works but looks slightly different.

The steps below use `de` (German) as an example. Read [CONTRIBUTING.md](CONTRIBUTING.md) to install the
project and open a pull request.

## 1. Declare the language

Add it to `LANGUAGES` in `app/src/lib/core/languages.ts`:

```ts
de: {
  name: 'Deutsch',                 // the name in your language, shown in the language lists
  aliases: ['german', 'allemand'], // other names people may write in the Language setting of the data file
  decimalComma: true,              // numbers are written 2,5 in the data file
},
```

## 2. The app's texts

Create `app/src/lib/i18n/de.ts`:

```ts
import type { Dictionary } from './en';

export const de: Dictionary = {
  'action.add': 'Hinzufügen',
  'action.cancel': 'Abbrechen',
};
```

and add it to `DICTIONARIES` in `app/src/lib/i18n/dictionaries.ts`. Then copy the lines you translate from
`app/src/lib/i18n/en.ts`: keep the keys on the left as they are, translate the texts on the right.

- **Placeholders** like `{days}`, `{count}` or `{date}` are replaced by the app: keep them, you can move them
  within the sentence.
- **Plurals:** keys ending in `_one` and `_other` are the singular and plural of the same message: translate
  both. The app picks `_one` when your language's grammar says "one", `_other` otherwise. If your language
  has more plural forms (Polish, Czech, Russian…), `_other` is used for all of them for now: tell us in the
  issue.
- **Tone:** short, calm and practical, never casual: people may read it in a crisis and must trust it. Where
  your language makes the difference, address the reader formally (like the French "vous", never "tu").
- **Length:** phone screens are narrow (390 px). Prefer short words for buttons and tabs, and check them in
  the app.

## 3. The data file

The app writes the user's data file in the app's language: section titles, column headers, setting names,
values (like *person* / *household*), category names and the help text at the top. People read and edit
this file by hand, so choose clear words, and make each header and value distinct from the others. Until you
translate them, these texts are written in English: the file still works, but it is half English, so
translate them all at once if you can.

They are `{ en: '…', fr: '…' }` objects: add `de: '…'` to each one in

- `app/src/lib/core/document.ts` (column headers, settings, values, log actions),
- `app/src/lib/core/defaults.ts` (section titles and help text; the help text tells which decimal separator
  to use, so match `decimalComma`),
- `app/src/lib/core/categories.ts` (category names).

Reading accepts every language, so a file written in one language still opens in any other.

## 4. The built-in catalog and the sample data

- `app/src/lib/core/catalog.ts`: the names, units and advice of the products the app suggests, also
  `{ en: '…', fr: '…' }` objects. Use the names people find in shops in your country.
- `app/src/lib/demo.ts`: the place names of the sample stock (`LOCATIONS`).
- Optionally, `docs/examples/survival-shelf.de.md`: an example file written by the app in your language.
  Start the app with *Try with sample data*, switch to your language, export the file, and add it to
  `EXAMPLES` in `app/src/lib/core/examples.test.ts`.

## 5. Docs and practical guides (welcome, not required)

- `README.de.md`, a translation of `README.md`. Add it to the language line at the top of every README, and
  to your language in `languages.ts` with the anchor of its "Get started" section, like
  `readme: 'README.de.md#los-gehts'`. The app links to it.
- `docs/FILE_FORMAT.de.md`, a translation of `docs/FILE_FORMAT.md`, declared as
  `fileFormat: 'docs/FILE_FORMAT.de.md'`. The app links to it from its settings.
- The [practical guides](../guides/). Until they exist in your language, the app shows the English ones.
  The guides are checked by `npm test` against a template written for English and French, and every guide
  is paired with its version in the other language, so a third language needs a few changes in
  `app/src/lib/guides/` first (its section headings, its summary and "checked in" lines, and which version
  each guide links to). Say in the issue that you want to translate them, and we will set it up together.
  Then follow [`guides/CONTRIBUTING.md`](../guides/CONTRIBUTING.md): adapt each guide to your readers rather
  than translating it word for word, and check its sources (official ones from your country are welcome).
  It is a big job: one pull request per theme is fine.

README screenshots are taken by a maintainer once the language is in.

## 6. Check your work

1. `npm run check`, `npm test` and `npm run build:all` pass.
2. `npm run dev`, then switch to your language and go through every screen: welcome, setup, overview, stock,
   check-in, plan, settings, and the printable inventory. Check a phone-sized window and the dark theme too.
3. Export the data file and read it: it should make sense to someone who never saw the app.

## After your language is in

New features bring new texts, written in English and French by their authors: they show in English in your
language until someone translates them, and `npm test` lists them. Keep an eye on the repository if you can
(*Watch* → *Custom* → *Issues* and *Pull requests*) to keep your language up to date.
