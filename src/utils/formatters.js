const numberFmt = new Intl.NumberFormat('th-TH')
const compactFmt = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  return numberFmt.format(Math.round(n))
}

export function formatBaht(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '฿0'
  return `฿${numberFmt.format(Math.round(n))}`
}

export function formatBahtCompact(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '฿0'
  return `฿${compactFmt.format(n)}`
}

export function formatDays(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0 วัน'
  return `${numberFmt.format(Math.round(n))} วัน`
}

export function daysToMonths(days) {
  const n = Number(days)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.ceil(n / 30)
}

// ---- Thai number-to-text (สำหรับสัญญา / เอกสารราชการ) ----
const THAI_DIGITS = [
  '',
  'หนึ่ง',
  'สอง',
  'สาม',
  'สี่',
  'ห้า',
  'หก',
  'เจ็ด',
  'แปด',
  'เก้า',
]
const THAI_PLACES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

// Read a 1–6 digit chunk into Thai words (ไม่รวม "ล้าน")
function readChunk(numStr) {
  const len = numStr.length
  let out = ''
  for (let i = 0; i < len; i++) {
    const d = parseInt(numStr[i], 10)
    const place = len - i - 1 // 0=unit, 1=tens, 2=hundreds, ...
    if (d === 0) continue
    if (place === 0) {
      // Unit place: "เอ็ด" if it's a unit after tens, else "หนึ่ง"
      if (d === 1 && len > 1) out += 'เอ็ด'
      else out += THAI_DIGITS[d]
    } else if (place === 1) {
      // Tens place: special rules for 1 ("สิบ") and 2 ("ยี่สิบ")
      if (d === 1) out += 'สิบ'
      else if (d === 2) out += 'ยี่สิบ'
      else out += THAI_DIGITS[d] + 'สิบ'
    } else {
      out += THAI_DIGITS[d] + THAI_PLACES[place]
    }
  }
  return out
}

/**
 * Convert a positive number (baht) to Thai text. Supports up to 999,999,999.
 * - Whole baht → "...บาทถ้วน"
 * - Decimal   → "...บาท....สตางค์"
 *
 * Examples:
 *   numberToThaiText(187070) → "หนึ่งแสนแปดหมื่นเจ็ดพันเจ็ดสิบบาทถ้วน"
 *   numberToThaiText(21)     → "ยี่สิบเอ็ดบาทถ้วน"
 *   numberToThaiText(1000.5) → "หนึ่งพันบาทห้าสิบสตางค์"
 */
export function numberToThaiText(value) {
  const n = Math.abs(Number(value) || 0)
  if (n === 0) return 'ศูนย์บาทถ้วน'

  const baht = Math.floor(n)
  const satang = Math.round((n - baht) * 100)

  let result = ''
  if (baht > 0) {
    const str = baht.toString()
    if (str.length > 6) {
      const millions = str.slice(0, -6)
      const rest = str.slice(-6)
      result += readChunk(millions) + 'ล้าน'
      if (rest !== '000000') result += readChunk(rest)
    } else {
      result += readChunk(str)
    }
    result += 'บาท'
  }

  if (satang > 0) {
    result += readChunk(satang.toString().padStart(2, '0').replace(/^0+/, '')) +
      'สตางค์'
  } else {
    result += 'ถ้วน'
  }

  return result
}
