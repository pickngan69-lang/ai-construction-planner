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
const ProjectContext = createContext(null)

function loadAdded() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// จัดการสถานะโปรเจกต์แบบ global — โปรเจกต์ที่ผู้ใช้สร้างจากผลวิเคราะห์ AI จะถูก
// เก็บลง localStorage (ชั่วคราวก่อนต่อ ERP backend) แล้ว merge กับข้อมูลตัวอย่าง (seed)
export function ProjectProvider({ children }) {
  const [added, setAdded] = useState(loadAdded)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(added))
    } catch {
      // ignore quota / unavailable storage
    }
  }, [added])

  // โปรเจกต์ที่สร้างใหม่อยู่บนสุด (ใหม่→เก่า) ตามด้วยข้อมูลตัวอย่าง
  const projects = useMemo(() => [...added, ...MOCK_PROJECTS], [added])

  const addProject = useCallback((project) => {
    setAdded((prev) => [project, ...prev])
  }, [])

  const getProject = useCallback(
    (id) => projects.find((p) => p.id === id) || null,
    [projects],
  )

  const value = useMemo(
    () => ({ projects, addProject, getProject }),
    [projects, addProject, getProject],
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
