import { cn } from '../../utils/cn'
import { MATERIAL_GRADES } from '../../utils/constants'

function GradeSelector({ value, onChange, compact = false }) {
  return (
    <div
      className={cn(
        compact
          ? 'flex flex-wrap gap-2'
          : 'grid grid-cols-2 lg:grid-cols-4 gap-3',
      )}
    >
      {MATERIAL_GRADES.map((g) => {
        const active = value === g.id
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            className={cn(
              'rounded-lg border text-left transition-colors',
              compact ? 'px-3 py-2' : 'p-3',
              active
                ? 'border-accent bg-accent/10'
                : 'border-line bg-surface hover:border-ink-muted',
            )}
          >
            <div className="flex items-center gap-2">
              <span className={compact ? 'text-base' : 'text-xl'}>{g.icon}</span>
              <span
                className={cn(
                  'font-semibold',
                  compact ? 'text-sm' : 'text-base',
                  active ? 'text-accent' : 'text-ink',
                )}
              >
                {g.label}
              </span>
              {compact && active && (
                <span className="ml-auto text-accent text-xs">✓</span>
              )}
            </div>
            {!compact && (
              <p className="text-xs text-ink-muted mt-1">{g.desc}</p>
            )}
            {!compact && (
              <p className="text-[11px] text-ink-muted mt-2 font-mono">
                {g.multiplier != null
                  ? `×${g.multiplier.toFixed(2)} ค่าวัสดุ`
                  : 'ระบุราคาเอง'}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default GradeSelector
