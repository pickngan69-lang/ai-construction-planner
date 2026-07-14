// ตารางเรตกลาง (central rate table) — "โปรแกรม" ใช้ตารางนี้คิดราคา BOQ ทั้งหมด
// AI มีหน้าที่ "ถอดปริมาณ" ต่อ key เหล่านี้เท่านั้น ห้ามคิด/ใส่ราคาเอง
// material/labor = บาทต่อ 1 หน่วย (unit) ระดับ "มาตรฐาน"

export const DISCIPLINES = [
  { key: 'architecture', label: 'สถาปัตยกรรม', icon: '🏛️' },
  { key: 'structure', label: 'โครงสร้าง', icon: '🏗️' },
  { key: 'electrical', label: 'ไฟฟ้า', icon: '⚡' },
  { key: 'sanitary', label: 'สุขาภิบาล', icon: '🚰' },
  { key: 'mechanical', label: 'เครื่องกล', icon: '⚙️' },
]

// ชนิดฐานราก — ล็อกตั้งแต่ฟอร์มเริ่มโปรเจกต์ เป็น guardrail ให้ AI (ห้ามปนกัน)
export const FOUNDATION_TYPES = [
  { key: 'spread', label: 'ฐานรากแผ่ (Spread Footing)', desc: 'ดินแข็ง ไม่ตอกเข็ม' },
  { key: 'driven_pile', label: 'เสาเข็มตอก (Driven Pile)', desc: 'ดินอ่อน ตอกเข็ม I-22' },
  { key: 'bored_pile', label: 'เสาเข็มเจาะ (Bored Pile)', desc: 'พื้นที่จำกัด/มีอาคารข้างเคียง' },
]

// แต่ละ item: key, discipline, name, unit, material, labor
// foundation (งานฐานราก) = ใช้กับฐานรากชนิดไหนบ้าง (คั่นด้วย ,) — กันปนกัน
export const RATE_TABLE = [
  { key: 'pile_driven_i22_6', discipline: 'structure', name: 'เสาเข็มตอก I-22 ยาว 6 ม.', unit: 'ต้น', material: 900, labor: 350, foundation: 'driven_pile' },
  { key: 'pile_driven_i22_9', discipline: 'structure', name: 'เสาเข็มตอก I-22 ยาว 9 ม.', unit: 'ต้น', material: 1150, labor: 450, foundation: 'driven_pile' },
  { key: 'pile_bored_035', discipline: 'structure', name: 'เสาเข็มเจาะ ศก. 0.35 ม.', unit: 'ต้น', material: 8000, labor: 4000, foundation: 'bored_pile' },
  { key: 'footing_spread', discipline: 'structure', name: 'ฐานรากแผ่ คสล.', unit: 'ลบ.ม.', material: 1600, labor: 700, foundation: 'spread' },
  { key: 'pile_cap', discipline: 'structure', name: 'ฐานราก/ตอม่อ คสล. (บนเสาเข็ม)', unit: 'ลบ.ม.', material: 1700, labor: 800, foundation: 'driven_pile,bored_pile' },
  { key: 'ground_beam', discipline: 'structure', name: 'คานคอดิน คสล.', unit: 'ลบ.ม.', material: 1600, labor: 900 },
  { key: 'column', discipline: 'structure', name: 'เสา คสล.', unit: 'ลบ.ม.', material: 1500, labor: 1200 },
  { key: 'beam', discipline: 'structure', name: 'คาน คสล.', unit: 'ลบ.ม.', material: 1500, labor: 1000 },
  { key: 'slab', discipline: 'structure', name: 'พื้น คสล.', unit: 'ตร.ม.', material: 550, labor: 350 },
  { key: 'stair', discipline: 'structure', name: 'บันได คสล.', unit: 'ชุด', material: 15000, labor: 12000 },
  { key: 'roof_structure', discipline: 'structure', name: 'โครงหลังคาเหล็ก', unit: 'ตร.ม.', material: 450, labor: 250 },
  { key: 'brick_wall', discipline: 'architecture', name: 'งานก่ออิฐผนัง', unit: 'ตร.ม.', material: 230, labor: 250 },
  { key: 'plaster', discipline: 'architecture', name: 'งานฉาบปูน', unit: 'ตร.ม.', material: 75, labor: 120 },
  { key: 'floor_tile', discipline: 'architecture', name: 'ปูกระเบื้องพื้น', unit: 'ตร.ม.', material: 350, labor: 250 },
  { key: 'wall_tile', discipline: 'architecture', name: 'ปูกระเบื้องผนัง', unit: 'ตร.ม.', material: 380, labor: 300 },
  { key: 'paint', discipline: 'architecture', name: 'งานทาสี', unit: 'ตร.ม.', material: 60, labor: 80 },
  { key: 'ceiling', discipline: 'architecture', name: 'ฝ้าเพดาน', unit: 'ตร.ม.', material: 200, labor: 150 },
  { key: 'roof_tile', discipline: 'architecture', name: 'มุงกระเบื้องหลังคา', unit: 'ตร.ม.', material: 280, labor: 180 },
  { key: 'door', discipline: 'architecture', name: 'ประตู พร้อมวงกบ', unit: 'ชุด', material: 3500, labor: 800 },
  { key: 'window', discipline: 'architecture', name: 'หน้าต่าง พร้อมวงกบ', unit: 'ชุด', material: 4500, labor: 900 },
  { key: 'elec_point', discipline: 'electrical', name: 'จุดไฟฟ้า (ดวงโคม/สวิตช์/ปลั๊ก)', unit: 'จุด', material: 450, labor: 550 },
  { key: 'elec_panel', discipline: 'electrical', name: 'ตู้ควบคุมไฟฟ้า (MDB)', unit: 'ชุด', material: 12000, labor: 5000 },
  { key: 'plumb_point', discipline: 'sanitary', name: 'จุดสุขาภิบาล (น้ำดี/น้ำทิ้ง)', unit: 'จุด', material: 800, labor: 900 },
  { key: 'sanitary_set', discipline: 'sanitary', name: 'สุขภัณฑ์ (โถ+อ่าง+ก๊อก)', unit: 'ชุด', material: 8000, labor: 2500 },
  { key: 'water_system', discipline: 'sanitary', name: 'ถังเก็บน้ำ + ปั๊มน้ำ', unit: 'ชุด', material: 15000, labor: 3000 },
  { key: 'aircon', discipline: 'mechanical', name: 'เครื่องปรับอากาศ พร้อมติดตั้ง', unit: 'ชุด', material: 18000, labor: 3000 },
  { key: 'ventilation', discipline: 'mechanical', name: 'พัดลมระบายอากาศ', unit: 'จุด', material: 1200, labor: 500 },
]

export const RATE_BY_KEY = Object.fromEntries(RATE_TABLE.map((r) => [r.key, r]))

// เรตที่ใช้ได้ตามชนิดฐานรากที่เลือก (ตัดฐานรากชนิดอื่นออก — ห้ามปน)
export function ratesForFoundation(foundationKey) {
  return RATE_TABLE.filter(
    (r) => !r.foundation || r.foundation.split(',').includes(foundationKey),
  )
}
