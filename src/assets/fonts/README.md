# Fonts

Bundled with the app so it works fully offline (no font CDN).

| File | Family | Weight |
| --- | --- | --- |
| `barlow-latin-400-normal.woff2` | Barlow | 400 |
| `barlow-latin-600-normal.woff2` | Barlow | 600 |
| `barlow-semi-condensed-latin-600-normal.woff2` | Barlow Semi Condensed | 600 |
| `barlow-semi-condensed-latin-700-normal.woff2` | Barlow Semi Condensed | 700 |

- Design: Jeremy Tribby, https://github.com/jpt/barlow
- Files: latin subset from Fontsource (`@fontsource/barlow`, `@fontsource/barlow-semi-condensed`).
- License: SIL Open Font License 1.1, see [OFL.txt](OFL.txt).

Only the latin subset is shipped (covers English and French). Declared with
`@font-face` at the top of `src/app.css`.
