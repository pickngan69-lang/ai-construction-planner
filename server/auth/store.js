import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(scryptCallback)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../.data')
const DATA_FILE = path.join(DATA_DIR, 'auth.json')
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { users: [], sessions: [] }
  }
}

async function saveStore(store) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8')
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password, passwordHash) {
  const [salt, key] = String(passwordHash || '').split(':')
  if (!salt || !key) return false
  const derivedKey = await scrypt(password, salt, 64)
  const storedKey = Buffer.from(key, 'hex')
  if (storedKey.length !== derivedKey.length) return false
  return timingSafeEqual(storedKey, derivedKey)
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    companyName: user.companyName || '',
    planCode: user.planCode || 'trial',
    status: user.status || 'trialing',
    aiCredits: Number(user.aiCredits) || 0,
    projectsUsed: Number(user.projectsUsed) || 0,
    trialEndsAt: user.trialEndsAt || null,
    subscriptionEndsAt: user.subscriptionEndsAt || null,
    lastPaymentAt: user.lastPaymentAt || null,
    createdAt: user.createdAt,
  }
}

function createSession(store, userId) {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  store.sessions = (store.sessions || []).filter((session) => {
    return session.expiresAt > now && session.userId !== userId
  })
  store.sessions.push({
    token,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  })
  return token
}

export async function registerUser({ name, email, companyName, password }) {
  const cleanEmail = normalizeEmail(email)
  const cleanName = String(name || '').trim()
  const cleanCompany = String(companyName || '').trim()

  if (!cleanName) {
    return { ok: false, status: 400, message: 'กรุณากรอกชื่อผู้ใช้งาน' }
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return { ok: false, status: 400, message: 'กรุณากรอกอีเมลให้ถูกต้อง' }
  }
  if (String(password || '').length < 8) {
    return {
      ok: false,
      status: 400,
      message: 'รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร',
    }
  }

  const store = await ensureStore()
  const exists = store.users.some((user) => user.email === cleanEmail)
  if (exists) {
    return { ok: false, status: 409, message: 'อีเมลนี้ถูกสมัครสมาชิกแล้ว' }
  }

  const now = Date.now()
  const user = {
    id: `usr_${now}_${randomBytes(4).toString('hex')}`,
    name: cleanName,
    email: cleanEmail,
    companyName: cleanCompany,
    passwordHash: await hashPassword(password),
    planCode: 'trial',
    status: 'trialing',
    aiCredits: 3,
    projectsUsed: 0,
    trialEndsAt: now + 7 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
  }

  store.users.push(user)
  const token = createSession(store, user.id)
  await saveStore(store)
  return { ok: true, user: publicUser(user), token }
}

export async function loginUser({ email, password }) {
  const cleanEmail = normalizeEmail(email)
  const store = await ensureStore()
  const user = store.users.find((item) => item.email === cleanEmail)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, status: 401, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  const token = createSession(store, user.id)
  await saveStore(store)
  return { ok: true, user: publicUser(user), token }
}

export async function getUserByToken(token) {
  if (!token) return null
  const now = Date.now()
  const store = await ensureStore()
  const session = (store.sessions || []).find(
    (item) => item.token === token && item.expiresAt > now,
  )
  if (!session) return null
  const user = store.users.find((item) => item.id === session.userId)
  return user ? publicUser(user) : null
}

export async function applyBillingPlanToUser(userId, plan, payment = {}) {
  const store = await ensureStore()
  const user = store.users.find((item) => item.id === userId)
  if (!user) return null

  const now = Date.now()
  const currentCredits = Number(user.aiCredits) || 0

  if (plan.billingType === 'one_time') {
    user.planCode = user.planCode?.startsWith('pro_') ? user.planCode : plan.code
    user.status = user.status || 'active'
    user.aiCredits = currentCredits + (Number(plan.aiCredits) || 0)
  } else {
    user.planCode = plan.code
    user.status = 'active'
    user.aiCredits = Number(plan.aiCredits) || currentCredits
    if (plan.interval === 'month') {
      user.subscriptionEndsAt = now + 30 * 24 * 60 * 60 * 1000
    }
    if (plan.interval === 'year') {
      user.subscriptionEndsAt = now + 365 * 24 * 60 * 60 * 1000
    }
  }

  user.lastPaymentAt = now
  user.lastPaymentId = payment.id || null
  user.updatedAt = now
  await saveStore(store)
  return publicUser(user)
}
export async function logoutToken(token) {
  if (!token) return
  const store = await ensureStore()
  store.sessions = (store.sessions || []).filter((item) => item.token !== token)
  await saveStore(store)
}

// Seed a default admin account on server start. The file store is ephemeral on
// Render (wiped every deploy), so we recreate this account on every boot from
// env vars — set DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD in the Render
// dashboard so the login persists with YOUR chosen credentials across deploys.
export async function ensureDefaultUser() {
  const email = normalizeEmail(
    process.env.DEFAULT_ADMIN_EMAIL || 'nhanswat869@gmail.com',
  )
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin1234!'
  if (!email || password.length < 8) return { created: false, email }

  const store = await ensureStore()
  if (store.users.some((item) => item.email === email)) {
    return { created: false, email }
  }

  const now = Date.now()
  store.users.push({
    id: `usr_${now}_${randomBytes(4).toString('hex')}`,
    name: 'ผู้ดูแลระบบ',
    email,
    companyName: '',
    passwordHash: await hashPassword(password),
    planCode: 'pro_yearly', // ให้แอดมินใช้งานได้เต็ม ไม่ติดลิมิตทดลอง
    status: 'active',
    aiCredits: 9999,
    projectsUsed: 0,
    subscriptionEndsAt: now + 365 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
  })
  await saveStore(store)
  return { created: true, email }
}
