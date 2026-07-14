import express from 'express'
import { getReqUser } from '../reqUser.js'
import { dbEnabled, q } from '../db.js'

const router = express.Router()

function toClient(r) {
  if (!r) return null
  return {
    name: r.name || '',
    logo: r.logo || '',
    taxId: r.tax_id || '',
    registrationNo: r.registration_no || '',
    address: r.address || '',
    phone: r.phone || '',
    email: r.email || '',
    website: r.website || '',
  }
}

// ข้อมูลบริษัทของผู้ใช้ที่ล็อกอิน
router.get('/', async (req, res) => {
  const user = await getReqUser(req)
  if (!user) return res.status(401).json({ error: { message: 'ยังไม่ได้เข้าสู่ระบบ' } })
  if (!dbEnabled) return res.json({ profile: null }) // ไม่มี DB → frontend ใช้ localStorage
  try {
    const r = await q('select * from app_company_profiles where user_id = $1', [user.id])
    res.json({ profile: toClient(r.rows[0]) })
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'load failed' } })
  }
})

router.put('/', async (req, res) => {
  const user = await getReqUser(req)
  if (!user) return res.status(401).json({ error: { message: 'ยังไม่ได้เข้าสู่ระบบ' } })
  if (!dbEnabled) return res.json({ ok: true }) // ไม่มี DB → frontend เก็บ localStorage เอง
  const b = req.body || {}
  try {
    await q(
      `insert into app_company_profiles
         (user_id, name, logo, tax_id, registration_no, address, phone, email, website, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (user_id) do update set
         name=$2, logo=$3, tax_id=$4, registration_no=$5, address=$6,
         phone=$7, email=$8, website=$9, updated_at=$10`,
      [
        user.id,
        b.name || '',
        b.logo || '',
        b.taxId || '',
        b.registrationNo || '',
        b.address || '',
        b.phone || '',
        b.email || '',
        b.website || '',
        Date.now(),
      ],
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'save failed' } })
  }
})

export default router
