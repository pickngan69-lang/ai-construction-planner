import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { MOCK_PROJECTS } from '../data/mockProjects'

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

// จัดการสถานะโปรเจกต์แบบ global. โปรเจกต์ที่ผู้ใช้สร้างจากผลวิเคราะห์ AI เก็บใน
// `added`; การแก้ไข/เปลี่ยนสถานะ (รวมถึงของ seed) เก็บเป็น `overrides` ราย id แล้ว
// merge ทับ — ทำให้แก้ทั้ง seed และโปรเจกต์ใหม่ได้เหมือนกันโดยไม่แตะข้อมูลตัวอย่าง.
export function ProjectProvider({ children }) {
  const [added, setAdded] = useState(() => loadJson(STORAGE_KEY, []))
  const [overrides, setOverrides] = useState(() => loadJson(OVERRIDES_KEY, {}))

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(added))
    } catch {
      // ignore quota / unavailable storage
    }
  }, [added])

  useEffect(() => {
    try {
      window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
    } catch {
      // ignore quota / unavailable storage
    }
  }, [overrides])

  const projects = useMemo(
    () =>
      [...added, ...MOCK_PROJECTS].map((p) => ({
        ...p,
        ...(overrides[p.id] || {}),
      })),
    [added, overrides],
  )

  const addProject = useCallback((project) => {
    setAdded((prev) => [project, ...prev])
  }, [])

  // แก้ไข/เปลี่ยนสถานะโปรเจกต์ (ใช้ได้ทั้ง seed และที่สร้างใหม่)
  const updateProject = useCallback((id, patch) => {
    setOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
  }, [])

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
