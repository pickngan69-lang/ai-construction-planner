// House-plan catalog (local data source) — REAL data.
//
// The 9 mock/Unsplash plans were removed. Add real house designs here, one
// object per design. Images live in /public/plans/ and are referenced as
// `/plans/<file>.png` (encode spaces as %20 so they serve in dev and prod).
//
// Rules of thumb per design:
//   imageUrl      : cover (a perspective/exterior render)
//   gallery       : all exterior renders + drawing sheets (รูปด้าน/รูปตัด/แบบขยาย)
//   floorPlans[]  : one entry per floor; `imageUrl` is the actual แปลนพื้น drawing
//
// Derived fields (priceByGrade, buildTimeMonths, default floor plan) are filled
// by `enrichPlan` so the raw data stays lean.

// Standard turnkey `budget` is the reference (standard-grade) price. The 3-grade
// range mirrors the material-grade system used elsewhere in the app.
function priceByGrade(budget) {
  const round = (n) => Math.round(n / 10000) * 10000
  return {
    economy: round(budget * 0.85),
    standard: budget,
    premium: round(budget * 1.28),
  }
}

// Rough construction time: ~1 month per 28 sqm, minimum 4 months.
function buildTimeMonths(area) {
  return Math.max(4, Math.round(area / 28))
}

// Default single-floor room breakdown derived from bed/bath counts (used only
// when a plan doesn't provide its own floorPlans).
function singleFloorPlan(area, beds, baths) {
  const rooms = ['ห้องนั่งเล่น', 'ครัว', 'ห้องรับประทานอาหาร']
  for (let i = 1; i <= beds; i++) rooms.push(`ห้องนอน ${i}`)
  for (let i = 1; i <= baths; i++) rooms.push(`ห้องน้ำ ${i}`)
  rooms.push('ที่จอดรถ')
  return [{ floor: 1, area, rooms }]
}

const RAW_PLANS = [
  {
    id: 'HP-01',
    title: 'บ้านไทยพอเพียง 1 (บ้านชั้นเดียว)',
    style: 'บ้านไม้ยกพื้น',
    // ชุดแบบจริง "บ้านไทยพอเพียง 1" (แบบบ้านสานฝันฯ) — ไฟล์ใน /public/plans/
    // ชื่อไฟล์มีช่องว่าง จึง encode เป็น %20 ให้เสิร์ฟได้ทั้ง dev/prod
    imageUrl: '/plans/house%20(2).png',
    gallery: [
      '/plans/house%20(2).png', // ทัศนียภาพ หน้า-ขวา
      '/plans/house%20(3).png', // ทัศนียภาพ หน้า-ซ้าย
      '/plans/house%20(4).png', // ทัศนียภาพ ด้านข้าง
      '/plans/house%20(5).png', // ทัศนียภาพ หน้าตรง + ระเบียง
      '/plans/house%20(6).png', // ภาพมุมสูง (หลังคา)
      '/plans/house%20(9).png', // รูปด้าน 1-2
      '/plans/house%20(8).png', // รูปด้าน 3-4
      '/plans/house%20(10).png', // รูปตัด A-A
      '/plans/house%20(11).png', // รูปตัด B-B
      '/plans/house%20(1).png', // แบบขยายประตู-หน้าต่าง
    ],
    budget: 550000, // ⚠️ ประมาณการ — โปรดยืนยันงบก่อสร้างจริงจากเอกสาร
    area: 48, //        ⚠️ ประมาณจากแปลน — โปรดยืนยันพื้นที่ใช้สอยจริง
    floors: 1,
    beds: 1,
    baths: 1,
    description:
      'บ้านไม้ชั้นเดียวยกพื้นสไตล์ไทยพอเพียง โครงสร้างเรียบง่าย งบประหยัด เหมาะเป็นบ้านหลังแรกหรือบ้านสวน — จากชุดแบบบ้านสานฝันฯ',
    highlights: [
      'ยกพื้นสูง 1.50 ม. กันน้ำท่วม-ระบายอากาศใต้ถุน',
      'หลังคาจั่วชัน ~35° ระบายความร้อนดี',
      'ชานระเบียงหน้าบ้านนั่งเล่นรับลม',
      'ผังเรียบง่าย 1 ห้องนอน ก่อสร้างเร็ว',
    ],
    specs: {
      parking: 0,
      ceilingHeight: 'พื้น +1.50 / หลังเส้า +4.50 / จั่ว +5.935 ม.',
      direction: '-',
      landSize: 'แนะนำ ≥ 30 ตร.ว.',
    },
    floorPlans: [
      {
        floor: 1,
        area: 48,
        rooms: ['ห้องนอน', 'ห้องน้ำ', 'ส่วนเตรียมอาหาร', 'ชานระเบียง'],
        imageUrl: '/plans/house%20(7).png', // แปลนพื้น (floor plan)
      },
    ],
  },
]

function enrichPlan(p) {
  return {
    ...p,
    // A plan may supply an explicit `gallery`; otherwise fall back to the cover.
    gallery: p.gallery || [p.imageUrl],
    priceByGrade: priceByGrade(p.budget),
    buildTimeMonths: buildTimeMonths(p.area),
    floorPlans: p.floorPlans || singleFloorPlan(p.area, p.beds, p.baths),
  }
}

export const HOUSE_PLANS = RAW_PLANS.map(enrichPlan)

export function getHousePlan(id) {
  return HOUSE_PLANS.find((p) => p.id === id) || null
}
