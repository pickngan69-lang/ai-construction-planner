import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getMemberToken } from '../features/auth/memberAuthApi'

// ข้อมูลบริษัท/ผู้รับเหมา — ใช้ auto-fill + หัวกระดาษเอกสารทุกใบ. เก็บใน DB
// (app_company_profiles) เมื่อล็อกอิน + cache ใน localStorage
const STORAGE_KEY = 'acp-company'

const EMPTY_COMPANY = Object.freeze({
  name: '',
  logo: '',
  taxId: '',
  registrationNo: '',
  address: '',
  phone: '',
  email: '',
  website: '',
})

const CompanyContext = createContext(null)

function load() {
  if (typeof window === 'undefined') return { ...EMPTY_COMPANY }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...EMPTY_COMPANY, ...JSON.parse(raw) } : { ...EMPTY_COMPANY }
  } catch {
    return { ...EMPTY_COMPANY }
  }
}

export function CompanyProvider({ children }) {
  const [company, setCompanyState] = useState(load)

  useEffect(() => {
    const token = getMemberToken()
    if (!token) return
    let alive = true
    fetch('/api/company', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.profile) {
          setCompanyState((prev) => ({ ...prev, ...d.profile }))
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
    } catch {
      // ignore
    }
  }, [company])

  const updateCompany = useCallback((patch) => {
    setCompanyState((prev) => {
      const next = { ...prev, ...patch }
      const token = getMemberToken()
      if (token) {
        fetch('/api/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(next),
        }).catch(() => {})
      }
      return next
    })
  }, [])

  const isConfigured = Boolean(company.name?.trim())

  const value = useMemo(
    () => ({ company, updateCompany, isConfigured }),
    [company, updateCompany, isConfigured],
  )

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used inside CompanyProvider')
  return ctx
}
