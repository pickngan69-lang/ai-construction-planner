import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import Card from '../ui/Card'
import { PHASE_COLORS } from '../../utils/constants'
import { formatBaht, formatBahtCompact, formatDays } from '../../utils/formatters'

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
          <p
            className="font-mono text-lg font-medium text-ink truncate"
            style={{ color: accent }}
          >
            {value}
          </p>
        </div>
      </div>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
      {label && <p className="text-ink font-medium mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {formatBaht(p.value)}
        </p>
      ))}
    </div>
  )
}

function DashboardTab({ result }) {
  const phaseData = useMemo(() => {
    return (result.phases || []).map((phase, idx) => {
      const tasks = (result.allTasks || []).filter((t) => t.phaseIdx === idx)
      const material = tasks.reduce(
        (s, t) => s + (t.material_cost_adjusted || 0),
        0,
      )
      const labor = tasks.reduce((s, t) => s + (t.labor_cost || 0), 0)
      return {
        name: phase.name,
        material,
        labor,
        total: material + labor,
        fill: PHASE_COLORS[idx % PHASE_COLORS.length],
      }
    })
  }, [result])

  const totalMaterial = result.total_material_cost_adjusted || 0
  const totalLabor = result.total_labor_cost || 0
  const totalCost = totalMaterial + totalLabor
  const totalDays = result.totalDays || 0

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon="📅"
          label="ระยะเวลารวม"
          value={formatDays(totalDays)}
          accent="#e07a2f"
        />
        <StatCard
          icon="💰"
          label="งบประมาณรวม"
          value={formatBahtCompact(totalCost)}
          accent="#2a9d8f"
        />
        <StatCard
          icon="🔨"
          label="ค่าแรงรวม"
          value={formatBahtCompact(totalLabor)}
          accent="#457b9d"
        />
        <StatCard
          icon="🧱"
          label="ค่าวัสดุรวม"
          value={formatBahtCompact(totalMaterial)}
          accent="#8338ec"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie: phase share */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink mb-3">
            สัดส่วนค่าใช้จ่ายแต่ละเฟส
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phaseData}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {phaseData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="#1c1917" />
                  ))}
                </Pie>
                <RTooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: '#a8a29e' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar: material vs labor per phase */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink mb-3">
            ค่าวัสดุ vs ค่าแรง (แยกตามเฟส)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#a8a29e', fontSize: 11 }}
                  stroke="#292524"
                />
                <YAxis
                  tick={{ fill: '#a8a29e', fontSize: 11 }}
                  stroke="#292524"
                  tickFormatter={(v) => formatBahtCompact(v)}
                />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: '#29252455' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a8a29e' }} />
                <Bar dataKey="material" name="ค่าวัสดุ" fill="#e07a2f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="labor" name="ค่าแรง" fill="#457b9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Phase breakdown text */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-ink mb-3">รายละเอียดแต่ละเฟส</h3>
        <div className="space-y-2">
          {phaseData.map((p, i) => {
            const pct = totalCost > 0 ? (p.total / totalCost) * 100 : 0
            return (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.fill }}
                />
                <span className="text-sm text-ink w-32 sm:w-40 truncate">
                  {p.name}
                </span>
                <div className="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, backgroundColor: p.fill }}
                  />
                </div>
                <span className="font-mono text-xs text-ink-soft w-12 text-right">
                  {pct.toFixed(0)}%
                </span>
                <span className="font-mono text-xs text-ink-muted w-20 text-right">
                  {formatBahtCompact(p.total)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default DashboardTab
