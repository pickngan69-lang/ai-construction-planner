import { cn } from '../../utils/cn'

const VARIANTS = {
  primary:
    'bg-accent text-canvas hover:bg-accent-soft disabled:bg-elevated disabled:text-ink-muted',
  secondary:
    'border border-line bg-surface text-ink hover:border-accent hover:text-accent',
  ghost: 'text-ink-soft hover:text-ink hover:bg-elevated',
  danger: 'bg-danger text-canvas hover:opacity-90',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
