// Express backend proxy — keeps the Anthropic API key server-side so it never
// reaches the browser. Uses ANTHROPIC_API_KEY (NOT VITE_ANTHROPIC_API_KEY) and
// also serves the built frontend from ./dist.
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const distPath = path.join(__dirname, 'dist')

app.use(cors())
app.use(express.json({ limit: '50mb' })) // base64 images can be several MB

// ---- API proxy: forward the request body to Anthropic with the secret key ----
app.post('/api/analyze', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_API_KEY is not configured on the server' },
    })
  }
  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })
    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (err) {
    res.status(502).json({
      error: { message: err?.message || 'Upstream request failed' },
    })
  }
})

// ---- Serve the built frontend ----
app.use(express.static(distPath))

// SPA fallback: any other GET returns index.html.
// (Express 5 rejects the bare '*' string route — use a regex wildcard instead.)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
