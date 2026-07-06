// Mock analysis data — powers the "🧪 ทดสอบ" mode so the UI can be exercised
// without calling the paid Anthropic API. Mirrors the exact JSON shape that
// analyzeHouse() returns (see the SYSTEM_PROMPT V5 schema in aiService.js):
// phases/tasks, materials (3 tiers), materialLabor, recommendations, risks —
// plus `permits` (consumed by RecommendTab / ContractDocument).

const PHASES = [
  {
    name: 'เตรียมงาน',
    tasks: [
      {
        name: 'เคลียร์พื้นที่และปรับระดับดิน',
        material_cost: 15000,
        labor_cost: 25000,
        details: 'รื้อถอนสิ่งกีดขวาง ถมปรับระดับ บดอัดดินให้แน่น',
      },
      {
        name: 'วางผังและกำหนดหมุดอ้างอิง',
        material_cost: 8000,
        labor_cost: 12000,
        details: 'ตอกหมุดผัง ขึงเอ็น ตรวจระยะร่นตามแบบ',
      },
      {
        name: 'ทำรั้วชั่วคราว + ห้องน้ำคนงาน',
        material_cost: 20000,
        labor_cost: 15000,
        details: 'ล้อมพื้นที่ก่อสร้าง ติดตั้งน้ำ-ไฟชั่วคราว',
      },
    ],
  },
  {
    name: 'งานโครงสร้าง',
    tasks: [
      {
        name: 'งานเสาเข็ม',
        material_cost: 80000,
        labor_cost: 60000,
        details: 'ตอกเสาเข็มคอนกรีต I-22 จำนวน 30 ต้น ตามจุดรับน้ำหนัก',
      },
      {
        name: 'งานฐานราก + คานคอดิน',
        material_cost: 120000,
        labor_cost: 70000,
        details: 'เทคอนกรีตฐานราก ผูกเหล็กตามแบบวิศวกร',
      },
      {
        name: 'งานเสา-คาน-พื้น คสล.',
        material_cost: 220000,
        labor_cost: 150000,
        details: 'เทเสา คาน พื้นคอนกรีตเสริมเหล็กทั้งหลัง',
      },
      {
        name: 'งานบันได คสล.',
        material_cost: 25000,
        labor_cost: 30000,
        details: 'หล่อบันไดคอนกรีตเสริมเหล็ก พร้อมขั้นพักเดิน',
      },
    ],
  },
  {
    name: 'งานสถาปัตย์',
    tasks: [
      {
        name: 'งานก่ออิฐผนัง',
        material_cost: 90000,
        labor_cost: 110000,
        details: 'ก่อผนังรอบบ้านและกั้นห้องตามแปลน',
      },
      {
        name: 'งานฉาบปูน',
        material_cost: 60000,
        labor_cost: 90000,
        details: 'ฉาบเรียบทั้งภายในและภายนอก เก็บมุมเซี้ยม',
      },
      {
        name: 'ติดตั้งวงกบ ประตู-หน้าต่าง',
        material_cost: 130000,
        labor_cost: 50000,
        details: 'ติดตั้งวงกบ บานประตู-หน้าต่าง พร้อมอุปกรณ์',
      },
      {
        name: 'งานมุงหลังคา',
        material_cost: 180000,
        labor_cost: 90000,
        details: 'ติดตั้งโครงหลังคา มุงกระเบื้อง พร้อมฉนวนกันความร้อน',
      },
    ],
  },
  {
    name: 'งานระบบ',
    tasks: [
      {
        name: 'งานระบบไฟฟ้า',
        material_cost: 95000,
        labor_cost: 70000,
        details: 'เดินสายไฟ ติดตั้งตู้ควบคุม สวิตช์-ปลั๊ก 60 จุด',
      },
      {
        name: 'งานระบบประปา-สุขาภิบาล',
        material_cost: 85000,
        labor_cost: 65000,
        details: 'เดินท่อน้ำดี-น้ำทิ้ง ทดสอบแรงดันก่อนปิดผนัง',
      },
      {
        name: 'ติดตั้งสุขภัณฑ์',
        material_cost: 70000,
        labor_cost: 25000,
        details: 'ติดตั้งโถสุขภัณฑ์ อ่างล้างหน้า ก๊อกน้ำ 2 ห้องน้ำ',
      },
    ],
  },
  {
    name: 'งานตกแต่ง',
    tasks: [
      {
        name: 'ปูกระเบื้องพื้น-ผนัง',
        material_cost: 140000,
        labor_cost: 95000,
        details: 'ปูกระเบื้องพื้นทั้งหลัง + ผนังห้องน้ำ-ห้องครัว',
      },
      {
        name: 'งานฝ้าเพดาน',
        material_cost: 55000,
        labor_cost: 45000,
        details: 'ติดตั้งฝ้ายิปซัม โครงคร่าว ฝ้าชายคา',
      },
      {
        name: 'งานทาสี',
        material_cost: 60000,
        labor_cost: 80000,
        details: 'ทาสีรองพื้น + สีจริง 2 เที่ยว ภายใน-ภายนอก',
      },
      {
        name: 'เก็บงาน + ทำความสะอาด',
        material_cost: 10000,
        labor_cost: 30000,
        details: 'เก็บรายละเอียด ตรวจ defect ส่งมอบงาน',
      },
    ],
  },
]

