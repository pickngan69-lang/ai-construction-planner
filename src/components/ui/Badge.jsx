import { cn } from '../../utils/cn'
import { PHASE_COLORS } from '../../utils/constants'

function Badge({ phaseIdx, color, children, className }) {
  const bg = color || (phaseIdx != null ? PHASE_COLORS[phaseIdx % PHASE_COLORS.length] : '#444')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: `${bg}22`, color: bg, border: `1px solid ${bg}55` }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: bg }}
      />
      {children}
    </span>
  )
}

export default Badge
