// Reference material prices from the TPSO (สนค. กระทรวงพาณิชย์) Open API.
// Official Thai construction-material reference prices, per province, per month,
// in baht (price before VAT + price incl. VAT). Public — no API key.
//
// We proxy it server-side (browser can't call it directly due to CORS) and
// cache each (year, month, type) result for a few hours since it's monthly data.
import { TPSO_PROVINCES } from './tpsoProvinces.js'

const TPSO_URL = 'https://index-api.tpso.go.th/OpenApi/CmiPrice/Month'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const cache = new Map() // `${year}-${month}-${type}` -> { at, rows }

function normalize(raw) {
  return (Array.isArray(raw) ? raw : []).map((r) => ({
    code: r.commodityCode,
    name: r.commodityNameTH,
    unit: r.unitName,
    price: r.priceCur, // ราคาก่อน VAT (ตามแบบราคากลาง)
    priceVat: r.priceVAT, // ราคารวม VAT
  }))
}

async function fetchOne(year, month, type) {
  const key = `${year}-${month}-${type}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows

  const res = await fetch(TPSO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month, type }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`TPSO HTTP ${res.status}`)
  const rows = normalize(await res.json())
  cache.set(key, { at: Date.now(), rows })
  return rows
}

// Try the requested period; TPSO data lags ~1 month, so step back up to 3
// months until we find published data. Returns the period actually used.
export async function getReferencePrices({ year, month, type }) {
  let y = Number(year)
  let m = Number(month)
  const t = Number(type)
  for (let i = 0; i < 4; i++) {
    const rows = await fetchOne(y, m, t)
    if (rows.length) return { year: y, month: m, type: t, rows }
    m -= 1
    if (m < 1) {
      m = 12
      y -= 1
    }
  }
  return { year: Number(year), month: Number(month), type: t, rows: [] }
}

export { TPSO_PROVINCES }
