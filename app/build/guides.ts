import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';
import { LANGS, type Lang } from '../src/lib/core/types.ts';
import { buildLibrary } from '../src/lib/guides/build.ts';
import { zip } from './zip.ts';

const VIRTUAL = 'virtual:guides';
/** Archive of all the guides, served next to the app. */
export const GUIDES_ZIP = 'survival-shelf-guides.zip';

/** Every Markdown file of the guides folder, keyed by its path relative to that folder. */
function readGuides(root: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const path = join(entry.parentPath, entry.name);
    files[relative(root, path).split(sep).join('/')] = readFileSync(path, 'utf8');
  }
  return files;
}

/** The whole guides folder, as it is in the repository. */
function guidesArchive(root: string): Buffer {
  const files = Object.entries(readGuides(root))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => [`survival-shelf-guides/${path}`, content]);
  return zip(Object.fromEntries(files));
}

/**
 * Makes the Markdown guides of the repository available to the app:
 * - `virtual:guides` exports `loadGuides(lang)`, the guides of a language already rendered to
 *   HTML, so the app needs no Markdown parser and reads them offline. Each language is a chunk
 *   of its own, loaded when first needed, or part of the main script with `inline` (the
 *   single-file build has no other file to load);
 * - with `archive`, a ZIP of the whole folder is written next to the app.
 */
export function guides(root: string, options: { inline: boolean; archive: boolean }): Plugin {
  return {
    name: 'survival-shelf:guides',
    resolveId(id) {
      return id === VIRTUAL || id.startsWith(`${VIRTUAL}/`) ? `\0${id}` : null;
    },
    load(id) {
      if (id === `\0${VIRTUAL}`) {
        if (options.inline) {
          return [
            ...LANGS.map((lang) => `import ${lang} from '${VIRTUAL}/${lang}';`),
            `const libraries = { ${LANGS.join(', ')} };`,
            'export const loadGuides = (lang) => Promise.resolve(libraries[lang]);',
          ].join('\n');
        }
        return [
          `const loaders = { ${LANGS.map((lang) => `${lang}: () => import('${VIRTUAL}/${lang}')`).join(', ')} };`,
          'export const loadGuides = (lang) => loaders[lang]().then((module) => module.default);',
        ].join('\n');
      }
      if (!id.startsWith(`\0${VIRTUAL}/`)) return null;
      const lang = id.slice(VIRTUAL.length + 2);
      if (!(LANGS as string[]).includes(lang)) throw new Error(`No guides in "${lang}"`);
      const files = readGuides(root);
      for (const path of Object.keys(files)) this.addWatchFile(join(root, path));
      return `export default ${JSON.stringify(buildLibrary(files, lang as Lang))};`;
    },
    generateBundle() {
      if (options.archive) this.emitFile({ type: 'asset', fileName: GUIDES_ZIP, source: guidesArchive(root) });
    },
    configureServer(server) {
      server.middlewares.use(`/${GUIDES_ZIP}`, (_request, response) => {
        response.setHeader('Content-Type', 'application/zip');
        response.end(guidesArchive(root));
      });
    },
  };
}
