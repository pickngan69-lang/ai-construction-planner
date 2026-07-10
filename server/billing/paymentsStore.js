import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../.data')
const DATA_FILE = path.join(DATA_DIR, 'payments.json')
const RECEIPT_PREFIX = 'RC'

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { payments: [] }
  }
}

async function saveStore(store) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8')
}

function getBangkokReceiptPeriod(timestamp = Date.now()) {
  const date = new Date(Number(timestamp) || Date.now())
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  return `${year}${month}`
}

function parseReceiptNo(receiptNo) {
  const match = /^RC-(\d{6})-(\d{6})$/.exec(String(receiptNo || ''))
  if (!match) return null
  return {
    period: match[1],
    sequence: Number(match[2]),
  }
}

function formatReceiptNo(period, sequence) {
  return `${RECEIPT_PREFIX}-${period}-${String(sequence).padStart(6, '0')}`
}

function getNextReceiptNo(payments, period) {
  const maxSequence = (payments || []).reduce((max, payment) => {
    const parsed = parseReceiptNo(payment.receiptNo)
    if (!parsed || parsed.period !== period) return max
    return Math.max(max, parsed.sequence)
  }, 0)
  return formatReceiptNo(period, maxSequence + 1)
}

export function createPaymentId() {
  return `pay_${Date.now()}_${randomBytes(4).toString('hex')}`
}

export function publicPayment(payment) {
  if (!payment) return null
  return {
    id: payment.id,
    planCode: payment.planCode,
    provider: payment.provider,
    method: payment.method,
    status: payment.status,
    subtotal: payment.subtotal,
    vatAmount: payment.vatAmount,
    totalAmount: payment.totalAmount,
    currency: payment.currency,
    providerChargeId: payment.providerChargeId || null,
    receiptNo: payment.receiptNo || null,
    receiptIssuedAt: payment.receiptIssuedAt || null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    paidAt: payment.paidAt || null,
  }
}

export async function createPayment(record) {
  const store = await ensureStore()
  const now = Date.now()
  const payment = {
    ...record,
    id: record.id || createPaymentId(),
    createdAt: record.createdAt || now,
    updatedAt: now,
  }
  store.payments.push(payment)
  await saveStore(store)
  return payment
}

export async function listPaymentsForUser(userId) {
  const store = await ensureStore()
  return (store.payments || [])
    .filter((payment) => payment.userId === userId)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
}
export async function getPayment(paymentId) {
  const store = await ensureStore()
  return store.payments.find((payment) => payment.id === paymentId) || null
}

export async function findPaymentByChargeId(chargeId) {
  const store = await ensureStore()
  return store.payments.find((payment) => payment.providerChargeId === chargeId) || null
}

export async function updatePayment(paymentId, patch) {
  const store = await ensureStore()
  const index = store.payments.findIndex((payment) => payment.id === paymentId)
  if (index === -1) return null
  store.payments[index] = {
    ...store.payments[index],
    ...patch,
    updatedAt: Date.now(),
  }
  await saveStore(store)
  return store.payments[index]
}

export async function ensureReceiptNo(paymentId, issuedAt = Date.now()) {
  const store = await ensureStore()
  const index = store.payments.findIndex((payment) => payment.id === paymentId)
  if (index === -1) return null

  const payment = store.payments[index]
  if (payment.receiptNo) return payment

  const receiptIssuedAt = payment.paidAt || issuedAt || Date.now()
  const period = getBangkokReceiptPeriod(receiptIssuedAt)
  const receiptNo = getNextReceiptNo(store.payments, period)

  store.payments[index] = {
    ...payment,
    receiptNo,
    receiptIssuedAt,
    updatedAt: Date.now(),
  }

  await saveStore(store)
  return store.payments[index]
}
