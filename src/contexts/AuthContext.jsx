import { createContext, useContext, useEffect, useState } from 'react'
import { DEMO_CONTRACTOR_PASSWORD, ROLES } from '../utils/constants'

const AuthContext = createContext(null)
const STORAGE_KEY = 'acp-auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(STORAGE_KEY)
  }, [user])

  const loginContractor = (password) => {
    if (!password) return { ok: false, error: 'กรุณากรอกรหัสผ่าน' }
    if (password !== DEMO_CONTRACTOR_PASSWORD) {
      return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' }
    }
    setUser({ role: ROLES.CONTRACTOR, name: 'ผู้รับเหมา' })
    return { ok: true }
  }

  const loginHomeowner = (pin) => {
    if (!/^\d{6}$/.test(pin || '')) {
      return { ok: false, error: 'PIN ต้องเป็นตัวเลข 6 หลัก' }
    }
    setUser({ role: ROLES.HOMEOWNER, name: 'เจ้าของบ้าน', pin })
    return { ok: true }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider
      value={{ user, loginContractor, loginHomeowner, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
