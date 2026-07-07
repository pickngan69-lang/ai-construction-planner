// Shared mock project data for the Mini ERP pages
// (MultiProjectDashboard, ProjectDetail, CustomerSummary).
// The real ERP backend (erp-backend/) will replace this later.

export const PROJECT_STATUSES = [
  { key: 'estimating', label: 'กำลังประเมินราคา', icon: '📝', color: '#e07a2f' },
  { key: 'building', label: 'ระหว่างก่อสร้าง', icon: '🔨', color: '#457b9d' },
  { key: 'delivered', label: 'ส่งมอบแล้ว', icon: '✅', color: '#2a9d8f' },
]
export const STATUS_META = Object.fromEntries(
  PROJECT_STATUSES.map((s) => [s.key, s]),
)

// installments[].status: 'paid' (ชำระแล้ว) | 'due' (ครบกำหนด/รอชำระ) | 'upcoming' (ยังไม่ถึง)
export const MOCK_PROJECTS = [
  {
    id: 'P-001',
    name: 'บ้านคุณสมชาย',
    client: 'สมชาย ใจดี',
    status: 'estimating',
    area: 180, floors: 2, style: 'โมเดิร์น', beds: 3, baths: 2,
    boqBudget: 2500000, actualCost: 0, progress: 0,
    installmentPaid: 0, installmentTotal: 2500000,
    installments: [
      { no: 1, label: 'เงินมัดจำ ณ วันทำสัญญา', percent: 20, status: 'upcoming', date: null },
      { no: 2, label: 'งานโครงสร้าง + หลังคา', percent: 30, status: 'upcoming', date: null },
      { no: 3, label: 'งานสถาปัตย์ + ระบบ', percent: 40, status: 'upcoming', date: null },
      { no: 4, label: 'ตรวจรับ + ส่งมอบงาน', percent: 10, status: 'upcoming', date: null },
    ],
  },
  {
    id: 'P-002',
    name: 'บ้านคุณวิภา',
    client: 'วิภา รักบ้าน',
    status: 'building',
    area: 220, floors: 2, style: 'ทรอปิคอล', beds: 4, baths: 3,
    boqBudget: 3800000, actualCost: 2100000, progress: 55,
    installmentPaid: 1900000, installmentTotal: 3800000,
    installments: [
      { no: 1, label: 'เงินมัดจำ ณ วันทำสัญญา', percent: 20, status: 'paid', date: '2026-03-15' },
      { no: 2, label: 'งานโครงสร้าง + หลังคา', percent: 30, status: 'paid', date: '2026-05-02' },
      { no: 3, label: 'งานสถาปัตย์ + ระบบ', percent: 40, status: 'due', date: null },
      { no: 4, label: 'ตรวจรับ + ส่งมอบงาน', percent: 10, status: 'upcoming', date: null },
    ],
  },
  {
    id: 'P-003',
    name: 'ทาวน์โฮมคุณเอก',
    client: 'เอกชัย พงษ์ไพศาล',
    status: 'building',
    area: 150, floors: 2, style: 'คอนเทมโพรารี', beds: 3, baths: 2,
    boqBudget: 1800000, actualCost: 1250000, progress: 60,
    installmentPaid: 1080000, installmentTotal: 1800000,
    installments: [
      { no: 1, label: 'เงินมัดจำ ณ วันทำสัญญา', percent: 20, status: 'paid', date: '2026-04-01' },
      { no: 2, label: 'งานโครงสร้าง + หลังคา', percent: 40, status: 'paid', date: '2026-06-10' },
      { no: 3, label: 'งานสถาปัตย์ + ระบบ', percent: 30, status: 'due', date: null },
      { no: 4, label: 'ตรวจรับ + ส่งมอบงาน', percent: 10, status: 'upcoming', date: null },
    ],
  },
  {
    id: 'P-004',
    name: 'วิลล่าคุณนภา',
    client: 'นภา ทองดี',
    status: 'delivered',
    area: 320, floors: 2, style: 'Luxury', beds: 4, baths: 4,
    boqBudget: 5500000, actualCost: 5150000, progress: 100,
    installmentPaid: 5500000, installmentTotal: 5500000,
    installments: [
      { no: 1, label: 'เงินมัดจำ ณ วันทำสัญญา', percent: 20, status: 'paid', date: '2025-09-05' },
      { no: 2, label: 'งานโครงสร้าง + หลังคา', percent: 30, status: 'paid', date: '2025-11-20' },
      { no: 3, label: 'งานสถาปัตย์ + ระบบ', percent: 40, status: 'paid', date: '2026-02-14' },
      { no: 4, label: 'ตรวจรับ + ส่งมอบงาน', percent: 10, status: 'paid', date: '2026-04-30' },
    ],
  },
  {
    id: 'P-005',
    name: 'บ้านคุณธนา',
    client: 'ธนา มั่งมี',
    status: 'delivered',
    area: 200, floors: 2, style: 'คอนเทมโพรารี', beds: 3, baths: 3,
    boqBudget: 3200000, actualCost: 3350000, progress: 100,
    installmentPaid: 3200000, installmentTotal: 3200000,
    installments: [
      { no: 1, label: 'เงินมัดจำ ณ วันทำสัญญา', percent: 20, status: 'paid', date: '2025-10-01' },
      { no: 2, label: 'งานโครงสร้าง + หลังคา', percent: 30, status: 'paid', date: '2025-12-15' },
      { no: 3, label: 'งานสถาปัตย์ + ระบบ', percent: 40, status: 'paid', date: '2026-03-01' },
      { no: 4, label: 'ตรวจรับ + ส่งมอบงาน', percent: 10, status: 'paid', date: '2026-05-10' },
    ],
  },
  {
    id: 'P-006',
    name: 'บ้านคุณมาลี',
    client: 'มาลี ศรีสุข',
    status: 'estimating',
    area: 190, floors: 1, style: 'นอร์ดิก', beds: 3, baths: 2,
    boqBudget: 2900000, actualCost: 0, progress: 0,
    installmentPaid: 0, installmentTotal: 2900000,
    installments: [
      { no: 1, label: 'เงินมัดจำ ณ วันทำสัญญา', percent: 20, status: 'upcoming', date: null },
      { no: 2, label: 'งานโครงสร้าง + หลังคา', percent: 30, status: 'upcoming', date: null },
      { no: 3, label: 'งานสถาปัตย์ + ระบบ', percent: 40, status: 'upcoming', date: null },
      { no: 4, label: 'ตรวจรับ + ส่งมอบงาน', percent: 10, status: 'upcoming', date: null },
    ],
  },
]

