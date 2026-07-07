import { useParams } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { getCustomerView, STATUS_META } from '../data/mockProjects'
import { formatBaht } from '../utils/formatters'

// 🔒 CUSTOMER-FACING (Magic Link, read-only).
// ห้ามแสดง/อ้างอิงต้นทุนวัสดุฝั่งผู้รับเหมา (actualCost) หรือกำไร (profit) เด็ดขาด.
// หน้านี้ดึงข้อมูลผ่าน getCustomerView() เท่านั้น ซึ่งตัดฟิลด์ต้องห้ามออกตั้งแต่ต้นทาง.

const PAYMENT_STATUS = {
  paid: { label: 'ชำระแล้ว', icon: '🟢', color: '#2a9d8f' },
  due: { label: 'รอชำระ', icon: '🟡', color: '#e07a2f' },
  upcoming: { label: 'ยังไม่ถึงกำหนด', icon: '⚪', color: '#78716c' },
}

function TopBar() {
  return (
    <header className="border-b border-line/60">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏗️</span>
          <div>
            <p className="text-sm font-semibold text-ink leading-tight">
              AI Construction Planner
            </p>
            <p className="text-[11px] text-ink-muted">รายงานความคืบหน้าสำหรับลูกค้า</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}

function CustomerSummary() {
  const { id } = useParams()
  const project = getCustomerView(id)

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas">
        <TopBar />
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <h1 className="text-lg font-semibold text-ink">ไม่พบรายงานโครงการ</h1>
          <p className="text-sm text-ink-muted mt-1">
            ลิงก์อาจไม่ถูกต้องหรือหมดอายุ — โปรดติดต่อผู้รับเหมาของคุณ
          </p>
        </main>
      </div>
    )
  }

  const meta = STATUS_META[project.status]

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar />

      <main className="max-w-3xl mx-auto px-6 py-8 sm:py-12 space-y-8">
        {/* Hero */}
        <section className="text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
          >
            {meta.icon} {meta.label}
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink mt-4">
            {project.name}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-ink-muted mt-3">
            <span>📐 {project.area} ตร.ม.</span>
            <span>🏢 {project.floors} ชั้น</span>
            <span>🛏 {project.beds} ห้องนอน</span>
            <span>🛁 {project.baths} ห้องน้ำ</span>
            <span>🎨 {project.style}</span>
          </div>
        </section>

        {/* Progress */}
        <section className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink-muted mb-2">ความคืบหน้าการก่อสร้าง</p>
          <p className="font-mono text-5xl font-semibold text-accent">
            {project.progress}%
          </p>
          <div className="h-3 rounded-full bg-elevated overflow-hidden mt-5 max-w-md mx-auto">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <p className="text-xs text-ink-muted mt-3">
            {project.progress === 0
              ? 'อยู่ระหว่างเตรียมงาน / ประเมินราคา'
              : project.progress >= 100
                ? 'ก่อสร้างแล้วเสร็จ ส่งมอบเรียบร้อย'
                : 'อยู่ระหว่างดำเนินการก่อสร้าง'}
          </p>
        </section>

        {/* Payment status */}
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-ink">สถานะการชำระค่างวด</h2>
            <span className="text-xs text-ink-muted">
              มูลค่าโครงการ {formatBaht(project.contractValue)}
            </span>
          </div>
          <p className="text-xs text-ink-muted mb-5">
            ชำระแล้ว {formatBaht(project.paidAmount)} จาก{' '}
            {formatBaht(project.contractTotal)}
          </p>

          <div className="space-y-2.5">
            {project.installments.map((inst) => {
              const s = PAYMENT_STATUS[inst.status] || PAYMENT_STATUS.upcoming
              return (
                <div
                  key={inst.no}
                  className="flex items-center gap-3 rounded-xl border border-line/70 px-4 py-3"
                >
                  <span className="text-lg shrink-0">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      งวดที่ {inst.no}: {inst.label}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {inst.percent}% ของมูลค่าโครงการ
                      {inst.date && ` · ชำระเมื่อ ${inst.date}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm text-ink">
                      {formatBaht(inst.amount)}
                    </p>
                    <p className="text-xs" style={{ color: s.color }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <p className="text-center text-xs text-ink-muted pb-4">
          รายงานนี้จัดทำโดยผู้รับเหมาของคุณ ผ่านระบบ AI Construction Planner
        </p>
      </main>
    </div>
  )
}

export default CustomerSummary
