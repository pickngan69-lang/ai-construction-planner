import { getUserByToken } from './auth/store.js'

// ดึง user จาก Bearer token (คืน null ถ้าไม่ได้ล็อกอิน/token ไม่ถูกต้อง)
export async function getReqUser(req) {
  const header = req.get('authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? await getUserByToken(match[1]) : null
}
