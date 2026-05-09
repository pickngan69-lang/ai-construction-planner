import { useEffect, useState } from 'react'

function GuidePopup({ title, children, label = '💡' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={title || 'คู่มือการใช้งาน'}
        aria-label={title || 'คู่มือการใช้งาน'}
        data-print-hide
        className="w-6 h-6 rounded-full border border-line text-ink-muted hover:text-accent hover:border-accent transition-colors flex items-center justify-center text-xs"
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          data-print-hide
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                💡 {title}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิด"
                className="w-7 h-7 rounded-full text-ink-soft hover:text-ink hover:bg-elevated"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-ink-soft space-y-2 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GuidePopup
