// ERP backend client (Supabase-backed Flask service on :5001).
//
// - Dev: leave VITE_ERP_API_URL unset → calls are same-origin (/api/erp/*) and
//   Vite proxies them to :5001.
// - Prod: the ERP service is a separate Render service, so set
//   VITE_ERP_API_URL=https://<erp-service>.onrender.com and the frontend calls
//   it cross-origin (the Flask app has CORS enabled).
//
// Read (brand catalog) always falls back to the bundled catalog when the
// backend is unreachable, so the UI keeps working offline.
import { buildBrandPriceIndex } from './mockData'

const ERP_BASE = (import.meta.env.VITE_ERP_API_URL || '').replace(/\/$/, '')
const url = (path) => `${ERP_BASE}${path}`

// Local brand catalog — always available, works offline.
const LOCAL_INDEX = buildBrandPriceIndex()

// Overlay live DB market prices onto the local catalog.
// DB rows: { material_name, current_price }. Match by name → update price;
// unknown names get appended as extra brand entries.
function mergeDbPrices(local, dbRows) {
  const byLabel = new Map(
    local.map((e) => [e.label.trim().toLowerCase(), { ...e }]),
  )
  for (const row of dbRows) {
    const name = String(row.material_name || '').trim()
    if (!name) continue
    const key = name.toLowerCase()
    const price = Number(row.current_price)
    if (byLabel.has(key)) {
      if (Number.isFinite(price)) byLabel.get(key).price = price
    } else {
      byLabel.set(key, {
        label: name,
        price: Number.isFinite(price) ? price : 0,
        unit: '',
        name,
        tier: 'db',
      })
    }
  }
  return [...byLabel.values()]
}

// Brand → price catalog for the custom-price grade autocomplete.
// Tries the ERP backend (Supabase) first; falls back to the bundled catalog
// when the backend isn't reachable. Never throws.
export async function fetchMarketPrices({ signal } = {}) {
  try {
    const res = await fetch(url('/api/erp/materials'), { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = await res.json()
    if (!Array.isArray(rows)) throw new Error('unexpected shape')
    return { source: 'db', items: mergeDbPrices(LOCAL_INDEX, rows) }
  } catch {
    return { source: 'local', items: LOCAL_INDEX }
  }
}

// ---- Market-price management (DB required) — these throw on failure so the
// management UI can surface a clear error / offline state. ----

// Is the ERP backend reachable? (used for the connection badge)
export async function checkErpHealth({ signal } = {}) {
  try {
    const res = await fetch(url('/api/erp/health'), { signal })
    return res.ok
  } catch {
    return false
  }
}

// Raw DB rows [{ id, material_name, current_price, last_updated }]
export async function listMarketPrices({ signal } = {}) {
  const res = await fetch(url('/api/erp/materials'), { signal })
  if (!res.ok) throw new Error(`โหลดราคาไม่สำเร็จ (HTTP ${res.status})`)
  return res.json()
}

// Create (no id) or update (with id) one material price. Returns the saved row.
export async function saveMarketPrice(row) {
  const body = JSON.stringify({
    material_name: row.material_name,
    current_price: row.current_price,
  })
  const opts = { method: row.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body }
  const path = row.id ? `/api/erp/materials/${row.id}` : '/api/erp/materials'
  const res = await fetch(url(path), opts)
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}))
    throw new Error(msg.error || `บันทึกไม่สำเร็จ (HTTP ${res.status})`)
  }
  return res.json()
}

export async function deleteMarketPrice(id) {
  const res = await fetch(url(`/api/erp/materials/${id}`), { method: 'DELETE' })
  if (!res.ok) throw new Error(`ลบไม่สำเร็จ (HTTP ${res.status})`)
  return res.json()
}

export { LOCAL_INDEX, ERP_BASE }
