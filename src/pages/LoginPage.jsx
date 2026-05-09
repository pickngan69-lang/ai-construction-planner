import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../contexts/AuthContext'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

function LoginPage() {
  const { loginContractor, loginHomeowner } = useAuth()
  const [tab, setTab] = useState('contractor')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)

  const submitContractor = (e) => {
    e.preventDefault()
    setError(null)
    const r = loginContractor(password)
    if (!r.ok) setError(r.error)
  }

  const submitHomeowner = (e) => {
    e.preventDefault()
    setError(null)
    const r = loginHomeowner(pin)
    if (!r.ok) setError(r.error)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <p className="text-3xl mb-2">🏗️</p>
            <h1 className="text-xl font-semibold text-ink">
              AI Construction Planner
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              เข้าสู่ระบบเพื่อเริ่มใช้งาน
            </p>
          </div>

          <div
            role="tablist"
            className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-elevated/50 p-1 mb-5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'contractor'}
              onClick={() => {
                setTab('contractor')
                setError(null)
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === 'contractor'
                  ? 'bg-accent text-canvas'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              👷 ผู้รับเหมา
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'homeowner'}
              onClick={() => {
                setTab('homeowner')
                setError(null)
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === 'homeowner'
                  ? 'bg-accent text-canvas'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              🏠 เจ้าของบ้าน
            </button>
          </div>

          {tab === 'contractor' ? (
            <form onSubmit={submitContractor} className="space-y-4">
              <div>
                <label className="block text-xs text-ink-soft mb-1.5">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านสำหรับผู้รับเหมา"
                  className={inputClass}
                  autoFocus
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  💡 demo: ใช้ <code className="font-mono">admin</code>
                </p>
              </div>
              {error && (
                <p className="text-sm text-danger">⚠️ {error}</p>
              )}
              <Button type="submit" size="lg" className="w-full">
                เข้าสู่ระบบในฐานะผู้รับเหมา
              </Button>
            </form>
          ) : (
            <form onSubmit={submitHomeowner} className="space-y-4">
              <div>
                <label className="block text-xs text-ink-soft mb-1.5">
                  PIN 6 หลัก
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  className={`${inputClass} font-mono text-center text-lg tracking-widest`}
                  autoFocus
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  💡 demo: ใส่ตัวเลข 6 หลักอะไรก็ได้
                </p>
              </div>
              {error && (
                <p className="text-sm text-danger">⚠️ {error}</p>
              )}
              <Button type="submit" size="lg" className="w-full">
                เข้าสู่ระบบในฐานะเจ้าของบ้าน
              </Button>
            </form>
          )}

          <p className="text-[11px] text-ink-muted text-center mt-6">
            💼 ผู้รับเหมา: ใช้งานเต็มรูปแบบ • 🏠 เจ้าของบ้าน:
            ดูความคืบหน้าและงวดงาน
          </p>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
