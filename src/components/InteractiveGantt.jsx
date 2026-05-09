import { useMemo, useRef, useState } from 'react'
import { exportCurrentSection } from '../utils/exportPdf'

// ============================================================
// Constants
// ============================================================
const PHASE_COLORS = ['#e07a2f', '#2a9d8f', '#264653', '#457b9d', '#8338ec']
const ACTUAL_STRIPE =
  'repeating-linear-gradient(135deg, transparent 0 4px, rgba(255,255,255,0.32) 4px 8px)'

const STATUSES = [
  { id: 'not_started', label: 'ยังไม่เริ่ม', icon: '⬜', color: '#78716c' },
  { id: 'in_progress', label: 'กำลังทำ', icon: '🔵', color: '#457b9d' },
  { id: 'completed', label: 'เสร็จแล้ว', icon: '✅', color: '#2a9d8f' },
  { id: 'delayed', label: 'ล่าช้า', icon: '⚠️', color: '#e76f51' },
]
const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]))

const ZOOM_LEVELS = [10, 16, 24, 32, 48]
const DEFAULT_ZOOM = 24

const LABEL_WIDTH = 180
const STATUS_WIDTH = 110
const INPUTS_WIDTH = 110
const DELETE_WIDTH = 28
const FIXED_LEFT_WIDTH =
  LABEL_WIDTH + STATUS_WIDTH + INPUTS_WIDTH + DELETE_WIDTH
const ROW_HEIGHT = 64
const BAR_HEIGHT = 22
const PLANNED_TOP = 8
const ACTUAL_TOP = 34
const HEADER_HEIGHT = 44
const RESIZE_HANDLE_W = 8
const MIN_DURATION = 1

// ============================================================
// Sample data
// ============================================================
const SAMPLE_PHASES = [
  { name: 'เตรียมงาน' },
  { name: 'งานโครงสร้าง' },
  { name: 'งานสถาปัตย์' },
  { name: 'งานระบบ' },
  { name: 'งานตกแต่ง' },
]

let _autoId = 0
const nid = (prefix = 't') => `${prefix}-${++_autoId}-${Date.now() % 1e6}`

function buildSampleTasks() {
  const seed = [
    { name: 'สำรวจที่ดิน', phaseIdx: 0, planned: 3, actual: 4, status: 'completed', progress: 100 },
    { name: 'ถมดิน/ปรับระดับ', phaseIdx: 0, planned: 5, actual: 5, status: 'completed', progress: 100 },
    { name: 'เสาเข็ม + ฐานราก', phaseIdx: 1, planned: 14, actual: 16, status: 'in_progress', progress: 60 },
    { name: 'เสา/คาน/พื้น', phaseIdx: 1, planned: 21, actual: 21, status: 'not_started', progress: 0 },
    { name: 'ก่อผนัง', phaseIdx: 2, planned: 14, actual: 14, status: 'not_started', progress: 0 },
    { name: 'มุงหลังคา', phaseIdx: 2, planned: 7, actual: 7, status: 'not_started', progress: 0 },
    { name: 'งานไฟฟ้า/ประปา', phaseIdx: 3, planned: 10, actual: 10, status: 'not_started', progress: 0 },
    { name: 'ปูกระเบื้อง + ทาสี', phaseIdx: 4, planned: 14, actual: 14, status: 'not_started', progress: 0 },
  ]
  let pCursor = 0
  let aCursor = 0
  return seed.map((s) => {
    const t = {
      id: nid(),
      ...s,
      planned_start: pCursor,
      planned_duration: s.planned,
      actual_start: aCursor,
      actual_duration: s.actual,
    }
    pCursor += s.planned
    aCursor += s.actual
    return t
  })
}

// ============================================================
// Helpers
// ============================================================
function applyEdit(baseline, taskIndex, which, newStart, newDur, modeArg) {
  const startKey = `${which}_start`
  const durKey = `${which}_duration`
  const old = baseline[taskIndex]
  if (!old) return baseline

  const finalStart = newStart != null ? Math.max(0, newStart) : old[startKey]
  const finalDur = newDur != null ? Math.max(MIN_DURATION, newDur) : old[durKey]
  const oldEnd = old[startKey] + old[durKey]
  const newEnd = finalStart + finalDur
  const delta = newEnd - oldEnd

  return baseline.map((t, i) => {
    if (i === taskIndex) {
      return { ...t, [startKey]: finalStart, [durKey]: finalDur }
    }
    if (modeArg === 'cascade' && i > taskIndex && delta !== 0) {
      return { ...t, [startKey]: Math.max(0, t[startKey] + delta) }
    }
    return t
  })
}

