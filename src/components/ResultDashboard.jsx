import { useCallback, useEffect, useMemo, useState } from 'react'
import Tabs from './ui/Tabs'
import GradeSelector from './ui/GradeSelector'
import Card from './ui/Card'
import ConfirmDialog from './ui/ConfirmDialog'
import ModeToggle from './ModeToggle'
import TaskModal from './TaskModal'
import DashboardTab from './tabs/DashboardTab'
import InteractiveGantt from './InteractiveGantt'
import BOQTab from './tabs/BOQTab'
import TaskDetailTab from './tabs/TaskDetailTab'
import MaterialTab from './tabs/MaterialTab'
import RecommendTab from './tabs/RecommendTab'
import ContractTab from './tabs/ContractTab' // แทรกไฟล์สัญญาเข้ามาแล้ว
import { useAnalysisContext } from '../contexts/AnalysisContext'
import { formatBaht, formatDays } from '../utils/formatters'

// Map AI-result tasks → InteractiveGantt task shape
function toGanttTasks(allTasks = []) {
  return allTasks.map((t, i) => ({
    id: t.id || `gtask-${i}`,
    name: t.name,
    phaseIdx: t.phaseIdx,
    planned_start: t.planned_start_day || 0,
    planned_duration: t.planned_duration_days || 7,
    actual_start: t.actual_start_day || 0,
    actual_duration: t.actual_duration_days || 7,
    status: t.status || 'not_started',
    progress: t.progress || 0,
  }))
}

// Convert a single addedTask record to InteractiveGantt's shape (uses
// the same id so it stays stable across syncs).
function addedTaskToGantt(t) {
  return {
    id: t.id,
    name: t.name,
    phaseIdx: t.phaseIdx,
    planned_start: t.planned_start_day || 0,
    planned_duration: t.planned_duration_days || 7,
    actual_start: t.actual_start_day || 0,
    actual_duration: t.actual_duration_days || 7,
    status: t.status || 'not_started',
    progress: t.progress || 0,
  }
}

const TAB_ITEMS = [
  { id: 'dashboard', label: 'สรุป', icon: '📊', exportName: 'Summary' },
  { id: 'gantt', label: 'Gantt', icon: '📅', exportName: 'Gantt' },
  { id: 'boq', label: 'BOQ', icon: '💰', exportName: 'BOQ' },
  { id: 'tasks', label: 'งาน', icon: '📋', exportName: 'Tasks' },
  { id: 'materials', label: 'วัสดุ', icon: '🧱', exportName: 'Materials' },
  { id: 'recommend', label: 'แนะนำ', icon: '💡', exportName: 'Recommendations' },
  { id: 'contract', label: 'สัญญา', icon: '📝', exportName: 'Contract' },
]

