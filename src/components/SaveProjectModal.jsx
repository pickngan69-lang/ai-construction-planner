import { useEffect, useState } from 'react'
import Button from './ui/Button'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <p className="text-[10px] text-ink-muted mt-1">{hint}</p>}
    </label>
  )
}

// ป๊อปอัปเก็บข้อมูลลูกค้าก่อนบันทึกโปรเจกต์เข้ากระดาน (สำหรับ Mini ERP)
function SaveProjectModal({ initial, defaultLocation = '', onConfirm, onClose }) {
  const isEdit = !!initial
  const [form, setForm] = useState({
    customerName: initial?.customerName || initial?.client || '',
    contact: initial?.contact || '',
    location: initial?.location || defaultLocation,
    startDate: initial?.startDate || '',
  })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const valid = form.customerName.trim().length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid) return
    onConfirm({
      customerName: form.customerName.trim(),
      contact: form.contact.trim(),
      location: form.location.trim(),
      startDate: form.startDate,
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
        className="relative w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">
              {isEdit ? '✏️ แก้ไขข้อมูลลูกค้า' : '💾 บันทึกโปรเจกต์เข้ากระดาน'}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              กรอกข้อมูลลูกค้าเพื่อจัดการในระบบ ERP
            </p>
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
          <Field label="ชื่อลูกค้า" required>
            <input
              type="text"
              value={form.customerName}
              onChange={update('customerName')}
              placeholder="เช่น คุณสมชาย ใจดี"
              className={inputClass}
              autoFocus
            />
          </Field>

          <Field label="เบอร์ติดต่อ / LINE">
            <input
              type="text"
              value={form.contact}
              onChange={update('contact')}
              placeholder="เช่น 08x-xxx-xxxx หรือ LINE ID"
              className={inputClass}
            />
          </Field>

          <Field label="สถานที่ก่อสร้าง">
            <input
              type="text"
              value={form.location}
              onChange={update('location')}
              placeholder="เช่น อ.เมือง จ.เชียงใหม่"
              className={inputClass}
            />
          </Field>

          <Field label="วันที่คาดว่าจะเริ่มงาน">
            <input
              type="date"
              value={form.startDate}
              onChange={update('startDate')}
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={!valid}>
            {isEdit ? 'บันทึกการแก้ไข' : 'ยืนยันบันทึก'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SaveProjectModal
