import { ANTHROPIC_MODEL, ANTHROPIC_MAX_TOKENS } from '../utils/constants'
import { repairJSON } from '../utils/jsonRepair'
import { DISCIPLINES, FOUNDATION_TYPES, ratesForFoundation } from '../data/rateTable'
import { computeBoq } from './boqEngine'
import { priceMaterials, materialKeysText } from '../data/materialTable'

const SYSTEM_PROMPT = `คุณคือ "ผู้ถอดแบบ" (QS) + สถาปนิก/วิศวกรที่อ่านแบบก่อสร้างบ้านในไทย
หน้าที่เดียวของคุณ: อ่านแบบ → "ถอดปริมาณงาน" (quantity take-off) ให้ครบและแม่นยำ

🚫 กฎเหล็ก (ผิดข้อใดข้อหนึ่ง = งานเสีย):
1. ห้ามคิดราคา/ต้นทุน/ยอดรวมใดๆ ทั้งสิ้น — "โปรแกรม" จะคูณราคาจากตารางเรตกลางเอง
   (อย่าใส่ field ราคา เช่น material_cost, labor_cost, price ใน boq_items เด็ดขาด)
2. ห้ามเปลี่ยนสเปกวัสดุไปจากแบบ — ระบุตามที่เห็นในแบบเท่านั้น ถ้าแบบไม่บอกให้ทิ้งว่าง/หมายเหตุ
3. ห้ามคิดงานที่ไม่มีในแบบ (ห้ามเดา/ห้ามแถม) — ถ้าไม่แน่ใจให้ confidence:"low" + note บอกเหตุผล
4. ทุกรายการต้องอ้าง "แผ่นแบบ" (drawing_sheet) ที่เอาข้อมูลมา เช่น "S-02", "A-04" ถ้าไม่ทราบใส่ ""
5. ชนิดฐานราก: ผู้ใช้ล็อกมาแล้ว 1 ชนิด — ใช้เฉพาะรายการฐานรากของชนิดนั้น ห้ามปนชนิดอื่น
6. ครอบคลุม 5 หมวดงาน: ${DISCIPLINES.map((d) => d.label).join(' / ')}

การจับคู่ key:
- แต่ละรายการให้เลือก "key" จาก "ตารางเรตที่อนุญาต" (แนบมาในข้อความผู้ใช้) ที่ตรงที่สุด
- ถ้าไม่มี key ที่ตรงจริงๆ ให้ key:"" แล้วอธิบายใน name/note (โปรแกรมจะ flag ให้ผู้ใช้กำหนดราคาเอง)
- หน่วย (unit) ต้องตรงกับหน่วยของ key นั้นในตาราง (เช่น คอนกรีต=ลบ.ม., ก่อ/ฉาบ/ทาสี=ตร.ม., เสาเข็ม=ต้น, จุดไฟฟ้า/ประปา=จุด)

การวัดปริมาณ (ให้ระบุใน note ว่าคิดจากอะไร):
- ก่ออิฐ/ฉาบ/ทาสี → พื้นที่ผนัง (กว้าง×สูง หักช่องเปิด)
- พื้น/ฝ้า/หลังคา → พื้นที่ตร.ม.
- คอนกรีต (เสา/คาน/ฐาน) → ปริมาตรลบ.ม. (กว้าง×ยาว×สูง×จำนวน)
- เสาเข็ม/ประตู/หน้าต่าง/สุขภัณฑ์/จุดระบบ → นับจำนวน

ข้อกำหนด output:
- ตอบกลับเป็น JSON เท่านั้น (ห้ามมีข้อความอื่น/ห้าม markdown fence)
- boq_items = รายการถอดปริมาณงานทั้งหมด (ไม่มีราคา)
- material_items = รายการวัสดุที่ต้องใช้ — เลือก "key" จาก "ตารางวัสดุที่อนุญาต" + ใส่ "ปริมาณ" ที่ประเมินจากแบบ
  ⚠️ ห้ามใส่ราคา (pricePerUnit) — โปรแกรมจะเติมราคา 3 เกรดจากตารางกลางเอง
  ถ้าเห็นสเปก/ยี่ห้อในแบบ ใส่ใน spec ได้ (เป็นหมายเหตุ) แต่ราคายังมาจากตาราง
- uncertainties = งาน/ข้อมูลที่ไม่แน่ใจและต้องให้ผู้ใช้ยืนยัน
- ห้ามใส่ duration_days, schedule, dates, timeline ใดๆ (ผู้ใช้จัดตารางเวลาเอง)

JSON schema (V6 — extraction only, ไม่มีราคาใดๆ):
{
  "house_analysis": { "type": "string", "estimated_size_sqm": number, "floors": number, "style": "string", "description": "string" },
  "boq_items": [
    {
      "key": "string (จากตารางเรตที่อนุญาต หรือ "")",
      "discipline": "architecture|structure|electrical|sanitary|mechanical",
      "name": "string (ชื่องานตามแบบ)",
      "spec": "string (สเปกจากแบบ ถ้าไม่มีใส่ "")",
      "quantity": number,
      "unit": "string",
      "drawing_sheet": "string (เลขแผ่นแบบ)",
      "confidence": "high|medium|low",
      "note": "string (วิธีคิดปริมาณ/ข้อสงสัย)"
    }
  ],
  "material_items": [
    { "key": "string (จากตารางวัสดุที่อนุญาต หรือ "")", "name": "string", "quantity": number, "unit": "string", "spec": "string (สเปกจากแบบ ถ้ามี)" }
  ],
  "uncertainties": ["string"],
  "recommendations": ["string"],
  "risks": [{ "risk": "string", "prevention": "string" }],
  "permits": ["string"]
}`

