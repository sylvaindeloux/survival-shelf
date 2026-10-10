import { computeAutonomy } from './core/autonomy';
import { today as currentDay, type Day } from './core/dates';
import { rotationPlan } from './core/rotation';
import { autonomyGap, shoppingList } from './core/shopping';
import { expiryAlerts, summarizeProducts } from './core/status';
import { emptyShelf } from './core/defaults';
import { parseShelf, serializeShelf } from './core/document';
import type { ParseIssue, Shelf } from './core/types';
import { demoShelf } from './demo';
import { i18n, t, type MessageKey } from './i18n/index.svelte';
import { idbDelete, idbGet, idbSet } from './storage/idb';
import {
  DEFAULT_FILE_NAME,
  canLinkFiles,
  downloadText,
  filePermission,
  isAbort,
  lastModifiedOf,
  pickExistingFile,
  pickFileWithInput,
  pickNewFile,
  readHandle,
  shareText,
  writeHandle,
} from './storage/files';

/**
 * State of the link with a real file on disk:
 * - none: not linked, the data only lives in the browser (export to back up)
 * - linked: every change is written to the file
 * - permission: the browser needs a click to allow access again
 * - paused: the file has errors, writing is paused so nothing gets lost
 * - error: the last read or write failed
 */
export type FileState = 'none' | 'linked' | 'permission' | 'paused' | 'error';

interface Meta {
  started: boolean;
  demo: boolean;
  /** Changes not written to the linked file yet. */
  dirtyForFile: boolean;
  /** Modification time of the linked file when we last read or wrote it. */
  fileLastModified: number | null;
  lastExport: number | null;
  changedSinceExport: boolean;
}

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'error';
  action?: { label: string; run: () => void };
}

const DEFAULT_META: Meta = {
  started: false,
  demo: false,
  dirtyForFile: false,
  fileLastModified: null,
  lastExport: null,
  changedSinceExport: false,
};

/** How long without export before the app reminds to back up the data. */
const EXPORT_REMINDER_DAYS = 7;
const WRITE_DELAY_MS = 300;

class App {
  shelf = $state<Shelf>(emptyShelf());
  issues = $state<ParseIssue[]>([]);
  ready = $state(false);
  started = $state(false);
  demo = $state(false);
  today = $state<Day>(currentDay());
  fileName = $state('');
  fileState = $state<FileState>('none');
  fileError = $state('');
  /** Content of the file when it and the app both changed. */
  conflict = $state<string | null>(null);
  lastExport = $state<number | null>(null);
  changedSinceExport = $state(false);
  toasts = $state<Toast[]>([]);

  readonly canLinkFiles = canLinkFiles;