export function getProjectById(id) {
  return MOCK_PROJECTS.find((p) => p.id === id) || null
}

// จำนวนเงินของงวดหนึ่ง (คิดจาก % ของราคาตามสัญญา)
export function installmentAmount(project, inst) {
  return Math.round((project.boqBudget * (Number(inst.percent) || 0)) / 100)
}

// เทมเพลตงวดงานเริ่มต้น (ใช้ตอนสร้างโปรเจกต์ใหม่จากผลวิเคราะห์ AI)
export const DEFAULT_INSTALLMENTS = [
  { no: 1, label: 'เงินมัดจำ ณ วันทำสัญญา', percent: 20, status: 'upcoming', date: null },
  { no: 2, label: 'งานโครงสร้าง + หลังคา', percent: 30, status: 'upcoming', date: null },
  { no: 3, label: 'งานสถาปัตย์ + ระบบ', percent: 40, status: 'upcoming', date: null },
  { no: 4, label: 'ตรวจรับ + ส่งมอบงาน', percent: 10, status: 'upcoming', date: null },
]

/**
 * 🔒 มุมมองสำหรับ "ลูกค้า" (Magic Link) — โปรเจกต์นี้ตั้งใจ **ตัด** ข้อมูลต้นทุน
 * ฝั่งผู้รับเหมาออกทั้งหมด: ไม่มี actualCost และไม่มี profit เด็ดขาด
 * (หน้า CustomerSummary import เฉพาะฟังก์ชันนี้ จึงเข้าถึงข้อมูลต้องห้ามไม่ได้เลย)
 */
export function getCustomerView(id) {
  const p = getProjectById(id)
  if (!p) return null
  const installments = p.installments.map((i) => ({
    no: i.no,
    label: i.label,
    percent: i.percent,
    amount: installmentAmount(p, i),
    status: i.status,
    date: i.date,
  }))
  const paidAmount = installments
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0)
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    area: p.area,
    floors: p.floors,
    style: p.style,
    beds: p.beds,
    baths: p.baths,
    contractValue: p.boqBudget, // ราคาตามสัญญา (ลูกค้าเป็นผู้จ่าย) — แสดงได้
    progress: p.progress,
    installments,
    paidAmount,
    contractTotal: p.installmentTotal,
    // ❌ ไม่มี actualCost, ไม่มี profit — ตามกฎเหล็กด้านความปลอดภัย
  }
}
