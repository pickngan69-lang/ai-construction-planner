// calc engine — "โปรแกรม" คิดราคา BOQ ทั้งหมดจากตารางเรตกลาง (rateTable.js)
// AI ส่งมาแค่ boq_items (ปริมาณ) — ที่นี่คือแหล่งความจริงเดียวของราคา (single source):
//   material_cost = quantity × rate.material
//   labor_cost    = quantity × rate.labor
// + บังคับ guardrail ชนิดฐานราก (ห้ามปน) + จับความผิดปกติเบื้องต้น

import { RATE_BY_KEY, DISCIPLINES, ratesForFoundation } from '../data/rateTable'

const DISCIPLINE_LABEL = Object.fromEntries(DISCIPLINES.map((d) => [d.key, d.label]))
const DISCIPLINE_ORDER = DISCIPLINES.map((d) => d.key)

const round = (n) => Math.round(Number(n) || 0)

// ตรวจระดับภาพรวม (audit) หลังคิดราคาแล้ว — คืน anomalies เพิ่มเติม
// rows = แถวที่คิดราคาแล้ว, area = พื้นที่ใช้สอย (ตร.ม.) ถ้ามี
function auditBoq(rows, total_material_cost, total_labor_cost, area) {
  const out = []

  // 1) หมวดงานที่หายไป — แบบบ้านปกติควรมีครบ 5 หมวด
  for (const d of DISCIPLINES) {
    if (!rows.some((r) => r.discipline === d.key)) {
      out.push({
        type: 'missing_discipline',
        level: 'info',
        key: d.key,
        message: `ไม่พบงานหมวด "${d.label}" — ตรวจว่าแบบไม่มีจริง หรือ AI ถอดตก`,
      })
    }
  }

  // 2) key ซ้ำ — อาจนับซ้ำ (หรือถูกต้องถ้ามาจากหลายแผ่นแบบ)
  const keyCount = {}
  for (const r of rows) if (r.key) keyCount[r.key] = (keyCount[r.key] || 0) + 1
  for (const [k, n] of Object.entries(keyCount)) {
    if (n > 1) {
      out.push({
        type: 'duplicate_key',
        level: 'info',
        key: k,
        message: `รายการ "${RATE_BY_KEY[k]?.name || k}" ปรากฏ ${n} ครั้ง — ตรวจว่าไม่ได้นับซ้ำ`,
      })
    }
  }

  // 3) สัดส่วนวัสดุ:ค่าแรง ผิดปกติ (ปกติ ~0.8–3.0)
  if (total_labor_cost > 0) {
    const ratio = total_material_cost / total_labor_cost
    if (ratio < 0.6 || ratio > 3.5) {
      out.push({
        type: 'ratio_abnormal',
        level: 'warn',
        message: `สัดส่วนวัสดุ:ค่าแรง = ${ratio.toFixed(2)} ผิดปกติ (ปกติ 0.8–3.0) — ตรวจปริมาณ/หน่วย`,
      })
    }
  }

  // 4) ราคารวมต่อ ตร.ม. ผิดปกติ (บ้านทั่วไป ~8,000–30,000 บาท/ตร.ม.)
  const a = Number(area) || 0
  if (a > 0) {
    const perSqm = (total_material_cost + total_labor_cost) / a
    if (perSqm < 6000 || perSqm > 35000) {
      out.push({
        type: 'cost_per_sqm_abnormal',
        level: 'warn',
        message: `ราคารวม ≈ ${Math.round(perSqm).toLocaleString()} บาท/ตร.ม. ผิดปกติ (ปกติ 8,000–30,000) — ตรวจปริมาณรวม`,
      })
    }
  }

  return out
}

