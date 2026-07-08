export const VAT_RATE = 0.07

export const BILLING_PLANS = [
  {
    code: 'trial',
    name: 'ทดลองใช้',
    billingType: 'trial',
    interval: null,
    subtotal: 0,
    aiCredits: 3,
    projectLimit: 1,
    seatLimit: 1,
    features: {
      pdfWatermark: true,
      customerShare: false,
      contract: false,
      miniErp: false,
    },
  },
  {
    code: 'credit_once',
    name: 'รายครั้ง',
    billingType: 'one_time',
    interval: null,
    subtotal: 199,
    aiCredits: 1,
    projectLimit: null,
    seatLimit: 1,
    features: {
      pdfWatermark: false,
      customerShare: false,
      contract: false,
      miniErp: false,
      projectRetentionDays: 30,
    },
  },
  {
    code: 'pro_monthly',
    name: 'Pro รายเดือน',
    billingType: 'subscription',
    interval: 'month',
    subtotal: 1490,
    aiCredits: 50,
    projectLimit: 30,
    seatLimit: 1,
    features: {
      pdfWatermark: false,
      customerShare: true,
      contract: true,
      miniErp: true,
    },
  },
  {
    code: 'pro_yearly',
    name: 'Pro รายปี',
    billingType: 'subscription',
    interval: 'year',
    subtotal: 14900,
    aiCredits: 50,
    projectLimit: 30,
    seatLimit: 1,
    features: {
      pdfWatermark: false,
      customerShare: true,
      contract: true,
      miniErp: true,
      creditsResetMonthly: true,
    },
  },
]

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function withVat(plan) {
  const subtotal = roundMoney(plan.subtotal)
  const vatAmount = roundMoney(subtotal * VAT_RATE)
  return {
    ...plan,
    vatRate: VAT_RATE,
    subtotal,
    vatAmount,
    totalAmount: roundMoney(subtotal + vatAmount),
  }
}

export function findBillingPlan(code) {
  return BILLING_PLANS.find((plan) => plan.code === code) || null
}
