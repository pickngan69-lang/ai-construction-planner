import * as XLSX from 'xlsx'
import mammoth from 'mammoth/mammoth.browser'

// Max characters of extracted text to keep the AI payload sane.
const MAX_TEXT_CHARS = 20000

function truncate(text) {
  return text.length > MAX_TEXT_CHARS
    ? text.slice(0, MAX_TEXT_CHARS) + '\n… (ตัดเนื้อหาส่วนที่เกินออก)'
    : text
}

// Detect what kind of file this is, for routing to the right handler.
// Returns 'image' | 'pdf' | 'doc' | 'sheet' | null (unsupported).
export function detectFileKind(file) {
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (
    name.endsWith('.docx') ||
    type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'doc'
  }
  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.csv') ||
    type === 'text/csv' ||
    type.includes('spreadsheet') ||
    type.includes('excel')
  ) {
    return 'sheet'
  }
  return null
}

// Read a File as a base64 string WITHOUT the data-URL prefix (Anthropic wants
// the raw base64 payload for image / document blocks).
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('FileReader did not return a string'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error || new Error('FileReader error'))
    reader.readAsDataURL(file)
  })
}

// Parse Excel (.xlsx/.xls) or CSV → { text, meta:{ sheets:[{name,rows}], totalRows } }
export async function parseSpreadsheet(file) {
  const buf = await file.arrayBuffer()
  const workbook = XLSX.read(buf, { type: 'array' })
  const sheets = []
  const parts = []
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name]
    const csv = XLSX.utils.sheet_to_csv(ws).trim()
    const ref = ws['!ref']
    const range = ref ? XLSX.utils.decode_range(ref) : null
    const rows = range ? range.e.r - range.s.r + 1 : 0
    sheets.push({ name, rows })
    if (csv) parts.push(`[ชีต: ${name}]\n${csv}`)
  }
  const totalRows = sheets.reduce((s, x) => s + x.rows, 0)
  return { text: truncate(parts.join('\n\n')), meta: { sheets, totalRows } }
}

// Extract raw text from a Word .docx → { text, meta:{ chars, preview } }
export async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = (result.value || '').trim()
  const preview = text.slice(0, 140).replace(/\s+/g, ' ')
  return { text: truncate(text), meta: { chars: text.length, preview } }
}

// Best-effort PDF page count from the raw bytes (returns 0 if undeterminable,
// e.g. compressed object streams). Used only for the preview UI.
export async function countPdfPages(file) {
  try {
    const buf = await file.arrayBuffer()
    const str = new TextDecoder('latin1').decode(buf)
    const matches = str.match(/\/Type\s*\/Page(?![a-zA-Z])/g)
    return matches ? matches.length : 0
  } catch {
    return 0
  }
}
