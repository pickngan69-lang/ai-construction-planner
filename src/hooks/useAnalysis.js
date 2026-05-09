import { useCallback, useEffect, useState } from 'react'
import { analyzeHouse } from '../services/aiService'
import { DEFAULT_TASK_DURATION_DAYS, STEPS } from '../utils/constants'

const STORAGE_KEY = 'acp-analysis-v2'

const EMPTY_MATERIAL_EDITS = Object.freeze({
  economy: [],
  standard: [],
  premium: [],
})

const EMPTY_MATERIAL_LABOR = Object.freeze({
  economy: 0,
  standard: 0,
  premium: 0,
})

function initializeTasks(phases = []) {
  let cursorDay = 0
  const out = []
  const dur = DEFAULT_TASK_DURATION_DAYS
  phases.forEach((phase, phaseIdx) => {
    ;(phase.tasks || []).forEach((task) => {
      const start = cursorDay
      out.push({
        ...task,
        phaseIdx,
        phaseName: phase.name,
        // Default planned schedule (sequential, equal durations) — user adjusts via Gantt
        planned_start_day: start,
        planned_duration_days: dur,
        planned_end_day: start + dur,
        // Actual schedule starts identical to planned
        actual_start_day: start,
        actual_duration_days: dur,
        actual_end_day: start + dur,
      })
      cursorDay = start + dur
    })
  })
  return out
}

function deriveHouseAnalysis(aiHouse, projectInfo) {
  if (aiHouse && Object.keys(aiHouse).length > 0) return aiHouse
  return {
    type: projectInfo?.name || 'แผนก่อสร้าง',
    estimated_size_sqm: projectInfo?.area ? Number(projectInfo.area) : undefined,
    floors: projectInfo?.floors ? Number(projectInfo.floors) : undefined,
    style: projectInfo?.style || undefined,
    description:
      projectInfo?.notes ||
      'แผน BOQ ที่ AI ประเมินจากรูปและข้อมูลโปรเจกต์',
  }
}

