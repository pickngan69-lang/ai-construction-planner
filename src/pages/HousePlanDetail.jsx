import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getHousePlan } from '../data/housePlans'
import { MATERIAL_GRADES } from '../utils/constants'
import { formatBaht } from '../utils/formatters'

// Image with graceful fallback: if the URL fails, hide it and reveal the emoji
// placeholder sitting behind it.
function SmartImage({ src, alt, className, emoji = '🏠' }) {
  return (
    <div className={`relative bg-gradient-to-br from-accent/20 to-elevated overflow-hidden ${className || ''}`}>
      <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-30 pointer-events-none">
        {emoji}
      </span>
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
          className="relative w-full h-full object-cover"
        />
      )}
    </div>
  )
}

function SpecTile({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-center">
      <div className="text-lg">{icon}</div>
      <div className="text-sm font-semibold text-ink mt-0.5">{value}</div>
      <div className="text-[11px] text-ink-muted">{label}</div>
    </div>
  )
}

function HousePlanDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const plan = getHousePlan(id)
  const [activeImg, setActiveImg] = useState(0)

  if (!plan) {
    return (
      <>
        <Header onBack={() => navigate('/catalog')} />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-ink-soft">ไม่พบแบบบ้านนี้</p>
          <Button className="mt-5" onClick={() => navigate('/catalog')}>
            ← กลับไปแคตตาล็อก
          </Button>
        </main>
      </>
    )
  }

  const gallery = plan.gallery?.length ? plan.gallery : [plan.imageUrl]

  // "เลือกแบบบ้านนี้" → หน้าวิเคราะห์ พร้อมข้อมูลครบ (prefill ชื่อ/งบ/พื้นที่/ชั้น/ห้อง)
  const handleSelect = () =>
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
      <Header onBack={() => navigate('/catalog')} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="text-sm text-ink-muted hover:text-accent transition-colors"
        >
          ← แคตตาล็อกแบบบ้าน
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ---- Gallery ---- */}
          <div className="space-y-3">
            <SmartImage
              src={gallery[activeImg]}
              alt={plan.title}
              className="aspect-[4/3] rounded-xl"
            />
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImg ? 'border-accent' : 'border-transparent hover:border-line'
                  }`}
                >
                  <SmartImage src={src} alt={`${plan.title} ${i + 1}`} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          {/* ---- Summary ---- */}
          <div className="space-y-4">
            <div>
              <span className="inline-block rounded-full bg-elevated px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                {plan.style}
              </span>
              <h1 className="text-2xl font-bold text-ink mt-2">{plan.title}</h1>
              <p className="text-sm text-ink-soft mt-2">{plan.description}</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <SpecTile icon="📐" label="ตร.ม." value={plan.area} />
              <SpecTile icon="🏢" label="ชั้น" value={plan.floors} />
              <SpecTile icon="🛏" label="นอน" value={plan.beds} />
              <SpecTile icon="🛁" label="น้ำ" value={plan.baths} />
              <SpecTile icon="⏱" label="เดือน" value={`~${plan.buildTimeMonths}`} />
            </div>

            {/* Price by grade */}
            <Card className="p-4">
              <p className="text-sm font-medium text-ink mb-3">💰 ราคาประเมินตามเกรดวัสดุ</p>
              <div className="grid grid-cols-3 gap-2">
                {['economy', 'standard', 'premium'].map((g) => {
                  const grade = MATERIAL_GRADES.find((m) => m.id === g)
                  return (
                    <div
                      key={g}
                      className={`rounded-lg border p-3 text-center ${
                        g === 'standard' ? 'border-accent bg-accent/5' : 'border-line bg-canvas'
                      }`}
                    >
                      <div className="text-lg">{grade?.icon}</div>
                      <div className="text-[11px] text-ink-muted">{grade?.label}</div>
                      <div className="text-sm font-mono font-semibold text-ink mt-1">
                        {formatBaht(plan.priceByGrade[g])}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-ink-muted mt-2">
                * ราคาเหมาโดยประมาณ (turnkey) — กด “วิเคราะห์” เพื่อประเมิน BOQ ละเอียด
              </p>
            </Card>

            <Button className="w-full" onClick={handleSelect}>
              เลือกแบบบ้านนี้ → วิเคราะห์ราคา
            </Button>
          </div>
        </div>

        {/* ---- Floor plans ---- */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">🗺 แปลนบ้าน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.floorPlans.map((fp) => (
              <Card key={fp.floor} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
                  <span className="text-sm font-semibold text-ink">ชั้นที่ {fp.floor}</span>
                  <span className="text-xs text-ink-muted">{fp.area} ตร.ม.</span>
                </div>
                {fp.imageUrl ? (
                  <SmartImage src={fp.imageUrl} alt={`แปลนชั้น ${fp.floor}`} className="aspect-video" emoji="📐" />
                ) : (
                  <div className="aspect-video bg-elevated flex flex-col items-center justify-center text-center px-4">
                    <span className="text-4xl opacity-40">📐</span>
                    <span className="text-xs text-ink-muted mt-2">
                      ยังไม่มีไฟล์แปลน — เพิ่มภายหลังได้
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs font-medium text-ink-soft mb-2">ห้อง/พื้นที่ใช้สอย</p>
                  <div className="flex flex-wrap gap-1.5">
                    {fp.rooms.map((room, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-canvas border border-line px-2.5 py-1 text-[11px] text-ink-soft"
                      >
                        {room}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ---- Highlights + specs ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">✨ จุดเด่น</h3>
            <ul className="space-y-2">
              {plan.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-soft">
                  <span className="text-accent">✓</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink mb-3">📋 ข้อมูลจำเพาะ</h3>
            <dl className="text-sm divide-y divide-line">
              <div className="flex justify-between py-2">
                <dt className="text-ink-muted">ที่จอดรถ</dt>
                <dd className="text-ink">{plan.specs.parking} คัน</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-muted">ความสูงฝ้า</dt>
                <dd className="text-ink">{plan.specs.ceilingHeight}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-muted">ทิศทางบ้าน</dt>
                <dd className="text-ink">{plan.specs.direction}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-muted">ขนาดที่ดินแนะนำ</dt>
                <dd className="text-ink">{plan.specs.landSize}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </main>
    </>
  )
}

export default HousePlanDetail
