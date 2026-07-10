import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentMember } from '../auth/memberAuthApi'
import { useMemberSession } from '../auth/useMemberSession'
import { listBillingPayments } from './billingApi'
import {
  buildReceiptHtml,
  downloadReceiptPdf,
  getReceiptNo,
  RECEIPT_A4_HEIGHT_PX,
  RECEIPT_A4_WIDTH_PX,
} from './receiptPdf'
import { getPlanPriceBreakdown, PLAN_CODES } from './plans'
import SubscriptionBadge from './SubscriptionBadge'

const RECEIPT_PROFILE_KEY = 'acp-receipt-profile'
const OLD_TAX_PROFILE_KEY = 'acp-tax-profile'

const moneyFmt = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const dateFmt = new Intl.DateTimeFormat('th-TH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function baht(value) {
  return `${moneyFmt.format(Number(value) || 0)} บาท`
}

function statusLabel(status) {
  if (status === 'paid') return 'ชำระแล้ว'
  if (status === 'failed') return 'ไม่สำเร็จ'
  if (status === 'expired') return 'หมดอายุ'
  if (status === 'creating') return 'กำลังสร้างรายการ'
  return 'รอชำระ'
}

function statusClass(status) {
  if (status === 'paid') return 'text-success'
  if (status === 'failed' || status === 'expired') return 'text-danger'
  return 'text-accent'
}

function readReceiptProfile() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(RECEIPT_PROFILE_KEY)
    if (raw) return JSON.parse(raw)

    const oldRaw = window.localStorage.getItem(OLD_TAX_PROFILE_KEY)
    if (!oldRaw) return {}
    const old = JSON.parse(oldRaw)
    return {
      receiptName: old.taxName || '',
      taxId: old.taxId || '',
      branch: old.branch || '',
      billingEmail: old.billingEmail || '',
      address: old.address || '',
      note: '',
    }
  } catch {
    return {}
  }
}