function SummaryHeader({ result, images, totalCost }) {
  const lo = Math.round((totalCost * 0.92) / 1000) * 1000
  const hi = Math.round((totalCost * 1.12) / 1000) * 1000
  const houseInfo = result.house_analysis || {}
  const cover = images?.[0]

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4 p-4 sm:p-6">
        {cover && (
          <div className="w-full md:w-44 aspect-square rounded-lg overflow-hidden bg-canvas shrink-0">
            <img
              src={cover.preview}
              alt="cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-ink">
            {houseInfo.type || 'แบบบ้าน'}
          </h2>
          {houseInfo.description && (
            <p className="text-sm text-ink-soft mt-1">{houseInfo.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted mt-3">
            {houseInfo.estimated_size_sqm && (
              <span>📐 {houseInfo.estimated_size_sqm} ตร.ม.</span>
            )}
            {houseInfo.floors && <span>🏢 {houseInfo.floors} ชั้น</span>}
            {result.totalDays > 0 && (
              <span>⏱ {formatDays(result.totalDays)} (ตามแผน)</span>
            )}
            {houseInfo.style && <span>🎨 {houseInfo.style}</span>}
          </div>
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-xs text-ink-muted">งบประมาณรวม (โดยประมาณ)</p>
            <p className="font-mono text-lg sm:text-xl text-accent">
              {formatBaht(lo)} - {formatBaht(hi)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ResultDashboard({
  result,
  images,
  projectInfo,
  gradeMultiplier,
  onGradeChange,
}) {
  const [tab, setTab] = useState('dashboard')
  const {
    mode,
    edits,
    setMode,
    updateTask,
    clearEdits,
    materialEdits,
    calculateMaterialTotal,
    materialLaborByGrade,
    addedTasks,
    deletedTaskIds,
    addTask,
    deleteTask,
  } = useAnalysisContext()

  // Hoist InteractiveGantt's tasks state so it survives tab switches
  const [ganttTasks, setGanttTasks] = useState(() =>
    toGanttTasks(result.allTasks),
  )
  // Hoisted UI state for InteractiveGantt — keeps mode/zoom/projectStartDate
  // alive across tab switches (Gantt unmounts when user goes to another tab)
  const [ganttMode, setGanttMode] = useState('free')
  const [ganttColWidth, setGanttColWidth] = useState(24)
  const [ganttProjectStartDate, setGanttProjectStartDate] = useState(
    () => new Date(),
  )
  // Re-init when a NEW analysis arrives (raw `result` identity changes only on new analyze)
  useEffect(() => {
    setGanttTasks(toGanttTasks(result.allTasks))
  }, [result])

  // Sync ganttTasks with added/deleted task lists from context
  useEffect(() => {
    setGanttTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id))
      const newOnes = addedTasks
        .filter((t) => !existingIds.has(t.id))
        .map(addedTaskToGantt)
      if (newOnes.length === 0) return prev
      return [...prev, ...newOnes]
    })
  }, [addedTasks])

  useEffect(() => {
    if (deletedTaskIds.length === 0) return
    setGanttTasks((prev) =>
      prev.filter((t) => {
        const m = /^gtask-(\d+)$/.exec(t.id)
        if (!m) return true // added tasks: keep
        const origIdx = Number(m[1])
        return !deletedTaskIds.includes(origIdx)
      }),
    )
  }, [deletedTaskIds])

  // Edits are ALWAYS applied (V3 — schedule is fully manual; mode toggle only
  // affects whether BOQ shows editable cost inputs)
  const adjustedResult = useMemo(() => {
    const baseline = result.allTasks || []

    // ---- Material + Labor → BOQ proportional allocation ----
    // When the active grade has manual material lists / labor, we want the
    // per-task "ค่าวัสดุ" / "ค่าแรง" columns in BOQ to add up to the tier
    // totals. We scale each task's AI cost proportionally so
    // Σ(rows) === tierTotal.
    const grade = projectInfo?.grade || 'standard'

    // Material allocation
    const matEditTotal = calculateMaterialTotal(grade)
    const materialEditCount = (materialEdits[grade] || []).filter(
      (m) => !m.isDeleted,
    ).length
    const useMaterialEdits = materialEditCount > 0
    const aiMaterialTotal = baseline.reduce(
      (s, t) => s + (Number(t.material_cost) || 0) * gradeMultiplier,
      0,
    )
    const matAllocFactor =
      useMaterialEdits && aiMaterialTotal > 0
        ? matEditTotal / aiMaterialTotal
        : 1
    const matEvenAlloc =
      useMaterialEdits && aiMaterialTotal === 0 && baseline.length > 0
        ? matEditTotal / baseline.length
        : 0

    // Labor allocation — when materialLaborByGrade[grade] > 0 we treat it as
    // an override that scales BOQ task labor proportionally
    const tierLabor = Number(materialLaborByGrade?.[grade]) || 0
    const useLaborOverride = tierLabor > 0
    const aiLaborTotal = baseline.reduce(
      (s, t) => s + (Number(t.labor_cost) || 0),
      0,
    )
    const laborAllocFactor =
      useLaborOverride && aiLaborTotal > 0 ? tierLabor / aiLaborTotal : 1
    const laborEvenAlloc =
      useLaborOverride && aiLaborTotal === 0 && baseline.length > 0
        ? tierLabor / baseline.length
        : 0

    // 1) Original tasks: skip deleted, apply edits, mark _ref = numeric idx
    const adjustedOriginals = baseline
      .map((t, i) => {
        if (deletedTaskIds.includes(i)) return null
        const o = edits[i] || {}

        const aiAdjusted = useMaterialEdits
          ? aiMaterialTotal > 0
            ? (t.material_cost || 0) * gradeMultiplier * matAllocFactor
            : matEvenAlloc
          : (t.material_cost || 0) * gradeMultiplier
        const materialCost =
          o.material_cost != null ? Number(o.material_cost) : aiAdjusted

        const aiLaborAdjusted = useLaborOverride
          ? aiLaborTotal > 0
            ? (t.labor_cost || 0) * laborAllocFactor
            : laborEvenAlloc
          : t.labor_cost || 0
        const laborCost =
          o.labor_cost != null ? Number(o.labor_cost) : aiLaborAdjusted

        const plannedStart =
          o.planned_start_day != null
            ? Number(o.planned_start_day)
            : t.planned_start_day || 0
        const plannedDur =
          o.planned_duration_days != null
            ? Math.max(1, Number(o.planned_duration_days))
            : t.planned_duration_days || 0
        const actualStart =
          o.actual_start_day != null
            ? Number(o.actual_start_day)
            : t.actual_start_day || 0
        const actualDur =
          o.actual_duration_days != null
            ? Math.max(1, Number(o.actual_duration_days))
            : t.actual_duration_days || 0

        return {
          ...t,
          name: o.name != null ? o.name : t.name,
          details: o.details != null ? o.details : t.details,
          planned_start_day: plannedStart,
          planned_duration_days: plannedDur,
          planned_end_day: plannedStart + plannedDur,
          actual_start_day: actualStart,
          actual_duration_days: actualDur,
          actual_end_day: actualStart + actualDur,
          // Backward-compat aliases — other tabs read these
          start_day: plannedStart,
          duration_days: plannedDur,
          end_day: plannedStart + plannedDur,
          material_cost_adjusted: materialCost,
          labor_cost: laborCost,
          total_cost: materialCost + laborCost,
          _ref: i,
          _isAdded: false,
          _baselineMaterial: (t.material_cost || 0) * gradeMultiplier,
          _baselineLabor: t.labor_cost || 0,
          _baselinePlannedStart: t.planned_start_day || 0,
          _baselinePlannedDuration: t.planned_duration_days || 0,
          _baselineActualStart: t.actual_start_day || 0,
          _baselineActualDuration: t.actual_duration_days || 0,
          // Specific edit flags so UI can distinguish "explicit user edit" from
          // "auto-allocated due to material list override"
          _isMaterialCostEdited: o.material_cost != null,
          _isLaborCostEdited: o.labor_cost != null,
          _isAllocated: useMaterialEdits && o.material_cost == null,
          _isCostEdited: o.material_cost != null || o.labor_cost != null,
          _isPlannedEdited:
            o.planned_start_day != null || o.planned_duration_days != null,
          _isActualEdited:
            o.actual_start_day != null || o.actual_duration_days != null,
          _isEdited:
            !!o &&
            (o.material_cost != null ||
              o.labor_cost != null ||
              o.name != null ||
              o.details != null ||
              o.planned_duration_days != null),
        }
      })
      .filter(Boolean)

    // 2) Added tasks: user-typed values are final (no grade multiplier)
    const adjustedAdded = addedTasks.map((t) => {
      const plannedStart = Number(t.planned_start_day) || 0
      const plannedDur = Math.max(1, Number(t.planned_duration_days) || 0)
      const actualStart = Number(t.actual_start_day) || 0
      const actualDur = Math.max(1, Number(t.actual_duration_days) || 0)
      const materialCost = Number(t.material_cost) || 0
      const laborCost = Number(t.labor_cost) || 0
      return {
        ...t,
        phaseName: result.phases?.[t.phaseIdx]?.name || '',
        planned_start_day: plannedStart,
        planned_duration_days: plannedDur,
        planned_end_day: plannedStart + plannedDur,
        actual_start_day: actualStart,
        actual_duration_days: actualDur,
        actual_end_day: actualStart + actualDur,
        start_day: plannedStart,
        duration_days: plannedDur,
        end_day: plannedStart + plannedDur,
        material_cost_adjusted: materialCost,
        labor_cost: laborCost,
        total_cost: materialCost + laborCost,
        _ref: t.id,
        _isAdded: true,
        _baselineMaterial: materialCost,
        _baselineLabor: laborCost,
        _baselinePlannedStart: plannedStart,
        _baselinePlannedDuration: plannedDur,
        _baselineActualStart: actualStart,
        _baselineActualDuration: actualDur,
        _isCostEdited: false,
        _isPlannedEdited: false,
        _isActualEdited: false,
        _isEdited: false,
      }
    })

    const adjustedTasks = [...adjustedOriginals, ...adjustedAdded]

    const totalMaterialFromTasks = adjustedTasks.reduce(
      (s, t) => s + (t.material_cost_adjusted || 0),
      0,
    )
    const totalLabor = adjustedTasks.reduce(
      (s, t) => s + (t.labor_cost || 0),
      0,
    )
    const maxPlannedEnd = adjustedTasks.reduce(
      (m, t) => Math.max(m, t.planned_end_day || 0),
      0,
    )
    const maxActualEnd = adjustedTasks.reduce(
      (m, t) => Math.max(m, t.actual_end_day || 0),
      0,
    )

    // Project-level material total: when manual materials exist, use their
    // sum; otherwise sum of per-task allocated material costs (== task baseline)
    const effectiveMaterial = useMaterialEdits
      ? matEditTotal
      : totalMaterialFromTasks
    // Project-level labor total: tier labor override > AI baseline
    const effectiveLabor = useLaborOverride ? tierLabor : totalLabor

    return {
      ...result,
      allTasks: adjustedTasks,
      total_material_cost_adjusted: effectiveMaterial,
      total_material_cost_from_tasks: totalMaterialFromTasks,
      total_material_cost_from_edits: matEditTotal,
      has_material_edits: useMaterialEdits,
      total_labor_cost: effectiveLabor,
      total_labor_cost_from_tasks: totalLabor,
      total_labor_cost_from_override: tierLabor,
      has_labor_override: useLaborOverride,
      totalDays: maxPlannedEnd,
      totalDaysActual: maxActualEnd,
    }
  }, [
    result,
    gradeMultiplier,
    edits,
    projectInfo?.grade,
    materialEdits,
    calculateMaterialTotal,
    materialLaborByGrade,
    addedTasks,
    deletedTaskIds,
  ])

  const totalCost =
    (adjustedResult.total_material_cost_adjusted || 0) +
    (adjustedResult.total_labor_cost || 0)

  const hasEdits =
    Object.keys(edits).length > 0 ||
    addedTasks.length > 0 ||
    deletedTaskIds.length > 0
  const isManual = mode === 'manual'

  // ----- Task CRUD modal/dialog state -----
  const [taskModal, setTaskModal] = useState(null) // null | { mode, ref?, phaseIdx?, initial? }
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null)

  const findTaskByRef = useCallback(
    (ref) => adjustedResult.allTasks.find((t) => t._ref === ref) || null,
    [adjustedResult],
  )

  const openAddTask = useCallback(
    (phaseIdx) =>
      setTaskModal({
        mode: 'add',
        phaseIdx,
        phaseLabel: result.phases?.[phaseIdx]?.name || '',
      }),
    [result.phases],
  )

  const openEditTask = useCallback(
    (ref) => {
      const t = findTaskByRef(ref)
      if (!t) return
      setTaskModal({
        mode: 'edit',
        ref,
        phaseLabel: t.phaseName || result.phases?.[t.phaseIdx]?.name || '',
        initial: {
          name: t.name,
          details: t.details || '',
          material_cost: t.material_cost_adjusted || 0,
          labor_cost: t.labor_cost || 0,
          planned_duration_days: t.planned_duration_days || 7,
        },
      })
    },
    [findTaskByRef, result.phases],
  )

  const requestDeleteTask = useCallback(
    (ref) => {
      const t = findTaskByRef(ref)
      if (!t) return
      setConfirmDeleteTask({ ref, name: t.name, isAdded: t._isAdded })
    },
    [findTaskByRef],
  )

  const handleSaveTask = useCallback(
    (data) => {
      if (!taskModal) return
      if (taskModal.mode === 'add') {
        addTask(taskModal.phaseIdx, data)
      } else if (taskModal.mode === 'edit' && taskModal.ref != null) {
        updateTask(taskModal.ref, data)
      }
      setTaskModal(null)
    },
    [taskModal, addTask, updateTask],
  )

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteTask) deleteTask(confirmDeleteTask.ref)
    setConfirmDeleteTask(null)
  }, [confirmDeleteTask, deleteTask])

  const currentTabItem = TAB_ITEMS.find((t) => t.id === tab) || TAB_ITEMS[0]
  const exportProjectName =
    projectInfo?.name?.trim() ||
    adjustedResult.house_analysis?.type ||
    'Project'

  return (
    <div
      className="space-y-6"
      data-export-section
      data-export-label={currentTabItem.label}
      data-export-filename={currentTabItem.exportName}
      data-export-project={exportProjectName}
      data-export-orientation={tab === 'gantt' ? 'landscape' : 'portrait'}
    >
      <SummaryHeader
        result={adjustedResult}
        images={images}
        totalCost={totalCost}
      />

      {hasEdits && (
        <div
          data-print-hide
          className="rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-xs text-accent flex items-center gap-2"
        >
          ✏️ <span className="font-medium">มีการแก้ไขด้วยตนเอง:</span>
          <span>
            {Object.keys(edits).length} จาก {result.allTasks?.length || 0} งาน —
            ค่า AI เดิมจะแสดงเป็นเส้นประใน Gantt และขีดทับใน BOQ
          </span>
        </div>
      )}

      <div
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        data-print-hide
      >
        <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
        <div className="flex flex-wrap items-center gap-3">
          
          {/* ซ่อน AI/Manual บน Summary + Gantt; แสดงบน tab อื่นทั้งหมด ตาม spec */}
          {tab !== 'dashboard' && tab !== 'gantt' && (
            <ModeToggle
              mode={mode}
              onChange={setMode}
              hasEdits={hasEdits}
              onClearEdits={clearEdits}
            />
          )}

          <div className="shrink-0">
            <GradeSelector
              value={projectInfo.grade}
              onChange={onGradeChange}
              compact
            />
          </div>
        </div>
      </div>

      <div>
        {tab === 'dashboard' && <DashboardTab result={adjustedResult} />}
        {tab === 'gantt' && (
          <InteractiveGantt
            phases={adjustedResult.phases}
            tasks={ganttTasks}
            onTasksChange={setGanttTasks}
            mode={ganttMode}
            onModeChange={setGanttMode}
            colWidth={ganttColWidth}
            onColWidthChange={setGanttColWidth}
            projectStartDate={ganttProjectStartDate}
            onProjectStartDateChange={setGanttProjectStartDate}
          />
        )}
        {tab === 'boq' && (
          <BOQTab
            result={adjustedResult}
            gradeMultiplier={gradeMultiplier}
            isManual={isManual}
            onUpdateTask={updateTask}
            onEditTask={openEditTask}
            onDeleteTask={requestDeleteTask}
            onAddTask={openAddTask}
          />
        )}
        {tab === 'tasks' && (
          <TaskDetailTab
            result={adjustedResult}
            onEditTask={openEditTask}
            onDeleteTask={requestDeleteTask}
            onAddTask={openAddTask}
          />
        )}
        {tab === 'materials' && (
          <MaterialTab
            projectInfo={projectInfo}
            onGradeChange={onGradeChange}
          />
        )}
        {tab === 'recommend' && <RecommendTab result={adjustedResult} />}
        
        {/* ผูกหน้าสัญญาเข้ากับระบบ */}
        {tab === 'contract' && <ContractTab result={adjustedResult} projectInfo={projectInfo} />}
      </div>

      {/* Task CRUD modals */}
      {taskModal && (
        <TaskModal
          mode={taskModal.mode}
          initial={taskModal.initial}
          phaseLabel={taskModal.phaseLabel}
          onSave={handleSaveTask}
          onClose={() => setTaskModal(null)}
        />
      )}
      {confirmDeleteTask && (
        <ConfirmDialog
          title="ยืนยันการลบรายการงาน"
          message={`ลบ "${confirmDeleteTask.name || 'งานนี้'}" ออกจากแผน?\n${
            confirmDeleteTask.isAdded
              ? '(ลบถาวร — งานที่เพิ่มเอง)'
              : '(ซ่อนจากการแสดงผล — สามารถยกเลิกผ่านปุ่ม "reset edits" ได้)'
          }`}
          confirmLabel="🗑️ ลบ"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteTask(null)}
        />
      )}
    </div>
  )
}

export default ResultDashboard