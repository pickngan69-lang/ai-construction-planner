import { useState } from 'react'
import QuotationDocument from '../QuotationDocument'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { exportCurrentSection } from '../../utils/exportPdf'
import { useCompany } from '../../contexts/CompanyContext'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1.5">{label}</span>
      {children}
    </label>
  )
}

// QuotationTab — ฟอร์มข้อมูลลูกค้า/เงื่อนไข + เอกสารใบเสนอราคา (A4) ที่ export ได้
function QuotationTab({ result, projectInfo }) {
  const { isConfigured } = useCompany()
  const [form, setForm] = useState({
    quoteDate: new Date().toISOString().split('T')[0],
    validDays: 30,
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    vatEnabled: true,
    warrantyYears: 1,
    notes: '',
  })
  const [exportBusy, setExportBusy] = useState(false)

  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: v }))
  }

  const handleExport = async () => {
    if (exportBusy) return
    setExportBusy(true)
    try {
      await exportCurrentSection()
    } catch (err) {
      console.error(err)
      alert(`Export ล้มเหลว: ${err?.message || 'unknown'}`)
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4" data-print-hide>
        {!isConfigured && (
          <div className="rounded-md border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm text-ink-soft">
            💡 ยังไม่ได้ตั้งข้อมูลบริษัท — หัวกระดาษจะว่าง ไปตั้งที่เมนู{' '}
            <strong>⚙️ ตั้งค่าบริษัท</strong> ก่อนเพื่อให้ใบเสนอราคาสมบูรณ์
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="ชื่อลูกค้า">
            <input type="text" value={form.clientName} onChange={set('clientName')} placeholder="เช่น คุณสมชาย ใจดี" className={inputClass} />
          </Field>
          <Field label="โทรศัพท์ลูกค้า">
            <input type="text" value={form.clientPhone} onChange={set('clientPhone')} className={inputClass} />
          </Field>
          <Field label="วันที่เสนอราคา">
            <input type="date" value={form.quoteDate} onChange={set('quoteDate')} className={`${inputClass} font-mono`} />
          </Field>
        </div>

        <Field label="ที่อยู่ลูกค้า">
          <input type="text" value={form.clientAddress} onChange={set('clientAddress')} className={inputClass} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Field label="ยืนราคา (วัน)">
            <input type="number" min="1" value={form.validDays} onChange={set('validDays')} className={`${inputClass} font-mono`} />
          </Field>
          <Field label="รับประกันงาน (ปี)">
            <input type="number" min="0" value={form.warrantyYears} onChange={set('warrantyYears')} className={`${inputClass} font-mono`} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-soft pb-2">
            <input type="checkbox" checked={form.vatEnabled} onChange={set('vatEnabled')} className="w-4 h-4 accent-accent" />
            รวมภาษีมูลค่าเพิ่ม (VAT 7%)
          </label>
        </div>

        <Field label="หมายเหตุเพิ่มเติม (ไม่บังคับ)">
          <input type="text" value={form.notes} onChange={set('notes')} placeholder="เช่น ราคานี้ไม่รวมค่าถมดิน / งานเพิ่มเติมคิดตามจริง" className={inputClass} />
        </Field>

        <div className="flex justify-end">
          <Button onClick={handleExport} disabled={exportBusy}>
            {exportBusy ? 'กำลังสร้าง PDF…' : '🖨️ Export ใบเสนอราคา (PDF)'}
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2" data-print-hide>
        <h2 className="text-lg font-semibold text-ink">📄 ตัวอย่างใบเสนอราคา (A4)</h2>
        <span className="text-xs text-ink-muted">Export ออกมาคือเฉพาะส่วนนี้</span>
      </div>

      <div className="overflow-x-auto bg-canvas/50 p-4 rounded-lg">
        <QuotationDocument form={form} result={result} projectInfo={projectInfo} />
      </div>
    </div>
  )
}

export default QuotationTab
