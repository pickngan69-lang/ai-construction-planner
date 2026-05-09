import { useState, useEffect, useRef } from 'react'
import ContractForm from '../ContractForm'
import ContractDocument from '../ContractDocument'
import { exportCurrentSection } from '../../utils/exportPdf'

/**
 * ContractTab — orchestrator: owns all contract state, composes
 * ContractForm (input UI, hidden in PDF) + ContractDocument (the actual A4
 * document that gets exported).
 */
function ContractTab({ result, projectInfo }) {
  // -------- ค่าจาก AI --------
  const grandTotal =
    (result?.total_material_cost_adjusted || 0) +
    (result?.total_labor_cost || 0)
  const aiTotalMaterial = result?.total_material_cost_adjusted || 0
  const aiTotalLabor = result?.total_labor_cost || 0
  const defaultDays = result?.totalDays || 0

  // -------- ราคาเหมา / วัน (sync จาก AI ถ้า user ยังไม่ override) --------
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

  // -------- เงื่อนไขสัญญาเพิ่มเติม --------
  const [daysToStart, setDaysToStart] = useState(7)
  const [warrantyYears, setWarrantyYears] = useState(1)
  const [lateFinePercent, setLateFinePercent] = useState(0.01)

  // -------- ฟอร์มข้อมูลคู่สัญญา --------
  const [form, setForm] = useState({
    contractDate: new Date().toISOString().split('T')[0],
    location: projectInfo?.province || '',
    ownerName: '',
    ownerAge: '',
    ownerPhone: '',
    ownerId: '',
    ownerAddress: '',
    contractorName: '',
    contractorAge: '',
    contractorPhone: '',
    contractorId: '',
    contractorRegistration: '',
    contractorAddress: '',
    witness1: '',
    witness2: '',
  })

  // -------- งวดงาน --------
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
  const removeInstallment = (id) =>
    setInstallments((prev) => prev.filter((inst) => inst.id !== id))

  // -------- Export PDF --------
  const [exportBusy, setExportBusy] = useState(false)
  const handleExport = async () => {
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

  return (
    <div className="space-y-6">
      <ContractForm
        form={form}
        setForm={setForm}
        customTotal={customTotal}
        customDays={customDays}
        daysToStart={daysToStart}
        warrantyYears={warrantyYears}
        lateFinePercent={lateFinePercent}
        onCustomTotalChange={handleCustomTotalChange}
        onCustomDaysChange={handleCustomDaysChange}
        onDaysToStartChange={(e) => setDaysToStart(Number(e.target.value))}
        onWarrantyYearsChange={(e) =>
          setWarrantyYears(Number(e.target.value))
        }
        onLateFinePercentChange={(e) =>
          setLateFinePercent(Number(e.target.value))
        }
        installments={installments}
        onInstallmentChange={handleInstallmentChange}
        onAddInstallment={addInstallment}
        onRemoveInstallment={removeInstallment}
        totalPercent={totalPercent}
        grandTotal={grandTotal}
        exportBusy={exportBusy}
        onExport={handleExport}
      />

      <div className="flex items-center gap-2" data-print-hide>
        <h2 className="text-lg font-semibold text-ink">
          🖨️ ตัวอย่างเอกสารสัญญา (A4)
        </h2>
        <span className="text-xs text-ink-muted">
          ขนาด 794px × A4 ratio • Export ออกมาคือเฉพาะส่วนนี้
        </span>
      </div>

      <div className="overflow-x-auto bg-canvas/50 p-4 rounded-lg">
        <ContractDocument
          form={form}
          installments={installments}
          customTotal={customTotal}
          customDays={customDays}
          daysToStart={daysToStart}
          warrantyYears={warrantyYears}
          lateFinePercent={lateFinePercent}
          result={result}
          projectInfo={projectInfo}
          totalMaterial={aiTotalMaterial}
          totalLabor={aiTotalLabor}
        />
      </div>
    </div>
  )
}

export default ContractTab
