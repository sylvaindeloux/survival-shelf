// Regenerates the PNG app icons from the SVG sources.
// Usage: CHROMIUM=/path/to/chrome-headless-shell node build/icons/render.mjs
// (the old headless mode is needed for an exact viewport size).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROMIUM = process.env.CHROMIUM ?? 'chromium';
const root = resolve(import.meta.dirname, '../..');
const work = mkdtempSync(join(tmpdir(), 'icons-'));

const targets = [
  ['public/favicon.svg', 'public/icons/icon-192.png', 192, true],
  ['public/favicon.svg', 'public/icons/icon-512.png', 512, true],
  ['build/icons/maskable.svg', 'public/icons/icon-maskable-512.png', 512, false],
  ['build/icons/full.svg', 'public/icons/apple-touch-icon.png', 180, false],
];

for (const [source, output, size, transparent] of targets) {
  const svg = readFileSync(join(root, source), 'utf8');
  const page = join(work, 'icon.html');
  writeFileSync(
    page,
    `<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}" style="display:block"></body></html>`,
  );
  execFileSync(CHROMIUM, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${size},${size}`,
    ...(transparent ? ['--default-background-color=00000000'] : []),
    `--screenshot=${join(root, output)}`,
    `file://${page}`,
  ]);
  console.log(`${output} (${size}px)`);
}
