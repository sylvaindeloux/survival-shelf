/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { inlineSingleFile } from './build/inline-single-file.ts';
import pkg from './package.json' with { type: 'json' };

const THEME_COLOR = '#2f5d46';
const BACKGROUND_COLOR = '#f6f4ee';

export default defineConfig(({ mode }) => {
  // `--mode single` builds one self-contained HTML file (no service worker).
  const single = mode === 'single';
  return {
    // Relative paths: works on GitHub Pages, any sub-folder, and from file://.
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    publicDir: single ? false : 'public',
    plugins: [
      svelte(),
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
              description: 'Build your survival stock tier by tier, offline: what to discard, eat and buy each week.',
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
              globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
              navigateFallback: 'index.html',
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
