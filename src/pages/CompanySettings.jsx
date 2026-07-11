import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useCompany } from '../contexts/CompanyContext'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

const MAX_LOGO_BYTES = 512 * 1024 // 512KB — เก็บใน localStorage ได้สบาย

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft mb-1.5">{label}</span>
      {children}
      {hint && <p className="text-[10px] text-ink-muted mt-1">{hint}</p>}
    </label>
  )
}

function CompanySettings() {
  const navigate = useNavigate()
  const { company, updateCompany } = useCompany()
  const [form, setForm] = useState(company)
  const [saved, setSaved] = useState(false)
  const [logoError, setLogoError] = useState(null)

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setSaved(false)
  }

  const handleLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)
    if (!file.type.startsWith('image/')) {
      setLogoError('กรุณาเลือกไฟล์รูปภาพ')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('โลโก้ใหญ่เกินไป (จำกัด 512KB) — ลองย่อรูปก่อน')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, logo: String(reader.result) }))
      setSaved(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    updateCompany(form)
    setSaved(true)
  }

  return (
    <>
      <Header onBack={() => navigate('/')} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-ink">⚙️ ตั้งค่าข้อมูลบริษัท</h2>
          <p className="text-sm text-ink-muted mt-1">
            ข้อมูลนี้จะขึ้นหัวกระดาษ + กรอกช่อง "ผู้รับจ้าง" ให้อัตโนมัติในเอกสารทุกใบ
            (ใบเสนอราคา / สัญญา / ใบเสร็จ)
          </p>
        </div>

        <Card className="p-5 space-y-4">
          {/* โลโก้ */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border border-line bg-elevated/40 flex items-center justify-center overflow-hidden shrink-0">
              {form.logo ? (
                <img src={form.logo} alt="logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl opacity-40">🏢</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-soft mb-1.5">โลโก้บริษัท (ไม่บังคับ)</p>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-md border border-line text-sm text-ink-soft hover:border-accent hover:text-accent cursor-pointer transition-colors">
                  เลือกรูป
                  <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                </label>
                {form.logo && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, logo: '' }))}
                    className="text-xs text-ink-muted hover:text-danger transition-colors"
                  >
                    ลบโลโก้
                  </button>
                )}
              </div>
              {logoError && <p className="text-[11px] text-danger mt-1">{logoError}</p>}
              <p className="text-[10px] text-ink-muted mt-1">PNG/JPG ≤ 512KB</p>
            </div>
          </div>

          <Field label="ชื่อบริษัท / ผู้รับเหมา *">
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="เช่น บริษัท รับสร้างบ้าน จำกัด / นายสมชาย รับเหมา"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="เลขประจำตัวผู้เสียภาษี / บัตรประชาชน">
              <input type="text" value={form.taxId} onChange={set('taxId')} placeholder="13 หลัก" className={`${inputClass} font-mono`} />
            </Field>
            <Field label="ทะเบียนนิติบุคคล / ทะเบียนพาณิชย์" hint="ถ้าเป็นบุคคลธรรมดา เว้นว่างได้">
              <input type="text" value={form.registrationNo} onChange={set('registrationNo')} className={`${inputClass} font-mono`} />
            </Field>
          </div>

          <Field label="ที่อยู่">
            <textarea
              value={form.address}
              onChange={set('address')}
              rows={2}
              placeholder="เลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
              className={`${inputClass} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="โทรศัพท์">
              <input type="text" value={form.phone} onChange={set('phone')} placeholder="0x-xxx-xxxx" className={inputClass} />
            </Field>
            <Field label="อีเมล">
              <input type="email" value={form.email} onChange={set('email')} className={inputClass} />
            </Field>
            <Field label="เว็บไซต์">
              <input type="text" value={form.website} onChange={set('website')} placeholder="(ไม่บังคับ)" className={inputClass} />
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              💾 บันทึกข้อมูลบริษัท
            </Button>
            {saved && <span className="text-sm text-success">✅ บันทึกแล้ว</span>}
            {!form.name.trim() && (
              <span className="text-xs text-ink-muted">* ต้องระบุชื่อบริษัทก่อน</span>
            )}
          </div>
        </Card>

        <p className="text-xs text-ink-muted">
          💡 ข้อมูลเก็บในเบราว์เซอร์นี้ (ยังไม่ sync ข้ามอุปกรณ์) — จะย้ายไปเก็บในบัญชี/ฐานข้อมูลภายหลัง
        </p>
      </main>
    </>
  )
}

export default CompanySettings
