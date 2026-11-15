# Security policy

Survival Shelf has no server, no database and no account: the app runs in the browser and the user's data
stays on their device, in a Markdown file. Security issues are still possible, and they matter to people
who rely on the app in an emergency.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately on GitHub instead:
[Security → Report a vulnerability](https://github.com/sylvaindeloux/survival-shelf/security/advisories/new).

Say what the problem is, how to reproduce it (a sample data file helps, without personal data), and what
an attacker could do with it. This is a personal project maintained on free time: you will get an answer as
soon as possible, and credit in the advisory if you wish.

## Supported versions

Only the latest version is supported: the current `master` branch, which is also what the online copy and
the downloadable single HTML file are built from. The version number is shown in Settings → About.

## What counts

- A data file (imported, opened or linked) that runs code, breaks the app for good or silently corrupts the
  user's data.
- Data leaving the device without the user asking for it (export and share are the only ways out).
- The service worker or the single HTML file loading code or content from another origin.
- The build and release chain: dependencies, GitHub Actions workflows, the published files.

Problems in browsers, operating systems, GitHub itself, or that need someone to already control the
user's device are out of scope.
