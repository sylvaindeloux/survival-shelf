import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Inlines the JS and CSS bundles (and the favicon) into index.html, so the
 * app runs from one file opened straight from a disk or a USB key.
 */
export function inlineSingleFile(publicDir: string): Plugin {
  return {
    name: 'survival-shelf:inline-single-file',
    apply: 'build',
    enforce: 'post',
    // No service worker in a single file: the PWA registration becomes a no-op.
    resolveId(id) {
      return id === 'virtual:pwa-register' ? '\0pwa-register-stub' : null;
    },
    load(id) {
      return id === '\0pwa-register-stub' ? 'export function registerSW() { return () => Promise.resolve(); }' : null;
    },
    transformIndexHtml(html) {
      const favicon = readFileSync(resolve(publicDir, 'favicon.svg'), 'base64');
      return html
        .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${favicon}">`)
        .replace(/\s*<link rel="(apple-touch-icon|manifest)"[^>]*>/g, '');
    },
    generateBundle(_options, bundle) {
      const htmlFile = Object.values(bundle).find((file) => file.type === 'asset' && file.fileName.endsWith('.html'));
      if (!htmlFile || htmlFile.type !== 'asset') return;
      let html = String(htmlFile.source);
      for (const [fileName, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          const code = file.code.replace(/<\/script/gi, '<\\/script');
          html = html.replace(
            new RegExp(`<script[^>]*src="[^"]*${escapeRegExp(fileName)}"[^>]*></script>`),
            () => `<script type="module">${code}</script>`,
          );
          delete bundle[fileName];
        } else if (file.type === 'asset' && fileName.endsWith('.css')) {
          html = html.replace(
            new RegExp(`<link[^>]*href="[^"]*${escapeRegExp(fileName)}"[^>]*>`),
            () => `<style>${String(file.source)}</style>`,
          );
          delete bundle[fileName];
        }
      }
      htmlFile.source = html;
    },
  };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
