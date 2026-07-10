import { useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import FileUploader from '../components/FileUploader'
import ProjectForm from '../components/ProjectForm'
import MockToggle from '../components/MockToggle'
import AnalyzingScreen from '../components/AnalyzingScreen'
import ResultDashboard from '../components/ResultDashboard'
import ContinueWorkStrip from '../components/ContinueWorkStrip'
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
          area: catalogPlan.area != null ? String(catalogPlan.area) : '',
          floors: catalogPlan.floors != null ? String(catalogPlan.floors) : '',
          bedrooms: catalogPlan.beds != null ? String(catalogPlan.beds) : '',
          bathrooms: catalogPlan.baths != null ? String(catalogPlan.baths) : '',
        }
      : DEFAULT_PROJECT_INFO,
  )
  const [useMock, setUseMock] = useState(false)
  const [catalogTitle, setCatalogTitle] = useState(
    () => catalogPlan?.title || null,
  )
  const { step, result, error, run, reset, loadSnapshot, setActiveProjectId } =
    useAnalysisContext()
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

  const handleAnalyze = () => {
    setActiveProjectId(null) // วิเคราะห์ใหม่ = ยังไม่ผูกกับโปรเจกต์ใด
    run(files, projectInfo, { mock: useMock })
  }
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

  // โปรเจกต์ที่กำลังทำอยู่ (ค้าง) — โชว์บนหน้าแรกให้เลือกทำต่อ
  const activeProjects = projects.filter(
    (p) => p.status === 'estimating' || p.status === 'building',
  )

  // กด "ทำต่อ" → เปิดหน้า BOQ เสมอ:
  //  • มีผลวิเคราะห์บันทึกไว้ → โหลด BOQ/Gantt เดิมกลับมาแก้ต่อ (RESULT)
  //  • ยังไม่เคยวิเคราะห์ (เช่นโปรเจกต์ตัวอย่าง) → สร้าง BOQ จากข้อมูลบ้าน
  //    แล้วเข้าหน้า BOQ เหมือนกดวิเคราะห์ เพื่อเริ่มทำงานต่อได้ทันที
  const handleContinueProject = (p) => {
    setActiveProjectId(p.id) // ผูกงานนี้กับโปรเจกต์ → บันทึกแล้วอัปเดตกลับโปรเจกต์เดิม
    if (p.analysis?.snapshot?.result) {
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
    } else {
      const projInfo = {
        ...DEFAULT_PROJECT_INFO,
        name: p.name || '',
        area: p.area != null ? String(p.area) : '',
        floors: p.floors != null ? String(p.floors) : '',
        bedrooms: p.beds != null ? String(p.beds) : '',
        bathrooms: p.baths != null ? String(p.baths) : '',
        budget: p.boqBudget != null ? String(p.boqBudget) : '',
      }
      setProjectInfo(projInfo)
      setFiles([])
      setCatalogTitle(p.name || null)
      run([], projInfo, { mock: true }) // → ANALYZING → RESULT (BOQ)
    }
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
        {step === STEPS.INPUT && (
          <ContinueWorkStrip
            projects={activeProjects}
            onContinue={handleContinueProject}
          />
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
