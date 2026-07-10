import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatBaht } from '../utils/formatters'
import { HOUSE_PLANS } from '../data/housePlans'

function PlanCard({ plan, onView, onSelect }) {
  return (
    <Card className="overflow-hidden flex flex-col group">
      <button
        type="button"
        onClick={() => onView(plan)}
        className="block text-left aspect-[4/3] relative bg-gradient-to-br from-accent/20 to-elevated overflow-hidden"
      >
        {/* Fallback shown behind the image; if the URL fails, the image hides
            and this emoji placeholder remains visible. */}
        <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-30 pointer-events-none">
          🏠
        </span>
        <img
          src={plan.imageUrl}
          alt={plan.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
          className="relative w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 rounded-full bg-canvas/85 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
          {plan.style}
        </span>
        <span className="absolute top-2 right-2 rounded-full bg-canvas/85 px-2.5 py-1 text-xs font-mono text-accent backdrop-blur">
          {formatBaht(plan.budget)}
        </span>
      </button>

      <div className="p-5 flex flex-col flex-1">
        <button
          type="button"
          onClick={() => onView(plan)}
          className="text-left text-base font-semibold text-ink hover:text-accent transition-colors"
        >
          {plan.title}
        </button>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted mt-1.5">
          <span>📐 {plan.area} ตร.ม.</span>
          <span>🏢 {plan.floors} ชั้น</span>
          <span>🛏 {plan.beds} นอน</span>
          <span>🛁 {plan.baths} น้ำ</span>
        </div>
        <p className="text-sm text-ink-soft mt-3 flex-1">{plan.description}</p>
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" onClick={() => onView(plan)}>
            ดูรายละเอียด
          </Button>
          <Button variant="secondary" onClick={() => onSelect(plan)}>
            วิเคราะห์เลย
          </Button>
        </div>
      </div>
    </Card>
  )
}

function HouseCatalog() {
  const navigate = useNavigate()
  const [budget, setBudget] = useState('')

  const maxBudget = Number(budget) || 0
  const filtered = useMemo(
    () =>
      maxBudget > 0
        ? HOUSE_PLANS.filter((p) => p.budget <= maxBudget)
        : HOUSE_PLANS,
    [maxBudget],
  )

  // ดูรายละเอียด → หน้า /catalog/:id
  const handleView = (plan) => navigate(`/catalog/${plan.id}`)

  // "วิเคราะห์เลย" → ไปหน้าวิเคราะห์ พร้อมแนบข้อมูลแบบบ้านผ่าน router state
  // (ContractorDashboard จะ useLocation มา auto-fill ชื่อ/งบ/พื้นที่ + ตั้งรูปเป็น reference)
  const handleSelect = (plan) =>
    navigate('/', {
      state: {
        housePlan: {
          title: plan.title,
          imageUrl: plan.imageUrl,
          budget: plan.budget,
          area: plan.area,
          floors: plan.floors,
          beds: plan.beds,
          baths: plan.baths,
          style: plan.style,
        },
      },
    })

  return (
    <>
      <Header onBack={() => navigate('/')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-ink">แคตตาล็อกแบบบ้าน</h2>
          <p className="text-sm text-ink-muted mt-1">
            เลือกแบบบ้านที่ตรงกับงบประมาณของลูกค้า แล้วนำไปวิเคราะห์ราคาต่อได้ทันที
          </p>
        </div>

        {/* Budget matching filter */}
        <Card className="p-5">
          <label className="block">
            <span className="block text-sm font-medium text-ink mb-2">
              💰 ระบุงบประมาณของคุณ
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min="0"
                step="100000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="เช่น 3000000"
                className="w-full sm:w-64 rounded-md border border-line bg-canvas px-3 py-2 text-sm font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
              />
              {maxBudget > 0 && (
                <button
                  type="button"
                  onClick={() => setBudget('')}
                  className="text-xs text-ink-muted hover:text-danger transition-colors"
                >
                  ล้างตัวกรอง
                </button>
              )}
              <span className="text-xs text-ink-muted">
                พบ {filtered.length} แบบ
                {maxBudget > 0 && ` ในงบ ≤ ${formatBaht(maxBudget)}`}
              </span>
            </div>
          </label>
        </Card>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm text-ink-soft">
              ไม่พบแบบบ้านในงบประมาณนี้ — ลองเพิ่มงบหรือล้างตัวกรอง
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onView={handleView}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default HouseCatalog
