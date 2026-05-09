import { useEffect, useState } from 'react'
import Button from './ui/Button'
import { formatBaht } from '../utils/formatters'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

const EMPTY_DRAFT = {
  name: '',
  details: '',
  material_cost: 0,
  labor_cost: 0,
  planned_duration_days: 7,
}

function TaskModal({ initial, mode = 'add', phaseLabel, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    ...EMPTY_DRAFT,
    ...(initial || {}),
  }))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const total =
    (Number(draft.material_cost) || 0) + (Number(draft.labor_cost) || 0)
  const valid = draft.name?.trim()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSave({
      name: draft.name.trim(),
      details: draft.details || '',
      material_cost: Number(draft.material_cost) || 0,
      labor_cost: Number(draft.labor_cost) || 0,
      planned_duration_days:
        Math.max(1, Number(draft.planned_duration_days) || 1),
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
          <div>
            <h3 className="text-base font-semibold text-ink">
              {mode === 'add' ? '➕ เพิ่มงานใหม่' : '✏️ แก้ไขรายการงาน'}
            </h3>
            {phaseLabel && (
              <p className="text-xs text-ink-muted mt-0.5">
                ในเฟส: {phaseLabel}
              </p>
            )}
          </div>
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
              ชื่องาน <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder="เช่น ก่อผนังภายใน"
              className={inputClass}
              autoFocus
            />
          </label>

          <label className="block">
            <span className="block text-xs text-ink-soft mb-1.5">
              รายละเอียด
            </span>
            <textarea
              rows={2}
              value={draft.details}
              onChange={(e) =>
                setDraft((d) => ({ ...d, details: e.target.value }))
              }
              placeholder="รายละเอียดเพิ่มเติม / ขอบเขตงาน"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-xs text-ink-soft mb-1.5">
                ค่าวัสดุ (บาท)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={draft.material_cost}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, material_cost: e.target.value }))
                }
                className={inputClass + ' font-mono'}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-ink-soft mb-1.5">
                ค่าแรง (บาท)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={draft.labor_cost}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, labor_cost: e.target.value }))
                }
                className={inputClass + ' font-mono'}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-ink-soft mb-1.5">
                แผน (วัน)
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={draft.planned_duration_days}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    planned_duration_days: e.target.value,
                  }))
                }
                className={inputClass + ' font-mono'}
              />
            </label>
          </div>
        </div>

        <div className="rounded-md border border-line bg-elevated/40 px-3 py-2 flex items-center justify-between text-sm">
          <span className="text-ink-soft">รวม วัสดุ + แรง</span>
          <span className="font-mono text-accent text-base">
            {formatBaht(total)}
          </span>
        </div>

        <p className="text-[11px] text-ink-muted">
          💡 จัดตารางวัน/ลำดับงาน ทำได้ที่ Gantt Chart (ลาก/ปรับ)
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} type="button">
            ยกเลิก
          </Button>
          <Button type="submit" disabled={!valid}>
            {mode === 'add' ? 'เพิ่มงาน' : 'บันทึก'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default TaskModal
