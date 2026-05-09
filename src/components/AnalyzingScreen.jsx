import { useEffect, useState } from 'react'

const PROGRESS_MESSAGES = [
  'กำลังวิเคราะห์รูปภาพ...',
  'กำลังประเมินขนาดและสไตล์บ้าน...',
  'กำลังคำนวณโครงสร้าง...',
  'กำลังจัดเฟสและลำดับงาน...',
  'กำลังประเมินค่าวัสดุและค่าแรง...',
  'กำลังประเมินความเสี่ยง...',
  'กำลังจัดทำคำแนะนำ...',
]

function AnalyzingScreen() {
  const [progress, setProgress] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)

  // fake progress: climb to 90% over ~25s, then hold
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90
        const step = p < 50 ? 2.5 : p < 75 ? 1.5 : 0.6
        return Math.min(90, p + step)
      })
    }, 400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % PROGRESS_MESSAGES.length)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <div className="relative mx-auto w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-elevated" />
          <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🏗️
          </div>
        </div>

        <h2 className="text-lg font-semibold text-ink mb-1">
          AI กำลังวิเคราะห์แบบบ้าน...
        </h2>
        <p className="text-sm text-ink-soft mb-6 min-h-[1.25rem]">
          {PROGRESS_MESSAGES[msgIdx]}
        </p>

        <div className="h-2 rounded-full bg-elevated overflow-hidden mb-2">
          <div
            className="h-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-ink-muted font-mono">
          {Math.round(progress)}%
        </p>

        <p className="text-xs text-ink-muted mt-6">
          ⏱ ใช้เวลาประมาณ 15-30 วินาที
        </p>
      </div>
    </div>
  )
}

export default AnalyzingScreen