function saveReceiptProfile(profile) {
  try {
    window.localStorage.setItem(RECEIPT_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // Ignore unavailable storage/quota errors.
  }
}

function AccountBillingPage() {
  const navigate = useNavigate()
  const { user: appUser, logout } = useAuth()
  const { session, setSession, clearSession } = useMemberSession()
  const [memberLoading, setMemberLoading] = useState(!session)
  const [receiptProfile, setReceiptProfile] = useState(() => readReceiptProfile())
  const [saved, setSaved] = useState(false)
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState('')
  const [downloadingId, setDownloadingId] = useState('')
  const [receiptPreview, setReceiptPreview] = useState(null)

  useEffect(() => {
    let alive = true

    async function loadCurrentMember() {
      if (session) {
        setMemberLoading(false)
        return
      }

      try {
        const member = await getCurrentMember()
        if (alive && member) setSession(member)
      } catch {
        // If there is no token on this browser port, show the fallback state.
      } finally {
        if (alive) setMemberLoading(false)
      }
    }

    loadCurrentMember()
    return () => {
      alive = false
    }
  }, [session, setSession])

  useEffect(() => {
    if (!session) return undefined
    let alive = true

    async function loadPayments() {
      setPaymentsLoading(true)
      setPaymentsError('')
      try {
        const data = await listBillingPayments()
        if (alive) setPayments(data.payments || [])
      } catch (err) {
        if (alive) setPaymentsError(err?.message || 'โหลดประวัติการชำระเงินไม่สำเร็จ')
      } finally {
        if (alive) setPaymentsLoading(false)
      }
    }

    loadPayments()
    return () => {
      alive = false
    }
  }, [session])

  const displaySession = useMemo(() => {
    if (session) return session
    if (!appUser) return null
    return {
      name: appUser.name,
      email: appUser.memberEmail || '',
      planCode: PLAN_CODES.TRIAL,
      status: 'trialing',
      aiCredits: 0,
    }
  }, [appUser, session])

  const plan = getPlanPriceBreakdown(displaySession?.planCode || PLAN_CODES.TRIAL)

  const updateReceiptProfile = (field, value) => {
    setSaved(false)
    setReceiptProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveReceiptProfile = () => {
    saveReceiptProfile(receiptProfile)
    setSaved(true)
  }

  const buildSampleReceipt = () => {
    const samplePlan = getPlanPriceBreakdown(PLAN_CODES.CREDIT_ONCE)
    const samplePayment = {
      id: `sample_${Date.now()}`,
      planCode: PLAN_CODES.CREDIT_ONCE,
      provider: 'DRAFT',
      receiptNo: 'DRAFT',
      isSample: true,
      method: 'ตัวอย่าง',
      status: 'paid',
      subtotal: samplePlan.subtotal,
      vatAmount: samplePlan.vatAmount,
      totalAmount: samplePlan.totalAmount,
      createdAt: Date.now(),
      paidAt: Date.now(),
    }

    return {
      payment: samplePayment,
      plan: samplePlan,
      member: displaySession || {
        name: 'ตัวอย่างผู้ใช้งาน',
        email: receiptProfile.billingEmail || 'sample@example.com',
      },
      receiptProfile: {
        ...receiptProfile,
        receiptName: receiptProfile.receiptName || displaySession?.name || 'ตัวอย่างผู้รับเอกสารภาษี',
        taxId: receiptProfile.taxId || '0500000000000',
        branch: receiptProfile.branch || 'สำนักงานใหญ่',
        billingEmail: receiptProfile.billingEmail || displaySession?.email || 'sample@example.com',
        address: receiptProfile.address || 'ที่อยู่ตัวอย่างสำหรับออกใบกำกับภาษี',
        note: receiptProfile.note || 'เอกสารตัวอย่างสำหรับตรวจรูปแบบใบเสร็จรับเงิน/ใบกำกับภาษี',
      },
    }
  }

  const openReceiptPreview = ({ payment, paymentPlan, sample = false }) => {
    const payload = sample
      ? buildSampleReceipt()
      : {
          payment,
          plan: paymentPlan || getPlanPriceBreakdown(payment.planCode) || plan,
          member: displaySession,
          receiptProfile,
        }

    setReceiptPreview({
      ...payload,
      html: buildReceiptHtml(payload),
    })
  }

  const handleDownloadPreviewReceipt = async () => {
    if (!receiptPreview) return
    setDownloadingId(receiptPreview.payment.id)
    try {
      await downloadReceiptPdf(receiptPreview)
    } finally {
      setDownloadingId('')
    }
  }

  const handleLogout = () => {
    clearSession()
    logout()
    navigate('/member/login')
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
                planCode={displaySession?.planCode || PLAN_CODES.TRIAL}
                status={displaySession?.status || 'trialing'}
              />
            </div>

            <div className="mt-5 space-y-3 rounded-lg border border-line bg-elevated/30 p-4">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">ผู้ใช้งาน</span>
                <span className="text-right text-sm font-medium text-ink">
                  {memberLoading ? 'กำลังโหลด...' : displaySession?.name || 'ยังไม่ได้เข้าสู่ระบบ'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">อีเมล</span>
                <span className="text-right text-sm text-ink">{displaySession?.email || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">แพ็กเกจ</span>
                <span className="text-right text-sm font-medium text-ink">{plan?.name || '-'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-ink-soft">เครดิต AI คงเหลือ</span>
                <span className="font-mono text-sm text-accent">{displaySession?.aiCredits ?? 0}</span>
              </div>
              {plan?.price > 0 && (
                <div className="border-t border-line pt-3">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">ราคาก่อน VAT</span>
                    <span className="font-mono text-ink">{baht(plan.subtotal)}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">VAT 7%</span>
                    <span className="font-mono text-ink">{baht(plan.vatAmount)}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">ยอดชำระรวม</span>
                    <span className="font-mono font-medium text-ink">{baht(plan.totalAmount)}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">เอกสาร</span>
                    <span className="text-ink">ใบเสร็จรับเงิน/ใบกำกับภาษี</span>
                  </div>
                </div>
              )}
            </div>

            {!displaySession && !memberLoading && (
              <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                ยังไม่พบข้อมูลสมาชิกบนพอร์ตนี้ กรุณาเข้าสู่ระบบสมาชิกอีกครั้ง
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => navigate('/pricing')}>
                เติมเครดิต/อัปเกรด
              </Button>
              {displaySession ? (
                <Button className="flex-1" variant="secondary" onClick={handleLogout}>
                  ออกจากระบบ
                </Button>
              ) : (
                <Button className="flex-1" variant="secondary" onClick={() => navigate('/member/login')}>
                  เข้าสู่ระบบสมาชิก
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">ข้อมูลใบเสร็จรับเงิน/ใบกำกับภาษี</h2>
            <p className="mt-1 text-sm text-ink-soft">
              เก็บข้อมูลนี้ไว้ใช้ตอนออกใบเสร็จรับเงิน/ใบกำกับภาษีหลังชำระเงินสำเร็จ
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs text-ink-soft">ชื่อบนเอกสารภาษี</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={receiptProfile.receiptName || ''}
                  onChange={(e) => updateReceiptProfile('receiptName', e.target.value)}
                  placeholder="ชื่อบุคคลหรือชื่อบริษัท"
                />
              </label>
              <label className="block">
                <span className="text-xs text-ink-soft">เลขประจำตัวผู้เสียภาษี</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={receiptProfile.taxId || ''}
                  onChange={(e) => updateReceiptProfile('taxId', e.target.value)}
                  placeholder="เช่น 0505566023075"
                />
              </label>
              <label className="block">
                <span className="text-xs text-ink-soft">สำนักงานใหญ่/สาขา</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={receiptProfile.branch || ''}
                  onChange={(e) => updateReceiptProfile('branch', e.target.value)}
                  placeholder="สำนักงานใหญ่"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-ink-soft">อีเมลรับเอกสาร</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={receiptProfile.billingEmail || ''}
                  onChange={(e) => updateReceiptProfile('billingEmail', e.target.value)}
                  type="email"
                  placeholder={displaySession?.email || 'email@example.com'}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-ink-soft">ที่อยู่สำหรับใบกำกับภาษี</span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={receiptProfile.address || ''}
                  onChange={(e) => updateReceiptProfile('address', e.target.value)}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-ink-soft">หมายเหตุบนเอกสาร</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  value={receiptProfile.note || ''}
                  onChange={(e) => updateReceiptProfile('note', e.target.value)}
                  placeholder="เช่น ชื่อโครงการ หรือเลขอ้างอิงภายใน"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button onClick={handleSaveReceiptProfile}>บันทึกข้อมูลเอกสารภาษี</Button>
              <Button
                variant="secondary"
                onClick={() => openReceiptPreview({ sample: true })}
                disabled={Boolean(downloadingId)}
              >
                ดูตัวอย่างเอกสาร
              </Button>
              {saved && <span className="text-sm text-success">บันทึกแล้ว</span>}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">ประวัติการชำระเงิน</h2>
              <p className="mt-1 text-sm text-ink-soft">
                รายการที่ชำระสำเร็จสามารถดูตัวอย่างและดาวน์โหลดใบเสร็จรับเงิน/ใบกำกับภาษีได้
              </p>
            </div>
            {paymentsLoading && <span className="text-sm text-ink-muted">กำลังโหลด...</span>}
          </div>

          {paymentsError && (
            <div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {paymentsError}
            </div>
          )}

          {!paymentsLoading && !paymentsError && payments.length === 0 && (
            <div className="mt-4 rounded-lg border border-line bg-elevated/30 px-4 py-5 text-sm text-ink-soft">
              ยังไม่มีประวัติการชำระเงิน เมื่อซื้อเครดิตหรือสมัครแพ็กเกจสำเร็จ รายการจะแสดงที่นี่
            </div>
          )}

          {payments.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-elevated/60 text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">วันที่</th>
                    <th className="px-4 py-3 text-left font-medium">แพ็กเกจ</th>
                    <th className="px-4 py-3 text-right font-medium">ยอดชำระ</th>
                    <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                    <th className="px-4 py-3 text-right font-medium">เอกสาร</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const paymentPlan = getPlanPriceBreakdown(payment.planCode)
                    const paid = payment.status === 'paid'
                    return (
                      <tr key={payment.id} className="border-t border-line/60">
                        <td className="px-4 py-3 text-ink-soft">
                          {dateFmt.format(new Date(payment.paidAt || payment.createdAt || Date.now()))}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          <div className="font-medium">{paymentPlan?.name || payment.planCode}</div>
                          <div className="mt-1 text-xs text-ink-muted">{payment.method || payment.provider}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink">
                          {baht(payment.totalAmount)}
                        </td>
                        <td className={`px-4 py-3 text-center font-medium ${statusClass(payment.status)}`}>
                          {statusLabel(payment.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={paid ? 'secondary' : 'ghost'}
                            disabled={!paid || downloadingId === payment.id}
                            onClick={() => openReceiptPreview({ payment, paymentPlan })}
                          >
                            {downloadingId === payment.id ? 'กำลังสร้าง...' : 'ดูเอกสาร'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {receiptPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 px-4 py-6" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-accent">Tax Document Preview</p>
                <h2 className="text-lg font-semibold text-ink">ตัวอย่างใบเสร็จรับเงิน/ใบกำกับภาษี</h2>
                <p className="text-xs text-ink-muted">เลขที่ {getReceiptNo(receiptPreview.payment)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleDownloadPreviewReceipt}
                  disabled={downloadingId === receiptPreview.payment.id}
                >
                  {downloadingId === receiptPreview.payment.id ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}
                </Button>
                <Button variant="secondary" onClick={() => setReceiptPreview(null)}>
                  ปิด
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-canvas p-4">
              <div
                className="mx-auto overflow-hidden rounded-lg bg-white shadow-lg"
                style={{
                  width: RECEIPT_A4_WIDTH_PX,
                  height: RECEIPT_A4_HEIGHT_PX,
                  maxWidth: 'none',
                }}
              >
                <div
                  style={{
                    width: RECEIPT_A4_WIDTH_PX,
                    height: RECEIPT_A4_HEIGHT_PX,
                    background: '#ffffff',
                    color: '#151515',
                    padding: 40,
                    boxSizing: 'border-box',
                    fontFamily: "'Noto Sans Thai', 'Tahoma', system-ui, sans-serif",
                  }}
                  dangerouslySetInnerHTML={{ __html: receiptPreview.html }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default AccountBillingPage
