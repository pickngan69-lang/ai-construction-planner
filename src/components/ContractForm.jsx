import Card from './ui/Card'
import { formatBaht } from '../utils/formatters'

const inputClass =
  'w-full text-sm p-2 rounded border border-line bg-canvas text-ink placeholder:text-ink-muted focus:border-accent outline-none transition-colors'

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1">{label}</span>
      {children}
      {hint && <p className="text-[10px] text-ink-muted mt-1">{hint}</p>}
    </label>
  )
}

/**
 * Pure presentation form for contract metadata. Owns no state — parent passes
 * `form`, `installments`, totals, and setters.
 */
function ContractForm({
  form,
  setForm,
  customTotal,
  customDays,
  daysToStart,
  warrantyYears,
  lateFinePercent,
  onCustomTotalChange,
  onCustomDaysChange,
  onDaysToStartChange,
  onWarrantyYearsChange,
  onLateFinePercentChange,
  installments,
  onInstallmentChange,
  onAddInstallment,
  onRemoveInstallment,
  totalPercent,
  grandTotal,
  exportBusy,
  onExport,
}) {
  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  return (
    <div className="space-y-4" data-print-hide>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-ink">📝 กรอกข้อมูลสัญญา</h2>
        <span className="text-xs text-ink-muted">
          (พิมพ์แล้วเอกสารด้านล่างจะอัปเดตทันที)
        </span>
      </div>

      {/* === Card 1: คู่สัญญา === */}
      <Card className="p-6 border-accent/40 bg-accent/5">
        <h3 className="text-base font-semibold text-accent mb-4">
          1. ข้อมูลคู่สัญญา
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-ink">
              ฝ่ายเจ้าของบ้าน (ผู้ว่าจ้าง)
            </h4>
            <Field label="ชื่อ-นามสกุล">
              <input
                type="text"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                placeholder="เช่น นายสมศรี ใจดี"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="อายุ (ปี)">
                <input
                  type="number"
                  name="ownerAge"
                  value={form.ownerAge}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>
              <Field label="โทรศัพท์">
                <input
                  type="tel"
                  name="ownerPhone"
                  value={form.ownerPhone}
                  onChange={handleChange}
                  placeholder="0xx-xxx-xxxx"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="เลขประจำตัวประชาชน (13 หลัก)">
              <input
                type="text"
                name="ownerId"
                value={form.ownerId}
                onChange={handleChange}
                placeholder="x-xxxx-xxxxx-xx-x"
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label="ที่อยู่">
              <textarea
                name="ownerAddress"
                value={form.ownerAddress}
                onChange={handleChange}
                placeholder="เลขที่/ถนน/ตำบล/อำเภอ/จังหวัด/ไปรษณีย์"
                className={`${inputClass} h-20`}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-ink">
              ฝ่ายผู้รับเหมา (ผู้รับจ้าง)
            </h4>
            <Field label="ชื่อ-นามสกุล / ชื่อบริษัท">
              <input
                type="text"
                name="contractorName"
                value={form.contractorName}
                onChange={handleChange}
                placeholder="เช่น บจ.รุ่งเรืองก่อสร้าง"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="อายุ (ปี)">
                <input
                  type="number"
                  name="contractorAge"
                  value={form.contractorAge}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>
              <Field label="โทรศัพท์">
                <input
                  type="tel"
                  name="contractorPhone"
                  value={form.contractorPhone}
                  onChange={handleChange}
                  placeholder="0xx-xxx-xxxx"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="เลขประจำตัวผู้เสียภาษี / บัตรประชาชน">
              <input
                type="text"
                name="contractorId"
                value={form.contractorId}
                onChange={handleChange}
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label="ทะเบียนนิติบุคคลเลขที่ (ถ้ามี)">
              <input
                type="text"
                name="contractorRegistration"
                value={form.contractorRegistration}
                onChange={handleChange}
                placeholder="0105560000000"
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label="ที่อยู่">
              <textarea
                name="contractorAddress"
                value={form.contractorAddress}
                onChange={handleChange}
                className={`${inputClass} h-20`}
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-line">
          <Field label="ทำที่ (จังหวัด)">
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="กรุงเทพมหานคร"
              className={inputClass}
            />
          </Field>
          <Field label="วันที่ทำสัญญา">
            <input
              type="date"
              name="contractDate"
              value={form.contractDate}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
          <Field label="พยาน 1 (ชื่อ)">
            <input
              type="text"
              name="witness1"
              value={form.witness1}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="พยาน 2 (ชื่อ)">
            <input
              type="text"
              name="witness2"
              value={form.witness2}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {/* === Card 2: ราคา + งวด + เงื่อนไข === */}
      <Card className="p-6 border-line bg-canvas/30">
        <h3 className="text-base font-semibold text-ink mb-4">
          2. มูลค่างาน, งวดชำระ และเงื่อนไข
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Field
            label="ราคาเหมาสุทธิ (บาท)"
            hint={`AI ประเมิน: ${formatBaht(grandTotal)}`}
          >
            <input
              type="number"
              value={customTotal}
              onChange={onCustomTotalChange}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="ระยะเวลาทำงานทั้งหมด (วัน)">
            <input
              type="number"
              value={customDays}
              onChange={onCustomDaysChange}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="ระยะเวลาเริ่มงาน หลังเซ็นสัญญา (วัน)">
            <input
              type="number"
              value={daysToStart}
              onChange={onDaysToStartChange}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="ระยะรับประกันผลงาน (ปี)">
            <input
              type="number"
              value={warrantyYears}
              onChange={onWarrantyYearsChange}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field
            label="ค่าปรับล่าช้า (% ต่อวัน)"
            hint="คิดจากค่าจ้างเหมา • ตัวอย่าง: 0.01 = วันละ 0.01% ของยอดเหมา"
          >
            <input
              type="number"
              step="0.001"
              value={lateFinePercent}
              onChange={onLateFinePercentChange}
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-line pb-2">
            <span className="text-sm font-medium text-ink">
              แบ่งงวดการชำระเงิน
            </span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                totalPercent === 100
                  ? 'bg-green-500/20 text-green-600'
                  : 'bg-danger/20 text-danger'
              }`}
            >
              รวม: {totalPercent}% / 100%
            </span>
          </div>

          {installments.map((inst, index) => {
            const amount = (customTotal * (Number(inst.percent) || 0)) / 100
            return (
              <div key={inst.id} className="flex gap-2 items-start">
                <div className="shrink-0 w-8 pt-2 text-xs font-medium text-ink-muted">
                  งวด {index + 1}
                </div>
                <div className="shrink-0 w-20 relative">
                  <input
                    type="number"
                    value={inst.percent}
                    onChange={(e) =>
                      onInstallmentChange(inst.id, 'percent', e.target.value)
                    }
                    className={`${inputClass} pr-6 text-right`}
                    placeholder="%"
                  />
                  <span className="absolute right-2 top-2 text-xs text-ink-muted">
                    %
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={inst.condition}
                    onChange={(e) =>
                      onInstallmentChange(
                        inst.id,
                        'condition',
                        e.target.value,
                      )
                    }
                    className={inputClass}
                    placeholder="เงื่อนไขการชำระเงิน..."
                  />
                  <div className="text-[10px] text-accent mt-1 pl-1">
                    คิดเป็นเงิน: {formatBaht(amount)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveInstallment(inst.id)}
                  className="p-2 text-ink-muted hover:bg-danger/10 hover:text-danger rounded transition-colors shrink-0"
                  title="ลบงวดนี้"
                >
                  🗑️
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={onAddInstallment}
            className="mt-2 text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1.5 px-3 py-1.5 rounded border border-dashed border-accent/40 hover:border-accent transition-colors"
          >
            + เพิ่มงวดใหม่
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-line/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-sm rounded-md border border-line text-ink-soft hover:text-ink hover:border-accent transition-colors"
          >
            🖨️ พิมพ์ (Browser)
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={exportBusy}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm ${
              totalPercent === 100
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-line text-ink-muted cursor-not-allowed'
            } disabled:opacity-60 disabled:cursor-wait`}
          >
            {exportBusy ? '⏳ กำลังสร้างไฟล์...' : '📄 Export PDF (สัญญา)'}
          </button>
        </div>
      </Card>
    </div>
  )
}

export default ContractForm
