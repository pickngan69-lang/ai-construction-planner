import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { loginMember } from './memberAuthApi'
import { useMemberSession } from './useMemberSession'

function MemberLoginPage() {
  const navigate = useNavigate()
  const { setSession } = useMemberSession()
  const { loginMemberUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง')
      return
    }
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน')
      return
    }

    setLoading(true)
    try {
      const user = await loginMember({ email, password })
      setSession(user)
      loginMemberUser(user)
      navigate('/')
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-accent">Member Login</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">เข้าสู่ระบบสมาชิก</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs text-ink-soft">อีเมล</span>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              value={email}
              onChange={(e) => {
                setError('')
                setEmail(e.target.value)
              }}
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">รหัสผ่าน</span>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              value={password}
              onChange={(e) => {
                setError('')
                setPassword(e.target.value)
              }}
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบสมาชิก'}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <Link className="text-accent" to="/register">
            สมัครสมาชิก
          </Link>
          <Link className="text-ink-soft hover:text-accent" to="/pricing">
            ดูแพ็กเกจ
          </Link>
        </div>
      </Card>
    </main>
  )
}

export default MemberLoginPage