// Express backend proxy — keeps the Anthropic API key server-side so it never
// reaches the browser. Uses ANTHROPIC_API_KEY (NOT VITE_ANTHROPIC_API_KEY) and
// also serves the built frontend from ./dist.
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { Readable } from 'node:stream'
import authRouter from './server/auth/routes.js'
import billingRouter from './server/billing/routes.js'
import erpRouter from './server/erp/routes.js'
import { ensureDefaultUser } from './server/auth/store.js'
import { pingDb } from './server/db.js'

dotenv.config()
const localEnv = dotenv.config({ path: '.env.local' })
if (localEnv.parsed) {
  Object.entries(localEnv.parsed).forEach(([key, value]) => {
    if (value) process.env[key] = value
  })
}
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const distPath = path.join(__dirname, 'dist')

app.use(cors())
app.use(express.json({ limit: '50mb' })) // base64 images can be several MB

app.use('/api/auth', authRouter)
app.use('/api/billing', billingRouter)
app.use('/api/erp', erpRouter)

// ---- API proxy: forward the request body to Anthropic with the secret key ----
app.post('/api/analyze', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_API_KEY is not configured on the server' },
    })
  }
  const t0 = Date.now()
  const streaming = req.body?.stream === true
  const bodyStr = JSON.stringify(req.body)
  console.log(
    `[analyze] ➡️  ${(Buffer.byteLength(bodyStr) / 1024 / 1024).toFixed(2)} MB${streaming ? ' (stream)' : ''}`,
  )
  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: bodyStr,
    })

    // Streaming success → pipe the SSE straight through. Bytes flow continuously,
    // so proxies/platforms don't cut the connection during a long PDF analysis.
    if (streaming && upstream.ok && upstream.body) {
      res.status(upstream.status)
      res.setHeader(
        'Content-Type',
        upstream.headers.get('content-type') || 'text/event-stream',
      )
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no') // don't let a proxy buffer the stream
      if (typeof res.flushHeaders === 'function') res.flushHeaders()
      res.on('close', () =>
        console.log(
          `[analyze] ⬅️  stream closed in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
        ),
      )
      Readable.fromWeb(upstream.body).pipe(res)
      return
    }

    // non-streaming, or an upstream error (Anthropic returns JSON even for
    // stream:true errors) → forward the JSON body as before
    const data = await upstream.json()
    console.log(
      `[analyze] ⬅️  upstream ${upstream.status} in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
    )
    res.status(upstream.status).json(data)
  } catch (err) {
    console.error(
      `[analyze] ❌ failed after ${((Date.now() - t0) / 1000).toFixed(1)}s: ${err?.message}`,
    )
    if (!res.headersSent) {
      res.status(502).json({
        error: { message: err?.message || 'Upstream request failed' },
      })
    }
  }
})

// ---- Serve the built frontend ----
app.use(express.static(distPath))

// SPA fallback: any other GET returns index.html.
// (Express 5 rejects the bare '*' string route — use a regex wildcard instead.)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  await pingDb() // log whether we're on Postgres or the file fallback
  // Seed/ensure the default admin exists (persists in DB; recreated each boot on file store).
  ensureDefaultUser()
    .then((r) => {
      if (r.created) console.log(`[auth] ✅ seeded default admin: ${r.email}`)
      else console.log(`[auth] default admin already present: ${r.email}`)
    })
    .catch((err) => console.error('[auth] default-admin seed failed:', err?.message))
})
