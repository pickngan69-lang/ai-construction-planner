import express from 'express'
import { getReqUser } from '../reqUser.js'
import { dbEnabled, q } from '../db.js'

const router = express.Router()

// โปรเจกต์ทั้งหมดของผู้ใช้ที่ล็อกอิน (data เก็บทั้งก้อนเป็น JSONB)
router.get('/', async (req, res) => {
  const user = await getReqUser(req)
  if (!user) return res.status(401).json({ error: { message: 'ยังไม่ได้เข้าสู่ระบบ' } })
  if (!dbEnabled) return res.json({ projects: null }) // frontend ใช้ localStorage
  try {
    const r = await q(
      'select data from app_projects where user_id = $1 order by created_at desc',
      [user.id],
    )
    res.json({ projects: r.rows.map((x) => x.data) })
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'load failed' } })
  }
})

// สร้าง/อัปเดต โปรเจกต์หนึ่ง (upsert ด้วย id)
router.put('/:id', async (req, res) => {
  const user = await getReqUser(req)
  if (!user) return res.status(401).json({ error: { message: 'ยังไม่ได้เข้าสู่ระบบ' } })
  if (!dbEnabled) return res.json({ ok: true })
  const data = req.body || {}
  const now = Date.now()
  try {
    await q(
      `insert into app_projects (id, user_id, data, created_at, updated_at)
       values ($1, $2, $3, $4, $4)
       on conflict (id) do update set data = $3, updated_at = $4
         where app_projects.user_id = $2`,
      [req.params.id, user.id, data, now],
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'save failed' } })
  }
})

router.delete('/:id', async (req, res) => {
  const user = await getReqUser(req)
  if (!user) return res.status(401).json({ error: { message: 'ยังไม่ได้เข้าสู่ระบบ' } })
  if (!dbEnabled) return res.json({ ok: true })
  try {
    await q('delete from app_projects where id = $1 and user_id = $2', [
      req.params.id,
      user.id,
    ])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'delete failed' } })
  }
})

export default router
