import { useEffect, useMemo, useState } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'
import GuidePopup from './GuidePopup'
import { fetchReferencePrices, listReferenceProvinces } from '../services/erpService'
import { formatBaht } from '../utils/formatters'

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const MAX_ROWS = 150 // cap rendered rows (ส่วนกลาง has ~5,500) — refine via search

// ราคากลางอ้างอิงจากกระทรวงพาณิชย์ (สนค.) — เลือกจังหวัด → ดึงราคาจริง → กด "ใช้"
// เพื่อคัดลอกลงตารางราคากลางของเรา (ผู้รับเหมาแก้ทับได้ภายหลัง)
function ReferencePricePanel({ onImport, importedNames }) {
  const [provinces, setProvinces] = useState([])
  const [type, setType] = useState(10)
  const [data, setData] = useState(null) // { year, month, rows }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    listReferenceProvinces()
      .then((list) => alive && setProvinces(list))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchReferencePrices({ type })
      setData(res)
      if (!res.rows.length) {
        setError('ยังไม่มีข้อมูลราคากลางของจังหวัด/เดือนนี้ — ลองจังหวัดอื่น')
      }
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const rows = data?.rows || []
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => (r.name || '').toLowerCase().includes(q))
  }, [data, query])

  const provinceName =
    provinces.find((p) => p.code === type)?.name || `จังหวัด ${type}`

  return (
    <Card className="p-4 space-y-3 border-accent/30">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">
          📚 ราคากลางอ้างอิง — กระทรวงพาณิชย์ (สนค.)
        </h3>
        <GuidePopup title="ราคากลางอ้างอิงคืออะไร">
          <p>
            ราคาวัสดุก่อสร้าง <strong>ทางการ รายจังหวัด รายเดือน</strong> จาก
            สำนักงานนโยบายและยุทธศาสตร์การค้า (สนค.) กระทรวงพาณิชย์
          </p>
          <p>
            เลือกจังหวัด → กด "ดึงราคากลาง" → กด <strong>"ใช้"</strong>{' '}
            ในแถวที่ต้องการ เพื่อคัดลอกลงตารางราคากลางของคุณ (แก้ทับเป็นราคาจริงได้)
          </p>
          <p className="text-ink-muted">
            * ราคาก่อน VAT ตามแบบราคากลาง (ไม่รวมค่าขนส่ง)
          </p>
        </GuidePopup>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(Number(e.target.value))}
          className="rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent transition-colors"
        >
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        <Button onClick={load} disabled={loading}>
          {loading ? 'กำลังดึง…' : '⬇ ดึงราคากลาง'}
        </Button>
        {data?.rows?.length > 0 && (
          <span className="text-xs text-ink-muted">
            {provinceName} · งวด {THAI_MONTHS[(data.month || 1) - 1]} {data.year} ·
            พบ {data.rows.length.toLocaleString('th-TH')} รายการ
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          ⚠️ {error}
        </div>
      )}

      {data?.rows?.length > 0 && (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 ค้นหาวัสดุในราคากลาง (เช่น ปูน, เหล็ก, กระเบื้อง)…"
            className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
          />
          <div className="text-xs text-ink-muted">
            แสดง {Math.min(filtered.length, MAX_ROWS).toLocaleString('th-TH')} จาก{' '}
            {filtered.length.toLocaleString('th-TH')} รายการ
            {filtered.length > MAX_ROWS && ' — พิมพ์ค้นหาเพื่อกรองให้แคบลง'}
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-line">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-elevated text-ink-soft text-xs">
                  <th className="text-left px-3 py-2 font-medium">วัสดุ</th>
                  <th className="text-left px-2 py-2 font-medium w-20">หน่วย</th>
                  <th className="text-right px-2 py-2 font-medium w-28">ราคา</th>
                  <th className="text-right px-2 py-2 font-medium w-28">รวม VAT</th>
                  <th className="text-center px-2 py-2 font-medium w-16">ใช้</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, MAX_ROWS).map((r) => {
                  const used = importedNames?.has(r.name)
                  return (
                    <tr
                      key={r.code}
                      className="border-t border-line/40 hover:bg-elevated/20"
                    >
                      <td className="px-3 py-1.5 text-ink">{r.name}</td>
                      <td className="px-2 py-1.5 text-ink-muted text-xs">{r.unit}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-ink">
                        {formatBaht(r.price)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-ink-muted text-xs">
                        {formatBaht(r.priceVat)}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onImport({ material_name: r.name, current_price: r.price })
                          }
                          disabled={used}
                          className={`px-2 h-7 rounded text-xs font-medium transition-colors ${
                            used
                              ? 'text-success cursor-default'
                              : 'bg-accent text-canvas hover:opacity-90'
                          }`}
                        >
                          {used ? '✓' : '➕'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}

export default ReferencePricePanel
