export const MAX_CHAT_FILES = 10;

const DB_NAME = "nexvision-chat-files";
const DB_VERSION = 1;
const STORE_NAME = "staged-files";

export const SUPPORTED_FILE_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "txt",
] as const;

export type SupportedFileExtension = (typeof SUPPORTED_FILE_EXTENSIONS)[number];

export interface StagedFileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
}

let storageMode: "auto" | "indexeddb" | "memory" = "auto";
const memoryStore = new Map<string, StagedFileRecord>();

function ensureClientSide() {
  if (typeof window === "undefined" || !window.indexedDB) {
    throw new Error("IndexedDB is unavailable in this environment.");
  }
}

function useMemoryStore() {
  storageMode = "memory";
}

function useIndexedDbStore() {
  if (storageMode === "auto") {
    storageMode = "indexeddb";
  }
}

function isMemoryStoreEnabled() {
  return storageMode === "memory";
}

function openDatabase(): Promise<IDBDatabase> {
  ensureClientSide();

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open staged files database."));

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);

        operation(store)
          .then((result) => {
            tx.oncomplete = () => {
              db.close();
              resolve(result);
            };
            tx.onerror = () => {
              db.close();
              reject(new Error("Database transaction failed."));
            };
          })
          .catch((err) => {
            db.close();
            reject(err);
          });
      }),
  );
}

function toStagedRecord(file: File): StagedFileRecord {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    blob: file,
  };
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

export function isSupportedFileType(file: File): boolean {
  const ext = getFileExtension(file.name);
  return SUPPORTED_FILE_EXTENSIONS.includes(ext as SupportedFileExtension);
}

export async function listStagedFiles(): Promise<StagedFileRecord[]> {
  if (isMemoryStoreEnabled()) {
    return Array.from(memoryStore.values());
  }

  try {
    const rows = await withStore("readonly", (store) => {
      return new Promise<StagedFileRecord[]>((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(new Error("Failed to read staged files."));
        request.onsuccess = () => {
          const rows = (request.result as StagedFileRecord[]) ?? [];
          resolve(rows);
        };
      });
    });

    useIndexedDbStore();
    return rows;
  } catch {
    useMemoryStore();
    return Array.from(memoryStore.values());
  }
}

export async function saveStagedFiles(files: File[]): Promise<StagedFileRecord[]> {
  const records = files.map(toStagedRecord);

  if (isMemoryStoreEnabled()) {
    records.forEach((record) => memoryStore.set(record.id, record));
    return records;
  }

  try {
    await withStore("readwrite", async (store) => {
      await Promise.all(
        records.map(
          (record) =>
            new Promise<void>((resolve, reject) => {
              const request = store.put(record);
              request.onerror = () => reject(new Error(`Failed to stage file '${record.name}'.`));
              request.onsuccess = () => resolve();
            }),
        ),
      );

      return records;
    });

    useIndexedDbStore();
    return records;
  } catch {
    useMemoryStore();
    records.forEach((record) => memoryStore.set(record.id, record));
    return records;
  }
}

export async function removeStagedFile(id: string): Promise<void> {
  if (isMemoryStoreEnabled()) {
    memoryStore.delete(id);
    return;
  }

  try {
    await withStore("readwrite", (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onerror = () => reject(new Error("Failed to remove staged file."));
        request.onsuccess = () => resolve();
      });
    });
    useIndexedDbStore();
  } catch {
    useMemoryStore();
    memoryStore.delete(id);
  }
}

export async function clearStagedFiles(): Promise<void> {
  if (isMemoryStoreEnabled()) {
    memoryStore.clear();
    return;
  }

  try {
    await withStore("readwrite", (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(new Error("Failed to clear staged files."));
        request.onsuccess = () => resolve();
      });
    });
    useIndexedDbStore();
  } catch {
    useMemoryStore();
    memoryStore.clear();
  }
}

export function toFile(record: StagedFileRecord): File {
  return new File([record.blob], record.name, {
    type: record.type,
    lastModified: record.lastModified,
  });
}
