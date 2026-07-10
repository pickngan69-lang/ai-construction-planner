import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import GuidePopup from '../components/GuidePopup'
import ReferencePricePanel from '../components/ReferencePricePanel'
import {
  checkErpHealth,
  listMarketPrices,
  saveMarketPrice,
  deleteMarketPrice,
  ERP_BASE,
} from '../services/erpService'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

const EMPTY_DRAFT = { material_name: '', current_price: '' }

// หน้าจัดการ "ราคากลางวัสดุ (ตลาด)" — แก้ราคาปัจจุบันเข้า Supabase
// autocomplete ในเกรด "ราคาที่กำหนด" จะดึงราคาจากตารางนี้ไปใช้ทันที
function MaterialPrices() {
  const navigate = useNavigate()
  // status: 'loading' | 'ready' | 'offline'
  const [status, setStatus] = useState('loading')
  const [rows, setRows] = useState([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [notice, setNotice] = useState(null) // { type: 'ok'|'err', text }
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const ok = await checkErpHealth()
      if (!ok) {
        if (alive) setStatus('offline')
        return
      }
      try {
        const data = await listMarketPrices()
        if (alive) {
          setRows(data.map((r) => ({ ...r, _dirty: false })))
          setStatus('ready')
        }
      } catch (e) {
        if (alive) {
          setStatus('offline')
          setNotice({ type: 'err', text: e.message })
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      (r.material_name || '').toLowerCase().includes(q),
    )
  }, [rows, query])

  const setField = (id, field, value) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: value, _dirty: true } : r,
      ),
    )

  const handleSave = async (row) => {
    setBusy(true)
    setNotice(null)
    try {
      const saved = await saveMarketPrice({
        id: row.id,
        material_name: row.material_name,
        current_price: Number(row.current_price) || 0,
      })
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...saved, _dirty: false } : r)),
      )
      setNotice({ type: 'ok', text: `บันทึก "${saved.material_name}" แล้ว` })
    } catch (e) {
      setNotice({ type: 'err', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`ลบ "${row.material_name}" ออกจากราคากลาง?`)) return
    setBusy(true)
    setNotice(null)
    try {
      await deleteMarketPrice(row.id)
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      setNotice({ type: 'ok', text: `ลบ "${row.material_name}" แล้ว` })
    } catch (e) {
      setNotice({ type: 'err', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  // ชื่อวัสดุที่มีอยู่ในตารางแล้ว (ใช้แสดง ✓ ในแผงราคากลางอ้างอิง)
  const importedNames = useMemo(
    () => new Set(rows.map((r) => r.material_name)),
    [rows],
  )

  // คัดลอกราคากลางอ้างอิง 1 รายการลงตารางของเรา (ซ้ำชื่อ → อัปเดตแถวเดิม)
  const handleImportReference = async ({ material_name, current_price }) => {
    setBusy(true)
    setNotice(null)
    try {
      const existing = rows.find((r) => r.material_name === material_name)
      const saved = await saveMarketPrice({
        id: existing?.id,
        material_name,
        current_price,
      })
      setRows((prev) => {
        const idx = prev.findIndex(
          (r) => r.id === saved.id || r.material_name === saved.material_name,
        )
        if (idx >= 0) {
          return prev.map((r, i) => (i === idx ? { ...saved, _dirty: false } : r))
        }
        return [{ ...saved, _dirty: false }, ...prev]
      })
      setNotice({ type: 'ok', text: `เพิ่ม "${saved.material_name}" จากราคากลางแล้ว` })
    } catch (e) {
      setNotice({ type: 'err', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async () => {
    const name = draft.material_name.trim()
    if (!name) {
      setNotice({ type: 'err', text: 'กรุณาระบุชื่อวัสดุ/แบรนด์' })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const saved = await saveMarketPrice({
        material_name: name,
        current_price: Number(draft.current_price) || 0,
      })
      setRows((prev) => [{ ...saved, _dirty: false }, ...prev])
      setDraft(EMPTY_DRAFT)
      setNotice({ type: 'ok', text: `เพิ่ม "${saved.material_name}" แล้ว` })
    } catch (e) {
      setNotice({ type: 'err', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Header onBack={() => navigate('/')} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-ink">🏷️ ราคากลางวัสดุ (ตลาด)</h2>
          <GuidePopup title="ราคากลางวัสดุคืออะไร">
            <p>
              ตารางราคาปัจจุบันของวัสดุ/แบรนด์ เก็บใน Supabase — เมื่อแก้ที่นี่
              ระบบ autocomplete ในเกรด <strong>"✏️ ราคาที่กำหนด"</strong>{' '}
              จะดึงราคาล่าสุดไปใช้ทันที
            </p>
            <p>
              ใช้ตั้ง "ราคาปัจจุบันที่แม่นยำ" เพื่อทดสอบการประเมินให้ตรงตลาด
            </p>
          </GuidePopup>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
              status === 'ready'
                ? 'bg-success/15 text-success'
                : status === 'offline'
                  ? 'bg-danger/15 text-danger'
                  : 'bg-elevated text-ink-muted'
            }`}
          >
            {status === 'ready'
              ? '🟢 เชื่อมต่อฐานข้อมูล'
              : status === 'offline'
                ? '🔴 ไม่ได้เชื่อมต่อ backend'
                : '⏳ กำลังเชื่อมต่อ…'}
          </span>
        </div>

        <p className="text-xs text-ink-muted">
          ปลายทาง ERP: <code className="text-ink-soft">{ERP_BASE || '(same-origin / dev proxy → :5001)'}</code>
        </p>

        {notice && (
          <div
            className={`rounded-md border px-4 py-2.5 text-sm ${
              notice.type === 'ok'
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-danger/40 bg-danger/10 text-danger'
            }`}
          >
            {notice.type === 'ok' ? '✅ ' : '⚠️ '}
            {notice.text}
          </div>
        )}

        {status === 'offline' && (
          <Card className="p-6 space-y-3">
            <p className="text-sm text-ink">
              🔌 ยังไม่ได้เชื่อมต่อ ERP backend — แก้ราคากลางไม่ได้ตอนนี้
            </p>
            <div className="text-sm text-ink-soft space-y-1.5">
              <p className="font-medium text-ink">วิธีเปิดใช้งาน:</p>
              <p>
                • <strong>Local:</strong> ตั้ง <code>DATABASE_URL</code> ใน{' '}
                <code>erp-backend/.env</code> → รัน migrations (001, 002) →{' '}
                <code>python erp-backend/app.py</code>
              </p>
              <p>
                • <strong>Online:</strong> deploy erp-backend เป็น Web Service บน
                Render แล้วตั้ง <code>VITE_ERP_API_URL</code> ที่ frontend service
              </p>
              <p className="text-ink-muted text-xs">
                หมายเหตุ: ระหว่างนี้ autocomplete ยังทำงานได้จากแคตตาล็อกในเครื่อง
                (เพียงแต่ราคายังไม่ใช่ค่าจาก DB สด)
              </p>
            </div>
          </Card>
        )}

        {status === 'ready' && (
          <>
            {/* ราคากลางอ้างอิงจากกระทรวงพาณิชย์ (สนค.) */}
            <ReferencePricePanel
              onImport={handleImportReference}
              importedNames={importedNames}
            />

            {/* เพิ่มรายการใหม่ */}
            <Card className="p-4">
              <p className="text-sm font-medium text-ink mb-3">➕ เพิ่มราคาวัสดุ/แบรนด์</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={draft.material_name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, material_name: e.target.value }))
                  }
                  placeholder="ชื่อวัสดุ / แบรนด์ เช่น ปูน SCG 50 กก."
                  className={inputClass + ' sm:flex-1'}
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={draft.current_price}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, current_price: e.target.value }))
                  }
                  placeholder="ราคา (บาท)"
                  className={inputClass + ' sm:w-40 font-mono'}
                />
                <Button onClick={handleAdd} disabled={busy}>
                  เพิ่ม
                </Button>
              </div>
            </Card>

            {/* ค้นหา */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 ค้นหาวัสดุ/แบรนด์…"
              className={inputClass}
            />

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-elevated/60 text-ink-soft text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">วัสดุ / แบรนด์</th>
                      <th className="text-right px-3 py-3 font-medium w-40">ราคา (บาท)</th>
                      <th className="text-left px-3 py-3 font-medium w-40">อัปเดตล่าสุด</th>
                      <th className="text-center px-3 py-3 font-medium w-32">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                          {rows.length === 0
                            ? 'ยังไม่มีราคาในฐานข้อมูล — เพิ่มด้านบน หรือรัน migration 002 เพื่อ seed แบรนด์'
                            : 'ไม่พบรายการที่ค้นหา'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-line/40 hover:bg-elevated/20 transition-colors"
                        >
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={r.material_name}
                              onChange={(e) =>
                                setField(r.id, 'material_name', e.target.value)
                              }
                              className={inputClass}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={r.current_price}
                              onChange={(e) =>
                                setField(r.id, 'current_price', e.target.value)
                              }
                              className={inputClass + ' text-right font-mono'}
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-ink-muted">
                            {r.last_updated
                              ? new Date(r.last_updated).toLocaleString('th-TH', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSave(r)}
                                disabled={busy || !r._dirty}
                                title={r._dirty ? 'บันทึก' : 'ไม่มีการแก้ไข'}
                                className={`px-2.5 h-8 rounded text-xs font-medium transition-colors ${
                                  r._dirty
                                    ? 'bg-accent text-canvas hover:opacity-90'
                                    : 'text-ink-muted cursor-default'
                                }`}
                              >
                                💾 บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(r)}
                                disabled={busy}
                                title="ลบ"
                                className="w-8 h-8 rounded text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <p className="text-xs text-ink-muted">
              รวม {rows.length} รายการ · แก้ราคาแล้วกด "💾 บันทึก" ในแถวนั้น →
              autocomplete เกรด "ราคาที่กำหนด" จะใช้ราคาล่าสุดทันที
            </p>
          </>
        )}
      </main>
    </>
  )
}

export default MaterialPrices
