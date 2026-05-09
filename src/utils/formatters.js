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
