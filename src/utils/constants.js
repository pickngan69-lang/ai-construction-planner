export const IMAGE_TAGS = [
  'แปลนพื้น',
  'รูปด้านหน้า',
  'รูปด้านข้าง',
  'ภาพ 3D/Perspective',
  'ภาพบันดาลใจ',
  'อื่นๆ',
]

export const HOUSE_STYLES = [
  'โมเดิร์น',
  'มินิมอล',
  'ลอฟท์',
  'ไทยประยุกต์',
  'คอนเทมโพรารี',
  'ทรอปิคอล',
  'สแกนดิเนเวียน',
  'อื่นๆ',
]

export const PROVINCES = [
  'กรุงเทพฯ',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'ชลบุรี',
  'เชียงใหม่',
  'ขอนแก่น',
  'นครราชสีมา',
  'ภูเก็ต',
  'สุราษฎร์ธานี',
  'อื่นๆ',
]

export const MATERIAL_GRADES = [
  {
    id: 'economy',
    label: 'ประหยัด',
    icon: '🏠',
    desc: 'วัสดุทั่วไป ช่างรายวัน',
    multiplier: 0.75,
  },
  {
    id: 'standard',
    label: 'มาตรฐาน',
    icon: '🏡',
    desc: 'วัสดุเกรดกลาง ผู้รับเหมา',
    multiplier: 1.0,
  },
  {
    id: 'premium',
    label: 'พรีเมียม',
    icon: '🏰',
    desc: 'วัสดุชั้นดี ผู้รับเหมาชั้นนำ',
    multiplier: 1.45,
  },
]

// สีประจำเฟส (อ้างอิงจาก index.css --color-phase-*)
export const PHASE_COLORS = [
  '#e07a2f', // 1: เตรียมงาน
  '#2a9d8f', // 2: โครงสร้าง
  '#264653', // 3: สถาปัตย์
  '#457b9d', // 4: ระบบ
  '#8338ec', // 5: ตกแต่ง
]

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'
// Bumped from 8k to 16k to fit BOQ + 3-tier material list (~15-20 items each)
export const ANTHROPIC_MAX_TOKENS = 16000

// Default per-task duration when scheduling is fully manual (V3)
export const DEFAULT_TASK_DURATION_DAYS = 7

export const STEPS = {
  INPUT: 'input',
  ANALYZING: 'analyzing',
  RESULT: 'result',
}

export const ROLES = {
  CONTRACTOR: 'contractor',
  HOMEOWNER: 'homeowner',
}

// Demo-only auth — replace with real backend before production.
export const DEMO_CONTRACTOR_PASSWORD = 'admin'

