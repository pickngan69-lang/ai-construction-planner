import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useMemberSession } from '../auth/useMemberSession'
import { getBillingPayment } from './billingApi'
import { getPlanPriceBreakdown, PLAN_CODES } from './plans'
import SubscriptionBadge from './SubscriptionBadge'

function getCreditsForPlan(planCode) {
  if (planCode === PLAN_CODES.CREDIT_ONCE) return 1
  if (planCode === PLAN_CODES.PRO_MONTHLY || planCode === PLAN_CODES.PRO_YEARLY) {
    return 50
  }
  return 3
}

function paymentStatusText(status) {
  if (status === 'paid') return 'ชำระเงินสำเร็จ'
  if (status === 'failed') return 'ชำระเงินไม่สำเร็จ'
  if (status === 'expired') return 'รายการหมดอายุ'
  if (status === 'creating') return 'กำลังสร้างรายการ'
  return 'รอการชำระเงิน'
}

function money(value) {
  return `${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`
}

function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, setSession } = useMemberSession()
  const params = new URLSearchParams(location.search)
  const paymentId = params.get('payment_id')
  const planCode = location.state?.planCode || params.get('plan') || PLAN_CODES.TRIAL
  const plan = useMemo(() => getPlanPriceBreakdown(planCode), [planCode])
  const [paymentState, setPaymentState] = useState({ loading: Boolean(paymentId), payment: null, error: '' })

  const refreshPayment = useCallback(async () => {
    if (!paymentId) return
    setPaymentState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const data = await getBillingPayment(paymentId)
      if (data.user) setSession(data.user)
      setPaymentState({ loading: false, payment: data.payment, error: '' })
    } catch (err) {
      setPaymentState((current) => ({
        ...current,
        loading: false,
        error: err?.message || 'ตรวจสอบสถานะการชำระเงินไม่สำเร็จ',
      }))
    }
  }, [paymentId, setSession])

  useEffect(() => {
    if (!plan) return

    if (plan.code === PLAN_CODES.TRIAL && !paymentId) {
      setSession({
        ...(session || {
          id: `user-${Date.now()}`,
          name: 'ผู้ใช้งาน',
          email: '',
          createdAt: Date.now(),
        }),
        planCode: plan.code,
        status: 'trialing',
        aiCredits: getCreditsForPlan(plan.code),
        lastCheckoutAt: Date.now(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.code, paymentId])

  useEffect(() => {
    if (!paymentId) return undefined
    refreshPayment()
    const timer = window.setInterval(refreshPayment, 5000)
    return () => window.clearInterval(timer)
  }, [paymentId, refreshPayment])

  if (!plan) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-10">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <h1 className="text-xl font-semibold text-ink">ไม่พบแพ็กเกจ</h1>
          <Button className="mt-5" onClick={() => navigate('/pricing')}>
            กลับไปเลือกแพ็กเกจ
          </Button>
        </Card>
      </main>
    )
  }

  const payment = paymentState.payment
  const isTrial = plan.code === PLAN_CODES.TRIAL
  const isPaid = isTrial || payment?.status === 'paid'
  const status = isTrial ? 'trialing' : payment?.status
  const subtotal = payment?.subtotal ?? plan.subtotal
  const vatAmount = payment?.vatAmount ?? plan.vatAmount
  const totalAmount = payment?.totalAmount ?? plan.totalAmount

  return (
    <main className="min-h-screen bg-canvas px-4 py-10">
      <Card className="mx-auto max-w-2xl p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <SubscriptionBadge
              planCode={plan.code}
              status={isTrial ? 'trialing' : isPaid ? 'active' : 'pending'}
            />
            <h1 className="mt-4 text-2xl font-semibold text-ink">
              {isPaid ? 'เปิดสิทธิ์แพ็กเกจเรียบร้อย' : 'รอการยืนยันการชำระเงิน'}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {isPaid
                ? 'ระบบบันทึกแพ็กเกจและเครดิต AI ให้บัญชีสมาชิกแล้ว และจะออกเอกสารเป็นใบเสร็จรับเงิน/ใบกำกับภาษี'
                : 'ถ้าชำระผ่าน Opn/Omise แล้ว ให้รอสักครู่หรือกดตรวจสอบสถานะอีกครั้ง'}
            </p>
          </div>

          {paymentState.error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {paymentState.error}
            </div>
          )}

          {!isTrial && !paymentId && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              ยังไม่มีเลขรายการชำระเงิน กรุณากลับไปเลือกแพ็กเกจและชำระผ่าน Opn/Omise ก่อน
            </div>
          )}

          <div className="rounded-lg border border-line bg-elevated/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink-soft">แพ็กเกจ</span>
              <span className="font-medium text-ink">{plan.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="text-sm text-ink-soft">เครดิต AI</span>
              <span className="font-mono text-accent">{getCreditsForPlan(plan.code)}</span>
            </div>
            {!isTrial && (
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-sm text-ink-soft">สถานะการชำระเงิน</span>
                <span className="font-medium text-ink">
                  {paymentState.loading ? 'กำลังตรวจสอบ...' : paymentStatusText(status)}
                </span>
              </div>
            )}
            {plan.price > 0 && (
              <>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-ink-soft">ราคาก่อน VAT</span>
                  <span className="font-mono text-ink">{money(subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-ink-soft">VAT 7%</span>
                  <span className="font-mono text-ink">{money(vatAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-ink-soft">เอกสาร</span>
                  <span className="text-sm font-medium text-ink">ใบเสร็จรับเงิน/ใบกำกับภาษี</span>
                </div>
                <div className="mt-3 border-t border-line pt-3 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-ink">ยอดชำระรวม</span>
                  <span className="font-mono text-lg font-semibold text-accent">
                    {money(totalAmount)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!isTrial && !isPaid && paymentId && (
              <Button className="flex-1" onClick={refreshPayment} disabled={paymentState.loading}>
                ตรวจสอบสถานะอีกครั้ง
              </Button>
            )}
            <Button className="flex-1" onClick={() => navigate('/account/billing')}>
              ดูสถานะแพ็กเกจ
            </Button>
            <Button className="flex-1" variant="secondary" onClick={() => navigate('/')}>
              เข้าใช้งานระบบ
            </Button>
          </div>

          <p className="text-center text-xs text-ink-muted">
            ต้องการเปลี่ยนแพ็กเกจ? <Link className="text-accent" to="/pricing">กลับไปหน้า Pricing</Link>
          </p>
        </div>
      </Card>
    </main>
  )
}

export default CheckoutSuccessPage
