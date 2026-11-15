<!--
Thanks for contributing! The title of this pull request becomes the commit message on master (squash
merge): write it as a short imperative sentence in English, like "Add a two-week tier".
-->

## What and why

<!-- What does this change, and why? Link the issue it comes from, for example "Closes #12". -->

## How to check it

<!-- Steps to see it in the app, or "covered by tests". For a visible change, add screenshots (phone and
computer, light and dark theme when it matters). -->

## Checklist

- [ ] One topic in this pull request. A new feature or a big change was agreed in an issue first.
- [ ] `npm run check`, `npm test` and `npm run build:all` pass.
- [ ] Logic changes in `app/src/lib/core` come with tests.
- [ ] Still works offline: no network request, CDN, analytics or remote font.
- [ ] English and French are both updated (app messages, data file labels, docs, guides). Other languages may
      stay behind: missing texts show in English.
- [ ] If the data file format changed: `docs/FILE_FORMAT.md`, `docs/FILE_FORMAT.fr.md` and `docs/examples/`
      are updated.
- [ ] New figures or advice (shelf lives, quantities, guides) come with their sources.
- [ ] No new dependency, or it was agreed in an issue first.
