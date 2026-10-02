// Where saves live (Spec 09, "Storage and saving"): one slot per browser, in IndexedDB, written safely. A save is
// written as a new record and only then marked current, so a crash part-way leaves the previous save loadable.

import { type SaveData, SaveError, parseSave, serialise } from './save.ts';

/** The small async store a save slot needs: IndexedDB in the browser, a map in tests. */
export interface KeyValueStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export class MemoryStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  async get(key: string): Promise<string | undefined> {
    return this.data.get(key);
  }
  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
}

/** The key that says which record is the save. */
export const CURRENT = 'current';
const recordKey = (n: number): string => `save-${n}`;

export class SaveSlot {
  /** `content` is this build's content fingerprint: saves made with other content are refused (Spec 09, Addendum A). */
  constructor(
    private readonly store: KeyValueStore,
    private readonly content?: string,
  ) {}

  /** The text of the current save, if there is one. */
  async readText(): Promise<string | undefined> {
    const key = await this.store.get(CURRENT);
    return key === undefined ? undefined : this.store.get(key);
  }

  async exists(): Promise<boolean> {
    return (await this.readText()) !== undefined;
  }

  /** The current save, read and upgraded; undefined when there is none. Throws `SaveError` for one that cannot be read. */
  async read(): Promise<SaveData | undefined> {
    const text = await this.readText();
    return text === undefined ? undefined : parseSave(text, undefined, undefined, this.content);
  }

  /**
   * Write a save: a new record first, then the pointer to it, then the old record goes. A crash before the pointer
   * moves leaves the old save current; a crash after leaves both, and the old one is replaced on the next write.
   */
  async write(save: SaveData | string): Promise<void> {
    const text = typeof save === 'string' ? save : serialise(save);
    const previous = await this.store.get(CURRENT);
    const number = previous ? Number(previous.slice('save-'.length)) + 1 : 1;
    const key = recordKey(Number.isFinite(number) ? number : 1);
    await this.store.set(key, text);
    await this.store.set(CURRENT, key);
    if (previous && previous !== key) await this.store.delete(previous);
  }

  async clear(): Promise<void> {
    const key = await this.store.get(CURRENT);
    await this.store.delete(CURRENT);
    if (key) await this.store.delete(key);
  }

  /** The save as a file's text, for a backup or to move to another browser (Spec 09). */
  async exportText(): Promise<string | undefined> {
    return this.readText();
  }

  /** Take a save from a file: it must be readable by this game, or nothing changes. Returns what it was. */
  async importText(text: string): Promise<SaveData> {
    const save = parseSave(text, undefined, undefined, this.content);
    await this.write(save);
    return save;
  }
}

/** The save slot of this browser: one IndexedDB database with one object store. */
export function idbStore(name = 'megadungeon'): KeyValueStore {
  const open = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new SaveError('invalid', 'The browser would not open its save store.'));
    });
  const run = async <T>(mode: IDBTransactionMode, body: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const db = await open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction('saves', mode);
        const request = body(tx.objectStore('saves'));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  };
  return {
    get: async (key) => (await run('readonly', (s) => s.get(key))) as string | undefined,
    set: async (key, value) => void (await run('readwrite', (s) => s.put(value, key))),
    delete: async (key) => void (await run('readwrite', (s) => s.delete(key))),
  };
}
