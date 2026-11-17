/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { guides } from './build/guides.ts';
import { inlineSingleFile } from './build/inline-single-file.ts';

const THEME_COLOR = '#4b5320';

/**
 * App version: a plain integer that grows by itself, the number of commits on the first-parent
 * line of HEAD. On master that is +1 for every merged pull request (merge or squash).
 * "dev" when git is missing or the clone is shallow, which would give a wrong count.
 */
function appVersion(): string {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: import.meta.dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    if (git('rev-parse', '--is-shallow-repository') !== 'false') return 'dev';
    return git('rev-list', '--count', '--first-parent', 'HEAD');
  } catch {
    return 'dev';
  }
}
const BACKGROUND_COLOR = '#ebeadf';

/**
 * Number of the pull request when building its preview (`PR_PREVIEW`, set by .github/workflows/preview.yml),
 * empty for every other build. Previews are served from `pr-preview/pr-<number>/` on the same site.
 */
function previewNumber(): string {
  const value = process.env.PR_PREVIEW ?? '';
  if (value !== '' && !/^\d+$/.test(value)) throw new Error(`PR_PREVIEW must be a pull request number, not "${value}"`);
  return value;
}

export default defineConfig(({ mode }) => {
  // `--mode single` builds one self-contained HTML file (no service worker).
  const single = mode === 'single';
  return {
    // Relative paths: works on GitHub Pages, any sub-folder, and from file://.
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(appVersion()),
      __PREVIEW__: JSON.stringify(previewNumber()),
    },
    publicDir: single ? false : 'public',
    plugins: [
      svelte(),
      // The practical guides live at the root of the repository, readable without the app.
      guides(resolve(import.meta.dirname, '../guides'), { inline: single }),
      single
        ? inlineSingleFile(resolve(import.meta.dirname, 'public'))
        : VitePWA({
            registerType: 'prompt',
            injectRegister: false,
            includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
            manifest: {
              id: './',
              name: 'Survival Shelf',
              short_name: 'Survival Shelf',
              description: 'Build your survival stock tier by tier, offline: what to discard, eat and buy each month.',
              lang: 'en',
              start_url: './',
              scope: './',
              display: 'standalone',
              orientation: 'any',
              background_color: BACKGROUND_COLOR,
              theme_color: THEME_COLOR,
              categories: ['lifestyle', 'productivity', 'utilities'],
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
              ],
              // Lets the installed app open .md files from the file manager (Chromium desktop).
              file_handlers: [{ action: './', accept: { 'text/markdown': ['.md', '.markdown'] } }],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
              navigateFallback: 'index.html',
              // Pull request previews live in sub-folders of the site: let them load their own page.
              navigateFallbackDenylist: [/\/pr-preview\//],
            },
          }),
    ],
    build: single
      ? {
          outDir: 'dist-single',
          assetsInlineLimit: Number.MAX_SAFE_INTEGER,
          cssCodeSplit: false,
          rolldownOptions: { output: { codeSplitting: false } },
        }
      : {},
    test: {
      include: ['src/**/*.test.ts'],
    },
  };
});
