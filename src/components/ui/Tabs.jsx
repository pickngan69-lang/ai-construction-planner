import { cn } from '../../utils/cn'

function Tabs({ items, value, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-canvas'
                : 'text-ink-soft hover:bg-elevated hover:text-ink',
            )}
          >
            {item.icon && <span className="mr-1.5">{item.icon}</span>}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
