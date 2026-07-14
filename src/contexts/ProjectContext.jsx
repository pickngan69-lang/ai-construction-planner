import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getMemberToken } from '../features/auth/memberAuthApi'

const STORAGE_KEY = 'acp-projects'
const OVERRIDES_KEY = 'acp-project-overrides'
const ProjectContext = createContext(null)

function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// รวมข้อมูลเก่า (added + overrides) → flat list ครั้งแรก แล้วเก็บเป็น flat ต่อไป
function loadInitial() {
  const added = loadJson(STORAGE_KEY, [])
  const overrides = loadJson(OVERRIDES_KEY, {})
  if (!Array.isArray(added)) return []
  return added.map((p) => ({ ...p, ...(overrides[p.id] || {}) }))
}

// จัดการโปรเจกต์แบบ global — เก็บใน DB (app_projects) เมื่อล็อกอิน + cache localStorage
export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(loadInitial)

  // โหลดจาก DB ตอน mount (ถ้าล็อกอิน) — DB เป็นแหล่งจริง
  useEffect(() => {
    const token = getMemberToken()
    if (!token) return
    let alive = true
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && Array.isArray(d?.projects)) setProjects(d.projects)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch {
      // ignore
    }
  }, [projects])

  const saveToDb = useCallback((project) => {
    const token = getMemberToken()
    if (!token || !project?.id) return
    fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(project),
    }).catch(() => {})
  }, [])

  const addProject = useCallback(
    (project) => {
      setProjects((prev) => [project, ...prev.filter((p) => p.id !== project.id)])
      saveToDb(project)
    },
    [saveToDb],
  )

  const updateProject = useCallback(
    (id, patch) => {
      setProjects((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
        const updated = next.find((p) => p.id === id)
        if (updated) saveToDb(updated)
        return next
      })
    },
    [saveToDb],
  )

  const getProject = useCallback(
    (id) => projects.find((p) => p.id === id) || null,
    [projects],
  )

  const value = useMemo(
    () => ({ projects, addProject, updateProject, getProject }),
    [projects, addProject, updateProject, getProject],
  )

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProjects() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProjects must be used inside ProjectProvider')
  return ctx
}
