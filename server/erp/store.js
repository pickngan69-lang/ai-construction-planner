// File-based store for ERP market material prices (mirrors the auth store's
// pattern). Persists to server/.data/erp-materials.json and seeds itself from
// MATERIALS_SEED on first run so the page has data immediately — no external DB.
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { MATERIALS_SEED } from './materialsSeed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../.data')
const DATA_FILE = path.join(DATA_DIR, 'erp-materials.json')

function seededStore() {
  const now = new Date().toISOString()
  const materials = MATERIALS_SEED.map(([name, price], i) => ({
    id: i + 1,
    material_name: name,
    current_price: price,
    last_updated: now,
  }))
  return { materials, nextId: materials.length + 1 }
}

async function saveStore(store) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8')
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    const store = seededStore()
    await saveStore(store)
    return store
  }
}

export async function listMaterials() {
  const store = await ensureStore()
  return [...store.materials].sort((a, b) =>
    String(a.material_name).localeCompare(String(b.material_name), 'th'),
  )
}

export async function createMaterial({ material_name, current_price }) {
  const store = await ensureStore()
  const row = {
    id: store.nextId++,
    material_name,
    current_price,
    last_updated: new Date().toISOString(),
  }
  store.materials.push(row)
  await saveStore(store)
  return row
}

export async function updateMaterial(id, patch) {
  const store = await ensureStore()
  const row = store.materials.find((m) => String(m.id) === String(id))
  if (!row) return null
  if (patch.material_name !== undefined) row.material_name = patch.material_name
  if (patch.current_price !== undefined) row.current_price = patch.current_price
  row.last_updated = new Date().toISOString()
  await saveStore(store)
  return row
}

export async function deleteMaterial(id) {
  const store = await ensureStore()
  const before = store.materials.length
  store.materials = store.materials.filter((m) => String(m.id) !== String(id))
  if (store.materials.length === before) return false
  await saveStore(store)
  return true
}
