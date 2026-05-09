import { useState } from 'react'
import { cn } from '../../utils/cn'

function Tooltip({ content, children, className }) {
  const [open, setOpen] = useState(false)
  if (!content) return children
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 bottom-full z-50 -translate-x-1/2 -translate-y-2 whitespace-pre rounded-md border border-line bg-elevated px-3 py-2 text-xs text-ink shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  )
}

export default Tooltip
