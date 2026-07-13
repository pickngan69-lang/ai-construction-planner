// Postgres (Supabase) connection. When DATABASE_URL is set, the app persists to
// Postgres; otherwise stores fall back to the local file/JSON store so the app
// keeps working (dev without a DB, or before Supabase is configured).
import pg from 'pg'

const url = process.env.DATABASE_URL
export const dbEnabled = Boolean(url)

const isLocal = url ? /localhost|127\.0\.0\.1/.test(url) : false

export const pool = dbEnabled
  ? new pg.Pool({
      connectionString: url,
      // Supabase (and most managed Postgres) require SSL; skip only for local.
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    })
  : null

// query helper — throws if DB isn't enabled (callers should guard with dbEnabled)
export async function q(text, params) {
  if (!pool) throw new Error('DATABASE_URL is not configured')
  return pool.query(text, params)
}

// เช็ก connection ตอน start (log ให้เห็นว่าใช้ DB หรือ file)
export async function pingDb() {
  if (!dbEnabled) {
    console.log('[db] DATABASE_URL not set → using local file store')
    return false
  }
  try {
    await q('select 1')
    console.log('[db] ✅ connected to Postgres (Supabase)')
    return true
  } catch (err) {
    console.error(`[db] ⚠️ connect failed → falling back to file store: ${err?.message}`)
    return false
  }
}
