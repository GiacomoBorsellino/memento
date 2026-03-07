// db.js — IndexedDB wrapper for Memento save system
//
// WHY IndexedDB over localStorage?
//   • Async: non-blocking, won't freeze the UI
//   • No size limit (~50MB+ vs ~5MB for localStorage)
//   • Transactional: atomic writes, no corruption on crash
//   • Supports complex types natively (arrays, objects, blobs)
//   • Industry-standard for PWA offline storage
//
// DB: "memento-db" v1
// Store: "saves" — keyPath: "slot"
// Record shape: { slot: string, nodeIdx: number, inventory: Item[], timestamp: number }

const DB_NAME    = "memento-db";
const DB_VERSION = 1;
const STORE      = "saves";

// Opens (or creates) the database. Returns a Promise<IDBDatabase>.
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "slot" });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// Helper: open DB, run a callback with the store, return a Promise.
async function withStore(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req   = fn(store);
    if (req) {
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    } else {
      tx.oncomplete = () => resolve();
      tx.onerror    = (e) => reject(e.target.error);
    }
  });
}

// ── Public API ────────────────────────────────────────────────

/** Save progress to a named slot (upsert). */
export async function saveGame(slot, { nodeIdx, inventory }) {
  return withStore("readwrite", (store) =>
    store.put({ slot, nodeIdx, inventory, timestamp: Date.now() })
  );
}

/** Load a save by slot. Returns the record or null if not found. */
export async function loadGame(slot) {
  return withStore("readonly", (store) => store.get(slot)).then(
    (r) => r ?? null
  );
}

/** List all saves, sorted by most recent first. */
export async function listSaves() {
  return withStore("readonly", (store) => store.getAll()).then((all) =>
    (all ?? []).sort((a, b) => b.timestamp - a.timestamp)
  );
}

/** Delete a specific save slot. */
export async function deleteSave(slot) {
  return withStore("readwrite", (store) => store.delete(slot));
}

/** Wipe every save (used by "New Game" to clear autosave). */
export async function clearAllSaves() {
  return withStore("readwrite", (store) => store.clear());
}
