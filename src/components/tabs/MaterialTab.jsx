import { useEffect, useMemo, useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import GuidePopup from '../GuidePopup'
import { MATERIAL_GRADES } from '../../utils/constants'
import { formatBaht, formatNumber } from '../../utils/formatters'
import { useAnalysisContext } from '../../contexts/AnalysisContext'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

const EMPTY_DRAFT = {
  id: null,
  name: '',
  spec: '',
  quantity: 1,
  unit: '',
  pricePerUnit: 0,
}

// ========== Modal: edit/add material ==========
function MaterialModal({ initial, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    ...EMPTY_DRAFT,
    ...(initial || {}),
  }))
  const isNew = !initial?.id

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const total =
    (Number(draft.quantity) || 0) * (Number(draft.pricePerUnit) || 0)

  const valid = draft.name.trim() && Number(draft.quantity) > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSave({
      ...draft,
      quantity: Number(draft.quantity) || 0,
      pricePerUnit: Number(draft.pricePerUnit) || 0,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-print-hide
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-ink">
            {isNew ? '➕ เพิ่มรายการวัสดุ' : '✏️ แก้ไขรายการวัสดุ'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full text-ink-soft hover:text-ink hover:bg-elevated"
            aria-label="ปิด"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs text-ink-soft mb-1.5">
              ชื่อวัสดุ <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder="เช่น ปูนซีเมนต์ปอร์ตแลนด์"
              className={inputClass}
              autoFocus
            />
          </label>

          <label className="block">
            <span className="block text-xs text-ink-soft mb-1.5">
              สเปก / ยี่ห้อ
            </span>
            <input
              type="text"
              value={draft.spec}
              onChange={(e) =>
                setDraft((d) => ({ ...d, spec: e.target.value }))
              }
              placeholder="เช่น ตราเสือ 50 กก."
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-ink-soft mb-1.5">
                จำนวน <span className="text-danger">*</span>
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={draft.quantity}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quantity: e.target.value }))
                }
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-ink-soft mb-1.5">หน่วย</span>
              <input
                type="text"
                value={draft.unit}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, unit: e.target.value }))
                }
                placeholder="ถุง / ก้อน / ตร.ม."
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs text-ink-soft mb-1.5">
              ราคาต่อหน่วย (บาท)
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={draft.pricePerUnit}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pricePerUnit: e.target.value }))
              }
              className={inputClass + ' font-mono'}
            />
          </label>
        </div>

        <div className="rounded-md border border-line bg-elevated/40 px-3 py-2 flex items-center justify-between text-sm">
          <span className="text-ink-soft">รวม</span>
          <span className="font-mono text-accent text-base">
            {formatBaht(total)}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">
            ยกเลิก
          </Button>
          <Button type="submit" disabled={!valid}>
            {isNew ? 'เพิ่มรายการ' : 'บันทึก'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ========== Confirm dialog (delete) ==========
function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      data-print-hide
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-xl space-y-4"
      >
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-soft">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel || 'ยืนยัน'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ========== Tier tabs ==========
function TierTabs({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
      {MATERIAL_GRADES.map((g) => {
        const active = g.id === value
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              active
                ? 'bg-accent text-canvas'
                : 'text-ink-soft hover:bg-elevated hover:text-ink'
            }`}
          >
            {g.icon} {g.label}
            <span className="ml-1.5 opacity-70 text-xs font-mono">
              ×{g.multiplier.toFixed(2)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ========== Labor input row ==========
function LaborInput({ value, onCommit, gradeLabel }) {
  const [draft, setDraft] = useState(String(value || 0))
  // Re-sync when external value changes (e.g., switch tier)
  useEffect(() => {
    setDraft(String(value || 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = () => {
    const n = Number(draft.replace(/,/g, ''))
    if (Number.isFinite(n) && n >= 0) onCommit(n)
    else setDraft(String(value || 0))
  }

  return (
    <div className="rounded-lg border border-info/40 bg-info/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-ink flex items-center gap-2">
          👷 ค่าแรงเหมา ({gradeLabel})
        </p>
        <p className="text-xs text-ink-muted mt-0.5">
          ค่าแรงรวมทั้งโปรเจกต์ที่ผู้รับเหมาเสนอ — เมื่อตั้งค่าแล้วจะ override
          ผลรวมค่าแรงต่อ task ใน BOQ และ sync ไปทุกหน้า
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="any"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur()
            if (e.key === 'Escape') {
              setDraft(String(value || 0))
              e.target.blur()
            }
          }}
          placeholder="0"
          className="w-32 rounded border border-line bg-canvas px-3 py-2 text-right font-mono text-sm text-ink focus:outline-none focus:border-accent"
        />
        <span className="text-xs text-ink-muted">บาท</span>
      </div>
    </div>
  )
}

// ========== Main tab ==========
function MaterialTab({ projectInfo, onGradeChange }) {
  const {
    materialEdits,
    updateMaterial,
    deleteMaterial,
    calculateMaterialTotal,
    materialLaborByGrade,
    setMaterialLabor,
  } = useAnalysisContext()

  const grade = projectInfo?.grade || 'standard'
  const gradeMeta = MATERIAL_GRADES.find((g) => g.id === grade)

  const [editing, setEditing] = useState(null) // null | { item } | 'new'
  const [confirmDelete, setConfirmDelete] = useState(null)

  const items = useMemo(
    () => (materialEdits[grade] || []).filter((m) => !m.isDeleted),
    [materialEdits, grade],
  )
  const total = useMemo(
    () => calculateMaterialTotal(grade),
    [calculateMaterialTotal, grade],
  )
  const labor = Number(materialLaborByGrade?.[grade]) || 0
  const grandTotal = total + labor

  const handleSave = (data) => {
    updateMaterial(grade, data)
    setEditing(null)
  }
  const handleConfirmDelete = () => {
    if (confirmDelete) deleteMaterial(grade, confirmDelete.id)
    setConfirmDelete(null)
  }
  const handleLaborChange = (n) => setMaterialLabor(grade, n)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-ink">
            🧱 รายการวัสดุก่อสร้าง
          </h3>
          <GuidePopup title="ระบบวัสดุ 3 เกรด">
            <p>
              เลือกเกรดที่จะแก้ไขจาก tab ด้านล่าง — แต่ละเกรด (ประหยัด /
              มาตรฐาน / พรีเมี่ยม) มีรายการวัสดุของตัวเอง
            </p>
            <p>
              <strong>เพิ่ม / แก้ / ลบ</strong> ใช้ได้เลย — รายการที่ลบจะถูก
              soft-delete (เก็บ baseline AI ไว้) เพื่อใช้เปรียบเทียบ
            </p>
            <p>
              ทุกครั้งที่แก้ไข <strong>โหมด Manual</strong> จะเปิดอัตโนมัติ
              และยอดรวมจะ sync ไปที่ <strong>Summary, BOQ, Contract</strong>{' '}
              ทันที
            </p>
          </GuidePopup>
        </div>
        <TierTabs value={grade} onChange={onGradeChange} />
        {gradeMeta && (
          <p className="text-xs text-ink-muted">
            กำลังแก้: <span className="text-ink font-medium">{gradeMeta.icon} {gradeMeta.label}</span> — {gradeMeta.desc}
          </p>
        )}
      </div>

      <LaborInput
        value={labor}
        onCommit={handleLaborChange}
        gradeLabel={gradeMeta?.label || 'มาตรฐาน'}
      />

      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-sm text-ink-soft mb-1">
              ยังไม่มีรายการวัสดุในเกรด{' '}
              <span className="text-ink font-medium">
                {gradeMeta?.label}
              </span>
            </p>
            <p className="text-xs text-ink-muted">
              คลิก "+ เพิ่มรายการวัสดุ" ด้านล่างเพื่อเริ่ม
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-elevated/60 text-ink-soft text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">ชื่อวัสดุ</th>
                  <th className="text-left px-3 py-3 font-medium">สเปก</th>
                  <th className="text-right px-3 py-3 font-medium w-24">จำนวน</th>
                  <th className="text-left px-3 py-3 font-medium w-20">หน่วย</th>
                  <th className="text-right px-3 py-3 font-medium w-32">
                    ราคา/หน่วย
                  </th>
                  <th className="text-right px-3 py-3 font-medium w-32">รวม</th>
                  <th className="text-center px-3 py-3 font-medium w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => {
                  const lineTotal =
                    (Number(m.quantity) || 0) *
                    (Number(m.pricePerUnit) || 0)
                  return (
                    <tr
                      key={m.id}
                      className="border-t border-line/40 hover:bg-elevated/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-ink">{m.name || '—'}</td>
                      <td className="px-3 py-2.5 text-ink-soft text-xs">
                        {m.spec || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink">
                        {formatNumber(m.quantity)}
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted">
                        {m.unit || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink">
                        {formatBaht(m.pricePerUnit)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink font-medium">
                        {formatBaht(lineTotal)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(m)}
                            title="แก้ไข"
                            className="w-7 h-7 rounded text-ink-muted hover:text-accent hover:bg-accent/10 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(m)}
                            title="ลบ"
                            className="w-7 h-7 rounded text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-elevated/40 border-t border-line text-ink-soft">
                  <td className="px-4 py-2.5" colSpan={5}>
                    🧱 รวมค่าวัสดุ ({items.length} รายการ)
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink">
                    {formatBaht(total)}
                  </td>
                  <td className="px-3 py-2.5"></td>
                </tr>
                <tr className="bg-elevated/40 text-ink-soft">
                  <td className="px-4 py-2.5" colSpan={5}>
                    👷 ค่าแรงเหมา
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-ink">
                    {formatBaht(labor)}
                  </td>
                  <td className="px-3 py-2.5"></td>
                </tr>
                <tr className="bg-accent/10 border-t-2 border-accent/30 font-semibold">
                  <td className="px-4 py-3 text-ink" colSpan={5}>
                    💰 รวมทั้งสิ้น (วัสดุ + แรง)
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-accent text-base">
                    {formatBaht(grandTotal)}
                  </td>
                  <td className="px-3 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Even when there are no items, still show the labor + grand total */}
      {items.length === 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">👷 ค่าแรงเหมา</span>
            <span className="font-mono text-ink">{formatBaht(labor)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-line font-semibold">
            <span className="text-ink">💰 รวมทั้งสิ้น</span>
            <span className="font-mono text-accent">{formatBaht(grandTotal)}</span>
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center gap-3">
        <Button variant="secondary" onClick={() => setEditing('new')}>
          ➕ เพิ่มรายการวัสดุ
        </Button>
        <p className="text-xs text-ink-muted">
          การเปลี่ยนแปลงจะ sync ไป Summary, BOQ, และ Contract อัตโนมัติ
        </p>
      </div>

      {editing && (
        <MaterialModal
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="ยืนยันการลบรายการ"
          message={`ลบ "${confirmDelete.name || 'รายการนี้'}" ออกจากเกรด ${gradeMeta?.label}?`}
          confirmLabel="🗑️ ลบ"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

export default MaterialTab
