import { useEffect, useState } from 'react'
import InvoiceDocument from './InvoiceDocument'
import Button from './ui/Button'
import { exportCurrentSection } from '../utils/exportPdf'

// Modal ออกใบแจ้งหนี้/ใบเสร็จ สำหรับงวดงานหนึ่ง + เลือกชนิดเอกสาร/ภาษี + export
function InvoiceModal({ project, installment, onClose }) {
  const [docType, setDocType] = useState(
    installment?.status === 'paid' ? 'receipt' : 'invoice',
  )
  const [vat, setVat] = useState(true)
  const [wht, setWht] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleExport = async () => {
    if (busy) return
    setBusy(true)
    try {
      await exportCurrentSection()
    } catch (err) {
      console.error(err)
      alert(`Export ล้มเหลว: ${err?.message || 'unknown'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-print-hide
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl my-8 rounded-xl border border-line bg-surface p-5 shadow-xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3" data-print-hide>
          <h3 className="text-base font-semibold text-ink">
            🧾 ออกเอกสาร — งวดที่ {installment?.no}
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

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4" data-print-hide>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            ชนิดเอกสาร
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
            >
              <option value="invoice">ใบแจ้งหนี้ / ใบวางบิล</option>
              <option value="receipt">ใบเสร็จรับเงิน / ใบกำกับภาษี</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} className="w-4 h-4 accent-accent" />
            VAT 7%
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={wht} onChange={(e) => setWht(e.target.checked)} className="w-4 h-4 accent-accent" />
            หัก ณ ที่จ่าย 3%
          </label>
          <Button className="ml-auto" onClick={handleExport} disabled={busy}>
            {busy ? 'กำลังสร้าง…' : '🖨️ Export PDF'}
          </Button>
        </div>

        {/* Document preview (คือส่วนที่ export) */}
        <div className="overflow-x-auto bg-canvas/50 p-3 rounded-lg">
          <InvoiceDocument
            project={project}
            installment={installment}
            vat={vat}
            wht={wht}
            docType={docType}
          />
        </div>
      </div>
    </div>
  )
}

export default InvoiceModal
