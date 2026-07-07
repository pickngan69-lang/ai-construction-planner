import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import { getProjectById, installmentAmount, STATUS_META } from '../data/mockProjects'
import { formatBaht, formatBahtCompact } from '../utils/formatters'

const INSTALLMENT_STATUS = {
  paid: { label: 'ชำระแล้ว', icon: '🟢', color: '#2a9d8f' },
  due: { label: 'รอชำระ', icon: '🟡', color: '#e07a2f' },
  upcoming: { label: 'ยังไม่ถึงกำหนด', icon: '⚪', color: '#78716c' },
}

function StatCard({ icon, label, value, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${accent}22` }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">{label}</p>
          <p className="font-mono text-lg font-medium truncate" style={{ color: accent }}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.payload.fill }}>
          {p.payload.name}: {formatBaht(p.value)}
        </p>
      ))}
    </div>
  )
}

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = getProjectById(id)
  const [copied, setCopied] = useState(false)

  const magicLink = `${window.location.origin}/shared/${id}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for browsers without clipboard API
      window.prompt('คัดลอกลิงก์นี้ส่งให้ลูกค้า:', magicLink)
    }
  }

  const chartData = useMemo(() => {
    if (!project) return []
    const isLoss = project.actualCost > project.boqBudget
    return [
      { name: 'BOQ (สัญญา)', value: project.boqBudget, fill: '#457b9d' },
      { name: 'ต้นทุนจริง', value: project.actualCost, fill: isLoss ? '#e76f51' : '#e07a2f' },
    ]
  }, [project])

  if (!project) {
    return (
      <>
        <Header onBack={() => navigate('/projects')} />
        <main className="max-w-3xl mx-auto px-6 py-12">
          <Card className="p-10 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm text-ink-soft">ไม่พบโปรเจกต์รหัส {id}</p>
          </Card>
        </main>
      </>
    )
  }

  const meta = STATUS_META[project.status]
  const profit = project.boqBudget - project.actualCost
  const isLoss = profit < 0
  const hasCost = project.actualCost > 0

  return (
    <>
      <Header onBack={() => navigate('/projects')} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top bar: title + copy magic link */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-ink">{project.name}</h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
              >
                {meta.icon} {meta.label}
              </span>
            </div>
            <p className="text-sm text-ink-muted mt-1">
              👤 {project.client} · {project.id}
            </p>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 px-4 py-2 rounded-md bg-accent text-canvas text-sm font-medium hover:bg-accent-soft transition-colors"
          >
            {copied ? '✅ คัดลอกแล้ว!' : '🔗 คัดลอกลิงก์ส่งให้ลูกค้า'}
          </button>
        </div>

        {/* House info */}
        <Card className="p-5">
          <p className="text-xs text-ink-muted mb-2">ข้อมูลบ้าน</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
            <span>📐 {project.area} ตร.ม.</span>
            <span>🏢 {project.floors} ชั้น</span>
            <span>🛏 {project.beds} ห้องนอน</span>
            <span>🛁 {project.baths} ห้องน้ำ</span>
            <span>🎨 {project.style}</span>
          </div>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon="💰" label="มูลค่าตามสัญญา (BOQ)" value={formatBahtCompact(project.boqBudget)} accent="#457b9d" />
          <StatCard icon="🧾" label="ต้นทุนจริง" value={hasCost ? formatBahtCompact(project.actualCost) : '—'} accent="#e07a2f" />
          <StatCard
            icon={isLoss ? '📉' : '📈'}
            label={isLoss ? 'ขาดทุน (โดยประมาณ)' : 'กำไร (โดยประมาณ)'}
            value={hasCost ? formatBahtCompact(Math.abs(profit)) : '—'}
            accent={isLoss ? '#e76f51' : '#2a9d8f'}
          />
          <StatCard icon="📊" label="ความคืบหน้า" value={`${project.progress}%`} accent="#8338ec" />
        </div>

        {/* BOQ vs Actual chart */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-ink mb-1">
            เปรียบเทียบ BOQ vs ต้นทุนจริง
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            {hasCost
              ? isLoss
                ? '⚠️ ต้นทุนจริงสูงกว่างบตามสัญญา'
                : '✅ ต้นทุนจริงต่ำกว่างบตามสัญญา (มีกำไร)'
              : 'ยังไม่มีต้นทุนจริง (อยู่ระหว่างประเมินราคา)'}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="name" tick={{ fill: '#a8a29e', fontSize: 12 }} stroke="#292524" />
                <YAxis tick={{ fill: '#a8a29e', fontSize: 11 }} stroke="#292524" tickFormatter={(v) => formatBahtCompact(v)} />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: '#29252455' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Installment history */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-ink mb-4">
            💳 ประวัติการเก็บค่างวด
          </h3>
          <div className="space-y-2">
            {project.installments.map((inst) => {
              const s = INSTALLMENT_STATUS[inst.status] || INSTALLMENT_STATUS.upcoming
              const amount = installmentAmount(project, inst)
              return (
                <div
                  key={inst.no}
                  className="flex items-center gap-3 rounded-lg border border-line bg-elevated/20 px-4 py-3"
                >
                  <span className="text-lg shrink-0">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      งวดที่ {inst.no}: {inst.label}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {inst.percent}% ของมูลค่าสัญญา
                      {inst.date && ` · ชำระเมื่อ ${inst.date}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm text-ink">{formatBaht(amount)}</p>
                    <p className="text-xs" style={{ color: s.color }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-sm">
            <span className="text-ink-soft">เก็บค่างวดแล้ว</span>
            <span className="font-mono text-accent">
              {formatBaht(project.installmentPaid)} / {formatBaht(project.installmentTotal)}
            </span>
          </div>
        </Card>
      </main>
    </>
  )
}

export default ProjectDetail
