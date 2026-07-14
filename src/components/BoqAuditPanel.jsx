import { useState } from 'react'
import Card from './ui/Card'

// แผงตรวจสอบ BOQ — รวม "ความผิดปกติ" ที่ engine จับได้ (ฐานรากปนชนิด/หน่วยเพี้ยน/
// นับซ้ำ/หมวดหาย/ราคาผิดปกติ) + "งานที่ AI ไม่แน่ใจ" (uncertainties) เพื่อให้ผู้ใช้
// ตรวจ/ยืนยันก่อนใช้ราคา — เป็นส่วนแนะนำ ไม่รวมในเอกสาร (ซ่อนตอน print/export)

const LEVEL_STYLE = {
  error: { chip: 'bg-danger/15 text-danger border-danger/40', icon: '⛔', label: 'ต้องแก้' },
  warn: { chip: 'bg-amber-500/15 text-amber-600 border-amber-500/40', icon: '⚠️', label: 'ควรตรวจ' },
  info: { chip: 'bg-sky-500/15 text-sky-600 border-sky-500/40', icon: 'ℹ️', label: 'หมายเหตุ' },
}

function BoqAuditPanel({ result }) {
  const anomalies = Array.isArray(result?.boq_anomalies) ? result.boq_anomalies : []
  const uncertainties = Array.isArray(result?.uncertainties)
    ? result.uncertainties.filter(Boolean)
    : []
  const [open, setOpen] = useState(true)

  const total = anomalies.length + uncertainties.length
  if (total === 0) {
    return (
      <div
        data-print-hide
        className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-600 flex items-center gap-2"
      >
        ✅ <span className="font-medium">ตรวจสอบผ่าน</span> — ไม่พบความผิดปกติ
        และยอดรวมทุกระดับตรงกัน
      </div>
    )
  }

  const counts = { error: 0, warn: 0, info: 0 }
  for (const a of anomalies) counts[a.level] = (counts[a.level] || 0) + 1

  return (
    <Card data-print-hide className="overflow-hidden border-amber-500/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-elevated/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          🔎 ผลตรวจสอบ BOQ
          <span className="text-xs font-normal text-ink-muted">
            ({total} รายการต้องดู)
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          {counts.error > 0 && (
            <span className={`px-1.5 py-0.5 rounded border ${LEVEL_STYLE.error.chip}`}>
              ⛔ {counts.error}
            </span>
          )}
          {counts.warn > 0 && (
            <span className={`px-1.5 py-0.5 rounded border ${LEVEL_STYLE.warn.chip}`}>
              ⚠️ {counts.warn}
            </span>
          )}
          {uncertainties.length > 0 && (
            <span className="px-1.5 py-0.5 rounded border bg-sky-500/15 text-sky-600 border-sky-500/40">
              ❓ {uncertainties.length}
            </span>
          )}
          <span className="text-ink-muted ml-1">{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-3 space-y-3">
          {uncertainties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-soft mb-1.5">
                ❓ งานที่ AI ไม่แน่ใจ — โปรดยืนยันจากแบบก่อนใช้ราคา
              </p>
              <ul className="space-y-1">
                {uncertainties.map((u, i) => (
                  <li
                    key={i}
                    className="text-xs text-ink-soft flex gap-2 leading-relaxed"
                  >
                    <span className="text-sky-500 shrink-0">•</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {anomalies.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-soft mb-1.5">
                รายการที่ระบบตรวจพบ
              </p>
              <ul className="space-y-1.5">
                {anomalies.map((a, i) => {
                  const st = LEVEL_STYLE[a.level] || LEVEL_STYLE.info
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] ${st.chip}`}
                      >
                        {st.icon} {st.label}
                      </span>
                      <span className="text-ink-soft">{a.message}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-ink-muted pt-1 border-t border-line/60">
            💡 ราคาทั้งหมดคำนวณโดยโปรแกรมจาก "ตารางเรตกลาง" (AI ถอดปริมาณเท่านั้น) —
            รายการที่ยังไม่มีเรตจะขึ้น "รอกำหนดราคา" ให้กรอกเอง
          </p>
        </div>
      )}
    </Card>
  )
}

export default BoqAuditPanel
