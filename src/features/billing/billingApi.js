import { getMemberToken } from '../auth/memberAuthApi'

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'เกิดข้อผิดพลาดจากระบบชำระเงิน')
    error.code = data?.error?.code
    error.data = data
    throw error
  }
  return data
}

function authHeaders() {
  const token = getMemberToken()
  if (!token) {
    const error = new Error('กรุณาเข้าสู่ระบบสมาชิกก่อนชำระเงิน')
    error.code = 'not_authenticated'
    throw error
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function createBillingCheckout(planCode) {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ planCode }),
  })
  return readJson(response)
}

export async function getBillingPayment(paymentId) {
  const response = await fetch(`/api/billing/payments/${encodeURIComponent(paymentId)}`, {
    headers: authHeaders(),
  })
  return readJson(response)
}