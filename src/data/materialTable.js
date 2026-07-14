// ตารางวัสดุกลาง (central material table) — "โปรแกรม" ใช้ตารางนี้กำหนดราคา+สเปก
// รายการวัสดุ 3 เกรด. AI มีหน้าที่เลือก key + ใส่ "ปริมาณ" (จากการถอดแบบ) เท่านั้น
// ห้าม AI คิด/ใส่ราคาวัสดุเอง — ราคาและสเปกยี่ห้อมาจากตารางนี้ (ผู้ใช้/ERP แก้ได้)

export const MATERIAL_GRADE_KEYS = ['economy', 'standard', 'premium']

export const MATERIAL_TABLE = [
  {
    key: 'cement_portland', name: 'ปูนซีเมนต์ปอร์ตแลนด์', unit: 'ถุง',
    economy: { spec: 'ตราเสือ 50 กก.', price: 165 },
    standard: { spec: 'SCG 50 กก.', price: 185 },
    premium: { spec: 'อินทรี Insee Super 50 กก.', price: 205 },
  },
  {
    key: 'rebar_db12', name: 'เหล็กเส้นข้ออ้อย DB12', unit: 'เส้น',
    economy: { spec: 'เหล็ก มอก. ทั่วไป 12 มม. ยาว 10 ม.', price: 230 },
    standard: { spec: 'SYS/TATA 12 มม. ยาว 10 ม.', price: 255 },
    premium: { spec: 'TATA Tiscon มอก. 12 มม. ยาว 10 ม.', price: 280 },
  },
  {
    key: 'rebar_rb6', name: 'เหล็กปลอก RB6', unit: 'เส้น',
    economy: { spec: 'เหล็กกลม 6 มม. ทั่วไป', price: 95 },
    standard: { spec: 'เหล็กกลม 6 มม. มอก.', price: 110 },
    premium: { spec: 'เหล็กกลม 6 มม. มอก. เกรดส่งออก', price: 125 },
  },
  {
    key: 'sand_coarse', name: 'ทรายหยาบงานโครงสร้าง', unit: 'ลบ.ม.',
    economy: { spec: 'ทรายหยาบคัดทั่วไป', price: 380 },
    standard: { spec: 'ทรายหยาบล้างสะอาด', price: 420 },
    premium: { spec: 'ทรายหยาบล้างคัดพิเศษ', price: 460 },
  },
  {
    key: 'rock_34', name: 'หิน 3/4', unit: 'ลบ.ม.',
    economy: { spec: 'หินคลุก/หินย่อยทั่วไป', price: 480 },
    standard: { spec: 'หิน 3/4 ล้าง', price: 520 },
    premium: { spec: 'หิน 3/4 ล้างคัดพิเศษ', price: 560 },
  },
  {
    key: 'formwork', name: 'ไม้แบบ + ค้ำยัน', unit: 'ตร.ม.',
    economy: { spec: 'ไม้แบบใช้ซ้ำ', price: 95 },
    standard: { spec: 'ไม้อัดเคลือบ', price: 130 },
    premium: { spec: 'ไม้อัดฟิล์มดำ', price: 180 },
  },
  {
    key: 'pile_i22', name: 'เสาเข็มคอนกรีต I-22', unit: 'ต้น',
    economy: { spec: 'เสาเข็ม I-22 ยาว 6 ม.', price: 850 },
    standard: { spec: 'เสาเข็ม I-22 ยาว 9 ม.', price: 1100 },
    premium: { spec: 'เสาเข็ม I-22 ยาว 12 ม. มอก.', price: 1400 },
  },
  {
    key: 'brick', name: 'อิฐก่อผนัง', unit: 'ตร.ม.',
    economy: { spec: 'อิฐมอญแดง', price: 240 },
    standard: { spec: 'อิฐมวลเบา Q-CON หนา 7.5 ซม.', price: 320 },
    premium: { spec: 'อิฐมวลเบา Superblock หนา 10 ซม.', price: 380 },
  },
  {
    key: 'mortar', name: 'ปูนก่อ-ฉาบสำเร็จรูป', unit: 'ถุง',
    economy: { spec: 'ปูนก่อ-ฉาบทั่วไป 50 กก.', price: 95 },
    standard: { spec: 'เสือ มอร์ตาร์ 50 กก.', price: 115 },
    premium: { spec: 'จระเข้/TPI พรีเมียม 50 กก.', price: 135 },
  },
  {
    key: 'roof_tile', name: 'กระเบื้องหลังคา', unit: 'ตร.ม.',
    economy: { spec: 'ลอนคู่/ซีแพคทั่วไป', price: 220 },
    standard: { spec: 'SCG คอนกรีตรุ่นมาตรฐาน', price: 320 },
    premium: { spec: 'SCG เซรามิก Excella', price: 480 },
  },
  {
    key: 'roof_steel', name: 'โครงหลังคาเหล็ก', unit: 'ตร.ม.',
    economy: { spec: 'เหล็กกล่องทั่วไป', price: 280 },
    standard: { spec: 'เหล็กกล่องชุบกัลวาไนซ์', price: 360 },
    premium: { spec: 'สมาร์ททรัส/กัลวาไนซ์หนาพิเศษ', price: 450 },
  },
  {
    key: 'insulation', name: 'ฉนวนกันความร้อนใต้หลังคา', unit: 'ตร.ม.',
    economy: { spec: 'แผ่นโฟม PE สะท้อนความร้อน', price: 60 },
    standard: { spec: 'ใยแก้ว Stay Cool', price: 95 },
    premium: { spec: 'SCG Cool Sheet / Aerolite', price: 140 },
  },
  {
    key: 'floor_tile', name: 'กระเบื้องปูพื้น', unit: 'ตร.ม.',
    economy: { spec: 'เซรามิก Campana 60x60', price: 220 },
    standard: { spec: 'Cotto/Sosuco 60x60', price: 350 },
    premium: { spec: 'แกรนิตโต้ Duragres 60x60', price: 650 },
  },
  {
    key: 'paint', name: 'สีรองพื้น + สีจริง', unit: 'ตร.ม.',
    economy: { spec: 'Jotun Essence', price: 38 },
    standard: { spec: 'TOA SuperShield', price: 60 },
    premium: { spec: 'Beger Premium / Dulux Weathershield', price: 95 },
  },
  {
    key: 'ceiling_gypsum', name: 'ฝ้าเพดานยิปซัม', unit: 'ตร.ม.',
    economy: { spec: 'ยิปซัมธรรมดา + โครง C-line', price: 160 },
    standard: { spec: 'ยิปรอค + โครงเคลือบสังกะสี', price: 220 },
    premium: { spec: 'ยิปรอคกันชื้น/กันร้อน', price: 300 },
  },
  {
    key: 'door_window', name: 'ประตู-หน้าต่าง', unit: 'ชุด',
    economy: { spec: 'บานเลื่อนอลูมิเนียมทั่วไป', price: 3200 },
    standard: { spec: 'อลูมิเนียมสี + กระจกเขียวตัดแสง', price: 4800 },
    premium: { spec: 'UPVC + กระจก Low-E', price: 7500 },
  },
  {
    key: 'electrical', name: 'สายไฟ + อุปกรณ์ไฟฟ้า', unit: 'จุด',
    economy: { spec: 'สายไฟ มอก. + ปลั๊ก Panasonic', price: 320 },
    standard: { spec: 'Bangkok Cable + Schneider', price: 420 },
    premium: { spec: 'Phelps Dodge + Schneider พรีเมียม', price: 560 },
  },
  {
    key: 'plumbing', name: 'ท่อ PVC + ระบบประปา', unit: 'จุด',
    economy: { spec: 'ท่อ PVC ทั่วไป', price: 850 },
    standard: { spec: 'ท่อ SCG ชั้น 8.5', price: 1100 },
    premium: { spec: 'ท่อ SCG + วาล์วทองเหลือง', price: 1450 },
  },
  {
    key: 'sanitary', name: 'สุขภัณฑ์ (ชุด)', unit: 'ชุด',
    economy: { spec: 'Karat โถ + อ่าง + ก๊อก', price: 6500 },
    standard: { spec: 'Cotto โถ + อ่าง + ก๊อก', price: 12000 },
    premium: { spec: 'American Standard/TOTO ครบชุด', price: 22000 },
  },
]

