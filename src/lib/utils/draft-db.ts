// -------------------------------------------------------------
//  Draft laporan offline di IndexedDB (Blueprint 5.2):
//  HP mati / sinyal hilang di basement gudang → inputan TIDAK hilang.
//  Blob foto ikut tersimpan (IndexedDB mendukung structured clone).
// -------------------------------------------------------------

const DB_NAME = "portal-driver";
const STORE = "draft-laporan";

function bukaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function simpanDraft(tripId: string, data: unknown): Promise<void> {
  try {
    const db = await bukaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, tripId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Gagal simpan draft tidak boleh mengganggu pengisian form.
  }
}

export async function ambilDraft<T>(tripId: string): Promise<T | null> {
  try {
    const db = await bukaDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(tripId);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function hapusDraft(tripId: string): Promise<void> {
  try {
    const db = await bukaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(tripId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* abaikan */
  }
}
