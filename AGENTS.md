# AGENTS.md

Instructions for AI coding agents working on Survival Shelf. They are the short version of
[.github/CONTRIBUTING.md](.github/CONTRIBUTING.md): read it for the details, the same rules apply to humans.

## The project

An offline-first web app (PWA) to build an emergency stock step by step and rotate it before it expires.
People may rely on it during a power cut, a storm or a crisis, so robustness comes before features.
No server, no database, no account: all user data lives in one Markdown file the user can read and edit by
hand. Svelte 5 + TypeScript + Vite, vite-plugin-pwa, Vitest. English and French.

## Commands

Run everything from the repository root (npm workspace, the app lives in `app/`):

```sh
npm ci                          # install exactly what the lock file says
npm run dev                     # development server
npm test                        # unit tests (Vitest); `npm test -- -u` updates snapshots
npm run check                   # type checks (svelte-check + tsc)
npm run build:all               # PWA in app/dist/ + single HTML file app/dist/survival-shelf.html
npm run preview -- --port 4173  # serve the build; options go after `--`
npm install -D <package> -w app # add a dependency (only after agreement, see below)
```

## Where things are

```
app/src/lib/core/      Pure TypeScript logic, no UI, unit-tested (*.test.ts next to the code):
                       document.ts (Markdown file parser/writer), defaults.ts, categories.ts, catalog.ts,
                       stock.ts, plan.ts (tiers), autonomy.ts, rotation.ts, checkin.ts, ics.ts, language.ts
app/src/lib/core/languages.ts  Languages: names, decimal comma, translated docs; fallback to English
app/src/lib/i18n/      en.ts (reference), one dictionary per language, dictionaries.ts lists them
app/src/lib/storage/   IndexedDB working copy, linked file (File System Access API), import/export
app/src/lib/ui/        Shared components and dialogs
app/src/lib/app.svelte.ts  App state: loading, saving, syncing with the linked file
app/src/views/         Screens
app/src/app.css        Design tokens (olive palette, light and dark)
docs/                  FILE_FORMAT.md / .fr.md, SHELF_LIFE.md, examples/, screenshots/
```

Generated, never edit by hand: `app/dist/`, `app/dist-single/`, `package-lock.json` (use npm).

## Rules you must follow

1. **Offline only.** No network request at run time: no CDN, API, analytics, telemetry or remote font.
   Everything the app needs is bundled. User data never leaves the device unless the user exports or shares it.
2. **Works everywhere.** Installed PWA, single HTML file opened from a disk (`file://`), any static host, every
   modern browser including Safari on iPhone. APIs that are not available everywhere are a bonus with a fallback.
3. **The data file stays readable.** One Markdown file with tables, columns matched by their header, unknown
   columns and sections kept. The app writes it in its own language: every new section, column, setting or
   value it writes needs a label in every language, and reading accepts all of them. A format change updates
   `docs/FILE_FORMAT.md`, `docs/FILE_FORMAT.fr.md`, `docs/examples/` and the tests.
4. **The data file is untrusted input.** Never render its content as HTML (`{@html}`) or evaluate it.
5. **English and French always complete.** A new message goes in `en.ts` and `fr.ts`, a new data file label
   (`Translated`) gets `en` and `fr`. Other languages may lag behind: missing texts fall back to English, do
   not machine-translate them unless asked. User docs and practical guides exist in English and French.
   French addresses the reader with "tu". Languages are declared in `app/src/lib/core/languages.ts`: never
   test a language code (`lang === 'fr'`), add a property to `LANGUAGES` instead. Adding a language:
   `.github/TRANSLATING.md`.
6. **Never invent facts.** Shelf lives, amounts, calories, water needs and guide advice come from reliable
   sources cited next to them (see `docs/SHELF_LIFE.md`). If you cannot find a source, say so and leave a
   question for the human instead of guessing. Never make up a URL.
7. **Logic goes in `app/src/lib/core`**, as plain TypeScript without UI, with tests.
8. **Dependencies:** as few as possible, stable releases only (no alpha, beta or rc), no known vulnerability.
   Do not add or upgrade a dependency to a new major version without the human's agreement.
9. **Design:** reuse the tokens in `app/src/app.css`, keep text contrast at WCAG AA, check light and dark
   themes and phone and desktop layouts. No CSS framework; icons come from `@lucide/svelte`.
10. **English in the code:** identifiers, comments, commit messages and pull requests. Comments explain why.
11. **Follow the surrounding style:** 2-space indent, single quotes, semicolons, small focused functions.
    Do not reformat or rename code you are not changing.

## How to work

- **Ask before building.** For a new feature, a data file change, a new dependency or a large refactor,
  propose a short plan to the human and wait for their go. Small fixes need no plan. When something is
  unclear, ask rather than guess.
- **One topic per change.** Keep the diff focused; do not fix unrelated things on the way, mention them instead.
- **Tests are the safety net.** Never skip, delete or weaken a test to make it pass. Update a snapshot only
  when the change in output is intended, and say so.
- **Before handing back,** run `npm run check`, `npm test` and `npm run build:all`, all green. Then summarize
  what changed, what you checked, and what you could not verify (for example, the look on a real phone).
- **Pull requests** follow [.github/pull_request_template.md](.github/pull_request_template.md). The title is an
  imperative English sentence: it becomes the commit message on `master` (squash merge).
- **Never commit** secrets, personal data or a real user's data file.

## Known constraints

- TypeScript stays on 6.x: svelte-check 4 does not support TypeScript 7 yet.
- The `overrides` entry for `glob` in the root `package.json` is a security fix for `workbox-build`: keep it
  until workbox-build depends on a patched glob.
- The app version is computed from the git history (`git rev-list --count --first-parent HEAD`): do not add a
  `version` field, tags or semantic versioning.
