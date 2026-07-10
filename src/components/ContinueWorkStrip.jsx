import { STATUS_META } from '../data/mockProjects'

// การ์ดโปรเจกต์ที่กำลังทำอยู่ (ค้าง) — โชว์บนหน้าแรกให้กด "ทำต่อ" ได้ทันที
function ContinueCard({ project, onContinue }) {
  const meta = STATUS_META[project.status] || STATUS_META.estimating
  const hasAnalysis = !!project.analysis?.snapshot?.result
  const progress = Number(project.progress) || 0

  return (
    <div
      className="rounded-lg border border-line bg-elevated/30 p-4 flex flex-col"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink truncate">{project.name}</p>
        <span className="text-[10px] font-mono text-ink-muted shrink-0">
          {project.id}
        </span>
      </div>
      <p className="text-xs text-ink-muted mt-0.5 truncate">
        👤 {project.customerName || project.client}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
        >
          {meta.icon} {meta.label}
        </span>
        {hasAnalysis && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
            ✓ มีผลวิเคราะห์
          </span>
        )}
      </div>

      {project.status === 'building' && (
        <div className="mt-2.5">
          <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-ink-muted mt-1 text-right">
            คืบหน้า {progress}%
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => onContinue(project)}
        className="mt-3 w-full px-3 py-1.5 rounded-md bg-accent text-canvas text-xs font-medium hover:bg-accent-soft transition-colors"
      >
        ทำต่อ →
      </button>
    </div>
  )
}

// แถบ "ทำงานต่อ" — รวมการ์ดโปรเจกต์ที่ค้างอยู่ ไว้บนสุดของหน้าแรก
function ContinueWorkStrip({ projects, onContinue }) {
  if (!projects.length) return null

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-ink">📂 ทำงานต่อ</h2>
        <span className="text-xs text-ink-muted">
          ({projects.length} โปรเจกต์ที่กำลังทำอยู่)
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((p) => (
          <ContinueCard key={p.id} project={p} onContinue={onContinue} />
        ))}
      </div>
    </section>
  )
}

export default ContinueWorkStrip