function buildResult(aiData, projectInfo) {
  const allTasks = initializeTasks(aiData.phases || [])
  const totalMaterial = allTasks.reduce(
    (s, t) => s + (Number(t.material_cost) || 0),
    0,
  )
  const totalLabor = allTasks.reduce(
    (s, t) => s + (Number(t.labor_cost) || 0),
    0,
  )
  const totalDays = allTasks.reduce(
    (m, t) => Math.max(m, t.planned_end_day || 0),
    0,
  )
  return {
    ...aiData,
    house_analysis: deriveHouseAnalysis(aiData.house_analysis, projectInfo),
    allTasks,
    total_material_cost: aiData.total_material_cost ?? totalMaterial,
    total_labor_cost: aiData.total_labor_cost ?? totalLabor,
    totalDays,
  }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePersisted(payload) {
  try {
    if (payload) localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore quota / unavailable storage
  }
}

function newMaterialId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function newAddedTaskId() {
  return `added-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// Convert AI's materialLabor.{economy,standard,premium} into our shape.
// Falls back to zeros when AI didn't provide it.
function buildMaterialLaborFromAi(aiLabor) {
  if (!aiLabor || typeof aiLabor !== 'object') {
    return { ...EMPTY_MATERIAL_LABOR }
  }
  return {
    economy: Number(aiLabor.economy) || 0,
    standard: Number(aiLabor.standard) || 0,
    premium: Number(aiLabor.premium) || 0,
  }
}

// Convert AI's materials.{economy,standard,premium} into the shape used by
// materialEdits (each item gets a stable id + isDeleted flag, etc.)
function buildMaterialEditsFromAi(aiMaterials) {
  if (!aiMaterials || typeof aiMaterials !== 'object') {
    return { ...EMPTY_MATERIAL_EDITS }
  }
  const tag = (grade) =>
    Array.isArray(aiMaterials[grade])
      ? aiMaterials[grade].map((m) => ({
          id: newMaterialId(),
          name: m.name || '',
          spec: m.spec || '',
          quantity: Number(m.quantity) || 0,
          unit: m.unit || '',
          pricePerUnit: Number(m.pricePerUnit) || 0,
          isDeleted: false,
        }))
      : []
  return {
    economy: tag('economy'),
    standard: tag('standard'),
    premium: tag('premium'),
  }
}

export function useAnalysis() {
  const [persisted] = useState(() => loadPersisted())
  const [step, setStep] = useState(
    persisted?.result ? STEPS.RESULT : STEPS.INPUT,
  )
  const [result, setResult] = useState(persisted?.result || null)
  const [edits, setEdits] = useState(persisted?.edits || {})
  const [mode, setMode] = useState(persisted?.mode || 'auto')
  const [error, setError] = useState(null)

  // Material CRUD per tier (economy / standard / premium)
  const [materialEdits, setMaterialEdits] = useState(
    persisted?.materialEdits || { ...EMPTY_MATERIAL_EDITS },
  )

  // Lump-sum labor estimate per tier (alongside materials). Initialized from
  // AI on `run()`; user can override via Materials tab. When > 0 for the active
  // grade, it overrides project labor total (with proportional allocation to
  // BOQ rows for numerical consistency).
  const [materialLaborByGrade, setMaterialLaborByGradeState] = useState(
    persisted?.materialLaborByGrade || { ...EMPTY_MATERIAL_LABOR },
  )

  // Task CRUD — extends the AI baseline (tasks live in `result.allTasks`):
  //   addedTasks    : full task objects appended to the project (have stable id 'added-…')
  //   deletedTaskIds: numeric indexes from result.allTasks that are soft-removed
  const [addedTasks, setAddedTasks] = useState(persisted?.addedTasks || [])
  const [deletedTaskIds, setDeletedTaskIds] = useState(
    persisted?.deletedTaskIds || [],
  )

  useEffect(() => {
    if (result) {
      savePersisted({
        result,
        edits,
        mode,
        materialEdits,
        materialLaborByGrade,
        addedTasks,
        deletedTaskIds,
      })
    }
  }, [
    result,
    edits,
    mode,
    materialEdits,
    materialLaborByGrade,
    addedTasks,
    deletedTaskIds,
  ])

  const run = useCallback(async (images, projectInfo) => {
    setError(null)
    setStep(STEPS.ANALYZING)
    try {
      const data = await analyzeHouse(images, projectInfo)
      const next = buildResult(data, projectInfo)
      setResult(next)
      setEdits({})
      setMode('auto')
      // Load AI's 3-tier material baseline (V4 schema). When AI doesn't
      // provide it, fall back to empty per-tier lists.
      setMaterialEdits(buildMaterialEditsFromAi(data.materials))
      // Lump-sum labor estimate per tier (V5)
      setMaterialLaborByGradeState(buildMaterialLaborFromAi(data.materialLabor))
      setAddedTasks([])
      setDeletedTaskIds([])
      setStep(STEPS.RESULT)
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')
      setStep(STEPS.INPUT)
    }
  }, [])

  const reset = useCallback(() => {
    setStep(STEPS.INPUT)
    setResult(null)
    setEdits({})
    setMode('auto')
    setMaterialEdits({ ...EMPTY_MATERIAL_EDITS })
    setMaterialLaborByGradeState({ ...EMPTY_MATERIAL_LABOR })
    setAddedTasks([])
    setDeletedTaskIds([])
    setError(null)
    savePersisted(null)
  }, [])

  // Set lump-sum labor for one tier (auto-flags Manual mode)
  const setMaterialLabor = useCallback((grade, value) => {
    if (!grade) return
    const num = Number(value)
    setMaterialLaborByGradeState((prev) => ({
      ...prev,
      [grade]: Number.isFinite(num) && num >= 0 ? num : 0,
    }))
    setMode('manual')
  }, [])

  // Single dispatcher: ref is either a number (original task index in
  // result.allTasks) or a string starting with 'added-' (id of an added task).
  // Patches accept any of: name, details, material_cost, labor_cost,
  // planned_start_day, planned_duration_days, actual_start_day,
  // actual_duration_days.
  const updateTask = useCallback((ref, patch) => {
    if (typeof ref === 'string' && ref.startsWith('added-')) {
      setAddedTasks((prev) =>
        prev.map((t) => (t.id === ref ? { ...t, ...patch } : t)),
      )
    } else {
      const idx = typeof ref === 'string' ? Number(ref) : ref
      if (!Number.isFinite(idx)) return
      setEdits((prev) => ({
        ...prev,
        [idx]: { ...(prev[idx] || {}), ...patch },
      }))
    }
    setMode('manual')
  }, [])

  // Delete: original tasks → soft delete via deletedTaskIds. Added tasks →
  // hard remove from addedTasks.
  const deleteTask = useCallback((ref) => {
    if (typeof ref === 'string' && ref.startsWith('added-')) {
      setAddedTasks((prev) => prev.filter((t) => t.id !== ref))
    } else {
      const idx = typeof ref === 'string' ? Number(ref) : ref
      if (!Number.isFinite(idx)) return
      setDeletedTaskIds((prev) =>
        prev.includes(idx) ? prev : [...prev, idx],
      )
    }
    setMode('manual')
  }, [])

  // Add a new task to a phase. Defaults are sensible; user can edit further
  // via the same Edit modal (it operates on the new task's id).
  const addTask = useCallback((phaseIdx, draft = {}) => {
    const id = newAddedTaskId()
    const dur = Number(draft.planned_duration_days) || DEFAULT_TASK_DURATION_DAYS
    const newTask = {
      id,
      phaseIdx: Number(phaseIdx) || 0,
      name: draft.name || 'งานใหม่',
      details: draft.details || '',
      material_cost: Number(draft.material_cost) || 0,
      labor_cost: Number(draft.labor_cost) || 0,
      planned_start_day: Number(draft.planned_start_day) || 0,
      planned_duration_days: dur,
      actual_start_day: Number(draft.actual_start_day) || 0,
      actual_duration_days:
        Number(draft.actual_duration_days) || dur,
    }
    setAddedTasks((prev) => [...prev, newTask])
    setMode('manual')
    return id
  }, [])

  const clearEdits = useCallback(() => {
    setEdits({})
    setAddedTasks([])
    setDeletedTaskIds([])
  }, [])

  // ----- Material CRUD -----
  // Update or add a material in the given grade. If `data.id` matches an
  // existing item, it's updated; otherwise a new id is assigned and the item
  // is appended. Any change auto-flags Manual mode (per spec section 4).
  const updateMaterial = useCallback((grade, data) => {
    if (!grade) return
    setMaterialEdits((prev) => {
      const list = prev[grade] || []
      const id = data.id
      const idx = id ? list.findIndex((m) => m.id === id) : -1
      let next
      if (idx >= 0) {
        next = list.map((m, i) => (i === idx ? { ...m, ...data } : m))
      } else {
        next = [
          ...list,
          {
            id: id || newMaterialId(),
            name: '',
            spec: '',
            quantity: 0,
            unit: '',
            pricePerUnit: 0,
            isDeleted: false,
            ...data,
          },
        ]
      }
      return { ...prev, [grade]: next }
    })
    setMode('manual')
  }, [])

  // Soft delete by flipping isDeleted (preserves baseline for AI comparison)
  const deleteMaterial = useCallback((grade, materialId) => {
    if (!grade || !materialId) return
    setMaterialEdits((prev) => ({
      ...prev,
      [grade]: (prev[grade] || []).map((m) =>
        m.id === materialId ? { ...m, isDeleted: true } : m,
      ),
    }))
    setMode('manual')
  }, [])

  const getMaterialItems = useCallback(
    (grade, { includeDeleted = false } = {}) => {
      const list = materialEdits[grade] || []
      return includeDeleted ? list : list.filter((m) => !m.isDeleted)
    },
    [materialEdits],
  )

  const calculateMaterialTotal = useCallback(
    (grade) => {
      return (materialEdits[grade] || [])
        .filter((m) => !m.isDeleted)
        .reduce(
          (sum, m) =>
            sum + (Number(m.quantity) || 0) * (Number(m.pricePerUnit) || 0),
          0,
        )
    },
    [materialEdits],
  )

  return {
    step,
    result,
    edits,
    mode,
    error,
    run,
    reset,
    setMode,
    updateTask,
    clearEdits,
    // Task CRUD
    addedTasks,
    deletedTaskIds,
    addTask,
    deleteTask,
    // Material CRUD
    materialEdits,
    updateMaterial,
    deleteMaterial,
    getMaterialItems,
    calculateMaterialTotal,
    // Lump-sum labor per tier
    materialLaborByGrade,
    setMaterialLabor,
  }
}
