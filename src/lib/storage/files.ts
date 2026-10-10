/**
 * Everything that touches real files. Linking a file (read and write it in
 * place) needs the File System Access API, available in Chromium-based
 * desktop browsers. Elsewhere the app falls back to import / export / share.
 */

export const DEFAULT_FILE_NAME = 'survival-shelf.md';

const PICKER_TYPES = [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }];

export const canLinkFiles =
  typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function pickNewFile(suggestedName = DEFAULT_FILE_NAME): Promise<FileSystemFileHandle> {
  return window.showSaveFilePicker({ suggestedName, types: PICKER_TYPES, id: 'survival-shelf' });
}

export async function pickExistingFile(): Promise<FileSystemFileHandle> {
  const [handle] = await window.showOpenFilePicker({ types: PICKER_TYPES, multiple: false, id: 'survival-shelf' });
  return handle;
}

/** Current read/write permission on a handle; `request` asks the user (needs a click). */
export async function filePermission(handle: FileSystemFileHandle, request = false): Promise<PermissionState> {
  const descriptor = { mode: 'readwrite' as const };
  try {
    const state = await handle.queryPermission(descriptor);
    if (state === 'granted' || !request) return state;
    return await handle.requestPermission(descriptor);
  } catch {
    return 'denied';
  }
}

export interface FileContent {
  text: string;
  lastModified: number;
}

export async function readHandle(handle: FileSystemFileHandle): Promise<FileContent> {
  const file = await handle.getFile();
  return { text: await file.text(), lastModified: file.lastModified };
}

export async function lastModifiedOf(handle: FileSystemFileHandle): Promise<number> {
  return (await handle.getFile()).lastModified;
}

/** Writes the whole file and returns its new modification time. */
export async function writeHandle(handle: FileSystemFileHandle, text: string): Promise<number> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return lastModifiedOf(handle);
}

/** Classic file input, works everywhere. Resolves null when cancelled. */
export function pickFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt,text/markdown,text/plain';
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

export function downloadText(text: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function markdownFile(text: string, fileName: string): File {
  // text/plain is the most widely accepted type by share targets.
  return new File([text], fileName, { type: 'text/plain' });
}

export function canShareFiles(): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [markdownFile('', DEFAULT_FILE_NAME)] });
  } catch {
    return false;
  }
}

/** Opens the system share sheet (save to Files, send by mail…). Returns false when cancelled. */
export async function shareText(text: string, fileName: string): Promise<boolean> {
  try {
    await navigator.share({ files: [markdownFile(text, fileName)], title: fileName });
    return true;
  } catch (error) {
    if (isAbort(error)) return false;
    throw error;
  }
}
