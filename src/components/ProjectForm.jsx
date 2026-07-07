import { HOUSE_STYLES, PROVINCES } from '../utils/constants'
import GradeSelector from './ui/GradeSelector'
import Button from './ui/Button'
import Card from './ui/Card'

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-ink-soft mb-1.5">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

function ProjectForm({
  projectInfo,
  setProjectInfo,
  onAnalyze,
  canAnalyze,
  useMock = false,
}) {
  const update = (key) => (e) => {
    const raw = e.target.value
    setProjectInfo((prev) => ({ ...prev, [key]: raw }))
  }

  const updateGrade = (grade) =>
    setProjectInfo((prev) => ({ ...prev, grade }))

  return (
    <Card className="p-6 space-y-5">
      <h2 className="text-base font-semibold text-ink">ข้อมูลโปรเจกต์</h2>

      <Field label="ชื่อโปรเจกต์">
        <input
          type="text"
          value={projectInfo.name}
          onChange={update('name')}
          placeholder="เช่น บ้านโมเดิร์น 2 ชั้น"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="พื้นที่ (ตร.ม.)">
          <input
            type="number"
            min="0"
            value={projectInfo.area}
            onChange={update('area')}
            placeholder="150"
            className={inputClass}
          />
        </Field>
        <Field label="จำนวนชั้น">
          <input
            type="number"
            min="1"
            value={projectInfo.floors}
            onChange={update('floors')}
            placeholder="2"
            className={inputClass}
          />
        </Field>
        <Field label="ห้องนอน">
          <input
            type="number"
            min="0"
            value={projectInfo.bedrooms}
            onChange={update('bedrooms')}
            placeholder="3"
            className={inputClass}
          />
        </Field>
        <Field label="ห้องน้ำ">
          <input
            type="number"
            min="0"
            value={projectInfo.bathrooms}
            onChange={update('bathrooms')}
            placeholder="2"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="สไตล์บ้าน">
          <select
            value={projectInfo.style}
            onChange={update('style')}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {HOUSE_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="จังหวัด">
          <select
            value={projectInfo.province}
            onChange={update('province')}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="งบประมาณ (บาท)">
          <input
            type="number"
            min="0"
            value={projectInfo.budget}
            onChange={update('budget')}
            placeholder="2500000"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="เกรดวัสดุ">
        <GradeSelector value={projectInfo.grade} onChange={updateGrade} />
      </Field>

      <Field label="หมายเหตุ">
        <textarea
          rows={3}
          value={projectInfo.notes}
          onChange={update('notes')}
          placeholder="ความต้องการพิเศษ เช่น ต้องการห้องครัวไทย, มีสระว่ายน้ำ"
          className={inputClass}
        />
      </Field>

      <div className="pt-2">
        <Button
          size="lg"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="w-full sm:w-auto"
        >
          {useMock ? '🧪 วิเคราะห์ (ข้อมูลทดสอบ)' : '🔍 วิเคราะห์แบบบ้าน'}
        </Button>
        {!canAnalyze && (
          <p className="text-xs text-ink-muted mt-2">
            ต้องแนบไฟล์อย่างน้อย 1 ไฟล์ก่อน (รูป / PDF / Excel / CSV)
          </p>
        )}
      </div>
    </Card>
  )
}

export default ProjectForm