// One row per material; each tier supplies its own brand spec + unit price.
// tierList(grade) expands this into the per-tier array the UI expects.
const MATERIAL_BASE = [
  {
    name: 'ปูนซีเมนต์ปอร์ตแลนด์',
    unit: 'ถุง',
    quantity: 350,
    economy: { spec: 'ตราเสือ 50 กก.', price: 165 },
    standard: { spec: 'SCG 50 กก.', price: 185 },
    premium: { spec: 'อินทรี Insee Super 50 กก.', price: 205 },
  },
  {
    name: 'เหล็กเส้นข้ออ้อย DB12',
    unit: 'เส้น',
    quantity: 280,
    economy: { spec: 'เหล็ก มอก. ทั่วไป 12 มม. ยาว 10 ม.', price: 230 },
    standard: { spec: 'SYS/TATA 12 มม. ยาว 10 ม.', price: 255 },
    premium: { spec: 'TATA Tiscon มอก. 12 มม. ยาว 10 ม.', price: 280 },
  },
  {
    name: 'เหล็กปลอก RB6',
    unit: 'เส้น',
    quantity: 200,
    economy: { spec: 'เหล็กกลม 6 มม. ทั่วไป', price: 95 },
    standard: { spec: 'เหล็กกลม 6 มม. มอก.', price: 110 },
    premium: { spec: 'เหล็กกลม 6 มม. มอก. เกรดส่งออก', price: 125 },
  },
  {
    name: 'ทรายหยาบงานโครงสร้าง',
    unit: 'ลบ.ม.',
    quantity: 40,
    economy: { spec: 'ทรายหยาบคัดทั่วไป', price: 380 },
    standard: { spec: 'ทรายหยาบล้างสะอาด', price: 420 },
    premium: { spec: 'ทรายหยาบล้างคัดพิเศษ', price: 460 },
  },
  {
    name: 'หิน 3/4',
    unit: 'ลบ.ม.',
    quantity: 35,
    economy: { spec: 'หินคลุก/หินย่อยทั่วไป', price: 480 },
    standard: { spec: 'หิน 3/4 ล้าง', price: 520 },
    premium: { spec: 'หิน 3/4 ล้างคัดพิเศษ', price: 560 },
  },
  {
    name: 'ไม้แบบ + ค้ำยัน',
    unit: 'ตร.ม.',
    quantity: 250,
    economy: { spec: 'ไม้แบบใช้ซ้ำ', price: 95 },
    standard: { spec: 'ไม้อัดเคลือบ', price: 130 },
    premium: { spec: 'ไม้อัดฟิล์มดำ', price: 180 },
  },
  {
    name: 'เสาเข็มคอนกรีต I-22',
    unit: 'ต้น',
    quantity: 30,
    economy: { spec: 'เสาเข็ม I-22 ยาว 6 ม.', price: 850 },
    standard: { spec: 'เสาเข็ม I-22 ยาว 9 ม.', price: 1100 },
    premium: { spec: 'เสาเข็ม I-22 ยาว 12 ม. มอก.', price: 1400 },
  },
  {
    name: 'อิฐก่อผนัง',
    unit: 'ตร.ม.',
    quantity: 320,
    economy: { spec: 'อิฐมอญแดง', price: 240 },
    standard: { spec: 'อิฐมวลเบา Q-CON หนา 7.5 ซม.', price: 320 },
    premium: { spec: 'อิฐมวลเบา Superblock หนา 10 ซม.', price: 380 },
  },
  {
    name: 'ปูนก่อ-ฉาบสำเร็จรูป',
    unit: 'ถุง',
    quantity: 280,
    economy: { spec: 'ปูนก่อ-ฉาบทั่วไป 50 กก.', price: 95 },
    standard: { spec: 'เสือ มอร์ตาร์ 50 กก.', price: 115 },
    premium: { spec: 'จระเข้/TPI พรีเมียม 50 กก.', price: 135 },
  },
  {
    name: 'กระเบื้องหลังคา',
    unit: 'ตร.ม.',
    quantity: 180,
    economy: { spec: 'ลอนคู่/ซีแพคทั่วไป', price: 220 },
    standard: { spec: 'SCG คอนกรีตรุ่นมาตรฐาน', price: 320 },
    premium: { spec: 'SCG เซรามิก Excella', price: 480 },
  },
  {
    name: 'โครงหลังคาเหล็ก',
    unit: 'ตร.ม.',
    quantity: 180,
    economy: { spec: 'เหล็กกล่องทั่วไป', price: 280 },
    standard: { spec: 'เหล็กกล่องชุบกัลวาไนซ์', price: 360 },
    premium: { spec: 'สมาร์ททรัส/กัลวาไนซ์หนาพิเศษ', price: 450 },
  },
  {
    name: 'ฉนวนกันความร้อนใต้หลังคา',
    unit: 'ตร.ม.',
    quantity: 180,
    economy: { spec: 'แผ่นโฟม PE สะท้อนความร้อน', price: 60 },
    standard: { spec: 'ใยแก้ว Stay Cool', price: 95 },
    premium: { spec: 'SCG Cool Sheet / Aerolite', price: 140 },
  },
  {
    name: 'กระเบื้องปูพื้น',
    unit: 'ตร.ม.',
    quantity: 170,
    economy: { spec: 'เซรามิก Campana 60x60', price: 220 },
    standard: { spec: 'Cotto/Sosuco 60x60', price: 350 },
    premium: { spec: 'แกรนิตโต้ Duragres 60x60', price: 650 },
  },
  {
    name: 'สีรองพื้น + สีจริง',
    unit: 'ตร.ม.',
    quantity: 600,
    economy: { spec: 'Jotun Essence', price: 38 },
    standard: { spec: 'TOA SuperShield', price: 60 },
    premium: { spec: 'Beger Premium / Dulux Weathershield', price: 95 },
  },
  {
    name: 'ฝ้าเพดานยิปซัม',
    unit: 'ตร.ม.',
    quantity: 160,
    economy: { spec: 'ยิปซัมธรรมดา + โครง C-line', price: 160 },
    standard: { spec: 'ยิปรอค + โครงเคลือบสังกะสี', price: 220 },
    premium: { spec: 'ยิปรอคกันชื้น/กันร้อน', price: 300 },
  },
  {
    name: 'ประตู-หน้าต่าง',
    unit: 'ชุด',
    quantity: 18,
    economy: { spec: 'บานเลื่อนอลูมิเนียมทั่วไป', price: 3200 },
    standard: { spec: 'อลูมิเนียมสี + กระจกเขียวตัดแสง', price: 4800 },
    premium: { spec: 'UPVC + กระจก Low-E', price: 7500 },
  },
  {
    name: 'สายไฟ + อุปกรณ์ไฟฟ้า',
    unit: 'จุด',
    quantity: 60,
    economy: { spec: 'สายไฟ มอก. + ปลั๊ก Panasonic', price: 320 },
    standard: { spec: 'Bangkok Cable + Schneider', price: 420 },
    premium: { spec: 'Phelps Dodge + Schneider พรีเมียม', price: 560 },
  },
  {
    name: 'ท่อ PVC + ระบบประปา',
    unit: 'จุด',
    quantity: 28,
    economy: { spec: 'ท่อ PVC ทั่วไป', price: 850 },
    standard: { spec: 'ท่อ SCG ชั้น 8.5', price: 1100 },
    premium: { spec: 'ท่อ SCG + วาล์วทองเหลือง', price: 1450 },
  },
  {
    name: 'สุขภัณฑ์ (ชุด)',
    unit: 'ชุด',
    quantity: 2,
    economy: { spec: 'Karat โถ + อ่าง + ก๊อก', price: 6500 },
    standard: { spec: 'Cotto โถ + อ่าง + ก๊อก', price: 12000 },
    premium: { spec: 'American Standard/TOTO ครบชุด', price: 22000 },
  },
]

