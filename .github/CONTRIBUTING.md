# Contributing to Survival Shelf

Thanks for your interest! Survival Shelf is a small, offline-first app: no server, no database, no account,
and all the data in one Markdown file the user can read and edit by hand. Contributions should keep it that
way: simple, robust and working without any network.

Bugs, ideas and corrections go in the [issues](https://github.com/sylvaindeloux/survival-shelf/issues), in
English or French. For a new feature or a bigger change, open an issue first so we can agree on the approach
before you write the code. Small fixes can go straight to a pull request.

Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md). Security problems are reported
privately, see the [security policy](SECURITY.md).

## Repository layout

The root stays short so that people who only want the app, the guides or the docs find them at a glance.

```
.github/   CI, Dependabot, this guide, translation guide, issue and pull request templates
.claude/   entry point for Claude Code, which imports AGENTS.md
app/       the app: code, assets, build and tool configs
docs/      file format, shelf lives, example data files, README screenshots
AGENTS.md  instructions for AI coding agents
```

The root `package.json` is an npm workspace that holds the lock file and forwards every script to `app/`, so
all commands run from the root.

## Ground rules

These come from the decisions taken while building the app. A pull request that breaks one of them will be
asked to change, so when in doubt, ask in an issue first.

### The app

- **Offline, always.** No server, no database, no account, and no network request at run time: no CDN, API,
  analytics, telemetry or remote font. Everything the app needs is bundled and cached. The user's data never
  leaves their device unless they export or share it.
- **Works everywhere.** As an installed app (PWA), as the single HTML file opened from a disk or a USB key,
  and on any static web host, in every modern browser including Safari on iPhone. A browser feature that is
  not available everywhere (like the linked file of the File System Access API) is a bonus with a fallback
  (import and export).
- **One readable data file.** All the data stays in one Markdown file that people can read, print and edit
  without the app. Columns are found by their header, and the app keeps what it does not know (extra columns,
  sections, text). The app writes the file in its own language: every new section, column, setting or value
  it writes needs a label in every language, and reading accepts all of them. A change to the format updates
  [`docs/FILE_FORMAT.md`](../docs/FILE_FORMAT.md), [`docs/FILE_FORMAT.fr.md`](../docs/FILE_FORMAT.fr.md),
  the [examples](../docs/examples/) and the tests.
- **The data file is untrusted input.** Never render its content as HTML (`{@html}`) or evaluate it.
- **Logic apart from the UI.** Business logic goes in `app/src/lib/core` as plain TypeScript, with tests.
- **Sturdy, sober design.** Reuse the design tokens of `app/src/app.css` (olive palette), keep text contrast at
  WCAG AA, and check the light and dark themes on phone and desktop layouts. No CSS framework; icons come from
  Lucide.

### Content

- **Every language together.** Every app message and every label written in the data file exists in each
  language of the app (English and French today, see [translating](TRANSLATING.md)), and the user docs and
  practical guides exist in English and French. French texts address the reader with "tu", like the app.
- **No made-up facts.** People may rely on this information in an emergency. Shelf lives, daily amounts,
  calories, water needs and advice come from reliable sources, cited next to them (see
  [`docs/SHELF_LIFE.md`](../docs/SHELF_LIFE.md)). Prefer official sources: health and food safety agencies,
  civil protection, the Red Cross, manufacturers' technical sheets. Blogs and forums can give ideas, only
  once cross-checked.
- **Your own words.** Do not copy text from other sites or books: everything here is MIT licensed.

### Code and pull requests

- **Code in English:** identifiers, comments, commit messages and pull requests. Comments explain why, not
  what. Follow the style of the surrounding code (2-space indent, single quotes, semicolons) and do not
  reformat code you are not changing.
- **One topic per pull request**, branched from an up-to-date `master`.
- **Squash merge only.** The maintainer merges with *Squash and merge*, so the pull request title becomes the
  single commit on `master`: write it as a short imperative sentence in English, without prefix, like
  "Add a two-week tier". Commits inside the branch need no particular format.
- **Green CI.** `npm run check`, `npm test` and `npm run build:all` must pass. Never skip, delete or weaken a
  test to get there, and update snapshots only when the new output is intended.
- **Fill in the [pull request template](pull_request_template.md)**: what, why, how to check it.

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
Barlow fonts bundled locally. No CSS framework, no runtime dependency beyond Svelte.

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

The business logic in `app/src/lib/core` is covered by unit tests (`*.test.ts` next to the code): please add
tests with your changes. Before opening a pull request, run `npm run check`, `npm test` and
`npm run build:all`, like the CI does. `npm test -- -u` updates the snapshots.

## Dependencies

The app must stay robust and easy to maintain for years, so:

- As few dependencies as possible. A new dependency, or a new major version, is agreed in an issue first.
- Stable releases only (no alpha, beta or release candidate), maintained, and without known vulnerability:
  check with `npm audit`.
- Dependencies are declared in `app/package.json` (`npm install -D <package> -w app`), and the root
  `package-lock.json` is committed. Dependabot proposes grouped updates once a month.
- Known exceptions: TypeScript stays on 6.x until svelte-check supports version 7, and the `glob` override in
  the root `package.json` fixes a vulnerability in `workbox-build` until it ships a patched version.

## Translating the app

English is the reference language. To add a language, follow the [translation guide](TRANSLATING.md): what to
translate, the few code changes to plug the language in, and how to check the result.

## Practical guides

The practical guides are plain Markdown pages, readable without the app, in `guides/<lang>/<theme>/`. Their
detailed writing rules and template are in `guides/CONTRIBUTING.md`. In short:

- One guide answers one practical question, with the summary first and the sources last.
- File names are translated, in lowercase, without accents, with hyphens.
- Every guide exists in English and French and links to the other version. French guides are written for
  France first, English guides for an international reader.
- At least two official sources per guide. When sources disagree, keep the most cautious advice and say so.
- Out of scope: identifying wild plants, fighting and weapons, medical acts beyond lay first aid.
- `npm test` checks the pairing, the template and the links.

## Screenshots

README screenshots live in `docs/screenshots/<lang>/`, one set per language. They are taken from the sample
stock (*Try with sample data*), in light theme except `plan-dark.png`: phones at 390 × 844 and the computer at
1280 × 800, both at 2× pixel density, saved as 256-color PNGs to keep the repository light.

## AI-assisted contributions

Contributions written with an AI agent are welcome, and you do not have to say so. We recommend that you
review and test what the agent produced before you submit it: you know the change, and you answer the
review. Agents find their instructions in [`AGENTS.md`](../AGENTS.md) (Claude Code reads it through
`.claude/CLAUDE.md`).

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

By contributing, you agree that your contributions are licensed under the [MIT license](../LICENSE). Third-party
files (fonts, icons, images) need a compatible license, documented next to them like in
[`app/src/assets/fonts/README.md`](../app/src/assets/fonts/README.md).
