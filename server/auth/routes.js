import express from 'express'
import { getUserByToken, loginUser, logoutToken, registerUser } from './store.js'

const router = express.Router()

function getBearerToken(req) {
  const header = req.get('authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}

router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body || {})
    if (!result.ok) {
      return res.status(result.status || 400).json({
        error: { code: 'register_failed', message: result.message },
      })
    }
    return res.status(201).json({ user: result.user, token: result.token })
  } catch (err) {
    return res.status(500).json({
      error: { code: 'register_failed', message: err?.message || 'Register failed' },
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const result = await loginUser(req.body || {})
    if (!result.ok) {
      return res.status(result.status || 401).json({
        error: { code: 'login_failed', message: result.message },
      })
    }
    return res.json({ user: result.user, token: result.token })
  } catch (err) {
    return res.status(500).json({
      error: { code: 'login_failed', message: err?.message || 'Login failed' },
    })
  }
})

router.post('/logout', async (req, res) => {
  await logoutToken(getBearerToken(req))
  res.status(204).send()
})

router.get('/me', async (req, res) => {
  const user = await getUserByToken(getBearerToken(req))
  if (!user) {
    return res.status(401).json({
      error: { code: 'not_authenticated', message: 'ยังไม่ได้เข้าสู่ระบบสมาชิก' },
    })
  }
  return res.json({ user })
})

export default router