// Lump-sum labor estimate per tier (V5 materialLabor). Economy ≈ 0.85× of the
// standard estimate, premium ≈ 1.3× — mirrors the SYSTEM_PROMPT guidance.
const MATERIAL_LABOR = {
  economy: 945000,
  standard: 1110000,
  premium: 1445000,
}

const RECOMMENDATIONS = [
  'ตรวจสอบสภาพดิน (เจาะสำรวจ) ก่อนเริ่มงานฐานราก เพื่อเลือกความยาวเสาเข็มที่เหมาะสม',
  'ทำสัญญาแบ่งงวดงานตามเฟส และกำหนดเงื่อนไขการตรวจรับแต่ละงวดให้ชัดเจน',
  'เผื่องบสำรอง (contingency) 10-15% สำหรับงานเพิ่มหรืองานแก้ที่อาจเกิดขึ้น',
  'เลือกวัสดุหลังคาและฉนวนที่ระบายความร้อนดี ช่วยลดค่าไฟในระยะยาว',
  'ติดตั้งระบบกันซึมบริเวณห้องน้ำและระเบียงให้ครบก่อนปูกระเบื้อง',
]

const RISKS = [
  {
    risk: 'ดินอ่อนหรือทรุดตัว ทำให้ฐานรากเสียหาย',
    prevention: 'เจาะสำรวจดินก่อน และใช้เสาเข็มยาวให้ถึงชั้นดินแข็ง',
  },
  {
    risk: 'ฝนตกระหว่างงานโครงสร้าง ทำให้งานล่าช้า',
    prevention: 'วางแผนเทคอนกรีตเลี่ยงหน้าฝน และเตรียมผ้าใบคลุมงาน',
  },
  {
    risk: 'ราคาวัสดุหลัก (เหล็ก/ปูน) ผันผวน',
    prevention: 'ล็อกราคากับร้านวัสดุและสั่งซื้อล่วงหน้าเป็นล็อต',
  },
  {
    risk: 'งานระบบไฟฟ้า-ประปาไม่ได้มาตรฐาน เกิดปัญหาภายหลัง',
    prevention: 'ใช้ช่างที่มีใบรับรอง และทดสอบแรงดันท่อก่อนปิดผนัง',
  },
  {
    risk: 'ผู้รับเหมาทิ้งงานกลางคัน',
    prevention: 'แบ่งจ่ายตามงวดงานจริง ทำสัญญารัดกุม และระบุค่าปรับ',
  },
]

