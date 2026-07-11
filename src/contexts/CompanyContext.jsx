import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// ข้อมูลบริษัท/ผู้รับเหมา — เก็บครั้งเดียว ใช้ auto-fill + หัวกระดาษเอกสารทุกใบ
// (ใบเสนอราคา / สัญญา / ใบเสร็จ). เก็บใน localStorage ฝั่งเบราว์เซอร์
// (คงอยู่ข้าม deploy แต่ยังไม่ sync ข้ามอุปกรณ์ — ย้าย DB ภายหลังได้)
const STORAGE_KEY = 'acp-company'

const EMPTY_COMPANY = Object.freeze({
  name: '', // ชื่อบริษัท/ผู้รับเหมา
  logo: '', // โลโก้ (base64 data URL)
  taxId: '', // เลขประจำตัวผู้เสียภาษี / บัตรประชาชน
  registrationNo: '', // ทะเบียนนิติบุคคล / ทะเบียนพาณิชย์
  address: '', // ที่อยู่
  phone: '', // โทรศัพท์
  email: '', // อีเมล
  website: '', // เว็บไซต์ (ถ้ามี)
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
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
    } catch {
      // ignore quota / unavailable storage
    }
  }, [company])

  // อัปเดตบางฟิลด์ (merge)
  const updateCompany = useCallback((patch) => {
    setCompanyState((prev) => ({ ...prev, ...patch }))
  }, [])

  // บริษัทถือว่า "ตั้งค่าแล้ว" เมื่อมีชื่ออย่างน้อย
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
