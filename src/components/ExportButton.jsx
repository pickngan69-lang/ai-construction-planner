import { useState } from 'react'
import { exportCurrentSection } from '../utils/exportPdf'

function ExportButton({ className = '' }) {
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      await exportCurrentSection()
    } catch (err) {
      console.error('Export failed:', err)
      alert(`Export ล้มเหลว: ${err?.message || 'unknown'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title={busy ? 'กำลัง Export...' : 'Export PDF'}
      aria-label="Export PDF"
      className={`w-9 h-9 rounded-md border border-line text-ink-soft hover:text-ink hover:border-accent disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center justify-center ${className}`}
    >
      {busy ? '⏳' : '📤'}
    </button>
  )
}

export default ExportButton
