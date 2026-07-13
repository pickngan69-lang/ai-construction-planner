import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { dbEnabled, q } from '../db.js'

const scrypt = promisify(scryptCallback)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../.data')
const DATA_FILE = path.join(DATA_DIR, 'auth.json')
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

// ---------------- shared helpers ----------------
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

// DB row (snake_case) → public user (camelCase)
function rowToPublicUser(r) {
  if (!r) return null
  return publicUser({
    id: r.id,
    name: r.name,
    email: r.email,
    companyName: r.company_name,
    planCode: r.plan_code,
    status: r.status,
    aiCredits: r.ai_credits,
    projectsUsed: r.projects_used,
    trialEndsAt: r.trial_ends_at != null ? Number(r.trial_ends_at) : null,
    subscriptionEndsAt:
      r.subscription_ends_at != null ? Number(r.subscription_ends_at) : null,
    lastPaymentAt: r.last_payment_at != null ? Number(r.last_payment_at) : null,
    createdAt: r.created_at != null ? Number(r.created_at) : null,
  })
}

function validateRegistration({ name, email, password }) {
  const cleanName = String(name || '').trim()
  const cleanEmail = normalizeEmail(email)
  if (!cleanName) return { ok: false, status: 400, message: 'กรุณากรอกชื่อผู้ใช้งาน' }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return { ok: false, status: 400, message: 'กรุณากรอกอีเมลให้ถูกต้อง' }
  }
  if (String(password || '').length < 8) {
    return { ok: false, status: 400, message: 'รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร' }
  }
  return { ok: true, cleanName, cleanEmail }
}

// ---------------- file store (fallback when no DB) ----------------
async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'))
  } catch {
    return { users: [], sessions: [] }
  }
}

async function saveStore(store) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8')
}

function fileCreateSession(store, userId) {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  store.sessions = (store.sessions || []).filter(
    (s) => s.expiresAt > now && s.userId !== userId,
  )
  store.sessions.push({ token, userId, createdAt: now, expiresAt: now + SESSION_TTL_MS })
  return token
}

// ---------------- DB store ----------------
async function dbCreateSession(userId) {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  await q('delete from app_sessions where user_id = $1', [userId]) // one active session per user
  await q(
    'insert into app_sessions (token, user_id, created_at, expires_at) values ($1,$2,$3,$4)',
    [token, userId, now, now + SESSION_TTL_MS],
  )
  return token
}

// ---------------- public API ----------------
export async function registerUser({ name, email, companyName, password }) {
  const v = validateRegistration({ name, email, password })
  if (!v.ok) return v
  const cleanCompany = String(companyName || '').trim()
  const now = Date.now()

  if (dbEnabled) {
    const dup = await q('select 1 from app_users where email = $1', [v.cleanEmail])
    if (dup.rowCount) {
      return { ok: false, status: 409, message: 'อีเมลนี้ถูกสมัครสมาชิกแล้ว' }
    }
    const id = `usr_${now}_${randomBytes(4).toString('hex')}`
    const passwordHash = await hashPassword(password)
    await q(
      `insert into app_users
        (id, name, email, company_name, password_hash, plan_code, status,
         ai_credits, projects_used, trial_ends_at, created_at, updated_at)
       values ($1,$2,$3,$4,$5,'trial','trialing',3,0,$6,$7,$7)`,
      [id, v.cleanName, v.cleanEmail, cleanCompany, passwordHash, now + 7 * 864e5, now],
    )
    const token = await dbCreateSession(id)
    const r = await q('select * from app_users where id = $1', [id])
    return { ok: true, user: rowToPublicUser(r.rows[0]), token }
  }

  const store = await ensureStore()
  if (store.users.some((u) => u.email === v.cleanEmail)) {
    return { ok: false, status: 409, message: 'อีเมลนี้ถูกสมัครสมาชิกแล้ว' }
  }
  const user = {
    id: `usr_${now}_${randomBytes(4).toString('hex')}`,
    name: v.cleanName,
    email: v.cleanEmail,
    companyName: cleanCompany,
    passwordHash: await hashPassword(password),
    planCode: 'trial',
    status: 'trialing',
    aiCredits: 3,
    projectsUsed: 0,
    trialEndsAt: now + 7 * 864e5,
    createdAt: now,
    updatedAt: now,
  }
  store.users.push(user)
  const token = fileCreateSession(store, user.id)
  await saveStore(store)
  return { ok: true, user: publicUser(user), token }
}

export async function loginUser({ email, password }) {
  const cleanEmail = normalizeEmail(email)

  if (dbEnabled) {
    const r = await q('select * from app_users where email = $1', [cleanEmail])
    const u = r.rows[0]
    if (!u || !(await verifyPassword(password, u.password_hash))) {
      return { ok: false, status: 401, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
    }
    const token = await dbCreateSession(u.id)
    return { ok: true, user: rowToPublicUser(u), token }
  }

  const store = await ensureStore()
  const user = store.users.find((u) => u.email === cleanEmail)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, status: 401, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }
  const token = fileCreateSession(store, user.id)
  await saveStore(store)
  return { ok: true, user: publicUser(user), token }
}