// ตารางเรตที่ "อนุญาต" ตามชนิดฐานรากที่ผู้ใช้เลือก — จัดกลุ่มตามหมวดงานให้ AI จับคู่ key
function buildAllowedRatesText(foundationKey) {
  const rates = ratesForFoundation(foundationKey)
  const byDisc = new Map(DISCIPLINES.map((d) => [d.key, []]))
  for (const r of rates) {
    if (!byDisc.has(r.discipline)) byDisc.set(r.discipline, [])
    byDisc.get(r.discipline).push(`${r.key} = ${r.name} [${r.unit}]`)
  }
  const out = ['ตารางเรตที่อนุญาต (เลือก key ที่ตรงที่สุด, ห้ามคิดราคา — โปรแกรมคูณราคาเอง):']
  for (const d of DISCIPLINES) {
    const items = byDisc.get(d.key) || []
    if (items.length) out.push(`• ${d.label}: ${items.join(' | ')}`)
  }
  return out.join('\n')
}

function buildProjectInfoText(p) {
  const foundation =
    FOUNDATION_TYPES.find((f) => f.key === p.foundation) || FOUNDATION_TYPES[0]
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
  lines.push('')
  lines.push(
    `⚠️ ชนิดฐานรากที่ล็อกไว้: ${foundation.label} — ใช้เฉพาะงานฐานรากของชนิดนี้ ห้ามปนชนิดอื่นเด็ดขาด`,
  )
  lines.push('')
  lines.push(buildAllowedRatesText(p.foundation))
  lines.push('')
  lines.push(
    'ตารางวัสดุที่อนุญาต (เลือก key ที่ตรงที่สุดสำหรับ material_items, ห้ามใส่ราคา):',
  )
  lines.push(materialKeysText())
  lines.push('')
  lines.push(
    'โปรดอ่านแบบ → ถอดปริมาณงานทั้ง 5 หมวด (boq_items) + รายการวัสดุที่ต้องใช้ (material_items) โดยไม่ใส่ราคาใดๆ ตอบเป็น JSON ตาม schema V6 เท่านั้น',
  )
  return lines.join('\n')
}

// Anthropic only fetches image URLs that are HTTPS and publicly reachable.
// Remote https catalog images pass through as `url` sources; local/relative
// ones (e.g. /plans/house.png) can't be fetched by Anthropic, so we download
// them in the browser and inline as base64 instead.
async function resolveImageSource(f) {
  if (f.sourceType === 'url' && f.url) {
    if (/^https:\/\//i.test(f.url)) {
      return { type: 'url', url: f.url }
    }
    const res = await fetch(f.url)
    if (!res.ok) {
      throw new Error(`โหลดรูปอ้างอิงไม่สำเร็จ: ${f.url} (HTTP ${res.status})`)
    }
    const blob = await res.blob()
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('อ่านรูปอ้างอิงไม่สำเร็จ'))
      reader.readAsDataURL(blob)
    })
    return {
      type: 'base64',
      media_type: blob.type || f.mediaType || 'image/png',
      data: String(dataUrl).split(',')[1],
    }
  }
  return { type: 'base64', media_type: f.mediaType, data: f.base64 }
}

