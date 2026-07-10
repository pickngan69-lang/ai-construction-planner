// Shared mock project data for the Mini ERP pages
// (MultiProjectDashboard, ProjectDetail, CustomerSummary).
// The real ERP backend (erp-backend/) will replace this later.

export const PROJECT_STATUSES = [
  { key: 'estimating', label: 'กำลังประเมินราคา', icon: '📝', color: '#e07a2f' },
  { key: 'building', label: 'ระหว่างก่อสร้าง', icon: '🔨', color: '#457b9d' },
  { key: 'delivered', label: 'ส่งมอบแล้ว', icon: '✅', color: '#2a9d8f' },
]
export const STATUS_META = {
  ...Object.fromEntries(PROJECT_STATUSES.map((s) => [s.key, s])),
  // สถานะจาก action menu (นอกเหนือจากคอลัมน์ kanban หลัก)
  completed: { key: 'completed', label: 'สำเร็จ', icon: '✅', color: '#2a9d8f' },
  cancelled: { key: 'cancelled', label: 'ยกเลิก', icon: '❌', color: '#e76f51' },
}

// installments[].status: 'paid' (ชำระแล้ว) | 'due' (ครบกำหนด/รอชำระ) | 'upcoming' (ยังไม่ถึง)
// โปรเจกต์ตัวอย่าง (mock) ถูกลบออกแล้ว — เริ่มต้นว่าง ให้ผู้ใช้สร้างโปรเจกต์จริงเอง
// (จากผลวิเคราะห์ AI → กด "บันทึกเข้ากระดานโปรเจกต์")
export const MOCK_PROJECTS = []

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
