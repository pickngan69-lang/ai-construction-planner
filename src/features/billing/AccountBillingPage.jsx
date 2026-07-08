import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useMemberSession } from '../auth/useMemberSession'
import { getPlanPriceBreakdown, PLAN_CODES } from './plans'
import SubscriptionBadge from './SubscriptionBadge'

const TAX_PROFILE_KEY = 'acp-tax-profile'

function readTaxProfile() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(TAX_PROFILE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveTaxProfile(profile) {
  try {
    window.localStorage.setItem(TAX_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // Ignore unavailable storage/quota errors.
  }
}

function AccountBillingPage() {
  const navigate = useNavigate()
  const { session, clearSession } = useMemberSession()
  const plan = getPlanPriceBreakdown(session?.planCode || PLAN_CODES.TRIAL)
  const [taxProfile, setTaxProfile] = useState(() => readTaxProfile())
  const [saved, setSaved] = useState(false)

  const updateTaxProfile = (field, value) => {
    setSaved(false)
    setTaxProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveTaxProfile = () => {
    saveTaxProfile(taxProfile)
    setSaved(true)
  }

  const handleLogout = () => {
    clearSession()
    navigate('/pricing')
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Account Billing</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">บัญชีและแพ็กเกจ</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/pricing')}>
              เปลี่ยนแพ็กเกจ
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              กลับหน้าแรก
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">สถานะการใช้งาน</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  ข้อมูลสมาชิกและสิทธิ์การใช้งานของบัญชีนี้
                </p>
              </div>
              <SubscriptionBadge
                planCode={session?.planCode || PLAN_CODES.TRIAL}
                status={session?.status || 'trialing'}
              />
            </div>

            <div className="mt-5 space-y-3 rounded-lg border border-line bg-elevated/30 p-4">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">ผู้ใช้งาน</span>
                <span className="text-right text-sm font-medium text-ink">
                  {session?.name || 'ยังไม่ได้สมัครสมาชิก'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">อีเมล</span>
                <span className="text-right text-sm text-ink">{session?.email || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">แพ็กเกจ</span>
                <span className="text-right text-sm font-medium text-ink">{plan?.name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">เครดิต AI คงเหลือ</span>
                <span className="font-mono text-sm text-accent">{session?.aiCredits ?? 0}</span>
              </div>
              {plan?.price > 0 && (
                <div className="border-t border-line pt-3">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">ยอดก่อน VAT</span>
                    <span className="font-mono text-ink">{plan.subtotal.toLocaleString()} บาท</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">VAT 7%</span>
                    <span className="font-mono text-ink">{plan.vatAmount.toLocaleString()} บาท</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4 text-sm font-medium">
                    <span className="text-ink">ยอดรวม</span>
                    <span className="font-mono text-accent">{plan.totalAmount.toLocaleString()} บาท</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => navigate('/pricing')}>
                เติมเครดิต/อัปเกรด
              </Button>
              <Button className="flex-1" variant="secondary" onClick={handleLogout}>
                ออกจากระบบ
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">ข้อมูลใบกำกับภาษี</h2>
            <p className="mt-1 text-sm text-ink-soft">
              เก็บข้อมูลนี้ไว้ใช้ตอนออกใบเสร็จ/ใบกำกับภาษีเต็มรูปแบบ
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-ink-soft">ชื่อบริษัท/ชื่อผู้เสียภาษี</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={taxProfile.taxName || ''}
                  onChange={(e) => updateTaxProfile('taxName', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs text-ink-soft">เลขประจำตัวผู้เสียภาษี</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={taxProfile.taxId || ''}
                  onChange={(e) => updateTaxProfile('taxId', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs text-ink-soft">สำนักงานใหญ่/สาขา</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={taxProfile.branch || ''}
                  onChange={(e) => updateTaxProfile('branch', e.target.value)}
                  placeholder="สำนักงานใหญ่"
                />
              </label>
              <label className="block">
                <span className="text-xs text-ink-soft">อีเมลรับเอกสาร</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={taxProfile.billingEmail || ''}
                  onChange={(e) => updateTaxProfile('billingEmail', e.target.value)}
                  type="email"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-ink-soft">ที่อยู่เต็ม</span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={taxProfile.address || ''}
                  onChange={(e) => updateTaxProfile('address', e.target.value)}
                />
              </label>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button onClick={handleSaveTaxProfile}>บันทึกข้อมูลภาษี</Button>
              {saved && <span className="text-sm text-success">บันทึกแล้ว</span>}
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default AccountBillingPage
