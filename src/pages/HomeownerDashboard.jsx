import { useMemo } from 'react'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import GuidePopup from '../components/GuidePopup'
import { useAnalysisContext } from '../contexts/AnalysisContext'
import { useAuth } from '../contexts/AuthContext'
import { PHASE_COLORS } from '../utils/constants'
import { formatBaht, formatBahtCompact, formatDays } from '../utils/formatters'

// Demo state — phase progress (in real app would come from contractor updates)
const DEMO_PHASE_STATUS = ['done', 'in_progress', 'pending', 'pending', 'pending']
const DEMO_IN_PROGRESS_PCT = 0.5

function ProgressCard({ result }) {
  const phases = result?.phases || []
  const phaseCount = phases.length || 1

  const completed = DEMO_PHASE_STATUS.filter((s) => s === 'done').length
  const partial =
    DEMO_PHASE_STATUS.filter((s) => s === 'in_progress').length *
    DEMO_IN_PROGRESS_PCT
  const overall = ((completed + partial) / phaseCount) * 100

  const currentPhaseIdx = DEMO_PHASE_STATUS.findIndex(
    (s) => s === 'in_progress',
  )
  const currentPhase = phases[currentPhaseIdx]

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          📊 ความคืบหน้าโครงการ
          <GuidePopup title="ความคืบหน้าโครงการ">
            <p>
              เปอร์เซ็นต์รวมคำนวณจากเฟสที่เสร็จแล้ว + เฟสที่กำลังดำเนินอยู่
              ผู้รับเหมาจะอัปเดตสถานะเป็นระยะ
            </p>
          </GuidePopup>
        </h2>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span className="font-mono text-4xl text-accent">
          {overall.toFixed(0)}%
        </span>
        <span className="text-sm text-ink-muted pb-1.5">
          จาก {phaseCount} เฟสทั้งหมด
        </span>
      </div>

      <div className="h-3 rounded-full bg-elevated overflow-hidden mb-4">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${overall}%` }}
        />
      </div>

      {currentPhase && (
        <div className="rounded-md border border-line bg-elevated/40 p-3">
          <p className="text-xs text-ink-muted">กำลังดำเนินการ</p>
          <p className="text-sm text-ink font-medium mt-0.5">
            🔨 เฟส {currentPhaseIdx + 1}: {currentPhase.name}
          </p>
        </div>
      )}

      {/* Phase status row */}
      <div className="grid grid-cols-5 gap-1 mt-4">
        {phases.map((p, i) => {
          const status = DEMO_PHASE_STATUS[i] || 'pending'
          const color = PHASE_COLORS[i % PHASE_COLORS.length]
          const opacity =
            status === 'done' ? 1 : status === 'in_progress' ? 0.7 : 0.25
          return (
            <div
              key={i}
              className="text-center"
              title={`เฟส ${i + 1}: ${p.name} — ${status}`}
            >
              <div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: color, opacity }}
              />
              <p className="text-[10px] text-ink-muted mt-1 truncate">
                {p.name}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function PaymentMilestones({ result }) {
  const milestones = useMemo(() => {
    const phases = result?.phases || []
    const allTasks = result?.allTasks || []
    return phases.map((phase, idx) => {
      const tasks = allTasks.filter((t) => t.phaseIdx === idx)
      const cost = tasks.reduce(
        (s, t) =>
          s + (Number(t.material_cost) || 0) + (Number(t.labor_cost) || 0),
        0,
      )
      return {
        idx,
        name: phase.name,
        cost,
        status: DEMO_PHASE_STATUS[idx] || 'pending',
        color: PHASE_COLORS[idx % PHASE_COLORS.length],
      }
    })
  }, [result])

  const totalCost = milestones.reduce((s, m) => s + m.cost, 0)

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
        💳 งวดงาน / ตารางการชำระเงิน
        <GuidePopup title="งวดงาน">
          <p>
            งวดงานแบ่งตามเฟสของโครงการ — ผู้รับเหมาจะแจ้งเรียกเก็บเมื่อเฟสนั้น
            เสร็จเรียบร้อย
          </p>
          <p>
            🟢 ชำระแล้ว — รับเงินครบ • 🟡 ค้างชำระ — เฟสเสร็จแล้วรอชำระ • ⚪
            อนาคต — ยังไม่ถึงกำหนด
          </p>
        </GuidePopup>
      </h2>

      <div className="space-y-3">
        {milestones.map((m) => {
          const statusUI = {
            done: { icon: '🟢', label: 'ชำระแล้ว', textColor: '#2a9d8f' },
            in_progress: {
              icon: '🟡',
              label: 'รอชำระ',
              textColor: '#e07a2f',
            },
            pending: {
              icon: '⚪',
              label: 'อนาคต',
              textColor: '#78716c',
            },
          }[m.status]
          const pct = totalCost > 0 ? (m.cost / totalCost) * 100 : 0
          return (
            <div
              key={m.idx}
              className="rounded-lg border border-line bg-elevated/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    งวดที่ {m.idx + 1}: {m.name}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    คิดเป็น {pct.toFixed(0)}% ของมูลค่าโครงการ
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-xs"
                    style={{ color: statusUI.textColor }}
                  >
                    {statusUI.icon} {statusUI.label}
                  </p>
                  <p className="font-mono text-sm text-ink mt-0.5">
                    {formatBaht(m.cost)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-elevated overflow-hidden mt-3">
                <div
                  className="h-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: m.color,
                    opacity: m.status === 'pending' ? 0.3 : 1,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
        <span className="text-sm text-ink-soft">มูลค่าโครงการรวม</span>
        <span className="font-mono text-lg text-accent">
          {formatBaht(totalCost)}
        </span>
      </div>
    </Card>
  )
}

const DEMO_DOCS = [
  { icon: '📄', name: 'สัญญาก่อสร้าง', date: '2025-10-15', status: 'signed' },
  { icon: '🧾', name: 'ใบเสร็จงวดที่ 1', date: '2025-11-02', status: 'received' },
  { icon: '🛡️', name: 'ใบรับประกันงาน', date: 'รอการออก', status: 'pending' },
  { icon: '📋', name: 'ใบอนุญาตก่อสร้าง', date: '2025-09-28', status: 'received' },
]

function DocumentVault() {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
        🗂️ คลังเอกสาร
        <GuidePopup title="คลังเอกสาร">
          <p>
            เก็บสัญญา ใบเสร็จ ใบรับประกัน และใบอนุญาตที่เกี่ยวข้อง — เข้าถึง
            ได้ตลอดเวลา
          </p>
          <p className="text-ink-muted text-xs">
            (ตอนนี้เป็น demo — ในระบบจริงจะ link กับที่จัดเก็บ cloud)
          </p>
        </GuidePopup>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DEMO_DOCS.map((d) => (
          <div
            key={d.name}
            className="rounded-lg border border-line bg-elevated/40 p-4 flex items-center gap-3"
          >
            <span className="text-2xl shrink-0">{d.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">{d.name}</p>
              <p className="text-xs text-ink-muted">{d.date}</p>
            </div>
            <button
              type="button"
              disabled={d.status === 'pending'}
              className="text-xs px-3 py-1.5 rounded-md border border-line text-ink-soft hover:text-ink hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ดู
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function HomeownerDashboard() {
  const { result } = useAnalysisContext()
  const { logout } = useAuth()
  // Back บนหน้านี้ = กลับไป LoginPage (ไม่มี previous step ในแอป)
  const handleBack = logout

  if (!result) {
    return (
      <>
        <Header onBack={handleBack} />
        <main className="max-w-3xl mx-auto px-6 py-12">
          <Card className="p-10 text-center">
            <p className="text-3xl mb-3">🏗️</p>
            <h2 className="text-lg font-semibold text-ink mb-1">
              ยังไม่มีข้อมูลโครงการ
            </h2>
            <p className="text-sm text-ink-muted">
              ผู้รับเหมายังไม่ได้สร้างแผนงาน — โปรดติดต่อผู้รับเหมาของคุณ
            </p>
          </Card>
        </main>
      </>
    )
  }

  const houseInfo = result.house_analysis || {}
  const projectName = houseInfo.type || 'Project'

  return (
    <>
      <Header onBack={handleBack} />
      <main
        className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5"
        data-export-section
        data-export-label="ภาพรวมโครงการ"
        data-export-filename="Homeowner_Overview"
        data-export-project={projectName}
      >
        {/* Welcome */}
        <Card className="p-6">
          <p className="text-xs text-ink-muted">โครงการของคุณ</p>
          <h1 className="text-xl font-semibold text-ink mt-1">
            {houseInfo.type || 'แผนก่อสร้าง'}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft mt-2">
            {houseInfo.estimated_size_sqm && (
              <span>📐 {houseInfo.estimated_size_sqm} ตร.ม.</span>
            )}
            {houseInfo.floors && <span>🏢 {houseInfo.floors} ชั้น</span>}
            {result.totalDays > 0 && <span>⏱ {formatDays(result.totalDays)}</span>}
            <span>
              💰 {formatBahtCompact(
                (result.total_material_cost || 0) +
                  (result.total_labor_cost || 0),
              )}
            </span>
          </div>
        </Card>

        <ProgressCard result={result} />
        <PaymentMilestones result={result} />
        <DocumentVault />
      </main>
    </>
  )
}

export default HomeownerDashboard
