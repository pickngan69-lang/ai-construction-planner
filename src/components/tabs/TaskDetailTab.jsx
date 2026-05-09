import Card from '../ui/Card'
import { PHASE_COLORS } from '../../utils/constants'
import { formatBaht, formatDays } from '../../utils/formatters'

function TaskCard({ task, color, onEditTask, onDeleteTask }) {
  const total = (task.material_cost_adjusted || 0) + (task.labor_cost || 0)
  // Prefer _ref (string id for added tasks, numeric for originals) over local _idx
  const idx = task._ref !== undefined ? task._ref : task._idx

  const handleEditClick = () => {
    if (onEditTask) onEditTask(idx);
    else alert('เตรียมพบกับฟีเจอร์แก้ไขรายละเอียดเร็วๆ นี้!');
  }

  const handleDeleteClick = () => {
    if (onDeleteTask) onDeleteTask(idx);
    else alert('เตรียมพบกับฟีเจอร์ลบรายการเร็วๆ นี้!');
  }

  return (
    <div
      className="rounded-lg border border-line bg-elevated/40 p-4 relative group transition-colors hover:border-line/80 hover:bg-elevated/60"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* ปุ่มจัดการ (จะแสดงเมื่อเอาเมาส์ชี้การ์ด) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-elevated/80 backdrop-blur-sm rounded-md p-0.5">
        <button 
          onClick={handleEditClick}
          className="p-1.5 text-ink-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
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
      </div>

      <div className="flex items-start justify-between gap-3 pr-16">
        <h4 className="text-ink font-medium">
          {task.name}
          {task._isEdited && (
            <span className="ml-2 text-[10px] text-accent">✏️</span>
          )}
        </h4>
        <span className="text-xs text-ink-muted shrink-0 font-mono">
          ⏱ {formatDays(task.duration_days)}
        </span>
      </div>
      
      {task.details && (
        <p className="text-sm text-ink-soft mt-2">{task.details}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
        {task.material_items && (
          <div className="text-ink-muted">
            <span className="text-ink-soft">🧱 วัสดุ:</span>{' '}
            {task.material_items}
          </div>
        )}
        {task.labor_detail && (
          <div className="text-ink-muted">
            <span className="text-ink-soft">👷 ค่าแรง:</span> {task.labor_detail}
          </div>
        )}
      </div>

      {task.warnings && (
        <div className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          ⚠️ {task.warnings}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-line/60 text-xs font-mono">
        <span className="text-ink-muted">
          วัสดุ:{' '}
          <span className="text-ink">
            {formatBaht(task.material_cost_adjusted)}
          </span>
        </span>
        <span className="text-ink-muted">
          แรง: <span className="text-ink">{formatBaht(task.labor_cost)}</span>
        </span>
        <span className="text-ink-muted ml-auto">
          รวม: <span className="text-accent">{formatBaht(total)}</span>
        </span>
      </div>
    </div>
  )
}

function TaskDetailTab({ result, onEditTask, onDeleteTask, onAddTask }) {
  const phases = result.phases || []
  const allTasks = result.allTasks || []

  if (phases.length === 0) {
    return (
      <Card className="p-8 text-center text-ink-muted">
        ไม่มีรายการงาน
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {phases.map((phase, idx) => {
        // Map เพื่อเก็บ index ต้นฉบับไว้ก่อน filter
        const tasks = allTasks
          .map((t, taskIdx) => ({ ...t, _idx: taskIdx }))
          .filter((t) => t.phaseIdx === idx)
        
        const color = PHASE_COLORS[idx % PHASE_COLORS.length]

        const handleAddClick = () => {
          if (onAddTask) onAddTask(idx);
          else alert(`เตรียมพบกับฟีเจอร์เพิ่มงานใน "เฟส ${idx + 1}" เร็วๆ นี้!`);
        }

        return (
          <section key={idx}>
            <h3 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              เฟส {idx + 1}: {phase.name}
              <span className="text-xs text-ink-muted font-normal ml-2">
                ({tasks.length} งาน)
              </span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {tasks.map((task) => (
                <TaskCard 
                  key={task._idx} 
                  task={task} 
                  color={color} 
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
              
              {/* การ์ดสำหรับกดปุ่มเพิ่มงานในเฟส */}
              <button
                onClick={handleAddClick}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line hover:border-accent hover:text-accent text-ink-muted bg-canvas/30 hover:bg-accent/5 transition-all min-h-[120px] p-6"
              >
                <span className="text-2xl font-light">+</span>
                <span className="text-sm font-medium">เพิ่มงานในเฟสนี้</span>
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default TaskDetailTab