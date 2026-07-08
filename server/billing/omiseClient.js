const OMISE_API_BASE = 'https://api.omise.co'

function getSecretKey() {
  return process.env.OMISE_SECRET_KEY || process.env.OPN_OMISE_SECRET_KEY || ''
}

export function isOmiseConfigured() {
  return Boolean(getSecretKey())
}

function encodeForm(body) {
  const params = new URLSearchParams()
  Object.entries(body || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.append(key, String(value))
  })
  return params
}

async function omiseRequest(path, { method = 'GET', body } = {}) {
  const secretKey = getSecretKey()
  if (!secretKey) {
    const error = new Error('OMISE_SECRET_KEY is not configured')
    error.code = 'omise_not_configured'
    throw error
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
  }

  const request = { method, headers }
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    request.body = encodeForm(body)
  }

  const response = await fetch(`${OMISE_API_BASE}${path}`, request)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.message || data?.error?.message || 'Omise request failed'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function createPromptPayCharge({ amountSatang, description, returnUri, metadata }) {
  const body = {
    amount: amountSatang,
    currency: 'THB',
    description,
    return_uri: returnUri,
    'source[type]': 'promptpay',
  }

  Object.entries(metadata || {}).forEach(([key, value]) => {
    body[`metadata[${key}]`] = value
  })

  return omiseRequest('/charges', {
    method: 'POST',
    body,
  })
}

export async function retrieveOmiseCharge(chargeId) {
  return omiseRequest(`/charges/${encodeURIComponent(chargeId)}`)
}