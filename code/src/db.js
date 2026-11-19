// db.js — IndexedDB wrapper for Memento save system
//
// WHY IndexedDB over localStorage?
//   • Async: non-blocking, won't freeze the UI
//   • Much larger quota than localStorage (~5MB)
//   • Transactional: atomic writes, no corruption on crash
//   • Stores structured data natively (arrays, objects, blobs)
//   • Industry-standard for PWA offline storage
//
// DB: "memento-db"
// Store: "saves" — keyPath: "slot"
//
// Schema history (DB_VERSION):
//   v1  { slot, nodeIdx: number, inventory, timestamp }
//       nodeIdx was the node's position in the story array.
//   v2  { slot, nodeId: string, inventory, flags: string[], timestamp }
//       nodes are addressed by id ("S01"); flags added.

const DB_NAME    = "memento-db";
const DB_VERSION = 2;
const STORE      = "saves";

// One shared connection, opened lazily. Reusing it avoids opening a new
// connection per call (the v1 code never closed them, and open connections
// block future version upgrades).
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    // Runs only when the stored DB is older than DB_VERSION (or missing).
    // It's the ONLY place where the schema may change, and it runs inside a
    // special "versionchange" transaction: req.transaction.
    req.onupgradeneeded = (e) => {
      const db = req.result;
      const oldVersion = e.oldVersion; // 0 = brand-new database

      // v0 → v1: create the store
      if (oldVersion < 1) {
        db.createObjectStore(STORE, { keyPath: "slot" });
      }

      // v1 → v2: saves switch from array index to node id.
      // v1 saves point into the old demo story (laboratory), which no longer
      // exists, so there's nothing sensible to map them to: delete them.
      // (If the story were the same, here we'd rewrite each record instead,
      //  e.g. record.nodeId = oldIds[record.nodeIdx]; cursor.update(record).)
      if (oldVersion >= 1 && oldVersion < 2) {
        const store = req.transaction.objectStore(STORE);
        store.openCursor().onsuccess = (ev) => {
          const cursor = ev.target.result;
          if (!cursor) return; // done
          if (typeof cursor.value.nodeIdx === "number") cursor.delete();
          cursor.continue();
        };
      }
    };

    req.onsuccess = () => {
      const db = req.result;
      // Another tab wants a newer version: close so we don't block it,
      // the next call will reopen.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => {
      console.warn("IndexedDB upgrade blocked: close other Memento tabs.");
    };
  });

  return dbPromise;
}

// Helper: run one request in a transaction, resolve when the transaction
// commits (not just when the request succeeds), so a resolved write is durable.
async function withStore(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(tx.error);
  });
}

// ── Public API ────────────────────────────────────────────────

/** Save progress to a named slot (upsert). */
export async function saveGame(slot, { nodeId, inventory, flags }) {
  return withStore("readwrite", (store) =>
    store.put({ slot, nodeId, inventory, flags, timestamp: Date.now() })
  );
}

/** Load a save by slot. Returns the record or null if not found. */
export async function loadGame(slot) {
  const r = await withStore("readonly", (store) => store.get(slot));
  return r ?? null;
}

/** List all saves, sorted by most recent first. */
export async function listSaves() {
  const all = await withStore("readonly", (store) => store.getAll());
  return (all ?? []).sort((a, b) => b.timestamp - a.timestamp);
}

/** Delete a specific save slot. */
export async function deleteSave(slot) {
  return withStore("readwrite", (store) => store.delete(slot));
}

/** Wipe every save (used by "New Game" to clear autosave). */
export async function clearAllSaves() {
  return withStore("readwrite", (store) => store.clear());
}
