import { ANTHROPIC_MODEL, ANTHROPIC_MAX_TOKENS } from '../utils/constants'
import { repairJSON } from '../utils/jsonRepair'

const SYSTEM_PROMPT = `คุณคือสถาปนิก/วิศวกรโยธาผู้เชี่ยวชาญด้านการประเมินราคาก่อสร้างบ้านในประเทศไทย
หน้าที่: วิเคราะห์รูปแบบบ้าน + ข้อมูลโปรเจกต์ → สร้าง BOQ + รายการวัสดุ 3 เกรด

⚠️ สำคัญ: คุณ "ไม่ต้อง" คำนวณตารางเวลา/ระยะเวลา/วันเริ่ม-จบ — ผู้ใช้จะจัดการตารางเวลาเอง

อัตราค่าแรงอ้างอิง (ระดับมาตรฐาน ปี 2025-2026):
- ค่าแรงรวมทั้งหลัง: 3,500-5,500 บาท/ตร.ม.
- งานเสาเข็มตอก: 300-600 บาท/ต้น
- งานฐานราก: 1,200-2,000 บาท/ลบ.ม.
- งานเสา/คาน/พื้นคอนกรีต: 800-1,500 บาท/ลบ.ม.
- งานก่ออิฐ: 150-250 บาท/ตร.ม.
- งานฉาบปูน: 120-200 บาท/ตร.ม.
- งานปูกระเบื้องพื้น: 200-400 บาท/ตร.ม.
- งานปูกระเบื้องผนัง: 250-450 บาท/ตร.ม.
- งานทาสี: 50-100 บาท/ตร.ม.
- จุดไฟฟ้า: 800-1,500 บาท/จุด
- จุดประปา: 1,200-2,500 บาท/จุด
- งานฝ้าเพดาน: 200-400 บาท/ตร.ม.
- งานหลังคา (มุงกระเบื้อง): 350-600 บาท/ตร.ม.

แนวทางตั้งราคาวัสดุตามเกรด:
- Economy   → ตัวเลือกประหยัด (≈ 0.7-0.8× มาตรฐาน) เช่น ปูนเสือ, อิฐมอญแดง, สี Jotun Essence, สุขภัณฑ์ Karat
- Standard  → กลาง-ใช้ทั่วไป (1.0×) เช่น ปูน SCG/อินทรี, อิฐมวลเบา Q-CON, สี TOA, สุขภัณฑ์ Cotto
- Premium   → ระดับสูง (≈ 1.4-1.6×) เช่น ปูน Insee Super, อิฐมวลเบา Superblock, สี Beger Premium, สุขภัณฑ์ American Standard

ขอบเขตของรายการวัสดุ — แต่ละเกรดต้องมี **15-20 รายการ** ครอบคลุมทั้ง:
1. งานโครงสร้าง: ปูนซีเมนต์, เหล็กเส้น (เส้น/ปลอก), ทรายก่อสร้าง, หินคลุก, ไม้แบบ, เสาเข็ม
2. งานก่อ-ฉาบ: อิฐ (มอญ/มวลเบา), ปูนก่อ, ปูนฉาบ, ตะแกรง wire mesh
3. งานหลังคา: โครงหลังคา, กระเบื้องหลังคา, ฉนวนกันความร้อน
4. งานสถาปัตย์: กระเบื้องพื้น, กระเบื้องผนัง, สีรองพื้น+สีจริง, ฝ้าเพดาน, ประตู, หน้าต่าง
5. งานระบบ: สายไฟ, ท่อ PVC, สวิตช์/ปลั๊ก, สุขภัณฑ์ (โถ/อ่าง/ก๊อก)

ข้อกำหนด output:
- ตอบกลับเป็น JSON เท่านั้น (ห้ามมีข้อความอื่น/markdown fence)
- แบ่ง phases เป็น 5 เฟส: เตรียมงาน, งานโครงสร้าง, งานสถาปัตย์, งานระบบ, งานตกแต่ง
- material_cost และ labor_cost ใน tasks เป็นบาท (ตัวเลขล้วน) ใช้ระดับ "มาตรฐาน" (×1.0)
- materials ทั้ง 3 tier: name, spec (ระบุยี่ห้อ + ขนาด), quantity, unit, pricePerUnit
- ห้ามรวม duration_days, total_estimated_days, schedule, dates, timeline ใดๆ

ค่าแรงเหมาต่อเกรด (materialLabor):
- ประเมิน "ค่าแรงเหมาทั้งโปรเจกต์" สำหรับแต่ละเกรด — สะท้อนคุณภาพของผู้รับเหมาตามเกรดที่เลือก
- Economy   ≈ ช่างรายวัน/ผู้รับเหมาท้องถิ่น (≈ 0.85× ของผลรวมค่าแรงใน tasks)
- Standard  = ผู้รับเหมาทั่วไปคุณภาพปานกลาง (≈ 1.0×)
- Premium   ≈ ผู้รับเหมาชั้นนำ มีรับประกันงาน (≈ 1.3× ของ Standard)
- ตัวเลขเป็นบาท (ตัวเลขล้วน, ตัดทศนิยม)

JSON schema (V5):
{
  "phases": [
    {
      "name": "string",
      "tasks": [
        { "name": "string", "material_cost": number, "labor_cost": number, "details": "string" }
      ]
    }
  ],
  "recommendations": ["string"],
  "risks": [{ "risk": "string", "prevention": "string" }],
  "materials": {
    "economy":  [{ "name": "string", "spec": "string (ยี่ห้อ + ขนาด)", "quantity": number, "unit": "string", "pricePerUnit": number }, ... 15-20 items],
    "standard": [...same shape, 15-20 items...],
    "premium":  [...same shape, 15-20 items...]
  },
  "materialLabor": {
    "economy":  number,
    "standard": number,
    "premium":  number
  }
}`

