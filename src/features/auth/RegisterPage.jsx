import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { registerMember } from './memberAuthApi'
import { useMemberSession } from './useMemberSession'

function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useMemberSession()
  const { loginMemberUser } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    companyName: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field, value) => {
    setError('')
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้งาน')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง')
      return
    }
    if (form.password.length < 8) {
      setError('รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    setLoading(true)
    try {
      const user = await registerMember({
        ...form,
        selectedPlanCode: location.state?.planCode || 'trial',
      })
      setSession(user)
      loginMemberUser(user)
      navigate('/account/billing')
    } catch (err) {
      setError(err.message || 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-10">
      <Card className="mx-auto max-w-lg p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-accent">Create Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">สมัครสมาชิก</h1>
          <p className="mt-2 text-sm text-ink-soft">
            เริ่มต้นด้วย Free Trial 7 วัน และ AI 3 ครั้ง ก่อนเลือกแพ็กเกจที่เหมาะกับทีม
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs text-ink-soft">ชื่อผู้ใช้งาน</span>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">อีเมล</span>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">ชื่อบริษัท/ทีม</span>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              autoComplete="organization"
            />
          </label>

          <label className="block">
            <span className="text-xs text-ink-soft">รหัสผ่าน</span>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครและเริ่มทดลองใช้'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-soft">
          มีบัญชีแล้ว? <Link className="text-accent" to="/member/login">เข้าสู่ระบบสมาชิก</Link>
        </p>
      </Card>
    </main>
  )
}

export default RegisterPage