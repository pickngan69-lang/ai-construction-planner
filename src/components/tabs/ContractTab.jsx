import { useState, useEffect, useRef } from 'react'
import Card from '../ui/Card'
import { formatBaht } from '../../utils/formatters'
import { exportCurrentSection } from '../../utils/exportPdf'

const inputClass =
  'w-full text-sm p-2 rounded border border-line bg-canvas text-ink placeholder:text-ink-muted focus:border-accent outline-none transition-colors'

// ส่วนยอดเงิน/ตัวเลขในกระดาษ — แสดงตัวจริงถ้ามี ไม่งั้นเป็น placeholder จาง
// nowrap=true: บังคับไม่ให้ตัวเลขถูกตัดบรรทัด (ใช้กับ ID, เลขทะเบียน, ยอดเงิน)
const Field = ({ value, placeholder, strong = true, nowrap = false }) => {
  const wrapCls = nowrap ? 'whitespace-nowrap' : ''
  if (value) {
    return strong ? (
      <strong className={wrapCls}>{value}</strong>
    ) : (
      <span className={wrapCls}>{value}</span>
    )
  }
  return (
    <span className={`text-gray-400 font-normal ${wrapCls}`}>{placeholder}</span>
  )
}

function ContractTab({ result, projectInfo }) {
  // ดึงข้อมูลตั้งต้นจาก AI
  const grandTotal =
    (result.total_material_cost_adjusted || 0) + (result.total_labor_cost || 0)
  const defaultDays = result.totalDays || 0

  // ใช้ ref เพื่อ track ว่าผู้ใช้แก้ตัวเลขเองแล้วหรือยัง — ถ้าแก้แล้วจะไม่ overwrite
  const userOverrodeTotal = useRef(false)
  const userOverrodeDays = useRef(false)
  const [customTotal, setCustomTotal] = useState(grandTotal)
  const [customDays, setCustomDays] = useState(defaultDays)

  useEffect(() => {
    if (!userOverrodeTotal.current) setCustomTotal(grandTotal)
  }, [grandTotal])
  useEffect(() => {
    if (!userOverrodeDays.current) setCustomDays(defaultDays)
  }, [defaultDays])

  const handleCustomTotalChange = (e) => {
    userOverrodeTotal.current = true
    setCustomTotal(Number(e.target.value))
  }
  const handleCustomDaysChange = (e) => {
    userOverrodeDays.current = true
    setCustomDays(Number(e.target.value))
  }

  // State สำหรับข้อมูลคู่สัญญา + วันที่/สถานที่
  const [form, setForm] = useState({
    contractDate: new Date().toISOString().split('T')[0],
    location: projectInfo?.province || '',
    ownerName: '',
    ownerId: '',
    ownerAddress: '',
    contractorName: '',
    contractorId: '',
    contractorAddress: '',
  })

  // งวดงาน (Default แนะนำ 4 งวด)
  const [installments, setInstallments] = useState([
    {
      id: 1,
      percent: 20,
      condition: 'ชำระเงินมัดจำ ณ วันทำสัญญา และเริ่มเตรียมเข้าพื้นที่',
    },
    {
      id: 2,
      percent: 30,
      condition: 'เมื่อดำเนินการงานโครงสร้างและหลังคาแล้วเสร็จ',
    },
    {
      id: 3,
      percent: 40,
      condition:
        'เมื่อดำเนินการก่ออิฐ ฉาบปูน ปูกระเบื้อง และติดตั้งงานระบบแล้วเสร็จ',
    },
    {
      id: 4,
      percent: 10,
      condition: 'เมื่อเก็บความเรียบร้อยและตรวจรับส่งมอบงานทั้งหมด',
    },
  ])

  const totalPercent = installments.reduce(
    (sum, inst) => sum + Number(inst.percent || 0),
    0,
  )

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleInstallmentChange = (id, field, value) => {
    setInstallments((prev) =>
      prev.map((inst) =>
        inst.id === id ? { ...inst, [field]: value } : inst,
      ),
    )
  }

  const addInstallment = () => {
    const newId =
      installments.length > 0
        ? Math.max(...installments.map((i) => i.id)) + 1
        : 1
    setInstallments([
      ...installments,
      { id: newId, percent: 0, condition: '' },
    ])
  }

  const removeInstallment = (id) => {
    setInstallments((prev) => prev.filter((inst) => inst.id !== id))
  }

  const [exportBusy, setExportBusy] = useState(false)
  const handlePrint = async () => {
    if (totalPercent !== 100) {
      alert(
        `⚠️ สัดส่วนงวดงานรวมกันได้ ${totalPercent}% (ต้องให้ได้ 100% พอดี) โปรดตรวจสอบก่อนพิมพ์ครับ`,
      )
      return
    }
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

  // Format วันที่ ISO → ไทย
  const fmtThaiDate = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d)
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          ส่วน 1: ฟอร์มกรอกข้อมูล (ซ่อนตอน export PDF)
          ============================================================ */}
      <div className="space-y-4" data-print-hide>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">
            📝 กรอกข้อมูลสัญญา
          </h2>
          <span className="text-xs text-ink-muted">
            (พิมพ์ในฟอร์มแล้วกระดาษด้านล่างจะอัปเดตทันที)
          </span>
        </div>

        {/* Card 1: ข้อมูลคู่สัญญา */}
        <Card className="p-6 border-accent/40 bg-accent/5">
          <h3 className="text-base font-semibold text-accent mb-4">
            1. ข้อมูลคู่สัญญา
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-ink">
                ฝ่ายเจ้าของบ้าน (ผู้ว่าจ้าง)
              </h4>
              <input
                type="text"
                name="ownerName"
                placeholder="ชื่อ-นามสกุล"
                value={form.ownerName}
                onChange={handleChange}
                className={inputClass}
              />
              <input
                type="text"
                name="ownerId"
                placeholder="เลขบัตรประชาชน"
                value={form.ownerId}
                onChange={handleChange}
                className={inputClass}
              />
              <textarea
                name="ownerAddress"
                placeholder="ที่อยู่"
                value={form.ownerAddress}
                onChange={handleChange}
                className={`${inputClass} h-20`}
              />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-ink">
                ฝ่ายผู้รับเหมา (ผู้รับจ้าง)
              </h4>
              <input
                type="text"
                name="contractorName"
                placeholder="ชื่อ-นามสกุล / บริษัท"
                value={form.contractorName}
                onChange={handleChange}
                className={inputClass}
              />
              <input
                type="text"
                name="contractorId"
                placeholder="เลขประจำตัวผู้เสียภาษี / เลขบัตรฯ"
                value={form.contractorId}
                onChange={handleChange}
                className={inputClass}
              />
              <textarea
                name="contractorAddress"
                placeholder="ที่อยู่"
                value={form.contractorAddress}
                onChange={handleChange}
                className={`${inputClass} h-20`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-line">
            <div>
              <label className="block text-xs text-ink-muted mb-1">
                ทำที่ (จังหวัด/ที่ตั้ง)
              </label>
              <input
                type="text"
                name="location"
                placeholder="เช่น กรุงเทพมหานคร"
                value={form.location}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">
                วันที่ทำสัญญา
              </label>
              <input
                type="date"
                name="contractDate"
                value={form.contractDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        {/* Card 2: ราคา + งวดงาน */}
        <Card className="p-6 border-line bg-canvas/30">
          <h3 className="text-base font-semibold text-ink mb-4">
            2. มูลค่างานและงวดชำระเงิน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-ink-muted mb-1">
                ราคาเหมาสุทธิ (บาท)
              </label>
              <input
                type="number"
                value={customTotal}
                onChange={handleCustomTotalChange}
                className={inputClass}
              />
              <p className="text-[10px] text-ink-soft mt-1">
                AI ประเมินไว้ที่: {formatBaht(grandTotal)}
              </p>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">
                ระยะเวลาทำงาน (วัน)
              </label>
              <input
                type="number"
                value={customDays}
                onChange={handleCustomDaysChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="text-sm font-medium text-ink">
                แบ่งงวดการชำระเงิน
              </span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${totalPercent === 100 ? 'bg-green-500/20 text-green-600' : 'bg-danger/20 text-danger'}`}
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
                        handleInstallmentChange(
                          inst.id,
                          'percent',
                          e.target.value,
                        )
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
                        handleInstallmentChange(
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
                    onClick={() => removeInstallment(inst.id)}
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
              onClick={addInstallment}
              className="mt-2 text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1.5 px-3 py-1.5 rounded border border-dashed border-accent/40 hover:border-accent transition-colors"
            >
              + เพิ่มงวดใหม่
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-line/50 flex justify-end">
            <button
              type="button"
              onClick={handlePrint}
              disabled={exportBusy}
              className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm ${totalPercent === 100 ? 'bg-accent text-white hover:bg-accent/90' : 'bg-line text-ink-muted cursor-not-allowed'} disabled:opacity-60 disabled:cursor-wait`}
            >
              {exportBusy ? '⏳ กำลังสร้างไฟล์...' : '📤 Export PDF (สัญญา)'}
            </button>
          </div>
        </Card>
      </div>

      {/* ============================================================
          ส่วน 2: ตัวอย่างกระดาษสัญญา A4 (เนื้อหานี้คือสิ่งที่ export)
          ============================================================ */}
      <div className="flex items-center gap-2" data-print-hide>
        <h2 className="text-lg font-semibold text-ink">
          🖨️ ตัวอย่างเอกสารสัญญา (A4)
        </h2>
        <span className="text-xs text-ink-muted">
          ขนาด 210 × 297 mm — ระยะขอบ 20 mm
        </span>
      </div>

      <div className="overflow-x-auto bg-canvas/50 p-4 rounded-lg">
        <div
          data-export-section-strict
          data-export-label="สัญญาจ้างเหมาก่อสร้าง"
          data-export-filename="Contract"
          data-export-project={
            projectInfo?.name?.trim() ||
            result?.house_analysis?.type ||
            'Project'
          }
          data-export-orientation="portrait"
          data-export-bare="true"
          className="print-container mx-auto min-h-[297mm] shadow-md border border-line/20"
        >
          {/* Title */}
          <h1
            className="text-2xl font-bold text-center mb-8"
            data-no-break
          >
            สัญญาจ้างเหมาก่อสร้าง
          </h1>

          {/* Date / location block */}
          <div className="text-right mb-6" data-no-break>
            <p>
              ทำที่:{' '}
              <Field
                value={form.location}
                placeholder="......................................................"
                strong={false}
              />
            </p>
            <p>
              วันที่:{' '}
              <Field
                value={fmtThaiDate(form.contractDate)}
                placeholder="......................................................"
                strong={false}
              />
            </p>
          </div>

          {/* Owner paragraph */}
          <p
            className="mb-4 break-inside-avoid clause-block"
            data-no-break
          >
            สัญญานี้ทำขึ้นระหว่าง{' '}
            <Field
              value={form.ownerName}
              placeholder="......................................................"
            />{' '}
            เลขประจำตัวประชาชน{' '}
            <Field
              value={form.ownerId}
              placeholder="......................................"
              nowrap
            />{' '}
            อยู่บ้านเลขที่{' '}
            <Field
              value={form.ownerAddress}
              placeholder=".........................................................................................."
            />{' '}
            ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>"ผู้ว่าจ้าง"</strong> ฝ่ายหนึ่ง
          </p>

          {/* Contractor paragraph */}
          <p
            className="mb-6 break-inside-avoid clause-block"
            data-no-break
          >
            กับ{' '}
            <Field
              value={form.contractorName}
              placeholder="......................................................"
            />{' '}
            เลขประจำตัว{' '}
            <Field
              value={form.contractorId}
              placeholder="......................................"
              nowrap
            />{' '}
            ตั้งอยู่เลขที่{' '}
            <Field
              value={form.contractorAddress}
              placeholder=".........................................................................................."
            />{' '}
            ซึ่งต่อไปในสัญญานี้จะเรียกว่า <strong>"ผู้รับจ้าง"</strong>{' '}
            อีกฝ่ายหนึ่ง
          </p>

          <p className="mb-4">คู่สัญญาตกลงทำสัญญากันดังมีข้อความต่อไปนี้:</p>

          {/* Clauses — each <li> kept together */}
          <ol className="list-decimal pl-6 space-y-4 mb-6">
            <li className="break-inside-avoid" data-no-break>
              <strong>ข้อตกลงว่าจ้าง:</strong>{' '}
              ผู้ว่าจ้างตกลงว่าจ้าง และผู้รับจ้างตกลงรับจ้างทำการก่อสร้าง/ปรับปรุง
              ตามรายการใบเสนอราคา (BOQ) และแบบรูปรายการที่แนบท้ายสัญญานี้
            </li>
            <li className="break-inside-avoid clause-block" data-no-break>
              <strong>ค่าจ้าง:</strong>{' '}
              ผู้ว่าจ้างตกลงจ่ายค่าจ้างเหมา (รวมค่าวัสดุและค่าแรงงาน) เป็นเงินทั้งสิ้น{' '}
              <strong className="whitespace-nowrap">
                {formatBaht(customTotal)}
              </strong>{' '}
              ซึ่งรวมภาษีอากรและค่าใช้จ่ายอื่นๆ ทั้งปวงแล้ว
            </li>
            <li className="break-inside-avoid" data-no-break>
              <strong>การชำระเงิน:</strong>{' '}
              ผู้ว่าจ้างตกลงชำระเงินค่าจ้างให้แก่ผู้รับจ้าง โดยแบ่งออกเป็น{' '}
              {installments.length} งวด ดังต่อไปนี้:
              <ul className="list-none pl-2 mt-2 space-y-2">
                {installments.map((inst, index) => {
                  const amount =
                    (customTotal * (Number(inst.percent) || 0)) / 100
                  return (
                    <li
                      key={inst.id}
                      className="break-inside-avoid clause-block"
                      data-no-break
                    >
                      <strong className="whitespace-nowrap">
                        งวดที่ {index + 1}
                      </strong>
                      : จำนวนร้อยละ{' '}
                      <span className="whitespace-nowrap">
                        {inst.percent || 0}
                      </span>{' '}
                      ของค่าจ้างเหมา เป็นเงิน{' '}
                      <strong className="whitespace-nowrap">
                        {formatBaht(amount)}
                      </strong>{' '}
                      จ่ายเมื่อ{' '}
                      <Field
                        value={inst.condition}
                        placeholder="........................................................................"
                        strong={false}
                      />
                    </li>
                  )
                })}
              </ul>
            </li>
            <li className="break-inside-avoid clause-block" data-no-break>
              <strong>กำหนดเวลาแล้วเสร็จ:</strong>{' '}
              ผู้รับจ้างตกลงจะเริ่มลงมือทำงานที่รับจ้าง
              และจะต้องทำงานให้แล้วเสร็จบริบูรณ์ภายในระยะเวลา{' '}
              <strong className="whitespace-nowrap">{customDays} วัน</strong>{' '}
              นับแต่วันเริ่มงาน
            </li>
            <li className="break-inside-avoid" data-no-break>
              <strong>การตรวจรับงาน:</strong>{' '}
              ผู้ว่าจ้างหรือผู้แทนมีสิทธิเข้าตรวจงานได้ทุกเวลา
              หากงานไม่ถูกต้องตามแบบ
              ผู้รับจ้างต้องแก้ไขให้ถูกต้องด้วยค่าใช้จ่ายของตนเอง
            </li>
          </ol>

          <p
            className="mb-12 mt-8 break-inside-avoid"
            data-no-break
          >
            สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความถูกต้องตรงกัน
            คู่สัญญาได้อ่านและเข้าใจข้อความโดยตลอดแล้ว
            จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน
          </p>

          {/* Signature block — must stay together */}
          <div
            className="flex justify-between mt-12 px-8 break-inside-avoid"
            data-no-break
          >
            <div className="text-center">
              <p>
                ลงชื่อ ......................................................
                ผู้ว่าจ้าง
              </p>
              <p className="mt-2">
                ({' '}
                <Field
                  value={form.ownerName}
                  placeholder="......................................................"
                  strong={false}
                />{' '}
                )
              </p>
            </div>
            <div className="text-center">
              <p>
                ลงชื่อ ......................................................
                ผู้รับจ้าง
              </p>
              <p className="mt-2">
                ({' '}
                <Field
                  value={form.contractorName}
                  placeholder="......................................................"
                  strong={false}
                />{' '}
                )
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractTab
