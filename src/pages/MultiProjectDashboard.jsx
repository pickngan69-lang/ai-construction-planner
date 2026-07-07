import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SaveProjectModal from '../components/SaveProjectModal'
import { formatBaht, formatBahtCompact } from '../utils/formatters'
import {
  PROJECT_STATUSES as STATUSES,
  STATUS_META,
} from '../data/mockProjects'
import { useProjects } from '../contexts/ProjectContext'

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

function ProjectCard({
  project,
  onOpen,
  menuOpen,
  onToggleMenu,
  onEdit,
  onComplete,
  onCancel,
}) {
  const meta = STATUS_META[project.status] || STATUS_META.estimating

  // ปิดเมนู + หยุด bubble ไม่ให้ไปเปิดหน้ารายละเอียด แล้วเรียก action
  const act = (fn) => (e) => {
    e.stopPropagation()
    onToggleMenu()
    fn(project)
  }

  return (
    <div
      onClick={() => onOpen(project.id)}
      className="relative rounded-lg border border-line bg-elevated/30 p-4 cursor-pointer hover:border-accent hover:bg-elevated/50 transition-colors"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      {/* Kebab menu */}
      <button
        type="button"
        aria-label="ตัวเลือกโปรเจกต์"
        onClick={(e) => {
          e.stopPropagation()
          onToggleMenu()
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-md text-ink-muted hover:text-ink hover:bg-elevated flex items-center justify-center leading-none"
      >
        ⋮
      </button>
      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-9 right-2 z-20 w-44 rounded-lg border border-line bg-surface shadow-xl py-1 text-sm"
        >
          <button
            type="button"
            onClick={act(onEdit)}
            className="w-full text-left px-3 py-2 text-ink hover:bg-elevated transition-colors"
          >
            ✏️ แก้ไขข้อมูล
          </button>
          <button
            type="button"
            onClick={act(onComplete)}
            className="w-full text-left px-3 py-2 text-ink hover:bg-elevated transition-colors"
          >
            ✅ ทำเครื่องหมายว่าสำเร็จ
          </button>
          <button
            type="button"
            onClick={act(onCancel)}
            className="w-full text-left px-3 py-2 text-danger hover:bg-danger/10 transition-colors"
          >
            ❌ ยกเลิกโปรเจกต์
          </button>
        </div>
      )}

      <div className="pr-7">
        <p className="text-sm font-medium text-ink">{project.name}</p>
        <p className="text-xs text-ink-muted mt-0.5">
          👤 {project.customerName || project.client}
        </p>
        {project.location && (
          <p className="text-xs text-ink-muted mt-0.5">📍 {project.location}</p>
        )}
        <p className="text-xs font-mono text-ink-soft mt-2">
          มูลค่า {formatBahtCompact(project.boqBudget)}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-accent">ดูรายละเอียด →</span>
          <span className="text-[10px] font-mono text-ink-muted">{project.id}</span>
        </div>
      </div>
    </div>
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
  const { projects, updateProject } = useProjects()
  const handleOpen = (pid) => navigate(`/project/${pid}`)

  // เมนู kebab เปิดได้ทีละใบ (จัดการที่ parent) + ปิดเมื่อคลิกที่อื่น
  const [openMenuId, setOpenMenuId] = useState(null)
  useEffect(() => {
    if (!openMenuId) return
    const close = () => setOpenMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])

  // modal แก้ไข + dialog ยืนยันยกเลิก
  const [editing, setEditing] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null)

  const handleComplete = (project) =>
    updateProject(project.id, { status: 'completed' })
  const handleCancelRequest = (project) => setConfirmCancel(project)
  const handleConfirmCancel = () => {
    if (confirmCancel) updateProject(confirmCancel.id, { status: 'cancelled' })
    setConfirmCancel(null)
  }
  const handleEdit = (project) => setEditing(project)
  const handleSaveEdit = (details) => {
    if (editing) {
      updateProject(editing.id, { ...details, client: details.customerName })
    }
    setEditing(null)
  }

  // แยกโปรเจกต์ที่ยกเลิกออกจากบอร์ดหลัก
  const boardProjects = projects.filter((p) => p.status !== 'cancelled')
  const cancelledProjects = projects.filter((p) => p.status === 'cancelled')

  const summary = useMemo(() => {
    const totalValue = boardProjects.reduce((s, p) => s + p.boqBudget, 0)
    // profit only meaningful once there's actual cost (building/delivered)
    const withActual = boardProjects.filter((p) => p.actualCost > 0)
    const profit = withActual.reduce((s, p) => s + (p.boqBudget - p.actualCost), 0)
    return { count: boardProjects.length, totalValue, profit }
  }, [boardProjects])

  // projects with cost — finance sections (ไม่รวม estimating และ cancelled)
  const activeProjects = boardProjects.filter((p) => p.status !== 'estimating')

  const cardProps = (p) => ({
    project: p,
    onOpen: handleOpen,
    menuOpen: openMenuId === p.id,
    onToggleMenu: () => setOpenMenuId((cur) => (cur === p.id ? null : p.id)),
    onEdit: handleEdit,
    onComplete: handleComplete,
    onCancel: handleCancelRequest,
  })

  return (
    <>
      <Header onBack={() => navigate('/')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink">แดชบอร์ดโปรเจกต์ (Mini ERP)</h2>
            <p className="text-sm text-ink-muted mt-1">
              ภาพรวมโปรเจกต์ลูกค้าทั้งหมด สถานะงาน ค่างวด และกำไร-ขาดทุน
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="shrink-0 px-4 py-2 rounded-md bg-accent text-canvas text-sm font-medium hover:bg-accent-soft transition-colors"
          >
            + สร้างโปรเจกต์ใหม่
          </button>
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
            // คอลัมน์ "ส่งมอบแล้ว" รวมสถานะ delivered + completed
            const colProjects = boardProjects.filter(
              (p) =>
                p.status === s.key ||
                (s.key === 'delivered' && p.status === 'completed'),
            )
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
                  <span className="text-xs text-ink-muted">{colProjects.length}</span>
                </div>
                <div className="space-y-2">
                  {colProjects.length === 0 ? (
                    <p className="text-xs text-ink-muted py-4 text-center">— ไม่มีโปรเจกต์ —</p>
                  ) : (
                    colProjects.map((p) => <ProjectCard key={p.id} {...cardProps(p)} />)
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

        {/* Cancelled projects */}
        {cancelledProjects.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
              ❌ โปรเจกต์ที่ยกเลิก
              <span className="text-xs text-ink-muted">
                ({cancelledProjects.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 opacity-80">
              {cancelledProjects.map((p) => (
                <ProjectCard key={p.id} {...cardProps(p)} />
              ))}
            </div>
          </Card>
        )}

        <p className="text-xs text-ink-muted text-center">
          * ข้อมูลตัวอย่าง (mock) — จะเชื่อมกับ ERP backend (Flask/PostgreSQL) ในเฟสถัดไป
        </p>
      </main>

      {/* Edit customer info */}
      {editing && (
        <SaveProjectModal
          initial={editing}
          onConfirm={handleSaveEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Confirm cancel */}
      {confirmCancel && (
        <ConfirmDialog
          title="ยกเลิกโปรเจกต์?"
          message={`ยืนยันยกเลิกโปรเจกต์ "${confirmCancel.name}"?\nโปรเจกต์จะถูกย้ายไปหมวด "ยกเลิก" (ยกเลิกได้ภายหลังโดยแก้สถานะ)`}
          confirmLabel="❌ ยกเลิกโปรเจกต์"
          onConfirm={handleConfirmCancel}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </>
  )
}

export default MultiProjectDashboard