function detectOverlaps(tasks) {
  // Returns Set of task ids that have planned-range overlap with any other task.
  const overlapping = new Set()
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i]
      const b = tasks[j]
      const aStart = a.planned_start
      const aEnd = a.planned_start + a.planned_duration
      const bStart = b.planned_start
      const bEnd = b.planned_start + b.planned_duration
      if (aStart < bEnd && bStart < aEnd) {
        overlapping.add(a.id)
        overlapping.add(b.id)
      }
    }
  }
  return overlapping
}

const dateFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
})
const longDateFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
function toInputDate(d) {
  return d.toISOString().slice(0, 10)
}

// ============================================================
// Subcomponents
// ============================================================
function ToolbarButton({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-accent text-canvas'
          : 'text-ink-soft hover:text-ink hover:bg-elevated'
      }`}
    >
      {children}
    </button>
  )
}

function NumberInput({ value, onCommit, accent }) {
  const [draft, setDraft] = useState(String(value))
  // sync external changes
  if (Number(draft) !== value && document.activeElement?.tagName !== 'INPUT') {
    // only sync when not actively editing
    setTimeout(() => setDraft(String(value)), 0)
  }
  return (
    <input
      type="number"
      min="1"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = Number(draft)
        if (Number.isFinite(n) && n >= 1) {
          onCommit(Math.round(n))
        } else {
          setDraft(String(value))
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.target.blur()
        if (e.key === 'Escape') {
          setDraft(String(value))
          e.target.blur()
        }
      }}
      className="w-12 rounded border border-line bg-canvas px-1.5 py-1 text-right font-mono text-sm text-ink focus:outline-none focus:border-accent"
      style={accent ? { borderColor: `${accent}55`, color: accent } : undefined}
    />
  )
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-line bg-canvas px-1.5 py-1 text-xs text-ink focus:outline-none focus:border-accent"
    >
      {STATUSES.map((s) => (
        <option key={s.id} value={s.id}>
          {s.icon} {s.label}
        </option>
      ))}
    </select>
  )
}

function GanttBar({
  task,
  taskIndex,
  which,
  baseColor,
  colWidth,
  isOverlapping,
  onDrag,
}) {
  const dragRef = useRef(null)
  const startKey = `${which}_start`
  const durKey = `${which}_duration`
  const start = task[startKey]
  const duration = task[durKey]

  const beginDrag = (e, type) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      type,
      startX: e.clientX,
      origStart: start,
      origDur: duration,
    }
  }

  const onPointerMove = (e) => {
    if (!dragRef.current) return
    const { type, startX, origStart, origDur } = dragRef.current
    const deltaDays = Math.round((e.clientX - startX) / colWidth)
    if (type === 'move') {
      onDrag(taskIndex, which, {
        newStart: origStart + deltaDays,
        newDur: origDur,
      })
    } else if (type === 'resize-right') {
      onDrag(taskIndex, which, {
        newStart: origStart,
        newDur: origDur + deltaDays,
      })
    } else if (type === 'resize-left') {
      // Dragging left edge: keep end fixed, change start + duration
      const newStart = origStart + deltaDays
      const newDur = origDur - deltaDays
      onDrag(taskIndex, which, { newStart, newDur })
    }
  }

  const endDrag = (e) => {
    if (!dragRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    dragRef.current = null
  }

  // Color: for actual bar, use status color if not 'not_started'; planned always uses phase color
  const status = STATUS_BY_ID[task.status] || STATUS_BY_ID.not_started
  const color =
    which === 'actual' && task.status && task.status !== 'not_started'
      ? status.color
      : baseColor

  const left = start * colWidth
  const width = Math.max(duration * colWidth, 6)
  const top = which === 'planned' ? PLANNED_TOP : ACTUAL_TOP
  const tooltip = [
    `${task.name} — ${which === 'planned' ? 'แผน' : 'ทำจริง'}`,
    `วัน ${start + 1}-${start + duration} (${duration} วัน)`,
    which === 'actual' ? `สถานะ: ${status.icon} ${status.label}` : null,
    which === 'actual' && task.progress > 0
      ? `Progress: ${task.progress}%`
      : null,
    '— ลากกลาง = ย้าย • ลากขอบ = ปรับเวลา —',
  ]
    .filter(Boolean)
    .join('\n')

  // Progress fill — only on actual bar
  const showProgress =
    which === 'actual' && task.progress > 0 && task.progress < 100
  const progressWidth = (width * task.progress) / 100

  return (
    <div
      title={tooltip}
      onPointerDown={(e) => beginDrag(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="absolute rounded text-[10px] text-white flex items-center overflow-hidden shadow-sm select-none cursor-grab active:cursor-grabbing hover:brightness-110 transition"
      style={{
        left,
        top,
        width,
        height: BAR_HEIGHT,
        backgroundColor: color,
        backgroundImage: which === 'actual' ? ACTUAL_STRIPE : 'none',
        outline: which === 'planned' && isOverlapping ? '2px solid #e76f51' : 'none',
        touchAction: 'none',
      }}
    >
      {/* progress fill (actual bar only) */}
      {showProgress && (
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{
            width: progressWidth,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRight: '2px solid rgba(255,255,255,0.6)',
          }}
        />
      )}
      <span className="relative z-10 px-1.5 font-bold pointer-events-none">
        {which === 'planned' ? 'P' : 'A'}
      </span>
      <span className="relative z-10 truncate font-medium pointer-events-none">
        {duration}d
        {which === 'actual' && task.progress > 0 && (
          <span className="ml-1 opacity-90">{task.progress}%</span>
        )}
      </span>
      {/* left resize handle */}
      <span
        onPointerDown={(e) => beginDrag(e, 'resize-left')}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="absolute left-0 top-0 bottom-0 cursor-ew-resize bg-white/15 hover:bg-white/40"
        style={{ width: RESIZE_HANDLE_W, touchAction: 'none' }}
        title="ลากเพื่อปรับขอบซ้าย"
      />
      {/* right resize handle */}
      <span
        onPointerDown={(e) => beginDrag(e, 'resize-right')}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="absolute right-0 top-0 bottom-0 cursor-ew-resize bg-white/15 hover:bg-white/40"
        style={{ width: RESIZE_HANDLE_W, touchAction: 'none' }}
        title="ลากเพื่อปรับขอบขวา"
      />
    </div>
  )
}

// ============================================================
// Main component
// ============================================================
function InteractiveGantt({
  phases = SAMPLE_PHASES,
  initialTasks: initialTasksProp,
  // Optional controlled mode — pass `tasks` + `onTasksChange` to lift state up
  tasks: tasksProp,
  onTasksChange,
  // Optional controlled UI state — pass these to persist mode/zoom/start across
  // tab switches. When omitted, falls back to internal useState.
  mode: modeProp,
  onModeChange,
  colWidth: colWidthProp,
  onColWidthChange,
  projectStartDate: startDateProp,
  onProjectStartDateChange,
}) {
  const isControlled = tasksProp !== undefined && typeof onTasksChange === 'function'
  const [internalTasks, setInternalTasks] = useState(
    () => initialTasksProp || buildSampleTasks(),
  )
  const tasks = isControlled ? tasksProp : internalTasks
  const setTasks = (next) => {
    if (isControlled) {
      const resolved = typeof next === 'function' ? next(tasksProp) : next
      onTasksChange(resolved)
    } else {
      setInternalTasks(next)
    }
  }

  // UI state — controlled if prop+handler provided, else internal
  const [internalMode, setInternalMode] = useState('free')
  const mode = modeProp !== undefined ? modeProp : internalMode
  const setMode = (v) =>
    typeof onModeChange === 'function' ? onModeChange(v) : setInternalMode(v)

  const [internalColWidth, setInternalColWidth] = useState(DEFAULT_ZOOM)
  const colWidth = colWidthProp !== undefined ? colWidthProp : internalColWidth
  const setColWidth = (v) =>
    typeof onColWidthChange === 'function'
      ? onColWidthChange(v)
      : setInternalColWidth(v)

  const [internalStartDate, setInternalStartDate] = useState(() => new Date())
  const projectStartDate =
    startDateProp !== undefined ? startDateProp : internalStartDate
  const setProjectStartDate = (v) =>
    typeof onProjectStartDateChange === 'function'
      ? onProjectStartDateChange(v)
      : setInternalStartDate(v)

  // ----- derived state -----
  const totalDays = useMemo(
    () =>
      tasks.reduce(
        (m, t) =>
          Math.max(
            m,
            t.planned_start + t.planned_duration,
            t.actual_start + t.actual_duration,
          ),
        0,
      ),
    [tasks],
  )
  const chartDays = totalDays + 5
  const overlaps = useMemo(() => detectOverlaps(tasks), [tasks])

  // tick interval (in days) — adapts to zoom
  const tickInterval = Math.max(1, Math.round(60 / colWidth))
  const dayTicks = []
  for (let d = 0; d <= chartDays; d += tickInterval) dayTicks.push(d)

  // ----- mutations -----
  const updateTaskField = (id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const handleDrag = (taskIndex, which, { newStart, newDur }) => {
    setTasks((prev) =>
      applyEdit(prev, taskIndex, which, newStart, newDur, mode),
    )
  }

  const handleDurationInput = (taskIndex, which, newDur) => {
    setTasks((prev) =>
      applyEdit(prev, taskIndex, which, null, newDur, mode),
    )
  }

  const addTaskToPhase = (phaseIdx) => {
    setTasks((prev) => {
      // place after the last existing task (in either phase) so it lays out cleanly
      const lastPlanned = prev.reduce(
        (m, t) => Math.max(m, t.planned_start + t.planned_duration),
        0,
      )
      const lastActual = prev.reduce(
        (m, t) => Math.max(m, t.actual_start + t.actual_duration),
        0,
      )
      const newTask = {
        id: nid('new'),
        name: 'งานใหม่',
        phaseIdx,
        planned: 7,
        actual: 7,
        planned_start: lastPlanned,
        planned_duration: 7,
        actual_start: lastActual,
        actual_duration: 7,
        status: 'not_started',
        progress: 0,
      }
      return [...prev, newTask]
    })
  }

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const zoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(colWidth)
    setColWidth(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, idx + 1)])
  }
  const zoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(colWidth)
    setColWidth(ZOOM_LEVELS[Math.max(0, idx - 1)])
  }
  const handleExport = async () => {
    try {
      await exportCurrentSection()
    } catch (err) {
      console.error('Export failed:', err)
      alert(`Export ล้มเหลว: ${err?.message || 'unknown'}`)
    }
  }

  const groupedByPhase = phases.map((phase, idx) => ({
    ...phase,
    idx,
    color: PHASE_COLORS[idx % PHASE_COLORS.length],
    tasks: tasks
      .map((t, taskIndex) => ({ ...t, _taskIndex: taskIndex }))
      .filter((t) => t.phaseIdx === idx),
  }))

  return (
    <div className="space-y-3">
      {/* ===================== Toolbar ===================== */}
      <div
        className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-line bg-surface"
        data-print-hide
      >
        {/* Mode toggle */}
        <div className="flex rounded-md border border-line bg-canvas p-0.5">
          <ToolbarButton
            active={mode === 'cascade'}
            onClick={() => setMode('cascade')}
            title="เมื่อย้ายงาน งานที่ตามมาจะเลื่อนตามอัตโนมัติ"
          >
            🔗 Auto Cascade
          </ToolbarButton>
          <ToolbarButton
            active={mode === 'free'}
            onClick={() => setMode('free')}
            title="ย้ายแต่ละงานได้อิสระ ทับซ้อนได้ (จะเตือนสีแดง)"
          >
            ✋ Free Move
          </ToolbarButton>
        </div>

        {/* Project start date */}
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          <span>📅 เริ่มโครงการ:</span>
          <input
            type="date"
            value={toInputDate(projectStartDate)}
            onChange={(e) => {
              const v = e.target.value
              if (v) setProjectStartDate(new Date(v))
            }}
            className="rounded border border-line bg-canvas px-2 py-1 text-xs text-ink focus:outline-none focus:border-accent"
          />
          <span className="text-ink font-medium">
            {longDateFmt.format(projectStartDate)}
          </span>
        </label>

        {/* Zoom */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-ink-muted mr-1">🔍</span>
          <button
            type="button"
            onClick={zoomOut}
            disabled={colWidth === ZOOM_LEVELS[0]}
            className="w-7 h-7 rounded border border-line text-ink-soft hover:text-ink hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            title="ซูมออก"
          >
            −
          </button>
          <span className="font-mono text-xs text-ink-muted w-12 text-center">
            {colWidth}px
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={colWidth === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            className="w-7 h-7 rounded border border-line text-ink-soft hover:text-ink hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            title="ซูมเข้า"
          >
            +
          </button>
        </div>

        {/* Export */}
        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-line text-ink-soft hover:text-ink hover:border-accent transition-colors"
          title="พิมพ์ / บันทึกเป็น PDF"
        >
          📤 Export PDF
        </button>
      </div>

      {/* ===================== Legend ===================== */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="font-medium text-ink">Bar:</span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-6 h-3 rounded"
            style={{ backgroundColor: PHASE_COLORS[0] }}
          />
          แผน (P)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-6 h-3 rounded"
            style={{
              backgroundColor: PHASE_COLORS[0],
              backgroundImage: ACTUAL_STRIPE,
            }}
          />
          ทำจริง (A)
        </span>
        <span className="mx-2 text-ink-muted">•</span>
        <span className="font-medium text-ink">สถานะ:</span>
        {STATUSES.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1"
            style={{ color: s.color }}
          >
            {s.icon} {s.label}
          </span>
        ))}
      </div>

      {/* ===================== Chart ===================== */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <div
            style={{
              minWidth: FIXED_LEFT_WIDTH + chartDays * colWidth,
              width: 'max-content',
            }}
          >
            {/* Header */}
            <div
              className="flex border-b border-line bg-elevated/40"
              style={{ height: HEADER_HEIGHT }}
            >
              <div
                style={{ width: LABEL_WIDTH }}
                className="shrink-0 sticky left-0 bg-surface z-20 border-r border-line px-3 flex items-center text-xs font-medium text-ink-soft"
              >
                รายการงาน
              </div>
              <div
                style={{ width: STATUS_WIDTH }}
                className="shrink-0 border-r border-line flex items-center justify-center text-[11px] font-medium text-ink-soft"
              >
                สถานะ
              </div>
              <div
                style={{ width: INPUTS_WIDTH }}
                className="shrink-0 border-r border-line grid grid-cols-2 text-[11px] font-medium text-ink-soft"
              >
                <div className="flex items-center justify-center border-r border-line">
                  แผน
                </div>
                <div className="flex items-center justify-center">ทำจริง</div>
              </div>
              <div style={{ width: DELETE_WIDTH }} className="shrink-0 border-r border-line" />
              <div className="relative" style={{ width: chartDays * colWidth }}>
                {dayTicks.map((d) => (
                  <span
                    key={d}
                    className="absolute top-2 text-[10px] text-ink-muted font-mono"
                    style={{ left: d * colWidth + 2 }}
                  >
                    {dateFmt.format(addDays(projectStartDate, d))}
                  </span>
                ))}
              </div>
            </div>

            {/* Body — phases */}
            {groupedByPhase.map((phase) => (
              <div key={phase.idx}>
                {/* Phase header row */}
                <div
                  className="flex border-b border-line/60 text-xs font-semibold text-ink"
                  style={{ backgroundColor: `${phase.color}11` }}
                >
                  <div
                    className="sticky left-0 px-3 py-2"
                    style={{
                      width: FIXED_LEFT_WIDTH,
                      backgroundColor: `${phase.color}22`,
                      borderRight: '1px solid var(--color-line)',
                    }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                      style={{ backgroundColor: phase.color }}
                    />
                    เฟส {phase.idx + 1}: {phase.name}
                    <span className="ml-2 text-ink-muted font-normal">
                      ({phase.tasks.length} งาน)
                    </span>
                  </div>
                  <div
                    style={{ minWidth: chartDays * colWidth }}
                    className="flex-1"
                  />
                </div>

                {/* Task rows */}
                {phase.tasks.map((task) => {
                  const isOverlap = overlaps.has(task.id)
                  return (
                    <div
                      key={task.id}
                      className="flex border-b border-line/40 hover:bg-elevated/20 transition-colors"
                    >
                      {/* Name (editable) */}
                      <div
                        style={{ width: LABEL_WIDTH }}
                        className="shrink-0 sticky left-0 bg-surface z-10 border-r border-line px-3 flex items-center text-xs"
                      >
                        <span
                          className="w-2 h-2 rounded-full mr-2 shrink-0"
                          style={{ backgroundColor: phase.color }}
                        />
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) =>
                            updateTaskField(task.id, { name: e.target.value })
                          }
                          className="flex-1 min-w-0 bg-transparent text-ink focus:outline-none focus:bg-canvas rounded px-1"
                        />
                        {isOverlap && (
                          <span
                            className="ml-1 text-[10px] text-danger"
                            title="งานนี้ทับซ้อนเวลากับงานอื่น"
                          >
                            ⚠️
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div
                        style={{ width: STATUS_WIDTH }}
                        className="shrink-0 border-r border-line px-1.5 flex items-center"
                      >
                        <StatusSelect
                          value={task.status || 'not_started'}
                          onChange={(s) =>
                            updateTaskField(task.id, {
                              status: s,
                              progress:
                                s === 'completed'
                                  ? 100
                                  : s === 'not_started'
                                    ? 0
                                    : task.progress || 0,
                            })
                          }
                        />
                      </div>

                      {/* Inputs (planned + actual days) */}
                      <div
                        style={{ width: INPUTS_WIDTH }}
                        className="shrink-0 border-r border-line grid grid-cols-2 items-center px-1 gap-1"
                      >
                        <div className="flex justify-center">
                          <NumberInput
                            value={task.planned_duration}
                            onCommit={(n) =>
                              handleDurationInput(task._taskIndex, 'planned', n)
                            }
                          />
                        </div>
                        <div className="flex justify-center">
                          <NumberInput
                            value={task.actual_duration}
                            onCommit={(n) =>
                              handleDurationInput(task._taskIndex, 'actual', n)
                            }
                            accent={phase.color}
                          />
                        </div>
                      </div>

                      {/* Delete */}
                      <div
                        style={{ width: DELETE_WIDTH }}
                        className="shrink-0 border-r border-line flex items-center justify-center"
                      >
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          title="ลบงาน"
                          className="w-6 h-6 rounded text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Bars area */}
                      <div
                        className="relative"
                        style={{
                          width: chartDays * colWidth,
                          height: ROW_HEIGHT,
                        }}
                      >
                        {/* day grid */}
                        {dayTicks.map((d) => (
                          <span
                            key={`grid-${task.id}-${d}`}
                            className="absolute top-0 bottom-0 border-l border-line/20"
                            style={{ left: d * colWidth }}
                          />
                        ))}
                        <GanttBar
                          task={task}
                          taskIndex={task._taskIndex}
                          which="planned"
                          baseColor={phase.color}
                          colWidth={colWidth}
                          isOverlapping={isOverlap}
                          onDrag={handleDrag}
                        />
                        <GanttBar
                          task={task}
                          taskIndex={task._taskIndex}
                          which="actual"
                          baseColor={phase.color}
                          colWidth={colWidth}
                          isOverlapping={false}
                          onDrag={handleDrag}
                        />
                      </div>
                    </div>
                  )
                })}

                {/* Add-task row */}
                <div
                  className="flex border-b border-line/30"
                  data-print-hide
                >
                  <div
                    style={{ width: FIXED_LEFT_WIDTH }}
                    className="sticky left-0 bg-surface px-3 py-1.5 border-r border-line"
                  >
                    <button
                      type="button"
                      onClick={() => addTaskToPhase(phase.idx)}
                      className="text-xs text-ink-muted hover:text-accent transition-colors"
                    >
                      + เพิ่มงานในเฟส {phase.idx + 1}
                    </button>
                  </div>
                  <div
                    style={{ minWidth: chartDays * colWidth }}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== Help text ===================== */}
      <div className="text-xs text-ink-muted space-y-1">
        <p>
          💡 <strong>การใช้งาน:</strong> แก้ตัวเลขในช่อง "แผน / ทำจริง" หรือ
          ลากแท่ง (กลาง = ย้าย, ขอบ = ปรับเวลา) — snap ทีละ 1 วัน
        </p>
        <p>
          {mode === 'cascade'
            ? '🔗 โหมด Cascade: เมื่อแก้งานหนึ่ง งานที่ตามมาจะเลื่อนตามอัตโนมัติ'
            : '✋ โหมด Free: แก้แต่ละงานได้อิสระ — ถ้าทับซ้อน จะมีกรอบสีแดงเตือน'}
        </p>
      </div>
    </div>
  )
}

export default InteractiveGantt
