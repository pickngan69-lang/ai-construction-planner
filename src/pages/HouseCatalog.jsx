import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatBaht } from '../utils/formatters'

// Premium mock catalog of house plans. `budget` is the estimated turnkey price
// used by the budget-matching filter below.
const HOUSE_PLANS = [
  {
    id: 'HP-01',
    title: 'บ้านโมเดิร์นชั้นเดียว',
    style: 'Modern',
    imageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60',
    budget: 1450000,
    area: 95,
    beds: 2,
    baths: 2,
    description:
      'บ้านชั้นเดียวสไตล์โมเดิร์น เส้นสายเรียบสะอาด ประหยัดงบ เหมาะครอบครัวเริ่มต้น',
  },
  {
    id: 'HP-02',
    title: 'บ้านสแกนดิเนเวียนกลางสวน',
    style: 'Scandinavian',
    imageUrl:
      'https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=800&q=60',
    budget: 1750000,
    area: 110,
    beds: 2,
    baths: 1,
    description:
      'บ้านไม้โทนอบอุ่นสไตล์สแกนดิเนเวียน หน้าต่างบานใหญ่รับแสงธรรมชาติ กลมกลืนกับสวน',
  },
  {
    id: 'HP-03',
    title: 'บ้านลอฟท์คอนกรีตเปลือย',
    style: 'Loft',
    imageUrl:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=60',
    budget: 1950000,
    area: 120,
    beds: 2,
    baths: 2,
    description:
      'ดีไซน์ลอฟท์ ผนังปูนเปลือย เพดานสูง ให้อารมณ์ดิบเท่ พร้อมพื้นที่ใช้สอยยืดหยุ่น',
  },
  {
    id: 'HP-04',
    title: 'บ้านมินิมอลสไตล์มูจิ',
    style: 'Muji Minimalist',
    imageUrl:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=60',
    budget: 2300000,
    area: 120,
    beds: 2,
    baths: 2,
    description:
      'มินิมอลสไตล์มูจิ โทนวัสดุธรรมชาติ ไม้-ปูนอ่อน เน้นความโปร่งโล่งและฟังก์ชันเรียบง่าย',
  },
  {
    id: 'HP-05',
    title: 'บ้านญี่ปุ่นเซน',
    style: 'Japanese Zen',
    imageUrl:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60',
    budget: 2650000,
    area: 150,
    beds: 3,
    baths: 2,
    description:
      'บ้านสไตล์ญี่ปุ่นเซน สงบเรียบง่าย ระแนงไม้ คอร์ตยาร์ดกลางบ้าน เชื่อมพื้นที่ใน-นอกอย่างลงตัว',
  },
  {
    id: 'HP-06',
    title: 'บ้านนอร์ดิกหน้าจั่ว',
    style: 'Nordic',
    imageUrl:
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=60',
    budget: 2800000,
    area: 140,
    beds: 3,
    baths: 2,
    description:
      'บ้านนอร์ดิกทรงจั่วสูง โทนขาว-ไม้ อบอุ่นแต่โมเดิร์น เหมาะครอบครัวที่รักความเรียบหรู',
  },
  {
    id: 'HP-07',
    title: 'บ้านคอนเทมโพรารี 2 ชั้น',
    style: 'Contemporary',
    imageUrl:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=60',
    budget: 3200000,
    area: 180,
    beds: 3,
    baths: 3,
    description:
      'บ้านสองชั้นคอนเทมโพรารี ผสมวัสดุหลากหลาย พื้นที่ใช้สอยครบ เหมาะครอบครัวขยาย',
  },
  {
    id: 'HP-08',
    title: 'บ้านโมเดิร์นทรอปิคอล',
    style: 'Modern Tropical',
    imageUrl:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=60',
    budget: 3900000,
    area: 210,
    beds: 4,
    baths: 3,
    description:
      'โมเดิร์นทรอปิคอล เปิดโล่งรับลม ชายคายื่นกันแดดฝน พร้อมสวนและพื้นที่กึ่งเอาต์ดอร์',
  },
  {
    id: 'HP-09',
    title: 'วิลล่าหรูพร้อมสระว่ายน้ำ',
    style: 'Luxury Villa',
    imageUrl:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=60',
    budget: 6800000,
    area: 320,
    beds: 4,
    baths: 4,
    description:
      'วิลล่าระดับพรีเมียม วัสดุชั้นสูง เพดานโปร่ง สระว่ายน้ำส่วนตัว เหมาะเป็นบ้านพักตากอากาศหรู',
  },
]

function PlanCard({ plan, onSelect }) {
  return (
    <Card className="overflow-hidden flex flex-col group">
      <div className="aspect-[4/3] relative bg-gradient-to-br from-accent/20 to-elevated overflow-hidden">
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
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-ink">{plan.title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted mt-1.5">
          <span>📐 {plan.area} ตร.ม.</span>
          <span>🛏 {plan.beds} นอน</span>
          <span>🛁 {plan.baths} น้ำ</span>
        </div>
        <p className="text-sm text-ink-soft mt-3 flex-1">{plan.description}</p>
        <Button className="w-full mt-4" onClick={() => onSelect(plan)}>
          เลือกแบบบ้านนี้
        </Button>
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

  // "เลือกแบบบ้านนี้" → ไปหน้าวิเคราะห์ พร้อมแนบข้อมูลแบบบ้านผ่าน router state
  // (ContractorDashboard จะ useLocation มา auto-fill ชื่อ/งบ + ตั้งรูปเป็น reference)
  const handleSelect = (plan) =>
    navigate('/', {
      state: {
        housePlan: {
          title: plan.title,
          imageUrl: plan.imageUrl,
          budget: plan.budget,
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
              <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default HouseCatalog
