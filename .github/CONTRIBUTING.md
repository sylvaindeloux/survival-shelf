# Contributing to Survival Shelf

Thanks for your interest! Survival Shelf is a small, offline-first app: no server, no database, no account,
and all the data in one Markdown file the user can read and edit by hand. Contributions should keep it that
way: simple, robust and working without any network.

Bugs and ideas go in the [issues](https://github.com/sylvaindeloux/survival-shelf/issues). For a bigger
change, open an issue first so we can agree on the approach before you write the code.

## Repository layout

The root stays short so that people who only want the app, the guides or the docs find them at a glance.

```
.github/   CI, Dependabot and this guide
app/       the app: code, assets, build and tool configs
docs/      file format, shelf lives, example data files, README screenshots
```

The root `package.json` is an npm workspace that holds the lock file and forwards every script to `app/`, so
all commands run from the root.

## Getting started

Requirements: Node.js 22.12+ (CI uses the Node.js 26 LTS).

```sh
npm install
npm run dev          # development server
npm test             # unit tests (Vitest)
npm run check        # type checks (svelte-check + tsc)
npm run build        # PWA in app/dist/
npm run build:single # single self-contained HTML file in app/dist-single/
npm run build:all    # both, with the single file copied to app/dist/survival-shelf.html
```

Add options after `--`, for example `npm run preview -- --port 4173`. Dependencies are declared in
`app/package.json`: add one with `npm install -D <package> -w app`.

`npm run build` produces static files in `app/dist/` that any web server can serve: this is also how to
self-host the full app (with offline support and install).

## Stack

[Svelte 5](https://svelte.dev) + TypeScript + [Vite](https://vite.dev),
[vite-plugin-pwa](https://vite-pwa-org.netlify.app) for the service worker, [Lucide](https://lucide.dev) icons,
Barlow fonts bundled locally. No CSS framework, no runtime dependency beyond Svelte. Only stable, maintained
versions of dependencies, no prereleases.

```
app/
  src/
    lib/core/      Pure logic, no UI: Markdown parser/writer, stock operations, autonomy, rotation,
                   tiers (plan.ts), check-in, calendar reminder (ics.ts), catalog
    lib/storage/   IndexedDB working copy and file access (File System Access API, import/export)
    lib/i18n/      English (reference) and French messages
    lib/ui/        Shared components and dialogs
    lib/app.svelte.ts  App state: loading, saving, syncing with the linked file
    views/         Screens
  public/          Favicon and app icons, copied as is
  build/           Single-file build plugin and icon sources
docs/              File format, shelf lives and README screenshots
  examples/        Example data files (English and French)
```

## Tests

The business logic in `app/src/lib/core` is covered by unit tests: please add tests with your changes. Before
opening a pull request, run `npm test` and `npm run check`.

## Translating the app

English is the reference language. To add a language:

1. Add its code to `LANGS` in `app/src/lib/core/types.ts`.
2. Copy `app/src/lib/i18n/en.ts` to the new language and translate every message (same keys), then register
   it in `app/src/lib/i18n/index.svelte.ts`.
3. Translate what the app writes in the data file: section titles, column and setting labels in
   `app/src/lib/core/document.ts` and `app/src/lib/core/defaults.ts`, and category labels in
   `app/src/lib/core/categories.ts`. Reading a file accepts every language, so a file written in one language
   still opens in another.
4. Translate the product names of the built-in catalog in `app/src/lib/core/catalog.ts` and the sample
   locations in `app/src/lib/demo.ts`.
5. Optionally, add a `README.<lang>.md`, a `docs/FILE_FORMAT.<lang>.md`, an example file in `docs/examples/`
   and screenshots in `docs/screenshots/<lang>/`, and link the new README from the language line of the
   others.

## Screenshots

README screenshots live in `docs/screenshots/<lang>/`, one set per language. They are taken from the sample
stock (*Try with sample data*), in light theme except `plan-dark.png`: phones at 390 × 844 and the computer at
1280 × 800, both at 2× pixel density, saved as 256-color PNGs to keep the repository light.

## Version

The app version is a plain number that grows by itself: the number of commits on the first-parent line of
`master` (`git rev-list --count --first-parent HEAD`), so +1 for every merged pull request and every deploy. It
is shown at the bottom of the sidebar and in Settings, and written in the data file. A build without the git
history (shallow clone, source archive) shows `dev`.

## Ideas for later

- Autonomy over time chart ("how long will I last in 6 months if I do nothing?").
- Several kits (cellar, car, 72-hour bag) with a go-bag checklist.
- Grace period for "best before" items, still edible after the date.
- Nutrition beyond calories (proteins…), and a finer balance between food groups.
- Barcode scanning without any online database.

## License

By contributing, you agree that your contributions are licensed under the [MIT license](../LICENSE).
