// โหลด env ให้เสร็จ "ก่อน" โมดูลอื่นถูก import — เพราะบางโมดูล (เช่น server/db.js)
// อ่าน process.env ตอน import (ES module imports ทำงานก่อน body ของ server.js)
// ต้อง import ไฟล์นี้เป็นตัวแรกใน server.js  ·  .env.local ทับ .env
import dotenv from 'dotenv'

dotenv.config()
const local = dotenv.config({ path: '.env.local' })
if (local.parsed) {
  for (const [key, value] of Object.entries(local.parsed)) {
    if (value) process.env[key] = value
  }
}
