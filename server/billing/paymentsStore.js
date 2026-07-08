import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../.data')
const DATA_FILE = path.join(DATA_DIR, 'payments.json')

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