  summaries = $derived(summarizeProducts(this.shelf, this.today));
  autonomy = $derived(computeAutonomy(this.shelf, this.today));
  rotation = $derived(rotationPlan(this.shelf, this.today));
  alerts = $derived(expiryAlerts(this.shelf, this.today));
  shopping = $derived(shoppingList(this.shelf, this.today));
  gap = $derived(autonomyGap(this.shelf, this.autonomy));
  locations = $derived(
    [...new Set(this.shelf.lots.map((lot) => lot.location).filter((location) => location !== ''))].sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  needsBackup = $derived(
    this.started &&
      !this.demo &&
      this.fileState === 'none' &&
      this.changedSinceExport &&
      (this.lastExport === null || Date.now() - this.lastExport > EXPORT_REMINDER_DAYS * 86_400_000) &&
      this.shelf.lots.length > 0,
  );

  #handle: FileSystemFileHandle | null = null;
  #meta: Meta = { ...DEFAULT_META };
  #writeTimer: ReturnType<typeof setTimeout> | null = null;
  #busy = false;
  #toastId = 0;

  async init() {
    this.#meta = { ...DEFAULT_META, ...((await idbGet<Meta>('meta')) ?? {}) };
    this.started = this.#meta.started;
    this.demo = this.#meta.demo;
    this.lastExport = this.#meta.lastExport;
    this.changedSinceExport = this.#meta.changedSinceExport;

    const text = await idbGet<string>('doc');
    if (text !== undefined) this.#load(text);

    const handle = await idbGet<FileSystemFileHandle>('file');
    if (handle && canLinkFiles) {
      this.#handle = handle;
      this.fileName = handle.name;
      if ((await filePermission(handle)) === 'granted') await this.#syncFromFile();
      else this.fileState = 'permission';
    }

    window.launchQueue?.setConsumer(({ files }) => {
      const [file] = files;
      if (file && file.kind === 'file') void this.#adoptHandle(file as FileSystemFileHandle);
    });
    const refresh = () => {
      this.today = currentDay();
      if (document.visibilityState === 'visible') void this.checkFile();
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    this.ready = true;
  }

  /** Applies a change to the shelf and saves it everywhere. */
  update(change: (shelf: Shelf) => Shelf, undoMessage?: string) {
    const before = $state.snapshot(this.shelf) as Shelf;
    this.shelf = change(this.shelf);
    void this.#persist();
    if (undoMessage) {
      this.toast(undoMessage, 'success', {
        label: t('action.undo'),
        run: () => {
          this.shelf = before;
          void this.#persist();
        },
      });
    }
  }

  /** Shows a short message. `sticky` toasts stay until dismissed. */
  toast(message: string, kind: Toast['kind'] = 'info', action?: Toast['action'], sticky = false) {
    const id = ++this.#toastId;
    this.toasts = [...this.toasts, { id, message, kind, action }].slice(-3);
    if (!sticky) setTimeout(() => this.dismissToast(id), action ? 7000 : 4000);
  }

  dismissToast(id: number) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  // --- Starting -------------------------------------------------------------

  async startNew(people: number) {
    const shelf = emptyShelf();
    shelf.settings.people = people;
    await this.#replace(shelf, [], { demo: false });
  }

  async startDemo() {
    await this.#replace(demoShelf(this.today, i18n.lang), [], { demo: true });
  }

  /** Forgets everything stored in this browser (the linked file is left untouched). */
  async reset() {
    if (this.#writeTimer) clearTimeout(this.#writeTimer);
    this.#handle = null;
    this.fileName = '';
    this.fileState = 'none';
    this.issues = [];
    this.shelf = emptyShelf();
    this.#meta = { ...DEFAULT_META };
    this.started = false;
    this.demo = false;
    this.lastExport = null;
    this.changedSinceExport = false;
    await Promise.all([idbDelete('doc'), idbDelete('file'), idbDelete('meta')]);
  }

  // --- Files ----------------------------------------------------------------

  /** Saves the current data to a new file and keeps it linked. */
  async linkNewFile() {
    try {
      const handle = await pickNewFile(this.fileName || DEFAULT_FILE_NAME);
      const text = serializeShelf(this.shelf);
      const lastModified = await writeHandle(handle, text);
      this.#handle = handle;
      this.fileName = handle.name;
      this.fileState = 'linked';
      this.fileError = '';
      this.#meta.fileLastModified = lastModified;
      this.#meta.dirtyForFile = false;
      this.demo = false;
      await idbSet('file', handle);
      await this.#saveMeta();
      this.toast(t('file.linked', { name: handle.name }), 'success');
    } catch (error) {
      if (!isAbort(error)) this.#fail(error);
    }
  }

  /** Opens an existing file: linked when the browser allows it, imported otherwise. */
  async openFile() {
    try {
      if (canLinkFiles) {
        await this.#adoptHandle(await pickExistingFile());
      } else {
        const file = await pickFileWithInput();
        if (file) await this.importFile(file);
      }
    } catch (error) {
      if (!isAbort(error)) this.#fail(error);
    }
  }

  /** Replaces the data with the content of a file, without linking it. */
  async importFile(file: File) {
    this.unlink();
    const { shelf, issues } = parseShelf(await file.text());
    await this.#replace(shelf, issues, { demo: false });
    this.toast(t('file.imported', { name: file.name }), issues.some((i) => i.level === 'error') ? 'error' : 'success');
  }

  exportFile() {
    downloadText(serializeShelf(this.shelf), this.fileName || DEFAULT_FILE_NAME);
    void this.#markExported();
  }

  async shareFile() {
    try {
      if (await shareText(serializeShelf(this.shelf), this.fileName || DEFAULT_FILE_NAME)) await this.#markExported();
    } catch (error) {
      this.#fail(error);
    }
  }

  unlink() {
    this.#handle = null;
    this.fileName = '';
    this.fileState = 'none';
    this.fileError = '';
    this.#meta.dirtyForFile = false;
    this.#meta.fileLastModified = null;
    void idbDelete('file');
    void this.#saveMeta();
  }

  /** Asks the browser again for access to the linked file (must run from a click). */
  async reconnect() {
    if (!this.#handle) return;
    if ((await filePermission(this.#handle, true)) === 'granted') await this.#syncFromFile();
  }

  /** Re-reads the linked file if it was modified outside the app. */
  async checkFile() {
    if (!this.#handle || this.#busy || (this.fileState !== 'linked' && this.fileState !== 'paused')) return;
    try {
      if ((await lastModifiedOf(this.#handle)) !== this.#meta.fileLastModified) await this.#syncFromFile();
    } catch (error) {
      this.#fail(error);
    }
  }

  /** Writes the app data over a file that has errors (invalid rows are dropped). */
  async overwriteFile() {
    this.issues = [];
    this.fileState = 'linked';
    await this.#writeFile();
  }

  async resolveConflict(keep: 'app' | 'file') {
    const fileText = this.conflict;
    this.conflict = null;
    if (fileText === null || !this.#handle) return;
    if (keep === 'file') {
      this.#meta.fileLastModified = await lastModifiedOf(this.#handle);
      this.#load(fileText);
      await this.#saveLocalCopy();
      this.#updateFileState('granted');
    } else {
      await this.#writeFile();
    }
  }

  // --- Internals ------------------------------------------------------------

  #load(text: string) {
    const { shelf, issues } = parseShelf(text);
    this.shelf = shelf;
    this.issues = issues;
  }

  async #replace(shelf: Shelf, issues: ParseIssue[], options: { demo: boolean }) {
    this.shelf = shelf;
    this.issues = issues;
    this.started = true;
    this.demo = options.demo;
    await this.#persist();
  }

  async #adoptHandle(handle: FileSystemFileHandle) {
    this.#handle = handle;
    this.fileName = handle.name;
    this.#meta.dirtyForFile = false;
    this.#meta.fileLastModified = null;
    await idbSet('file', handle);
    const { text, lastModified } = await readHandle(handle);
    this.#meta.fileLastModified = lastModified;
    this.#load(text);
    this.started = true;
    this.demo = false;
    await this.#saveLocalCopy();
    this.#updateFileState(await filePermission(handle));
    this.toast(t('file.opened', { name: handle.name }), 'success');
  }

  #updateFileState(permission: PermissionState) {
    if (permission !== 'granted') this.fileState = 'permission';
    else if (this.issues.some((issue) => issue.level === 'error')) this.fileState = 'paused';
    else this.fileState = 'linked';
  }

  /** Reconciles the app data and the linked file after (re)gaining access. */
  async #syncFromFile() {
    if (!this.#handle) return;
    this.#busy = true;
    try {
      const { text, lastModified } = await readHandle(this.#handle);
      const fileChanged = lastModified !== this.#meta.fileLastModified;
      if (text === serializeShelf(this.shelf)) {
        this.#meta.fileLastModified = lastModified;
        this.#meta.dirtyForFile = false;
      } else if (this.#meta.dirtyForFile && fileChanged && this.#meta.fileLastModified !== null) {
        this.conflict = text;
      } else if (this.#meta.dirtyForFile && !fileChanged) {
        this.fileState = 'linked';
        await this.#writeFile();
        return;
      } else {
        this.#meta.fileLastModified = lastModified;
        if (this.started) this.toast(t('file.reloaded', { name: this.fileName }));
        this.#load(text);
        this.started = true;
        this.demo = false;
        await this.#saveLocalCopy();
      }
      this.#updateFileState('granted');
      this.fileError = '';
      await this.#saveMeta();
    } catch (error) {
      this.#fail(error);
    } finally {
      this.#busy = false;
    }
  }

  async #persist() {
    const text = serializeShelf(this.shelf);
    this.#meta.started = this.started = true;
    this.#meta.demo = this.demo;
    if (this.#handle) {
      this.#meta.dirtyForFile = true;
      if (this.fileState === 'linked') this.#scheduleWrite();
    } else {
      this.#meta.changedSinceExport = this.changedSinceExport = true;
    }
    await idbSet('doc', text);
    await this.#saveMeta();
    void requestPersistentStorage();
  }

  #scheduleWrite() {
    if (this.#writeTimer) clearTimeout(this.#writeTimer);
    this.#writeTimer = setTimeout(() => void this.#writeFile(), WRITE_DELAY_MS);
  }

  async #writeFile() {
    if (!this.#handle) return;
    this.#busy = true;
    try {
      if ((await filePermission(this.#handle)) !== 'granted') {
        this.fileState = 'permission';
        return;
      }
      // Never overwrite changes made to the file outside the app.
      const current = await lastModifiedOf(this.#handle);
      if (this.#meta.fileLastModified !== null && current !== this.#meta.fileLastModified) {
        const { text } = await readHandle(this.#handle);
        if (text !== serializeShelf(this.shelf)) {
          this.conflict = text;
          return;
        }
      }
      this.#meta.fileLastModified = await writeHandle(this.#handle, serializeShelf(this.shelf));
      this.#meta.dirtyForFile = false;
      this.fileState = 'linked';
      this.fileError = '';
      await this.#saveMeta();
    } catch (error) {
      this.#fail(error);
    } finally {
      this.#busy = false;
    }
  }

  /** Stores data that came from the linked file: nothing to write back. */
  async #saveLocalCopy() {
    this.#meta.started = true;
    this.#meta.demo = false;
    this.#meta.dirtyForFile = false;
    await idbSet('doc', serializeShelf(this.shelf));
    await this.#saveMeta();
  }

  async #markExported() {
    this.lastExport = this.#meta.lastExport = Date.now();
    this.changedSinceExport = this.#meta.changedSinceExport = false;
    await this.#saveMeta();
  }

  async #saveMeta() {
    await idbSet('meta', { ...this.#meta });
  }

  #fail(error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    if (this.#handle) {
      this.fileState = 'error';
      this.fileError = message;
    }
    this.toast(t('file.error', { message }), 'error');
  }
}

async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // Best effort only.
  }
}

export const app = new App();

/** Helper for components: translated issue message. */
export function issueMessage(issue: ParseIssue): string {
  const key = `issue.${issue.code}` as MessageKey;
  return t(key, issue.params);
}