export const MATERIAL_BY_KEY = Object.fromEntries(
  MATERIAL_TABLE.map((m) => [m.key, m]),
)

// รายการ key ที่อนุญาต (ข้อความให้ AI จับคู่) — key = ชื่อวัสดุ [หน่วย]
export function materialKeysText() {
  return MATERIAL_TABLE.map((m) => `${m.key} = ${m.name} [${m.unit}]`).join(' | ')
}

// แปลง material_items จาก AI ([{key, quantity, spec?}]) → materials 3 เกรด
// (ราคา+สเปกจากตารางกลาง). คืน { economy, standard, premium, anomalies }
export function priceMaterials(materialItems = []) {
  const out = { economy: [], standard: [], premium: [] }
  const anomalies = []

  for (const raw of materialItems) {
    const key = raw?.key
    const row = key ? MATERIAL_BY_KEY[key] : undefined
    const qty = Number(raw?.quantity) || 0

    if (!row) {
      // ไม่พบในตารางวัสดุกลาง → ราคา 0 + flag ให้ผู้ใช้กรอกเอง (สเปกตามที่ AI เห็นในแบบ)
      const name = raw?.name || key || 'วัสดุไม่ระบุ'
      for (const g of MATERIAL_GRADE_KEYS) {
        out[g].push({
          name,
          spec: raw?.spec || '',
          quantity: qty,
          unit: raw?.unit || '',
          pricePerUnit: 0,
          unpriced: true,
        })
      }
      anomalies.push({
        type: 'unknown_material',
        level: 'warn',
        key: key || '',
        message: `ไม่พบวัสดุ "${name}"${key ? ` (key: ${key})` : ''} ในตารางกลาง — รอกำหนดราคา`,
      })
      continue
    }

    for (const g of MATERIAL_GRADE_KEYS) {
      const tier = row[g]
      out[g].push({
        name: row.name,
        // สเปกยี่ห้อจากตารางกลาง (ถ้า AI ระบุสเปกจากแบบมาก็ต่อท้ายเป็นหมายเหตุ)
        spec: raw?.spec ? `${tier.spec} (แบบ: ${raw.spec})` : tier.spec,
        quantity: qty,
        unit: row.unit,
        pricePerUnit: tier.price,
      })
    }
  }

  return { ...out, anomalies }
}
