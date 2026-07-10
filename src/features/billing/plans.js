export const VAT_RATE = 0.07

export const BILLING_PERIODS = {
  TRIAL: 'trial',
  ONE_TIME: 'one_time',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

export const PLAN_CODES = {
  TRIAL: 'trial',
  CREDIT_ONCE: 'credit_once',
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function calculateReceiptTotal(subtotal) {
  const base = roundMoney(subtotal)
  const vatAmount = roundMoney(base * VAT_RATE)
  return {
    subtotal: base,
    vatAmount,
    totalAmount: roundMoney(base + vatAmount),
    vatRate: VAT_RATE,
    receiptType: 'tax_invoice',
  }
}

export const calculateVat = calculateReceiptTotal

export const SUBSCRIPTION_PLANS = [
  {
    code: PLAN_CODES.TRIAL,
    period: BILLING_PERIODS.TRIAL,
    name: 'ทดลองใช้',
    label: 'Free Trial',
    description: 'สำหรับทดลองระบบครั้งแรกโดยไม่ต้องผูกบัตร',
    price: 0,
    badge: 'เริ่มต้น',
    cta: 'เริ่มใช้ฟรี',
    features: [
      'ใช้งานฟรี 7 วัน',
      'AI วิเคราะห์ 3 ครั้ง',
      'สร้างได้ 1 โปรเจกต์',
      'Export PDF มีลายน้ำ',
    ],
    limits: {
      trialDays: 7,
      aiCredits: 3,
      projects: 1,
      seats: 1,
      pdfWatermark: true,
      customerShare: false,
      contract: false,
      miniErp: false,
    },
  },
  {
    code: PLAN_CODES.CREDIT_ONCE,
    period: BILLING_PERIODS.ONE_TIME,
    name: 'รายครั้ง',
    label: 'ซื้อเครดิต',
    description: 'เหมาะกับผู้รับเหมาที่มีงานนาน ๆ ที',
    price: 199,
    badge: 'จ่ายตามใช้',
    cta: 'ซื้อ 1 เครดิต',
    features: [
      'AI วิเคราะห์ 1 ครั้ง',
      'Export PDF ไม่มีลายน้ำ',
      'เก็บโปรเจกต์ 30 วัน',
      'ไม่ผูก subscription',
    ],
    limits: {
      aiCredits: 1,
      projectRetentionDays: 30,
      seats: 1,
      pdfWatermark: false,
      customerShare: false,
      contract: false,
      miniErp: false,
    },
  },
  {
    code: PLAN_CODES.PRO_MONTHLY,
    period: BILLING_PERIODS.MONTHLY,
    name: 'Pro รายเดือน',
    label: 'Monthly Plan',
    description: 'สำหรับผู้รับเหมาที่ใช้งานประจำ',
    price: 1490,
    badge: 'ยอดนิยม',
    cta: 'สมัครรายเดือน',
    features: [
      'AI วิเคราะห์ 50 ครั้ง/เดือน',
      'สร้างได้ 30 โปรเจกต์',
      'เอกสารสัญญาจ้าง',
      'แชร์ลิงก์ให้ลูกค้า',
      'Mini ERP',
      '1 ผู้ใช้',
    ],
    limits: {
      aiCreditsPerMonth: 50,
      projects: 30,
      seats: 1,
      pdfWatermark: false,
      customerShare: true,
      contract: true,
      miniErp: true,
    },
  },
  {
    code: PLAN_CODES.PRO_YEARLY,
    period: BILLING_PERIODS.YEARLY,
    name: 'Pro รายปี',
    label: 'Annual Plan',
    description: 'สำหรับทีมที่ต้องการใช้งานต่อเนื่องและคุมงบรายปี',
    price: 14900,
    badge: 'คุ้มสุด',
    cta: 'สมัครรายปี',
    savingsText: 'ประหยัด 2,980 บาท/ปี ก่อน VAT',
    features: [
      'สิทธิ์เหมือน Pro รายเดือน',
      'AI รีเซ็ต 50 ครั้งทุกเดือน',
      'สร้างได้ 30 โปรเจกต์',
      'สัญญา + แชร์ลูกค้า + Mini ERP',
      'จ่ายถูกกว่ารายเดือนประมาณ 16.7%',
    ],
    limits: {
      aiCreditsPerMonth: 50,
      projects: 30,
      seats: 1,
      pdfWatermark: false,
      customerShare: true,
      contract: true,
      miniErp: true,
    },
  },
]

export function getPlanByCode(code) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.code === code) || null
}

export function getPlanPriceBreakdown(code) {
  const plan = getPlanByCode(code)
  if (!plan) return null
  return { ...plan, ...calculateReceiptTotal(plan.price) }
}