// boqItems: [{ key, discipline, name, spec, quantity, unit, drawing_sheet, confidence, note }]
// opts.foundation: 'spread' | 'driven_pile' | 'bored_pile'
// opts.area: พื้นที่ใช้สอย (ตร.ม.) — ใช้ตรวจราคาต่อหน่วยพื้นที่
export function computeBoq(boqItems = [], { foundation = 'spread', area } = {}) {
  const allowedKeys = new Set(ratesForFoundation(foundation).map((r) => r.key))
  const anomalies = []
  const rows = []

  for (const raw of boqItems) {
    const key = raw?.key
    const rate = key ? RATE_BY_KEY[key] : undefined
    const qty = Number(raw?.quantity) || 0

    const item = {
      key: key || '',
      discipline: raw?.discipline || rate?.discipline || 'architecture',
      name: raw?.name || rate?.name || key || 'งานไม่ระบุชื่อ',
      spec: raw?.spec || '',
      quantity: qty,
      unit: raw?.unit || rate?.unit || '',
      drawing_sheet: raw?.drawing_sheet || '',
      confidence: (raw?.confidence || 'medium').toLowerCase(),
      note: raw?.note || '',
      material_cost: 0,
      labor_cost: 0,
      unpriced: false,
    }

    if (!rate) {
      // ไม่พบใน rate table → ไม่รู้ราคา ให้ต้นทุน 0 + flag ให้ผู้ใช้กำหนดเอง
      item.unpriced = true
      anomalies.push({
        type: 'unknown_rate',
        level: 'warn',
        key: key || '',
        message: `ไม่พบเรตในตารางกลางสำหรับ "${item.name}"${key ? ` (key: ${key})` : ''} — รอกำหนดราคา`,
      })
    } else if (rate.foundation && !allowedKeys.has(key)) {
      // งานฐานรากผิดชนิด → guardrail ตัดออก ไม่ให้ปนกัน
      anomalies.push({
        type: 'foundation_mismatch',
        level: 'error',
        key,
        message: `ตัด "${item.name}" ออก — เป็นงานของฐานรากคนละชนิดกับที่เลือก (${foundation})`,
      })
      continue
    } else {
      item.material_cost = round(qty * rate.material)
      item.labor_cost = round(qty * rate.labor)
      item.rate_material = rate.material
      item.rate_labor = rate.labor
      if (qty <= 0) {
        anomalies.push({
          type: 'zero_qty',
          level: 'warn',
          key,
          message: `ปริมาณเป็น 0: "${item.name}" — ตรวจสอบว่าถอดปริมาณครบหรือยัง`,
        })
      }
      if (raw?.unit && rate.unit && raw.unit !== rate.unit) {
        anomalies.push({
          type: 'unit_mismatch',
          level: 'warn',
          key,
          message: `หน่วยไม่ตรงตาราง: "${item.name}" (แบบ=${raw.unit} / เรต=${rate.unit})`,
        })
      }
    }

    if (item.confidence === 'low') {
      anomalies.push({
        type: 'low_confidence',
        level: 'info',
        key: key || '',
        message: `AI ไม่มั่นใจรายการ "${item.name}" — โปรดยืนยันก่อนใช้ราคา`,
      })
    }

    rows.push(item)
  }

  // จัดกลุ่มเป็น phases ตาม discipline — คงรูป phases[].tasks[] ให้ downstream เดิมใช้ได้
  const byDisc = {}
  for (const it of rows) {
    const disc = DISCIPLINE_LABEL[it.discipline] ? it.discipline : 'architecture'
    ;(byDisc[disc] ||= []).push({
      name: it.name,
      quantity: it.quantity,
      unit: it.unit,
      material_cost: it.material_cost,
      labor_cost: it.labor_cost,
      details: [
        it.spec,
        it.drawing_sheet && `แบบ: ${it.drawing_sheet}`,
        it.note,
      ]
        .filter(Boolean)
        .join(' • '),
      // ข้อมูลเพิ่มเพื่อ UI (badge ความมั่นใจ / อ้างอิงแบบ / งานที่ยังไม่มีราคา)
      discipline: it.discipline,
      drawing_sheet: it.drawing_sheet,
      confidence: it.confidence,
      spec: it.spec,
      unpriced: it.unpriced,
    })
  }

  const phases = DISCIPLINE_ORDER.filter((d) => byDisc[d]?.length).map((d) => ({
    name: DISCIPLINE_LABEL[d],
    discipline: d,
    tasks: byDisc[d],
  }))

  const total_material_cost = rows.reduce((s, r) => s + (r.material_cost || 0), 0)
  const total_labor_cost = rows.reduce((s, r) => s + (r.labor_cost || 0), 0)

  // ตรวจระดับภาพรวม (หมวดหาย/นับซ้ำ/สัดส่วน/ราคาต่อ ตร.ม.)
  anomalies.push(...auditBoq(rows, total_material_cost, total_labor_cost, area))

  // reconcile: ยอดรวมจาก phases ต้องเท่ากับยอดรวมจาก rows (กันเลขไม่ตรงกันทุกระดับ)
  const phaseMaterial = phases.reduce(
    (s, ph) => s + ph.tasks.reduce((t, k) => t + (k.material_cost || 0), 0),
    0,
  )
  const phaseLabor = phases.reduce(
    (s, ph) => s + ph.tasks.reduce((t, k) => t + (k.labor_cost || 0), 0),
    0,
  )
  const reconciled =
    phaseMaterial === total_material_cost && phaseLabor === total_labor_cost
  if (!reconciled) {
    anomalies.push({
      type: 'reconcile_failed',
      level: 'error',
      message: 'ยอดรวมแต่ละระดับไม่ตรงกัน — ระบบคำนวณผิดพลาด โปรดลองใหม่',
    })
  }

  return {
    phases,
    rows,
    anomalies,
    total_material_cost,
    total_labor_cost,
    reconciled,
  }
}