const PERMITS = [
  'ใบอนุญาตก่อสร้างอาคาร (แบบ อ.1) จากองค์กรปกครองส่วนท้องถิ่น',
  'แบบแปลนที่มีวิศวกร/สถาปนิกเซ็นรับรองตามที่กฎหมายกำหนด',
  'หนังสือขออนุญาตเชื่อมต่อระบบประปาและไฟฟ้า',
  'หนังสือยินยอมของเพื่อนบ้าน (กรณีก่อสร้างชิดแนวเขตที่ดิน)',
  'หนังสือแจ้งเริ่มงานก่อสร้างต่อเจ้าพนักงานท้องถิ่น',
]

function tierList(grade) {
  return MATERIAL_BASE.map(({ name, unit, quantity, [grade]: tier }) => ({
    name,
    spec: tier.spec,
    quantity,
    unit,
    pricePerUnit: tier.price,
  }))
}

// Build a full mock analysis payload shaped exactly like analyzeHouse()'s
// return value. house_analysis is adapted from the entered projectInfo so the
// test result still reflects what the user typed.
export function buildMockAnalysis(projectInfo = {}) {
  return {
    house_analysis: {
      type: projectInfo.name || 'บ้านตัวอย่าง (โหมดทดสอบ)',
      estimated_size_sqm: Number(projectInfo.area) || 150,
      floors: Number(projectInfo.floors) || 1,
      style: projectInfo.style || 'โมเดิร์น',
      description:
        projectInfo.notes ||
        'ข้อมูลจำลองสำหรับทดสอบ UI — ไม่ได้เรียก AI จริง ไม่มีค่าใช้จ่าย',
    },
    phases: PHASES,
    recommendations: RECOMMENDATIONS,
    risks: RISKS,
    permits: PERMITS,
    materials: {
      economy: tierList('economy'),
      standard: tierList('standard'),
      premium: tierList('premium'),
    },
    materialLabor: MATERIAL_LABOR,
  }
}
