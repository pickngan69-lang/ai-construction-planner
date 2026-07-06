import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../contexts/AuthContext'

const inputClass =
  'w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors'

// Contractor-only login. The homeowner role was removed — this app now serves
// contractors exclusively.
function LoginPage() {
  const { loginContractor } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    setError(null)
    const r = loginContractor(password)
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
              สำหรับผู้รับเหมา — เข้าสู่ระบบเพื่อเริ่มใช้งาน
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
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
            {error && <p className="text-sm text-danger">⚠️ {error}</p>}
            <Button type="submit" size="lg" className="w-full">
              เข้าสู่ระบบ
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
