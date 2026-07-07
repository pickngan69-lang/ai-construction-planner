import { useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import FileUploader from '../components/FileUploader'
import ProjectForm from '../components/ProjectForm'
import MockToggle from '../components/MockToggle'
import AnalyzingScreen from '../components/AnalyzingScreen'
import ResultDashboard from '../components/ResultDashboard'
import GuidePopup from '../components/GuidePopup'
import { MATERIAL_GRADES, STEPS } from '../utils/constants'
import { useAnalysisContext } from '../contexts/AnalysisContext'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'

const DEFAULT_PROJECT_INFO = {
  name: '',
  area: '',
  floors: '',
  bedrooms: '',
  bathrooms: '',
  style: '',
  province: '',
  budget: '',
  grade: 'standard',
  notes: '',
}

function ContractorDashboard() {
  const location = useLocation()
  // แบบบ้านที่ส่งมาจากแคตตาล็อก (ผ่าน router state) — ใช้ seed ค่าเริ่มต้นของฟอร์ม
  const catalogPlan = location.state?.housePlan || null

  // Auto-fill จากแคตตาล็อก: seed ตอน mount เลย (lazy initial state) — ตั้งชื่อ/งบ
  // และเพิ่มรูปแบบบ้านเป็น reference image (sourceType 'url') ให้กดวิเคราะห์ได้ทันที
  const [files, setFiles] = useState(() =>
    catalogPlan?.imageUrl
      ? [
          {
            id: `catalog-${Date.now()}`,
            kind: 'image',
            name: catalogPlan.title || 'reference',
            preview: catalogPlan.imageUrl,
            url: catalogPlan.imageUrl,
            sourceType: 'url',
            tag: 'ภาพบันดาลใจ',
          },
        ]
      : [],
  )
  const [projectInfo, setProjectInfo] = useState(() =>
    catalogPlan
      ? {
          ...DEFAULT_PROJECT_INFO,
          name: catalogPlan.title || '',
          budget: catalogPlan.budget != null ? String(catalogPlan.budget) : '',
        }
      : DEFAULT_PROJECT_INFO,
  )
  const [useMock, setUseMock] = useState(false)
  const [catalogTitle, setCatalogTitle] = useState(
    () => catalogPlan?.title || null,
  )
  const { step, result, error, run, reset, loadSnapshot } = useAnalysisContext()
  const { projects } = useProjects()
  const { logout } = useAuth()

  // เมื่อมาจากแคตตาล็อก: ล้างผลลัพธ์เก่า + บังคับ step กลับเป็น INPUT
  // (กันกรณีมี result ค้างใน localStorage แล้วโผล่หน้า RESULT เก่า).
  // ใช้ useLayoutEffect เพื่อ reset ก่อน paint จึงไม่เห็นหน้า RESULT เก่าแวบ ๆ.
  // ข้อมูล prefill (ชื่อ/งบ/รูป reference) มาจาก lazy initial state ด้านบน —
  // reset() แตะเฉพาะ analysis context จึงยังคง auto-fill ไว้ครบ พร้อมกดวิเคราะห์.
  useLayoutEffect(() => {
    if (!location.state?.housePlan) return
    reset() // clear result เก่า + step → INPUT
    // เคลียร์ router state กัน browser refresh มา reset/auto-fill ซ้ำ
    window.history.replaceState({}, document.title)
  }, [location.state, reset])

  const gradeMultiplier =
    MATERIAL_GRADES.find((g) => g.id === projectInfo.grade)?.multiplier || 1

  const handleAnalyze = () => run(files, projectInfo, { mock: useMock })
  // Test mode lets you exercise the UI without uploading any file
  const canAnalyze = useMock || files.length > 0

  // ฟังก์ชันรีเซ็ตค่าเพื่อกลับไปหน้าเริ่มแรก
  const handleReset = () => {
    reset() // สั่ง Context ให้กลับไป Step.INPUT
    setFiles([]) // ล้างไฟล์เก่า
    setProjectInfo(DEFAULT_PROJECT_INFO) // ล้างข้อมูลฟอร์ม
    setCatalogTitle(null)
  }

  const handleGradeChange = (grade) =>
    setProjectInfo((prev) => ({ ...prev, grade }))

  // โปรเจกต์ที่บันทึกผลวิเคราะห์ไว้ (เปิดกลับมาดูได้)
  const savedProjects = projects.filter((p) => p.analysis?.snapshot?.result)

  const handleSelectProject = (e) => {
    const id = e.target.value
    if (!id) return
    const p = projects.find((x) => x.id === id)
    if (!p?.analysis?.snapshot) return
    setProjectInfo(p.analysis.projectInfo || DEFAULT_PROJECT_INFO)
    setFiles(
      p.imageUrl
        ? [
            {
              id: `saved-${p.id}`,
              kind: 'image',
              name: p.name,
              preview: p.imageUrl,
              url: p.imageUrl,
              sourceType: 'url',
              tag: 'ภาพบันดาลใจ',
            },
          ]
        : [],
    )
    setCatalogTitle(null)
    loadSnapshot(p.analysis.snapshot) // ตั้ง step = RESULT ให้แสดงผลวิเคราะห์
  }

  // Back behavior — depends on step:
  // RESULT/ANALYZING → reset back to input
  // INPUT → logout (กลับไป LoginPage)
  const handleBack =
    step === STEPS.RESULT || step === STEPS.ANALYZING ? handleReset : logout

  return (
    <>
      <Header onBack={handleBack}>
        {step === STEPS.RESULT && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs rounded-md border border-line text-ink-soft hover:text-ink hover:border-accent transition-colors"
          >
            + วิเคราะห์ใหม่ (อัปโหลดไฟล์เพิ่ม)
          </button>
        )}
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {savedProjects.length > 0 && step !== STEPS.ANALYZING && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface/60 px-4 py-2.5">
            <span className="text-sm text-ink-soft">
              📂 เปิดโปรเจกต์ที่บันทึกไว้:
            </span>
            <select
              value=""
              onChange={handleSelectProject}
              className="rounded-md border border-line bg-canvas px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">— เลือกโปรเจกต์ —</option>
              {savedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.customerName || p.client}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === STEPS.INPUT && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-soft">โหมดข้อมูล:</span>
              <MockToggle useMock={useMock} onChange={setUseMock} />
            </div>

            {catalogTitle && (
              <div className="rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent flex flex-wrap items-center gap-2">
                🏠 <span className="font-medium">เลือกจากแคตตาล็อก:</span>
                <span>{catalogTitle}</span>
                <span className="text-ink-muted text-xs">
                  — เติมชื่อ/งบ + ตั้งรูป reference ให้อัตโนมัติแล้ว กด "วิเคราะห์แบบบ้าน" ได้เลย
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-ink">
                  อัปโหลดไฟล์แบบบ้าน &amp; เอกสาร
                </h2>
                <GuidePopup title="รองรับไฟล์อะไรบ้าง">
                  <p>
                    อัปโหลดได้หลายไฟล์ (สูงสุด 7): <strong>🖼️ รูปภาพ</strong>{' '}
                    (PNG/JPG/WEBP), <strong>📄 PDF</strong> (แปลนบ้าน), และ{' '}
                    <strong>📊 Excel/CSV</strong> (BOQ / รายการวัสดุ)
                  </p>
                  <p>
                    รูปภาพเลือก tag ได้ (แปลนพื้น/รูปด้าน/3D/ภาพบันดาลใจ) · PDF
                    ส่งให้ AI อ่านโดยตรง · ตาราง Excel/CSV จะถูกแปลงเป็นข้อมูล
                    ประกอบให้ AI
                  </p>
                  <p>
                    💡 แนบแปลนพื้น (รูปหรือ PDF) จะช่วยให้ประเมินขนาด/ห้อง
                    ได้แม่นยำที่สุด
                  </p>
                </GuidePopup>
              </div>
              <p className="text-sm text-ink-muted mb-4">
                🆕 รองรับหลายไฟล์แล้ว — แปลนบ้าน (รูป/PDF) และไฟล์ BOQ/วัสดุ
                (Excel, CSV)
              </p>

              <FileUploader files={files} setFiles={setFiles} maxFiles={7} />
            </div>

            <ProjectForm
              projectInfo={projectInfo}
              setProjectInfo={setProjectInfo}
              onAnalyze={handleAnalyze}
              canAnalyze={canAnalyze}
              useMock={useMock}
            />

            {error && (
              <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {step === STEPS.ANALYZING && <AnalyzingScreen />}

        {step === STEPS.RESULT && result && (
          <ResultDashboard
            result={result}
            images={files}
            projectInfo={projectInfo}
            gradeMultiplier={gradeMultiplier}
            onGradeChange={handleGradeChange}
          />
        )}
      </main>
    </>
  )
}

export default ContractorDashboard
