import express from 'express'
import { applyBillingPlanToUser, getUserByToken } from '../auth/store.js'
import { BILLING_PLANS, findBillingPlan, withVat } from './catalog.js'
import { createPromptPayCharge, isOmiseConfigured, retrieveOmiseCharge } from './omiseClient.js'
import {
  createPayment,
  createPaymentId,
  findPaymentByChargeId,
  getPayment,
  publicPayment,
  updatePayment,
} from './paymentsStore.js'

const router = express.Router()

function getBearerToken(req) {
  const header = req.get('authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}

async function requireMember(req, res) {
  const user = await getUserByToken(getBearerToken(req))
  if (!user) {
    res.status(401).json({
      error: {
        code: 'not_authenticated',
        message: 'กรุณาเข้าสู่ระบบสมาชิกก่อนชำระเงิน',
      },
    })
    return null
  }
  return user
}

function getAppOrigin(req) {
  return process.env.APP_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`
}

function toSatang(amount) {
  return Math.round((Number(amount) || 0) * 100)
}

function paymentStatusFromCharge(charge) {
  if (charge?.paid || charge?.status === 'successful') return 'paid'
  if (charge?.status === 'failed') return 'failed'
  if (charge?.status === 'expired') return 'expired'
  return 'pending'
}

function getChargeIdFromWebhook(payload) {
  const data = payload?.data || payload?.charge || payload
  return data?.id || data?.object?.id || null
}

async function verifyAndFulfillPayment(payment, chargeInput = null) {
  if (!payment) return { payment: null, user: null }

  const charge = chargeInput || (payment.providerChargeId
    ? await retrieveOmiseCharge(payment.providerChargeId)
    : null)
  const status = paymentStatusFromCharge(charge)

  if (status !== 'paid') {
    const updated = await updatePayment(payment.id, {
      status,
      rawProviderStatus: charge?.status || status,
    })
    return { payment: updated, user: null }
  }

  if (payment.status === 'paid') {
    return { payment, user: null }
  }

  const plan = findBillingPlan(payment.planCode)
  const user = plan ? await applyBillingPlanToUser(payment.userId, plan, payment) : null
  const updated = await updatePayment(payment.id, {
    status: 'paid',
    paidAt: Date.now(),
    rawProviderStatus: charge?.status || 'successful',
  })

  return { payment: updated, user }
}

router.get('/plans', (req, res) => {
  res.json({
    plans: BILLING_PLANS.map(withVat),
  })
})

router.get('/subscription', async (req, res) => {
  const user = await requireMember(req, res)
  if (!user) return
  res.json({ subscription: user })
})

router.post('/checkout', async (req, res) => {
  const { planCode } = req.body || {}
  const plan = findBillingPlan(planCode)
  if (!plan) {
    return res.status(400).json({
      error: { code: 'invalid_plan', message: 'ไม่พบแพ็กเกจที่เลือก' },
    })
  }

  if (plan.billingType === 'trial' || Number(plan.subtotal) <= 0) {
    return res.status(400).json({
      error: { code: 'trial_has_no_payment', message: 'แพ็กเกจทดลองใช้ฟรีไม่ต้องชำระเงิน' },
    })
  }

  const user = await requireMember(req, res)
  if (!user) return

  if (!isOmiseConfigured()) {
    return res.status(503).json({
      error: {
        code: 'omise_not_configured',
        message: 'ยังไม่ได้ใส่ OMISE_SECRET_KEY ในไฟล์ .env.local หรือ .env',
      },
    })
  }

  const pricedPlan = withVat(plan)
  const paymentId = createPaymentId()
  const amountSatang = toSatang(pricedPlan.totalAmount)
  const returnUri = `${getAppOrigin(req)}/checkout/success?plan=${encodeURIComponent(
    plan.code,
  )}&payment_id=${encodeURIComponent(paymentId)}`

  await createPayment({
    id: paymentId,
    userId: user.id,
    planCode: plan.code,
    provider: 'omise',
    method: 'promptpay',
    status: 'creating',
    subtotal: pricedPlan.subtotal,
    vatAmount: pricedPlan.vatAmount,
    totalAmount: pricedPlan.totalAmount,
    amountSatang,
    currency: 'THB',
  })

  try {
    const charge = await createPromptPayCharge({
      amountSatang,
      returnUri,
      description: `AI Construction Planner - ${plan.code}`,
      metadata: {
        payment_id: paymentId,
        user_id: user.id,
        plan_code: plan.code,
      },
    })

    const updated = await updatePayment(paymentId, {
      status: paymentStatusFromCharge(charge),
      providerChargeId: charge.id,
      checkoutUrl: charge.authorize_uri,
      rawProviderStatus: charge.status,
    })

    return res.status(201).json({
      payment: publicPayment(updated),
      redirectUrl: charge.authorize_uri,
      plan: pricedPlan,
    })
  } catch (err) {
    const failed = await updatePayment(paymentId, {
      status: 'failed',
      errorMessage: err?.message || 'Omise checkout failed',
    })
    return res.status(err?.status || 502).json({
      error: {
        code: err?.code || 'omise_checkout_failed',
        message: err?.message || 'ไม่สามารถเปิดหน้าชำระเงิน Omise ได้',
      },
      payment: publicPayment(failed),
    })
  }
})

router.get('/payments/:paymentId', async (req, res) => {
  const user = await requireMember(req, res)
  if (!user) return

  const payment = await getPayment(req.params.paymentId)
  if (!payment || payment.userId !== user.id) {
    return res.status(404).json({
      error: { code: 'payment_not_found', message: 'ไม่พบรายการชำระเงินนี้' },
    })
  }

  try {
    const result = payment.providerChargeId
      ? await verifyAndFulfillPayment(payment)
      : { payment, user: null }

    return res.json({
      payment: publicPayment(result.payment),
      user: result.user,
    })
  } catch (err) {
    return res.status(err?.status || 502).json({
      error: {
        code: 'payment_status_failed',
        message: err?.message || 'ตรวจสอบสถานะการชำระเงินไม่สำเร็จ',
      },
      payment: publicPayment(payment),
    })
  }
})

router.post('/customer-portal', (req, res) => {
  res.status(501).json({
    error: {
      code: 'customer_portal_not_connected',
      message: 'Customer portal for Omise will be added after recurring card billing is enabled.',
    },
  })
})

router.post('/webhook', async (req, res) => {
  const chargeId = getChargeIdFromWebhook(req.body || {})
  if (!chargeId) return res.status(202).json({ received: true })

  try {
    const payment = await findPaymentByChargeId(chargeId)
    if (!payment) return res.status(202).json({ received: true })

    const charge = await retrieveOmiseCharge(chargeId)
    await verifyAndFulfillPayment(payment, charge)
    return res.json({ received: true })
  } catch (err) {
    return res.status(500).json({
      error: { code: 'webhook_failed', message: err?.message || 'Webhook failed' },
    })
  }
})

export default router