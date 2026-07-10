import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { BILLING_PERIODS, calculateReceiptTotal, SUBSCRIPTION_PLANS } from './plans'
import { createBillingCheckout } from './billingApi'

const moneyFmt = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function baht(value) {
  return `${moneyFmt.format(value)} บาท`
}

function periodLabel(period) {
  if (period === BILLING_PERIODS.MONTHLY) return '/เดือน'
  if (period === BILLING_PERIODS.YEARLY) return '/ปี'
  return ''
}

function PlanCard({ plan, onSelect, disabled, loading }) {
  const price = calculateReceiptTotal(plan.price)
  const isPopular = plan.code === 'pro_monthly'
  const isYearly = plan.code === 'pro_yearly'

  return (
    <Card
      className={`p-5 flex flex-col gap-5 ${
        isPopular ? 'border-accent shadow-[0_0_0_1px_var(--color-accent)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-accent">{plan.label}</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{plan.name}</h3>
          <p className="mt-2 text-sm text-ink-soft">{plan.description}</p>
        </div>
        {plan.badge && (
          <span className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            {plan.badge}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold text-ink">
            {plan.price === 0 ? 'ฟรี' : baht(price.subtotal)}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-ink-muted">{periodLabel(plan.period)}</span>
          )}
        </div>
        {plan.price > 0 && (
          <p className="mt-1 text-xs text-ink-muted">
            ยังไม่รวม VAT 7% ({baht(price.vatAmount)}) ยอดชำระรวม {baht(price.totalAmount)}
          </p>
        )}
        {isYearly && plan.savingsText && (
          <p className="mt-2 text-xs font-medium text-success">{plan.savingsText}</p>
        )}
      </div>

      <ul className="space-y-2 text-sm text-ink-soft">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-auto w-full"
        variant={isPopular ? 'primary' : 'secondary'}
        onClick={() => onSelect(plan)}
        disabled={disabled}
      >
        {loading ? 'กำลังเปิดหน้าชำระเงิน...' : plan.cta}
      </Button>
    </Card>
  )
}

function PricingPage() {
  const navigate = useNavigate()
  const [loadingPlanCode, setLoadingPlanCode] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')

  const handleSelect = async (plan) => {
    setCheckoutError('')

    if (plan.period === BILLING_PERIODS.TRIAL) {
      navigate('/register', { state: { planCode: plan.code } })
      return
    }

    setLoadingPlanCode(plan.code)
    try {
      const checkout = await createBillingCheckout(plan.code)
      if (checkout.redirectUrl) {
        window.location.assign(checkout.redirectUrl)
        return
      }
      navigate('/checkout/success', { state: { planCode: plan.code } })
    } catch (err) {
      if (err.code === 'not_authenticated') {
        navigate('/register', { state: { planCode: plan.code } })
        return
      }
      setCheckoutError(err?.message || 'ไม่สามารถเปิดหน้าชำระเงินได้')
      setLoadingPlanCode(null)
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Subscription</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
              เลือกแพ็กเกจสำหรับ AI Construction Planner
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-ink-soft">
              ราคาแพ็กเกจแสดงเป็นราคาก่อน VAT 7% และระบบจะคิดยอดชำระรวมพร้อมออกใบเสร็จรับเงิน/ใบกำกับภาษี
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            กลับหน้าแรก
          </Button>
        </div>

        {checkoutError && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {checkoutError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PlanCard
              key={plan.code}
              plan={plan}
              onSelect={handleSelect}
              disabled={Boolean(loadingPlanCode)}
              loading={loadingPlanCode === plan.code}
            />
          ))}
        </div>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">เงื่อนไขการชำระเงินและเอกสารภาษี</h2>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg border border-line bg-elevated/30 p-3">
              <p className="font-medium text-ink">ราคาแพ็กเกจ</p>
              <p className="mt-1 text-ink-soft">ราคาที่แสดงบนการ์ดคือราคาก่อน VAT 7% และยอดชำระรวมจะแสดงก่อนยืนยันชำระเงิน</p>
            </div>
            <div className="rounded-lg border border-line bg-elevated/30 p-3">
              <p className="font-medium text-ink">รายครั้ง</p>
              <p className="mt-1 text-ink-soft">บันทึกเป็นเครดิต AI 1 ครั้ง ไม่ต่ออายุอัตโนมัติ และเก็บโปรเจกต์ 30 วัน</p>
            </div>
            <div className="rounded-lg border border-line bg-elevated/30 p-3">
              <p className="font-medium text-ink">ใบกำกับภาษี</p>
              <p className="mt-1 text-ink-soft">ระบบจะใช้ข้อมูลโปรไฟล์สำหรับออกใบเสร็จรับเงิน/ใบกำกับภาษีหลังชำระเงินสำเร็จ</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default PricingPage