export async function getUserByToken(token) {
  if (!token) return null

  if (dbEnabled) {
    const r = await q(
      `select u.* from app_sessions s
         join app_users u on u.id = s.user_id
        where s.token = $1 and s.expires_at > $2`,
      [token, Date.now()],
    )
    return rowToPublicUser(r.rows[0])
  }

  const now = Date.now()
  const store = await ensureStore()
  const session = (store.sessions || []).find(
    (s) => s.token === token && s.expiresAt > now,
  )
  if (!session) return null
  const user = store.users.find((u) => u.id === session.userId)
  return user ? publicUser(user) : null
}

export async function applyBillingPlanToUser(userId, plan, payment = {}) {
  const now = Date.now()

  if (dbEnabled) {
    const r = await q('select * from app_users where id = $1', [userId])
    const u = r.rows[0]
    if (!u) return null
    const currentCredits = Number(u.ai_credits) || 0
    let planCode
    let status
    let aiCredits
    let subEnds = u.subscription_ends_at
    if (plan.billingType === 'one_time') {
      planCode = String(u.plan_code || '').startsWith('pro_') ? u.plan_code : plan.code
      status = u.status || 'active'
      aiCredits = currentCredits + (Number(plan.aiCredits) || 0)
    } else {
      planCode = plan.code
      status = 'active'
      aiCredits = Number(plan.aiCredits) || currentCredits
      if (plan.interval === 'month') subEnds = now + 30 * 864e5
      if (plan.interval === 'year') subEnds = now + 365 * 864e5
    }
    await q(
      `update app_users set plan_code=$1, status=$2, ai_credits=$3,
              subscription_ends_at=$4, last_payment_at=$5, last_payment_id=$6, updated_at=$7
        where id=$8`,
      [planCode, status, aiCredits, subEnds, now, payment.id || null, now, userId],
    )
    const r2 = await q('select * from app_users where id = $1', [userId])
    return rowToPublicUser(r2.rows[0])
  }

  const store = await ensureStore()
  const user = store.users.find((u) => u.id === userId)
  if (!user) return null
  const currentCredits = Number(user.aiCredits) || 0
  if (plan.billingType === 'one_time') {
    user.planCode = user.planCode?.startsWith('pro_') ? user.planCode : plan.code
    user.status = user.status || 'active'
    user.aiCredits = currentCredits + (Number(plan.aiCredits) || 0)
  } else {
    user.planCode = plan.code
    user.status = 'active'
    user.aiCredits = Number(plan.aiCredits) || currentCredits
    if (plan.interval === 'month') user.subscriptionEndsAt = now + 30 * 864e5
    if (plan.interval === 'year') user.subscriptionEndsAt = now + 365 * 864e5
  }
  user.lastPaymentAt = now
  user.lastPaymentId = payment.id || null
  user.updatedAt = now
  await saveStore(store)
  return publicUser(user)
}

export async function logoutToken(token) {
  if (!token) return
  if (dbEnabled) {
    await q('delete from app_sessions where token = $1', [token])
    return
  }
  const store = await ensureStore()
  store.sessions = (store.sessions || []).filter((s) => s.token !== token)
  await saveStore(store)
}

// Seed a default admin on server start (idempotent). File store is ephemeral on
// Render, so this recreates the account every boot from env vars — but with a DB
// it persists, and this just ensures the account exists once.
export async function ensureDefaultUser() {
  const email = normalizeEmail(
    process.env.DEFAULT_ADMIN_EMAIL || 'nhanswat869@gmail.com',
  )
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'test1234'
  if (!email || password.length < 8) return { created: false, email }
  const now = Date.now()

  if (dbEnabled) {
    const dup = await q('select 1 from app_users where email = $1', [email])
    if (dup.rowCount) return { created: false, email }
    const id = `usr_${now}_${randomBytes(4).toString('hex')}`
    const passwordHash = await hashPassword(password)
    await q(
      `insert into app_users
        (id, name, email, company_name, password_hash, plan_code, status,
         ai_credits, projects_used, subscription_ends_at, created_at, updated_at)
       values ($1,'ผู้ดูแลระบบ',$2,'',$3,'pro_yearly','active',9999,0,$4,$5,$5)`,
      [id, email, passwordHash, now + 365 * 864e5, now],
    )
    return { created: true, email }
  }

  const store = await ensureStore()
  if (store.users.some((u) => u.email === email)) return { created: false, email }
  store.users.push({
    id: `usr_${now}_${randomBytes(4).toString('hex')}`,
    name: 'ผู้ดูแลระบบ',
    email,
    companyName: '',
    passwordHash: await hashPassword(password),
    planCode: 'pro_yearly',
    status: 'active',
    aiCredits: 9999,
    projectsUsed: 0,
    subscriptionEndsAt: now + 365 * 864e5,
    createdAt: now,
    updatedAt: now,
  })
  await saveStore(store)
  return { created: true, email }
}
