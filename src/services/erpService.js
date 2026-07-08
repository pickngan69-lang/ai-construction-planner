// ERP backend client (Supabase-backed Flask service on :5001).
// In dev, Vite proxies /api/erp → :5001. In prod without the ERP service,
// calls fail and we fall back to the bundled brand catalog — so the UI
// (brand autocomplete in the "ราคาที่กำหนด" grade) always works.
import { buildBrandPriceIndex } from './mockData'

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

// Brand → price catalog for the custom-price grade.
// Tries the ERP backend (Supabase) first; falls back to the bundled catalog
// when the backend isn't reachable. Never throws.
export async function fetchMarketPrices({ signal } = {}) {
  try {
    const res = await fetch('/api/erp/materials', { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = await res.json()
    if (!Array.isArray(rows)) throw new Error('unexpected shape')
    return { source: 'db', items: mergeDbPrices(LOCAL_INDEX, rows) }
  } catch {
    return { source: 'local', items: LOCAL_INDEX }
  }
}

export { LOCAL_INDEX }