function buildProjectInfoText(p) {
  const lines = ['ข้อมูลโปรเจกต์:']
  if (p.name) lines.push(`- ชื่อโปรเจกต์: ${p.name}`)
  if (p.area) lines.push(`- พื้นที่ใช้สอย: ${p.area} ตร.ม.`)
  if (p.floors) lines.push(`- จำนวนชั้น: ${p.floors}`)
  if (p.bedrooms) lines.push(`- ห้องนอน: ${p.bedrooms}`)
  if (p.bathrooms) lines.push(`- ห้องน้ำ: ${p.bathrooms}`)
  if (p.style) lines.push(`- สไตล์บ้าน: ${p.style}`)
  if (p.province) lines.push(`- จังหวัด: ${p.province}`)
  if (p.budget) lines.push(`- งบประมาณ: ${p.budget} บาท`)
  if (p.notes) lines.push(`- หมายเหตุ: ${p.notes}`)
  if (lines.length === 1) lines.push('- (ผู้ใช้ไม่ได้กรอกข้อมูล — กรุณาประเมินจากรูปภาพ)')
  lines.push('')
  lines.push(
    'โปรดวิเคราะห์รูป → สร้าง BOQ + รายการวัสดุ 3 เกรด (15-20 รายการ/เกรด) ตอบเป็น JSON ตาม schema ที่กำหนด',
  )
  return lines.join('\n')
}

export async function analyzeHouse(files, projectInfo) {
  if (!files?.length) throw new Error('ต้องแนบไฟล์อย่างน้อย 1 ไฟล์')

  const content = []

  // Attach every uploaded file in the shape Anthropic expects:
  //   image → image block (base64 upload, or remote URL for catalog reference)
  //   pdf   → document block (base64)
  //   sheet → text block with the extracted table content (BOQ/materials)
  let imageCount = 0
  files.forEach((f) => {
    if (f.kind === 'pdf') {
      content.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: f.base64,
        },
      })
      content.push({
        type: 'text',
        text: `ไฟล์เอกสาร PDF: ${f.name || 'ไม่ระบุชื่อ'} — โปรดใช้ประกอบการประเมิน (เช่น แปลนบ้าน)`,
      })
    } else if (f.kind === 'sheet') {
      content.push({
        type: 'text',
        text: `ข้อมูลจากไฟล์ตาราง "${f.name || 'ตาราง'}" (เช่น BOQ / รายการวัสดุ):\n${f.textContent || '(ไม่มีข้อมูล)'}`,
      })
    } else if (f.kind === 'doc') {
      content.push({
        type: 'text',
        text: `ข้อความจากไฟล์เอกสาร Word "${f.name || 'เอกสาร'}":\n${f.textContent || '(ไม่มีข้อมูล)'}`,
      })
    } else {
      // image — catalog reference carries a remote URL (Anthropic fetches it
      // server-side); uploaded images carry base64 data.
      imageCount += 1
      const source =
        f.sourceType === 'url' && f.url
          ? { type: 'url', url: f.url }
          : { type: 'base64', media_type: f.mediaType, data: f.base64 }
      content.push({ type: 'image', source })
      content.push({
        type: 'text',
        text: `รูปที่ ${imageCount}: ${f.tag || 'ไม่ระบุ'}`,
      })
    }
  })

  content.push({ type: 'text', text: buildProjectInfoText(projectInfo) })

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${errText.slice(0, 300)}`)
  }

  const data = await response.json()
  if (data.error) throw new Error(data.error.message || 'AI returned an error')

  const textBlock = (data.content || []).find((b) => b.type === 'text')
  if (!textBlock?.text) throw new Error('AI ไม่ได้ส่งข้อความตอบกลับ')

  return repairJSON(textBlock.text)
}
