import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import { formatBaht, formatBahtCompact } from '../utils/formatters'
import {
  MOCK_PROJECTS,
  PROJECT_STATUSES as STATUSES,
  STATUS_META,
} from '../data/mockProjects'

function StatCard({ icon, label, value, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${accent}22` }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">{label}</p>
          <p className="font-mono text-lg font-medium truncate" style={{ color: accent }}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  )
}

function ProjectCard({ project, onOpen }) {
  const meta = STATUS_META[project.status]
  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="w-full text-left rounded-lg border border-line bg-elevated/30 p-4 hover:border-accent hover:bg-elevated/50 transition-colors"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink">{project.name}</p>
        <span className="text-[10px] font-mono text-ink-muted shrink-0">
          {project.id}
        </span>
      </div>
      <p className="text-xs text-ink-muted mt-0.5">👤 {project.client}</p>
      <p className="text-xs font-mono text-ink-soft mt-2">
        มูลค่า {formatBahtCompact(project.boqBudget)}
      </p>
      <p className="text-[11px] text-accent mt-2">ดูรายละเอียด →</p>
    </button>
  )
}

// Installment (ค่างวดงาน) tracking row
function InstallmentRow({ project }) {
  const pct =
    project.installmentTotal > 0
      ? (project.installmentPaid / project.installmentTotal) * 100
      : 0
  return (
    <div className="rounded-lg border border-line bg-elevated/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{project.name}</p>
        <span className="text-xs font-mono text-ink-soft">
          {formatBaht(project.installmentPaid)} / {formatBaht(project.installmentTotal)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-elevated overflow-hidden mt-2">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-ink-muted mt-1 text-right">
        เก็บแล้ว {pct.toFixed(0)}%
      </p>
    </div>
  )
}

// BOQ vs Actual cost (เปรียบเทียบกำไร-ขาดทุน) row
function ProfitRow({ project }) {
  const profit = project.boqBudget - project.actualCost
  const isLoss = profit < 0
  const maxVal = Math.max(project.boqBudget, project.actualCost, 1)
  const boqW = (project.boqBudget / maxVal) * 100
  const actW = (project.actualCost / maxVal) * 100
  return (
    <div className="rounded-lg border border-line bg-elevated/20 p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-ink">{project.name}</p>
        <span
          className="text-xs font-mono font-medium px-2 py-0.5 rounded"
          style={{
            backgroundColor: isLoss ? '#e76f5122' : '#2a9d8f22',
            color: isLoss ? '#e76f51' : '#2a9d8f',
          }}
        >
          {isLoss ? '📉 ขาดทุน' : '📈 กำไร'} {formatBaht(Math.abs(profit))}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-16 text-[11px] text-ink-muted shrink-0">BOQ</span>
          <div className="flex-1 h-2.5 rounded-full bg-elevated overflow-hidden">
            <div className="h-full" style={{ width: `${boqW}%`, backgroundColor: '#457b9d' }} />
          </div>
          <span className="w-20 text-[11px] font-mono text-ink-soft text-right">
            {formatBahtCompact(project.boqBudget)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-[11px] text-ink-muted shrink-0">ต้นทุนจริง</span>
          <div className="flex-1 h-2.5 rounded-full bg-elevated overflow-hidden">
            <div className="h-full" style={{ width: `${actW}%`, backgroundColor: isLoss ? '#e76f51' : '#e07a2f' }} />
          </div>
          <span className="w-20 text-[11px] font-mono text-ink-soft text-right">
            {formatBahtCompact(project.actualCost)}
          </span>
        </div>
      </div>
    </div>
  )
}

function MultiProjectDashboard() {
  const navigate = useNavigate()
  const handleOpen = (pid) => navigate(`/project/${pid}`)

  const summary = useMemo(() => {
    const totalValue = MOCK_PROJECTS.reduce((s, p) => s + p.boqBudget, 0)
    // profit only meaningful once there's actual cost (building/delivered)
    const withActual = MOCK_PROJECTS.filter((p) => p.actualCost > 0)
    const profit = withActual.reduce((s, p) => s + (p.boqBudget - p.actualCost), 0)
    return { count: MOCK_PROJECTS.length, totalValue, profit }
  }, [])

  // projects that have started incurring cost — used by both finance sections
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status !== 'estimating')

  return (
    <>
      <Header onBack={() => navigate('/')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">แดชบอร์ดโปรเจกต์ (Mini ERP)</h2>
          <p className="text-sm text-ink-muted mt-1">
            ภาพรวมโปรเจกต์ลูกค้าทั้งหมด สถานะงาน ค่างวด และกำไร-ขาดทุน
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon="🏗️" label="โปรเจกต์ทั้งหมด" value={`${summary.count} โปรเจกต์`} accent="#e07a2f" />
          <StatCard icon="💰" label="มูลค่างานรวม" value={formatBahtCompact(summary.totalValue)} accent="#457b9d" />
          <StatCard icon="📈" label="กำไรสะสม (โดยประมาณ)" value={formatBahtCompact(summary.profit)} accent="#2a9d8f" />
        </div>

        {/* Kanban by status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {STATUSES.map((s) => {
            const projects = MOCK_PROJECTS.filter((p) => p.status === s.key)
            return (
              <Card key={s.key} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.icon} {s.label}
                  </h3>
                  <span className="text-xs text-ink-muted">{projects.length}</span>
                </div>
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <p className="text-xs text-ink-muted py-4 text-center">— ไม่มีโปรเจกต์ —</p>
                  ) : (
                    projects.map((p) => (
                      <ProjectCard key={p.id} project={p} onOpen={handleOpen} />
                    ))
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Finance sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Installment tracking */}
          <Card className="p-5">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              💳 ค่างวดงาน (Installment Tracking)
            </h3>
            <div className="space-y-3">
              {activeProjects.map((p) => (
                <InstallmentRow key={p.id} project={p} />
              ))}
            </div>
          </Card>

          {/* BOQ vs Actual */}
          <Card className="p-5">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              ⚖️ BOQ vs ต้นทุนจริง (กำไร-ขาดทุน)
            </h3>
            <div className="space-y-3">
              {activeProjects.map((p) => (
                <ProfitRow key={p.id} project={p} />
              ))}
            </div>
          </Card>
        </div>

        <p className="text-xs text-ink-muted text-center">
          * ข้อมูลตัวอย่าง (mock) — จะเชื่อมกับ ERP backend (Flask/PostgreSQL) ในเฟสถัดไป
        </p>
      </main>
    </>
  )
}

export default MultiProjectDashboard
