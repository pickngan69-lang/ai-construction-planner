import { useTheme } from '../contexts/ThemeContext'

function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
      className={`w-9 h-9 rounded-md border border-line text-ink-soft hover:text-ink hover:border-accent transition-colors flex items-center justify-center ${className}`}
    >
      {isDark ? '🌞' : '🌙'}
    </button>
  )
}

export default ThemeToggle
