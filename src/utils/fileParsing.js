import * as XLSX from 'xlsx'

// Max characters of extracted spreadsheet text to keep the AI payload sane.
const MAX_SHEET_CHARS = 20000

// Detect what kind of file this is, for routing to the right handler.
// Returns 'image' | 'pdf' | 'sheet' | null (unsupported).
export function detectFileKind(file) {
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
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

// Parse an Excel (.xlsx/.xls) or CSV file into a plain-text (CSV per sheet)
// representation suitable for sending to the AI as textual context.
export async function parseSpreadsheet(file) {
  const buf = await file.arrayBuffer()
  const workbook = XLSX.read(buf, { type: 'array' })
  const parts = []
  for (const sheetName of workbook.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]).trim()
    if (csv) parts.push(`[ชีต: ${sheetName}]\n${csv}`)
  }
  let text = parts.join('\n\n')
  if (text.length > MAX_SHEET_CHARS) {
    text = text.slice(0, MAX_SHEET_CHARS) + '\n… (ตัดเนื้อหาส่วนที่เกินออก)'
  }
  return text
}
