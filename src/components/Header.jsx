import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import ExportButton from './ExportButton'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../utils/constants'

const NAV_ITEMS = [
  { to: '/', icon: '🔍', label: 'วิเคราะห์แบบบ้าน', end: true },
  { to: '/catalog', icon: '🏠', label: 'แคตตาล็อกแบบบ้าน' },
  { to: '/projects', icon: '📋', label: 'โปรเจกต์ทั้งหมด' },
  { to: '/materials', icon: '🏷️', label: 'ราคากลางวัสดุ' },
]

function Header({ children, onBack }) {
  const { user, logout } = useAuth()
  const displayName = user?.name || user?.memberEmail || 'ผู้ใช้งาน'

  const roleBadge =
    user?.role === ROLES.CONTRACTOR
      ? { icon: '👷', label: displayName, color: '#e07a2f' }
      : null

  const handleBack = () => {
    if (typeof onBack === 'function') onBack()
    else window.history.back()
  }

  return (
    <header
      data-print-hide
      className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="mr-1 sm:mr-2 px-2 py-1.5 flex items-center gap-1.5 rounded-md hover:bg-stone-800 transition-colors text-stone-400 hover:text-stone-200 text-sm font-medium border border-transparent hover:border-stone-700"
            title="ย้อนกลับ"
          >
            <span>←</span>
            <span className="hidden sm:inline">ย้อนกลับ</span>
          </button>

          <span className="text-2xl">🏗️</span>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-ink leading-tight">
              AI Construction Planner
            </h1>
            <p className="text-[11px] text-ink-muted hidden sm:block">
              วางแผนก่อสร้างอัจฉริยะ • Powered by Claude
            </p>
          </div>
          {roleBadge && (
            <span
              className="ml-2 hidden sm:inline-flex max-w-40 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] truncate"
              style={{
                backgroundColor: `${roleBadge.color}22`,
                color: roleBadge.color,
                border: `1px solid ${roleBadge.color}55`,
              }}
              title={roleBadge.label}
            >
              <span>{roleBadge.icon}</span>
              <span className="truncate">{roleBadge.label}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {children}
          <ExportButton />
          <ThemeToggle />
          {user && (
            <NavLink
              to="/account/billing"
              className="px-2.5 py-1.5 text-xs rounded-md border border-line text-ink-soft hover:text-ink hover:border-accent transition-colors"
            >
              จัดการโปรไฟล์
            </NavLink>
          )}
          {user && (
            <button
              type="button"
              onClick={logout}
              className="px-2.5 py-1.5 text-xs rounded-md border border-line text-ink-soft hover:text-ink hover:border-danger transition-colors"
            >
              ออกจากระบบ
            </button>
          )}
        </div>
      </div>

      {user && (
        <nav className="border-t border-line/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-accent text-accent'
                      : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
                  }`
                }
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
