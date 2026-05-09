import { useMemo } from 'react'
import Card from '../ui/Card'
import GuidePopup from '../GuidePopup'
import { PHASE_COLORS, MATERIAL_GRADES } from '../../utils/constants'
import { formatBaht, formatNumber } from '../../utils/formatters'

function BOQTab({ result, gradeMultiplier, isManual, onUpdateTask, onEditTask, onDeleteTask, onAddTask }) {
  const phases = result.phases || []
  const allTasks = result.allTasks || []
  const grade = MATERIAL_GRADES.find(
    (g) => Math.abs(g.multiplier - gradeMultiplier) < 0.001,
  )

  const phaseRows = useMemo(() => {
    return phases.map((phase, idx) => {
      const tasks = allTasks
        .map((t, taskIdx) => ({ ...t, _idx: taskIdx }))
        .filter((t) => t.phaseIdx === idx)
      const material = tasks.reduce(
        (s, t) => s + (t.material_cost_adjusted || 0),
        0,
      )
      const labor = tasks.reduce((s, t) => s + (t.labor_cost || 0), 0)
      const days = tasks.reduce((s, t) => s + (t.duration_days || 0), 0)
      return {
        idx,
        name: phase.name,
        tasks,
        material,
        labor,
        total: material + labor,
        days,
        color: PHASE_COLORS[idx % PHASE_COLORS.length],
      }
    })
  }, [phases, allTasks])

  const grandMaterial = result.total_material_cost_adjusted || 0
  const grandLabor = result.total_labor_cost || 0
  const grandTotal = grandMaterial + grandLabor

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-ink-muted">
        <span className="flex items-center gap-2">
          เกรดวัสดุปัจจุบัน:{' '}
          <span className="text-ink font-medium">
            {grade?.icon} {grade?.label || 'มาตรฐาน'}
          </span>{' '}
          (×{gradeMultiplier.toFixed(2)} ค่าวัสดุ)
          <GuidePopup title="BOQ และเกรดวัสดุ">
            <p>
              BOQ แยก "ค่าวัสดุ" และ "ค่าแรง" ออกจากกัน — เกรดวัสดุจะคูณกับ
              ค่าวัสดุเท่านั้น (ค่าแรงคงที่)
            </p>
            <p>
              <span className="text-accent">โหมด Manual:</span> สลับโหมดที่
              ปุ่มด้านบน แล้วคลิกที่ตัวเลขเพื่อแก้ไขเอง — ค่าที่แก้แล้วจะ
              override AI (ไม่คูณเกรดอีก)
            </p>
          </GuidePopup>
        </span>
        {isManual && (
          <span className="text-accent font-medium">
            ✏️ โหมด Manual: คลิกตัวเลขเพื่อแก้
          </span>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-elevated/60 text-ink-soft text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">รายการ</th>
                <th className="text-right px-3 py-3 font-medium w-20">จำนวน</th>
                <th className="text-left px-3 py-3 font-medium w-20">หน่วย</th>
                <th className="text-right px-3 py-3 font-medium w-36">
                  ค่าวัสดุ
                </th>
                <th className="text-right px-3 py-3 font-medium w-32">
                  ค่าแรง
                </th>
                <th className="text-right px-3 py-3 font-medium w-32">รวม</th>
                <th className="text-right px-3 py-3 font-medium w-16">วัน</th>
                <th className="text-center px-3 py-3 font-medium w-24 no-print">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {phaseRows.map((row) => (
                <PhaseRows
                  key={row.idx}
                  row={row}
                  isManual={isManual}
                  onUpdateTask={onUpdateTask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onAddTask={onAddTask}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-accent/10 border-t-2 border-accent/30 font-semibold">
                <td className="px-4 py-3 text-ink" colSpan={3}>
                  💰 รวมทั้งหมด
                </td>
                <td className="px-3 py-3 text-right font-mono text-ink">
                  {formatBaht(grandMaterial)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-ink">
                  {formatBaht(grandLabor)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-accent text-base">
                  {formatBaht(grandTotal)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-ink-soft">
                  {result.totalDays || '-'}
                </td>
                <td className="px-3 py-3 no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}

function PhaseRows({ row, isManual, onUpdateTask, onEditTask, onDeleteTask, onAddTask }) {
  const handleAddClick = () => {
    if (onAddTask) onAddTask(row.idx);
    else alert(`เตรียมพบกับฟีเจอร์เพิ่มงานใน "เฟส ${row.idx + 1}" เร็วๆ นี้!`);
  }

  return (
    <>
      <tr style={{ backgroundColor: `${row.color}11` }}>
        <td className="px-4 py-2.5 text-ink font-semibold" colSpan={8}>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
            style={{ backgroundColor: row.color }}
          />
          เฟส {row.idx + 1}: {row.name}
        </td>
      </tr>
      
      {row.tasks.map((task) => (
        <TaskRow
          key={task._idx}
          task={task}
          isManual={isManual}
          onUpdateTask={onUpdateTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
      
      {/* เพิ่มแถวสำหรับปุ่ม "+ เพิ่มรายการ" ของแต่ละเฟส (ซ่อนตอน export/print) */}
      <tr className="border-t border-line/20 hover:bg-elevated/20 transition-colors no-print">
        <td className="px-4 py-2 pl-10" colSpan={8}>
          <button
            onClick={handleAddClick}
            className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1.5 px-3 py-1.5 rounded border border-dashed border-accent/40 hover:border-accent transition-colors"
          >
            + เพิ่มงานในเฟสนี้
          </button>
        </td>
      </tr>

      <tr className="border-t border-line bg-elevated/30 text-ink-soft font-medium phase-total">
        <td className="px-4 py-2 pl-10" colSpan={3}>
          รวมเฟส {row.idx + 1}
        </td>
        <td className="px-3 py-2 text-right font-mono">
          {formatBaht(row.material)}
        </td>
        <td className="px-3 py-2 text-right font-mono">
          {formatBaht(row.labor)}
        </td>
        <td className="px-3 py-2 text-right font-mono text-ink">
          {formatBaht(row.total)}
        </td>
        <td className="px-3 py-2 text-right font-mono">{row.days}</td>
        <td className="px-3 py-2 no-print"></td>
      </tr>
    </>
  )
}

function EditableCost({ value, baseline, onCommit, isManual, isEdited }) {
  if (!isManual) {
    return (
      <span className="font-mono text-ink">{formatBaht(value)}</span>
    )
  }
  const handleBlur = (e) => {
    const raw = e.target.value.replace(/,/g, '').trim()
    const num = Number(raw)
    if (Number.isFinite(num) && num >= 0) {
      onCommit(num)
    } else {
      e.target.value = String(Math.round(value))
    }
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') {
      e.target.value = String(Math.round(value))
      e.target.blur()
    }
  }
  return (
    <div className="flex flex-col items-end gap-0.5">
      <input
        type="number"
        defaultValue={Math.round(value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-28 rounded border px-2 py-1 font-mono text-right text-sm bg-canvas focus:outline-none focus:border-accent ${
          isEdited ? 'border-accent text-accent' : 'border-line text-ink'
        }`}
      />
      {isEdited && Math.round(value) !== Math.round(baseline) && (
        <span className="text-[10px] text-ink-muted font-mono line-through">
          AI: {formatBaht(baseline)}
        </span>
      )}
    </div>
  )
}

function TaskRow({ task, isManual, onUpdateTask, onEditTask, onDeleteTask }) {
  const total = (task.material_cost_adjusted || 0) + (task.labor_cost || 0)
  // Prefer _ref (string id for added tasks, numeric for originals) over local _idx
  const idx = task._ref !== undefined ? task._ref : task._idx

  // Use explicit edit flags so allocation (from Material tab override) doesn't
  // cause a false-positive strikethrough on AI baseline values
  const isMaterialEdited = !!task._isMaterialCostEdited
  const isLaborEdited = !!task._isLaborCostEdited

  const handleEditClick = () => {
    if (onEditTask) onEditTask(idx);
    else alert('เตรียมพบกับฟีเจอร์แก้ไขรายละเอียดเร็วๆ นี้!');
  }

  const handleDeleteClick = () => {
    if (onDeleteTask) onDeleteTask(idx);
    else alert('เตรียมพบกับฟีเจอร์ลบรายการเร็วๆ นี้!');
  }

  return (
    <tr className="border-t border-line/40 hover:bg-elevated/30 transition-colors group">
      <td className="px-4 py-2 text-ink-soft pl-10">
        • {task.name}
        {task._isEdited && (
          <span className="ml-2 text-[10px] text-accent">✏️</span>
        )}
      </td>
      <td className="px-3 py-2 text-right font-mono text-ink-muted">
        {task.quantity ? formatNumber(task.quantity) : '-'}
      </td>
      <td className="px-3 py-2 text-ink-muted">{task.unit || '-'}</td>
      <td className="px-3 py-2 text-right">
        <EditableCost
          value={task.material_cost_adjusted || 0}
          baseline={task._baselineMaterial || 0}
          onCommit={(v) => onUpdateTask(idx, { material_cost: v })}
          isManual={isManual}
          isEdited={isMaterialEdited}
        />
      </td>
      <td className="px-3 py-2 text-right">
        <EditableCost
          value={task.labor_cost || 0}
          baseline={task._baselineLabor || 0}
          onCommit={(v) => onUpdateTask(idx, { labor_cost: v })}
          isManual={isManual}
          isEdited={isLaborEdited}
        />
      </td>
      <td className="px-3 py-2 text-right font-mono text-ink font-medium">
        {formatBaht(total)}
      </td>
      <td className="px-3 py-2 text-right font-mono text-ink-muted">
        {task.duration_days || '-'}
      </td>
      
      <td className="px-3 py-2 text-center whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity no-print">
        <button
          onClick={handleEditClick}
          className="p-1.5 text-ink-muted hover:text-accent hover:bg-accent/10 rounded transition-colors mr-1"
          title="แก้ไขรายการ"
        >
          ✏️
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
          title="ลบรายการ"
        >
          🗑️
        </button>
      </td>
    </tr>
  )
}

export default BOQTab