// Read an Anthropic SSE stream (text/event-stream) and return the concatenated
// text output. Streaming keeps the connection alive during long analyses so
// proxies/platforms don't cut it (fixes large-PDF timeouts).
async function readAnthropicStream(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  let streamError = null

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let nl
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      let evt
      try {
        evt = JSON.parse(payload)
      } catch {
        continue
      }
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        text += evt.delta.text
      } else if (evt.type === 'error') {
        streamError = evt.error?.message || 'AI stream error'
      }
    }
  }
  if (streamError) throw new Error(streamError)
  return text
}

export async function analyzeHouse(files, projectInfo) {
  if (!files?.length) throw new Error('ต้องแนบไฟล์อย่างน้อย 1 ไฟล์')

  const content = []

  // Attach every uploaded file in the shape Anthropic expects:
  //   image → image block (base64 upload, or remote URL for catalog reference)
  //   pdf   → document block (base64)
  //   sheet → text block with the extracted table content (BOQ/materials)
  let imageCount = 0
  for (const f of files) {
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
      // image — catalog reference may be a remote https URL (Anthropic fetches
      // it) or a local /plans/ image (inlined as base64); uploads are base64.
      imageCount += 1
      const source = await resolveImageSource(f)
      content.push({ type: 'image', source })
      content.push({
        type: 'text',
        text: `รูปที่ ${imageCount}: ${f.tag || 'ไม่ระบุ'}`,
      })
    }
  }

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
      stream: true, // สตรีมคำตอบ → connection ไม่ถูกตัดตอนวิเคราะห์ไฟล์ใหญ่
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${errText.slice(0, 300)}`)
  }

  // Streaming response (SSE) → อ่านทีละ chunk สะสมเป็นข้อความ
  // เผื่อ server ไม่รองรับ stream → fallback อ่านเป็น JSON ก้อนเดียว
  const contentType = response.headers.get('content-type') || ''
  let text
  if (contentType.includes('text/event-stream') && response.body) {
    text = await readAnthropicStream(response.body)
  } else {
    const rawBody = await response.text().catch(() => '')
    let data
    try {
      data = JSON.parse(rawBody)
    } catch {
      throw new Error(
        rawBody
          ? `เซิร์ฟเวอร์ตอบไม่ใช่ JSON (status ${response.status}, ${rawBody.length} bytes): ${rawBody.slice(0, 200)}`
          : `เซิร์ฟเวอร์ตอบกลับว่างเปล่า (status ${response.status}) — คำขอถูกตัดกลางทาง`,
      )
    }
    if (data.error) throw new Error(data.error.message || 'AI returned an error')
    text = (data.content || []).find((b) => b.type === 'text')?.text || ''
  }

  if (!text) throw new Error('AI ไม่ได้ส่งข้อความตอบกลับ')
  let parsed
  try {
    parsed = repairJSON(text)
  } catch {
    throw new Error('AI ตอบกลับไม่ครบ (JSON ถูกตัดกลางคัน) — ลองวิเคราะห์ใหม่')
  }

  // V6: AI ส่ง boq_items (ปริมาณ, ไม่มีราคา) → "โปรแกรม" คูณราคาจากตารางเรตกลาง
  // = แหล่งความจริงเดียวของ phases/ราคา/ยอดรวม (single source of truth)
  const anomalies = []
  if (Array.isArray(parsed.boq_items)) {
    const boq = computeBoq(parsed.boq_items, {
      foundation: projectInfo?.foundation,
      area: Number(projectInfo?.area) || 0,
    })
    parsed.phases = boq.phases
    parsed.total_material_cost = boq.total_material_cost
    parsed.total_labor_cost = boq.total_labor_cost
    anomalies.push(...boq.anomalies)
  }

  // V6: AI ส่ง material_items (key+ปริมาณ, ไม่มีราคา) → "โปรแกรม" เติมราคา+สเปก 3 เกรด
  // จากตารางวัสดุกลาง (materialTable.js) — ราคาวัสดุมาจากโปรแกรม ไม่ใช่ AI
  if (Array.isArray(parsed.material_items)) {
    const m = priceMaterials(parsed.material_items)
    parsed.materials = { economy: m.economy, standard: m.standard, premium: m.premium }
    anomalies.push(...m.anomalies)
  }

  // รวม flag จาก engine (guardrail/หน่วย/ปริมาณ 0/วัสดุไม่มีเรต) กับที่ AI แจ้งไม่แน่ใจ
  parsed.boq_anomalies = anomalies
  parsed.uncertainties = parsed.uncertainties || []
  return parsed
}
