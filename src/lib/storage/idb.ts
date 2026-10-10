/**
 * Tiny key/value store on top of IndexedDB. IndexedDB is needed (rather than
 * localStorage) because file handles can only be persisted there.
 * Falls back to memory when IndexedDB is unavailable (some private modes).
 */
const DB_NAME = 'survival-shelf';
const STORE = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;
const memory = new Map<string, unknown>();

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    return await run<T | undefined>('readonly', (store) => store.get(key));
  } catch {
    return memory.get(key) as T | undefined;
  }
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    await run('readwrite', (store) => store.put(value, key));
  } catch {
    memory.set(key, value);
  }
}

export async function idbDelete(key: string): Promise<void> {
  memory.delete(key);
  try {
    await run('readwrite', (store) => store.delete(key));
  } catch {
    // Nothing stored anyway.
  }
}
