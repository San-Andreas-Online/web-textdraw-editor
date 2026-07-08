
const DB_NAME = 'textdraw-editor'
const DB_VERSION = 1
const STORE = 'projects'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(mode, callback) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const result = callback(store)

    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function makeProjectId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export async function saveProject(project) {
  await withStore('readwrite', (store) => store.put(project))
  return project
}

export async function listProjects() {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readonly')
  const store = tx.objectStore(STORE)
  const all = await reqToPromise(store.getAll())
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getProject(id) {
  return withStore('readonly', (store) => reqToPromise(store.get(id))).then((p) => p)
}

export async function deleteProject(id) {
  await withStore('readwrite', (store) => store.delete(id))
}