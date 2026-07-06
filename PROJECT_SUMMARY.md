# PROJECT SUMMARY — AI Construction Planner

> เอกสารสรุปโปรเจกต์ฉบับสมบูรณ์ (สำหรับให้ AI / นักพัฒนาคนอื่นอ่านแล้วพัฒนาต่อได้ทันที)
> อัปเดตล่าสุด: 2026-07-06 · repo: `pickngan69-lang/ai-construction-planner`

---

## 1. ภาพรวมโปรเจกต์

| หัวข้อ | รายละเอียด |
|---|---|
| **ชื่อ** | AI Construction Planner (package: `gantt-learning`) |
| **ภาษา UI** | ไทยทั้งหมด |
| **วัตถุประสงค์** | เว็บแอปช่วย **ผู้รับเหมาชาวไทย** วางแผนก่อสร้างบ้าน — อัปโหลดรูปแบบบ้าน + กรอกข้อมูลโปรเจกต์ → ให้ Claude (Anthropic API) วิเคราะห์ออกมาเป็น **BOQ (ราคากลาง)**, **รายการวัสดุ 3 เกรด**, **Gantt Chart แบบ interactive**, **คำแนะนำ/ความเสี่ยง**, และ **ร่างสัญญาจ้างเหมาก่อสร้าง** พร้อม **Export PDF**. นอกจากนี้มี **แคตตาล็อกแบบบ้าน** (จับคู่งบประมาณ) และ **แดชบอร์ด Mini ERP** (จัดการหลายโปรเจกต์) |
| **โมเดล AI** | `claude-sonnet-4-6` (เรียกผ่าน **Node Express backend proxy** — API key ไม่หลุดฝั่ง browser) |
| **สถาปัตยกรรม** | React SPA แบบ **multi-page (react-router)** + **Node Express backend** (`server.js`) เป็น proxy ซ่อน API key/serve static + **Python Flask ERP backend แยกต่างหาก** (`erp-backend/`, port 5001). State ฝั่ง client เก็บใน `localStorage` / `sessionStorage` |

### Tech Stack

| ชั้น | เทคโนโลยี |
|---|---|
| Framework | **React 19** (`react`, `react-dom`) |
| Build tool | **Vite 8** (`@vitejs/plugin-react`) |
| Routing | **react-router-dom v7** (`/`, `/catalog`, `/projects`) |
| Styling | **Tailwind CSS 4** (ผ่าน `@tailwindcss/vite`) + CSS variables (theme dark/light) |
| Charts | **recharts** (Pie + Bar ใน Dashboard) |
| PDF Export | **jspdf** + **html2canvas-pro** (รองรับ CSS สมัยใหม่ oklch/color-mix) |
| Fonts | Noto Sans Thai + DM Mono (โหลดจาก Google Fonts ใน `index.html`) |
| State | React hooks + Context (ไม่มี Redux/Zustand) |
| **Node backend** | **Express 5** + **cors** + **dotenv** (`server.js`) — proxy `POST /api/analyze` → Anthropic, serve `dist/` |
| **ERP backend** | **Python / Flask / Flask-SQLAlchemy / PostgreSQL** (`erp-backend/`, port 5001) — บริการแยกอิสระ (ดูข้อ 13) |

---

## 2. โครงสร้างไฟล์

```
gantt-learning/
├── index.html                      # HTML entry, โหลดฟอนต์ไทย, mount #root
├── server.js                       # ⭐ Node Express backend — proxy POST /api/analyze (ซ่อน API key) + serve dist/
├── vite.config.js                  # Vite config + dev proxy /api → backend (localhost:5000)
├── eslint.config.js                # ESLint (flat config)
├── package.json                    # deps + scripts (dev/build/start/lint/preview)
├── .env                            # ANTHROPIC_API_KEY (ห้าม commit — อยู่ใน .gitignore)
├── .env.example                    # ตัวอย่าง env
├── PROJECT_SUMMARY.md              # ← ไฟล์นี้
│
├── erp-backend/                    # ⭐ Phase 2: Python Flask ERP backend (บริการแยก — ดูข้อ 13)
│   ├── app.py                      # Flask app (port 5001) + endpoints + config PG URI จาก .env
│   ├── models.py                   # SQLAlchemy models: Project, FinancialTracking, MaterialMarketPrice
│   ├── requirements.txt            # Flask, Flask-SQLAlchemy, psycopg2-binary, python-dotenv, flask-cors
│   ├── .env.example                # DATABASE_URL ตัวอย่าง
│   └── README.md                   # วิธีติดตั้ง/รัน
│
├── public/                         # static assets
└── src/
    ├── main.jsx                    # React entry — <StrictMode><App/></StrictMode>
    ├── App.jsx                     # Provider tree + AppRouter (react-router: /, /catalog, /projects)
    ├── index.css                   # Tailwind + CSS variables ธีม (--color-ink, --color-accent ฯลฯ)
    ├── App.css                     # (สไตล์เสริม)
    │
    ├── contexts/
    │   ├── AuthContext.jsx         # login/logout ผู้รับเหมา, sessionStorage
    │   ├── ThemeContext.jsx        # dark/light theme, localStorage 'acp-theme'
    │   └── AnalysisContext.jsx     # ครอบ useAnalysis() ให้ทุก component ใช้ร่วมกัน
    │
    ├── hooks/
    │   └── useAnalysis.js          # ⭐ หัวใจของแอป — state engine ทั้งหมด (analyze, edits, task/material CRUD)
    │
    ├── services/
    │   ├── aiService.js            # ⭐ เรียก proxy /api/analyze (system prompt + schema + fetch)
    │   └── mockData.js             # ข้อมูลจำลองสำหรับโหมด "🧪 ทดสอบ" (ไม่เรียก API จริง)
    │
    ├── utils/
    │   ├── constants.js            # ค่าคงที่: STEPS, ROLES, MATERIAL_GRADES, PHASE_COLORS, HOUSE_STYLES, PROVINCES, ANTHROPIC_MODEL ฯลฯ
    │   ├── formatters.js           # formatBaht, formatDays, numberToThaiText (แปลงเลข→ตัวอักษรไทยสำหรับสัญญา)
    │   ├── jsonRepair.js           # ซ่อม JSON ที่ AI ตอบมาไม่ครบ (truncated)
    │   ├── exportPdf.js            # ⭐ แปลง DOM → PDF หลายหน้า (html2canvas-pro + jsPDF)
    │   └── cn.js                   # helper รวม className (แบบ clsx เบาๆ)
    │
    ├── pages/                      # หน้าหลัก (route targets)
    │   ├── LoginPage.jsx           # หน้า login (ผู้รับเหมาเท่านั้น — รหัสผ่าน)
    │   ├── ContractorDashboard.jsx # ⭐ route "/" — flow วิเคราะห์: INPUT → ANALYZING → RESULT
    │   ├── HouseCatalog.jsx        # ⭐ route "/catalog" — แคตตาล็อกแบบบ้าน + จับคู่งบประมาณ
    │   └── MultiProjectDashboard.jsx # ⭐ route "/projects" — แดชบอร์ด Mini ERP (mock)
    │
    └── components/
        ├── Header.jsx              # แถบบน (โลโก้, role badge, ย้อนกลับ, Export, Theme, ออก) + เมนูนำทาง (NavLink)
        ├── ImageUploader.jsx       # อัปโหลดรูป (drag&drop, สูงสุด 7 รูป, ติด tag, → base64)
        ├── ProjectForm.jsx         # ฟอร์มข้อมูลโปรเจกต์ + ปุ่มวิเคราะห์
        ├── MockToggle.jsx          # ปุ่มสลับ 🤖 AI จริง / 🧪 ทดสอบ (โหมด mock)
        ├── ModeToggle.jsx          # ปุ่มสลับ 🤖 Auto / ✏️ Manual (โหมดแก้ไขค่า)
        ├── AnalyzingScreen.jsx     # หน้าจอ loading ระหว่าง AI คิด (progress ปลอม + ข้อความหมุน)
        ├── ResultDashboard.jsx     # ⭐ ตัว orchestrate ผลลัพธ์ + 7 แท็บ + คำนวณ adjustedResult
        ├── InteractiveGantt.jsx    # ⭐ Gantt Chart แบบลากได้ (ดูข้อ 7)
        ├── TaskModal.jsx           # modal เพิ่ม/แก้ไขงาน (ชื่อ, ค่าวัสดุ, ค่าแรง, วัน)
        ├── ContractForm.jsx        # ฟอร์มกรอกข้อมูลสัญญา (คู่สัญญา, ราคา, งวดงาน)
        ├── ContractDocument.jsx    # เอกสารสัญญา A4 (10 ข้อ + ลายเซ็น) ที่ export เป็น PDF
        ├── GuidePopup.jsx          # ปุ่ม 💡 เปิด popup อธิบายการใช้งานแต่ละส่วน
        ├── ExportButton.jsx        # ปุ่ม Export PDF บน Header
        ├── ThemeToggle.jsx         # ปุ่มสลับธีม 🌞/🌙
        │
        ├── tabs/                   # แท็บย่อยใน ResultDashboard
        │   ├── DashboardTab.jsx    # "สรุป" — stat cards + Pie + Bar chart
        │   ├── BOQTab.jsx          # "BOQ" — ตารางแยกค่าวัสดุ/ค่าแรงต่อเฟส (แก้ inline ได้)
        │   ├── TaskDetailTab.jsx   # "งาน" — การ์ดรายละเอียดงานแยกเฟส
        │   ├── MaterialTab.jsx     # "วัสดุ" — จัดการวัสดุ 3 เกรด + ค่าแรงเหมา
        │   ├── RecommendTab.jsx    # "แนะนำ" — คำแนะนำ / ความเสี่ยง / ใบอนุญาต
        │   └── ContractTab.jsx     # "สัญญา" — orchestrate ContractForm + ContractDocument
        │
        └── ui/                     # primitives ที่ใช้ซ้ำ
            ├── Button.jsx          # ปุ่ม (variant: primary/secondary/ghost/danger, size sm/md/lg)
            ├── Card.jsx            # กล่อง (rounded-xl border bg-surface)
            ├── Tabs.jsx            # แถบแท็บ (ใช้ใน ResultDashboard)
            ├── GradeSelector.jsx   # เลือกเกรดวัสดุ (compact / เต็ม)
            ├── ConfirmDialog.jsx   # dialog ยืนยัน (ลบ ฯลฯ)
            ├── Badge.jsx           # ป้ายสีตามเฟส
            └── Tooltip.jsx         # tooltip hover
```

---

## 3. สรุป Component ทุกตัว (props / state)

### Contexts (Provider + hook)

| Context | State ที่จัดการ | ค่าที่ส่งออก |
|---|---|---|
| **AuthContext** | `user` `{role:'contractor', name}` เก็บใน `sessionStorage['acp-auth']` | `user`, `loginContractor(password)`, `logout()` |
| **ThemeContext** | `theme` (`'dark'`\|`'light'`) → set `data-theme` บน `<html>`, เก็บ `localStorage['acp-theme']` | `theme`, `setTheme`, `toggle()` |
| **AnalysisContext** | ครอบ `useAnalysis()` ทั้งก้อน | ทุกค่าจาก useAnalysis (ดูด้านล่าง) |

### `useAnalysis()` — hook หัวใจ ([src/hooks/useAnalysis.js](src/hooks/useAnalysis.js))

State หลัก (persist ลง `localStorage['acp-analysis-v2']`):

| State | ความหมาย |
|---|---|
| `step` | `'input'` \| `'analyzing'` \| `'result'` (จาก `STEPS`) |
| `result` | ผลจาก AI ที่ผ่าน `buildResult()` แล้ว (มี `allTasks`, `total_*`, `totalDays`) |
| `edits` | `{ [taskIndex]: patch }` — การแก้ไขค่าต่อ task (material_cost, labor_cost, ชื่อ, วัน) |
| `mode` | `'auto'` \| `'manual'` — โหมดแก้ไข (ต่างจากโหมด mock) |
| `materialEdits` | `{ economy[], standard[], premium[] }` — วัสดุแต่ละเกรด (มี id, isDeleted) |
| `materialLaborByGrade` | `{ economy, standard, premium }` — ค่าแรงเหมาต่อเกรด |
| `addedTasks` | งานที่ผู้ใช้เพิ่มเอง (id ขึ้นต้น `added-`) |
| `deletedTaskIds` | index ของงาน AI ที่ถูก soft-delete |

ฟังก์ชันสำคัญ: `run(images, projectInfo, {mock})`, `reset()`, `updateTask(ref, patch)`, `addTask(phaseIdx, draft)`, `deleteTask(ref)`, `updateMaterial(grade, data)`, `deleteMaterial(grade, id)`, `setMaterialLabor(grade, value)`, `calculateMaterialTotal(grade)`, `clearEdits()`

> 🔑 **แนวคิด "baseline + edits":** ค่า AI คือ baseline เสมอ, การแก้ไขเก็บแยกใน `edits`/`materialEdits` — ทำให้ reset กลับไปค่า AI เดิมได้ และแสดง "AI: xxx" ขีดทับเทียบกับค่าที่แก้

### Pages (route targets)

| Component | Route | Props | State ภายใน | หน้าที่ |
|---|---|---|---|---|
| **App** | — | — | — | Provider tree (`Theme→Auth→Analysis`) + `AppRouter` (react-router) |
| **LoginPage** | (ก่อน login) | — | `password, error` | login ผู้รับเหมา (รหัสผ่าน) — minimalist |
| **ContractorDashboard** | `/` | — | `images, projectInfo, useMock` + ดึง context | flow วิเคราะห์: INPUT → ANALYZING → RESULT |
| **HouseCatalog** | `/catalog` | — | `budget` | แคตตาล็อกแบบบ้าน + ตัวกรองจับคู่งบประมาณ (ดูข้อ 12) |
| **MultiProjectDashboard** | `/projects` | — | — (mock data) | แดชบอร์ด Mini ERP: kanban สถานะ + ค่างวด + BOQ vs จริง (ดูข้อ 12) |

### Components หลัก

| Component | Props สำคัญ | State | หน้าที่ |
|---|---|---|---|
| **Header** | `children`, `onBack` | — | แถบบน + role badge + ปุ่ม Export/Theme/ออก + **เมนูนำทาง (NavLink: วิเคราะห์/แคตตาล็อก/โปรเจกต์)** |
| **ImageUploader** | `images`, `setImages`, `maxFiles=7` | `dragOver, error` | drag&drop รูป → แปลงเป็น base64, ติด tag (แปลนพื้น/รูปด้าน/3D…) |
| **ProjectForm** | `projectInfo`, `setProjectInfo`, `onAnalyze`, `canAnalyze`, `useMock` | — | ฟอร์ม (ชื่อ, พื้นที่, ชั้น, ห้องนอน/น้ำ, สไตล์, จังหวัด, งบ, เกรด, หมายเหตุ) + ปุ่มวิเคราะห์ |
| **MockToggle** | `useMock`, `onChange` | — | สลับ 🤖 AI จริง / 🧪 ทดสอบ |
| **ModeToggle** | `mode`, `onChange`, `hasEdits`, `onClearEdits` | — | สลับ Auto/Manual + ปุ่ม reset edits |
| **AnalyzingScreen** | — | `progress, msgIdx` | loading spinner + progress ปลอม (ไต่ถึง 90%) |
| **ResultDashboard** | `result`, `images`, `projectInfo`, `gradeMultiplier`, `onGradeChange` | `tab, ganttTasks, ganttMode, ganttColWidth, ganttProjectStartDate, taskModal, confirmDeleteTask` | ⭐ คำนวณ `adjustedResult` (allocation) + render 7 แท็บ |
| **InteractiveGantt** | `phases`, `tasks`, `onTasksChange`, `mode/onModeChange`, `colWidth`, `projectStartDate` (controlled) | ภายในถ้าไม่ controlled | Gantt ลากได้ (ดูข้อ 7) |
| **TaskModal** | `initial`, `mode`, `phaseLabel`, `onSave`, `onClose` | `draft` | เพิ่ม/แก้ไขงาน |
| **ContractTab** | `result`, `projectInfo` | `form, installments, customTotal, customDays, daysToStart, warrantyYears, lateFinePercent, exportBusy` | orchestrate ฟอร์ม+เอกสารสัญญา |
| **ContractForm** | (state ทั้งหมดจาก ContractTab) | — (pure) | ฟอร์มกรอกคู่สัญญา/ราคา/งวดงาน |
| **ContractDocument** | `form, installments, customTotal, ...` | — (pure) | เอกสาร A4 10 ข้อ (คือ target ที่ export) |

### tabs/

| Tab | Props | หน้าที่ |
|---|---|---|
| **DashboardTab** | `result` | stat cards (เวลา/งบ/ค่าแรง/ค่าวัสดุ) + Pie (สัดส่วนเฟส) + Bar (วัสดุ vs แรง) |
| **BOQTab** | `result, gradeMultiplier, isManual, onUpdateTask, onEditTask, onDeleteTask, onAddTask` | ตาราง BOQ แยกค่าวัสดุ/ค่าแรงต่อเฟส — โหมด Manual แก้ตัวเลข inline ได้ |
| **TaskDetailTab** | `result, onEditTask, onDeleteTask, onAddTask` | การ์ดงานแยกเฟส (รายละเอียด + ต้นทุน) |
| **MaterialTab** | `projectInfo, onGradeChange` (ดึง material CRUD จาก context) | จัดการวัสดุ 3 เกรด (เพิ่ม/แก้/ลบ) + ค่าแรงเหมาต่อเกรด |
| **RecommendTab** | `result` | คำแนะนำ / ความเสี่ยง / **ใบอนุญาต (permits)** |
| **ContractTab** | `result, projectInfo` | ดูด้านบน |

### ui/ (primitives)

| Component | Props |
|---|---|
| **Button** | `variant`(primary/secondary/ghost/danger), `size`(sm/md/lg), `type`, `...rest` |
| **Card** | `as='div'`, `className`, `...rest` |
| **Tabs** | `items[{id,label,icon}]`, `value`, `onChange` |
| **GradeSelector** | `value`, `onChange`, `compact` |
| **ConfirmDialog** | `title`, `message`, `confirmLabel`, `variant`, `onConfirm`, `onCancel` (ESC=ยกเลิก) |
| **Badge** | `phaseIdx`\|`color`, `children` |
| **Tooltip** | `content`, `children` |

---

## 4. Application Flow & Routing

### Routing (react-router-dom)

`App.jsx` → `AppRouter`: ถ้ายังไม่ login แสดง `LoginPage`; เมื่อ login แล้วเข้าสู่ `BrowserRouter` ที่มี 3 route:

```
main.jsx → <App>
   └── ThemeProvider → AuthProvider → AnalysisProvider → AppRouter
                                                            │
                    ┌───────────────────────────────────────┤
                    ▼ (ยังไม่ login)                        ▼ (login แล้ว = contractor)
                LoginPage                            <BrowserRouter>
                                                       ├── "/"         → ContractorDashboard (วิเคราะห์)
                                                       ├── "/catalog"  → HouseCatalog
                                                       ├── "/projects" → MultiProjectDashboard
                                                       └── "*"         → redirect "/"
```

**เมนูนำทาง (main nav):** อยู่ใน `Header.jsx` เป็นแถบ `NavLink` (🔍 วิเคราะห์แบบบ้าน · 🏠 แคตตาล็อกแบบบ้าน · 📋 โปรเจกต์ทั้งหมด) แสดงทุกหน้าเมื่อ login แล้ว มี active-state highlight ตาม route ปัจจุบัน · การ deploy รองรับ deep-link เพราะ `server.js` มี wildcard GET → `index.html` และ Vite serve index.html ทุก path

### เส้นทางการใช้งานหลัก (วิเคราะห์แบบบ้าน)

```
1. LoginPage → กรอกรหัส 'admin' → AuthContext.loginContractor() → user={role:'contractor'}
2. ContractorDashboard (route "/") step = INPUT:
   - ImageUploader: ลากรูป → base64 (สูงสุด 7) + ติด tag
   - (ทางเลือก) MockToggle: 🧪 ทดสอบ = ไม่ต้องอัปรูป, ใช้ mockData
   - ProjectForm: กรอกข้อมูล → กด "วิเคราะห์แบบบ้าน"
3. handleAnalyze() → useAnalysis.run(images, projectInfo, {mock:useMock})
   - setStep(ANALYZING) → AnalyzingScreen แสดง
   - mock=false: aiService.analyzeHouse() เรียก proxy /api/analyze → Claude
     mock=true : buildMockAnalysis(projectInfo) (หน่วง 600ms)
   - data → buildResult() → เติม allTasks (schedule เริ่มต้น sequential), total_*, totalDays
   - โหลด materialEdits / materialLaborByGrade จาก AI
   - setStep(RESULT)
4. ResultDashboard:
   - คำนวณ adjustedResult (useMemo): apply edits + proportional allocation ของวัสดุ/แรง
   - 7 แท็บ: สรุป | Gantt | BOQ | งาน | วัสดุ | แนะนำ | สัญญา
   - GradeSelector (มุมขวา) เปลี่ยนเกรด → กระทบค่าวัสดุทุกหน้า
   - แก้ไขได้ (Manual): BOQ inline, TaskModal, MaterialTab CRUD → เก็บใน edits/materialEdits
   - Export PDF ได้ทุกแท็บ (ExportButton / ในแต่ละ tab)
5. ทุก state persist ลง localStorage → รีเฟรชแล้วยังอยู่ (เปิดมาที่ RESULT เลย)
6. "+ วิเคราะห์ใหม่" → reset() → กลับ INPUT
```

---

## 5. AI Service ([src/services/aiService.js](src/services/aiService.js))

### วิธีเรียก API (ผ่าน backend proxy — ซ่อน key)

frontend เรียก **`POST /api/analyze` ของ Node Express backend** (`server.js`) โดยไม่แตะ API key เลย. backend เติม `x-api-key` (จาก `ANTHROPIC_API_KEY` ฝั่ง server) แล้ว forward ไป Anthropic:

**Frontend** ([src/services/aiService.js](src/services/aiService.js)):
```js
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: ANTHROPIC_MODEL,           // 'claude-sonnet-4-6'
    max_tokens: ANTHROPIC_MAX_TOKENS, // 16000
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }], // content = [image blocks..., text]
  }),
})
```

**Backend** ([server.js](server.js)):
```js
app.post('/api/analyze', async (req, res) => {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY, // ← secret อยู่ฝั่ง server เท่านั้น
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req.body),   // forward payload ที่ client สร้าง
  })
  const data = await upstream.json()
  res.status(upstream.status).json(data) // ส่ง status + body กลับตามจริง
})
```

- `content` ประกอบด้วย image blocks (base64) แต่ละรูป + text block ต่อท้าย + สรุปข้อมูลโปรเจกต์ (`buildProjectInfoText`)
- ผลลัพธ์ = text block เดียวที่เป็น JSON → ผ่าน `repairJSON()` แล้วคืนเป็น object
- ไม่มี header `anthropic-dangerous-direct-browser-access` แล้ว (ไม่ต้อง เพราะเรียกจาก server ไม่ใช่ browser)

### System Prompt (สรุปสาระ)

เป็นภาษาไทย กำหนดบทเป็น "สถาปนิก/วิศวกรโยธาผู้เชี่ยวชาญประเมินราคาก่อสร้างบ้านในไทย" มีเนื้อหา:
- อัตราค่าแรงอ้างอิงปี 2025-2026 (ต่อ ตร.ม. / ต่อจุด / ต่อ ลบ.ม.)
- แนวทางตั้งราคาวัสดุ 3 เกรด (Economy ≈0.7-0.8×, Standard 1.0×, Premium ≈1.4-1.6×) พร้อมยี่ห้ออ้างอิง
- แต่ละเกรดต้องมีวัสดุ **15-20 รายการ** ครอบคลุมงานโครงสร้าง/ก่อ-ฉาบ/หลังคา/สถาปัตย์/ระบบ
- **สำคัญ:** AI ห้ามคำนวณตารางเวลา/วันเริ่ม-จบ (ผู้ใช้จัดตารางเองใน Gantt)
- แบ่ง phases เป็น **5 เฟส** เสมอ, ตอบ **JSON เท่านั้น** (ห้าม markdown fence)

### JSON Schema ที่ AI ตอบกลับ (V5)

```jsonc
{
  "phases": [
    {
      "name": "string",                    // ชื่อเฟส
      "tasks": [
        { "name": "string",
          "material_cost": number,          // ค่าวัสดุ (บาท, ระดับมาตรฐาน ×1.0)
          "labor_cost": number,             // ค่าแรง (บาท)
          "details": "string" }
      ]
    }
  ],
  "recommendations": ["string"],           // คำแนะนำ
  "risks": [{ "risk": "string", "prevention": "string" }],
  "materials": {
    "economy":  [{ "name","spec","quantity","unit","pricePerUnit" }, ...15-20 รายการ],
    "standard": [...],
    "premium":  [...]
  },
  "materialLabor": { "economy": number, "standard": number, "premium": number }
}
```

> ⚠️ **หมายเหตุความไม่ตรงกัน:** UI (`RecommendTab`, `ContractDocument`) อ่าน `result.permits` (array ของ string) **แต่ system prompt ปัจจุบันไม่ได้สั่งให้ AI ส่ง `permits`** → ตอนเรียก AI จริง permits จะว่างเสมอ (มีเฉพาะในโหมด mock) ควรแก้ prompt ให้ AI ส่ง permits ด้วย (ดูข้อ 11)

### โหมด Mock ([src/services/mockData.js](src/services/mockData.js))

`buildMockAnalysis(projectInfo)` คืน object รูปแบบเดียวกับ schema ข้างบน (มี `permits` ครบ) — ใช้ทดสอบ UI โดยไม่เสียเงิน เปิดผ่าน `MockToggle` บนหน้า input แล้ว `run()` จะข้ามการเรียก API

---

## 6. ฟีเจอร์ทั้งหมดที่มีตอนนี้

| ฟีเจอร์ | รายละเอียด |
|---|---|
| 🔐 **Login (ผู้รับเหมา)** | เข้าสู่ระบบด้วยรหัสผ่าน (demo: `admin`) — demo auth, sessionStorage |
| 🧭 **Navigation (routing)** | react-router 3 หน้า: วิเคราะห์ (`/`) · แคตตาล็อก (`/catalog`) · โปรเจกต์ (`/projects`) พร้อมเมนูใน Header |
| 🏠 **แคตตาล็อกแบบบ้าน** | รายการแบบบ้าน + ตัวกรอง "จับคู่งบประมาณ" (ดูข้อ 12) |
| 📋 **แดชบอร์ด Mini ERP** | หลายโปรเจกต์แยกสถานะ + ค่างวด + BOQ vs ต้นทุนจริง (mock — ดูข้อ 12) |
| 📐 **อัปโหลดรูป** | drag&drop สูงสุด 7 รูป, ติด tag (แปลนพื้น/รูปด้าน/3D/บันดาลใจ), แปลง base64 |
| 🤖 **วิเคราะห์ด้วย AI** | ส่งรูป+ข้อมูล → Claude → BOQ + วัสดุ 3 เกรด + คำแนะนำ + ความเสี่ยง |
| 🧪 **โหมด Mock** | สลับใช้ข้อมูลจำลอง (ไม่เรียก API, ไม่ต้องอัปรูป) — ทดสอบ UI ฟรี |
| 📊 **Dashboard สรุป** | stat cards + Pie chart (สัดส่วนเฟส) + Bar chart (วัสดุ vs แรง) |
| 📅 **Gantt Chart interactive** | ลากปรับตารางงานได้ (ดูข้อ 7) |
| 💰 **BOQ** | ตารางแยก **ค่าวัสดุ / ค่าแรง** ต่อเฟส, แก้ตัวเลข inline (Manual), แสดง "AI: xxx" ขีดทับเมื่อแก้ |
| 🧱 **วัสดุ 3 เกรด** | ประหยัด/มาตรฐาน/พรีเมียม — เพิ่ม/แก้/ลบรายการ + ค่าแรงเหมาต่อเกรด, sync ยอดไปทุกหน้า |
| 🎚️ **เลือกเกรดวัสดุ** | multiplier ×0.75 / ×1.0 / ×1.45 (คูณเฉพาะค่าวัสดุ, ค่าแรงคงที่) |
| ✏️ **แก้ไข task** | เพิ่ม/แก้/ลบงาน (TaskModal), soft-delete งาน AI (reset ได้), เพิ่มงานเองถาวร |
| 💡 **คำแนะนำ/ความเสี่ยง/ใบอนุญาต** | RecommendTab |
| 📝 **สัญญาก่อสร้าง** | ร่างสัญญา A4 10 ข้อ (ภาษากฎหมายไทย) + งวดงาน (ต้องรวม 100%) + แปลงเลขเป็นตัวอักษรไทย |
| 📤 **Export PDF** | ทุกแท็บ export เป็น PDF A4 หลายหน้า (มี header/footer แบรนด์, ตัดหน้าอัจฉริยะ) |
| 🌗 **ธีม Dark/Light** | สลับได้, จำค่าใน localStorage |
| 💾 **Persist** | ผลวิเคราะห์+การแก้ไขทั้งหมดเก็บ localStorage — รีเฟรชแล้วยังอยู่ |
| 📱 **Responsive** | รองรับมือถือ (Tailwind breakpoints) |

---

## 7. ฟีเจอร์ Gantt Chart แบบละเอียด ([src/components/InteractiveGantt.jsx](src/components/InteractiveGantt.jsx))

Gantt แสดง **2 แท่งต่องาน**: **P (Planned/แผน)** สีตามเฟส และ **A (Actual/ทำจริง)** ลายทาง + สีตามสถานะ

### โหมดการทำงาน (2 โหมด)

| โหมด | พฤติกรรม |
|---|---|
| 🔗 **Auto Cascade** | เมื่อย้าย/ปรับงานหนึ่ง งานที่ตามมา (index มากกว่า) จะ **เลื่อนตามอัตโนมัติ** ตาม delta |
| ✋ **Free Move** | ย้ายแต่ละงานได้อิสระ ทับซ้อนได้ — ถ้าทับซ้อนเวลาจะมี **กรอบสีแดง + ⚠️ เตือน** (`detectOverlaps`) |

### การโต้ตอบกับแท่ง (drag)

ใช้ Pointer Events + `setPointerCapture`, snap ทีละ 1 วัน (`Math.round(deltaX / colWidth)`):

| ลาก | ผล |
|---|---|
| ลาก **กลางแท่ง** | ย้ายงาน (เปลี่ยน start, คง duration) |
| ลาก **ขอบขวา** | ยืด/หด duration (คง start) |
| ลาก **ขอบซ้าย** | เปลี่ยน start + duration (คงจุดสิ้นสุด) |

```js
// applyEdit(): แกนกลางของการแก้ + cascade
if (modeArg === 'cascade' && i > taskIndex && delta !== 0) {
  return { ...t, [startKey]: Math.max(0, t[startKey] + delta) }
}
```

### ความสามารถอื่น

- **กรอกวัน Planned/Actual** ผ่านช่อง input ตัวเลข (แก้ duration โดยตรง, `NumberInput`)
- **สถานะงาน** (`StatusSelect`): ⬜ ยังไม่เริ่ม / 🔵 กำลังทำ / ✅ เสร็จแล้ว / ⚠️ ล่าช้า — เลือก "เสร็จแล้ว" auto-set progress 100%, "ยังไม่เริ่ม" = 0%
- **Progress %** แสดงเป็นแถบ overlay บนแท่ง Actual (เมื่อ 0 < progress < 100)
- **สีแท่ง Actual** เปลี่ยนตามสถานะ (ถ้าไม่ใช่ not_started ใช้สีสถานะ, ไม่งั้นใช้สีเฟส)
- **Zoom** 5 ระดับ `[10,16,24,32,48]` px/วัน (ปุ่ม +/−), tick label ปรับความถี่ตาม zoom
- **วันที่จริง** (`projectStartDate`) — เลือกวันเริ่มโครงการ แล้วหัวตารางแสดงวันที่จริง (พ.ศ./ค.ศ. ไทย ผ่าน `Intl.DateTimeFormat('th-TH')`)
- **เพิ่ม/ลบ/เปลี่ยนชื่องาน** ในแต่ละเฟส (input ชื่อแก้ inline, ปุ่ม 🗑️, "+ เพิ่มงานในเฟส")
- **Export PDF** ปุ่มในทูลบาร์ (บังคับ overflow visible เพื่อให้ Gantt กว้างพิมพ์ครบ)
- **Controlled/Uncontrolled**: รับ `tasks/onTasksChange/mode/colWidth/projectStartDate` เป็น prop ได้ (ResultDashboard ยก state ขึ้นไปเก็บ เพื่อให้ค่าคงอยู่ตอนสลับแท็บ)

> ⚠️ **ข้อควรรู้เชิงสถาปัตยกรรม:** state ตารางใน Gantt (`ganttTasks` ใน ResultDashboard) **แยกจาก** state งานหลัก (`edits`/`allTasks` ใน context) — การเพิ่ม/ลบงานจาก context จะ sync **เข้า** Gantt แต่การลากปรับตารางใน Gantt **ไม่ sync กลับ** ไป BOQ/context (ถือเป็นมุมมองจัดตารางแยก) ดูข้อ 11

---

## 8. การ Deploy

### 8.1 Development

frontend + Node backend (2 process) และ ERP backend (แยก ถ้าต้องใช้):

```bash
npm install
node server.js     # Terminal 1: Node Express backend  → http://localhost:5000
npm run dev        # Terminal 2: Vite dev server        → http://localhost:5173

# (ทางเลือก) ERP backend — ดูข้อ 13
cd erp-backend && pip install -r requirements.txt && python app.py   # → :5001
```

- ต้องมีไฟล์ `.env` (root) ที่มี **`ANTHROPIC_API_KEY`** (ไม่มี prefix `VITE_`)
- `vite.config.js` proxy ทุก `/api/*` → Node backend อัตโนมัติ:

```js
server: { proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } }
```

> 💡 เปิดเว็บที่ **`http://localhost:5173`** — frontend ยิง `/api/analyze` → Vite proxy → Express (`:5000`) → Anthropic. API key อยู่ฝั่ง server ไม่หลุดมา browser
> ⚠️ ตอนต่อ ERP dashboard เข้ากับ backend จริง `/api/erp/*` จะชนกับ proxy `/api` ปัจจุบัน (ที่ชี้ไป `:5000`) — ต้องเพิ่ม proxy `/api/erp` → `:5001` แยก (ดูข้อ 14)

### 8.2 Production — **Render Web Service** (Node + server.js)

deploy frontend + Node proxy เป็น **Web Service** (ต้องเปลี่ยนจาก Static Site เดิม):

| ตั้งค่า Render | ค่า |
|---|---|
| Type | **Web Service** ⚠️ (เปลี่ยนจาก Static Site เดิม) |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start`  (= `node server.js`) |
| Environment Variable | **`ANTHROPIC_API_KEY`** = คีย์จริง (ไม่มี `VITE_` prefix) |
| Auto-Deploy | เปิด — push ขึ้น `main` แล้ว build+deploy อัตโนมัติ |
| URL | https://ai-construction-planner.onrender.com |

- Express serve static จาก `dist/` + endpoint `POST /api/analyze` ที่พอร์ตเดียวกัน (`process.env.PORT` ที่ Render กำหนดให้, local fallback 5000)
- **API key ไม่หลุดฝั่ง client อีกต่อไป** — อยู่ใน env ฝั่ง server เท่านั้น
- ⚠️ **ต้องลบ env เก่า `VITE_ANTHROPIC_API_KEY` ออกจาก Render** แล้วเพิ่ม `ANTHROPIC_API_KEY` แทน
- **ERP backend** (`erp-backend/`) deploy แยกเป็นอีก service (Python + PostgreSQL) — ยังไม่ได้ deploy

---

## 9. Environment Variables

| ตัวแปร | ที่ตั้ง | ค่า | หมายเหตุ |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `.env` (root, local) + Render env | `sk-ant-...` | **จำเป็น** — คีย์ Anthropic API. อยู่ฝั่ง **Node server เท่านั้น** (ไม่มี prefix `VITE_` จึงไม่ถูกฝังใน client bundle → ไม่หลุด) |
| `PORT` | Render กำหนดให้เอง (local fallback 5000) | (auto) | พอร์ตที่ Node Express ฟัง |
| `DATABASE_URL` | `erp-backend/.env` | `postgresql://...` | **(ERP)** connection string PostgreSQL สำหรับ Flask backend (ดูข้อ 13) |

ไฟล์ `.env`, `.env.local` และ `erp-backend/.env` อยู่ใน `.gitignore` (ห้าม commit) — ดู `.env.example`:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

> ⚠️ ถ้า `.env` เดิมยังใช้ชื่อ `VITE_ANTHROPIC_API_KEY` ต้อง **เปลี่ยนชื่อเป็น `ANTHROPIC_API_KEY`** ไม่งั้น server จะขึ้น `ANTHROPIC_API_KEY is not configured`

---

## 10. ปัญหาที่เคยเจอและวิธีแก้

| ปัญหา | อาการ | วิธีแก้ที่ใช้ |
|---|---|---|
| **Model name 404** | `API error 404: not_found_error, model: claude-sonnet-4-20250514` | `claude-sonnet-4-20250514` เลิกใช้แล้ว → เปลี่ยน `ANTHROPIC_MODEL` เป็น **`claude-sonnet-4-6`** ใน [constants.js](src/utils/constants.js) (commit `e730ea8`) |
| **CORS / เรียก API จากเบราว์เซอร์ไม่ได้** | เบราว์เซอร์บล็อกการเรียก Anthropic โดยตรง | (เดิม) เพิ่ม header `anthropic-dangerous-direct-browser-access` → **ปัจจุบันเลิกใช้** เพราะย้ายไปเรียกผ่าน backend proxy แล้ว |
| **API key หลุดฝั่ง client** | คีย์ `VITE_ANTHROPIC_API_KEY` ถูก inline ใน bundle → ใครเปิดเว็บก็ดึงไปใช้ได้ | ✅ **แก้แล้ว** — refactor เป็น Node Express backend proxy (`server.js`): ย้าย key เป็น `ANTHROPIC_API_KEY` ฝั่ง server, frontend เรียกผ่าน `/api/analyze` (ดูข้อ 5/8) |
| **JSON truncated** | AI ตอบ JSON ไม่ครบ (โดนตัดกลางคัน) → `JSON.parse` fail | (1) `repairJSON()` — ตัด fragment ค้าง + เติมวงเล็บ/ปีกกาที่ขาดให้ balance; (2) เพิ่ม `max_tokens` จาก 8k → **16k** เพื่อให้พอสำหรับ BOQ + วัสดุ 3 เกรด |
| **Express 5 wildcard route** | `app.get('*', ...)` แบบเดิม crash บน Express 5 (path-to-regexp v8) | ใช้ regex wildcard `app.get(/.*/, ...)` แทน สำหรับ SPA fallback ใน `server.js` |
| **npm EINTEGRITY** | `npm install` ล้มเพราะ checksum ไม่ตรง | `npm cache clean --force` แล้วติดตั้งใหม่ |

### `repairJSON` (หัวใจการกัน JSON พัง)

```js
// ตัด fragment key/value ที่ค้าง แล้ว balance วงเล็บ
fixed = fixed.replace(/,\s*"[^"]*$/, '').replace(/,\s*$/, '')
for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']'
for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}'
return JSON.parse(fixed)
```

---

## 11. สิ่งที่ยังไม่ได้ทำ / ควรทำต่อ

### 🟢 เสร็จแล้ว (ความปลอดภัย)
1. ✅ **ซ่อน API key ด้วย backend proxy** — Node Express `server.js` (`POST /api/analyze`) เรียก Anthropic ฝั่ง server ด้วย `ANTHROPIC_API_KEY`, frontend เรียกผ่าน `/api/analyze`. **เหลือแค่ปรับ Render เป็น Web Service + ตั้ง env `ANTHROPIC_API_KEY`** (ดูข้อ 8.2)

### 🟠 ความถูกต้องของข้อมูล
2. **`permits` ไม่อยู่ใน AI schema** — UI แสดง "ใบอนุญาตที่ต้องมี" แต่ system prompt ไม่ได้สั่งให้ AI ส่ง `permits` (มีเฉพาะ mock). ควรเพิ่ม `permits: ["string"]` เข้า schema ใน `SYSTEM_PROMPT` หรือเอาการ์ด permits ออก
3. **Gantt schedule ไม่ sync กลับ BOQ/context** — การลากปรับวันใน Gantt เป็น state แยก (`ganttTasks`) ไม่ย้อนกลับไป `edits`. ถ้าต้องการให้ตารางที่ลากมีผลต่อ BOQ/สัญญา ต้องเชื่อม `onTasksChange` → `updateTask` ใน context

### 🟡 ความสมบูรณ์ของฟีเจอร์
4. **Auth เป็น demo เท่านั้น** — รหัสผ่านผู้รับเหมา hardcode `'admin'` ([DEMO_CONTRACTOR_PASSWORD](src/utils/constants.js)). ต้องต่อ backend auth จริงก่อน production
5. **แคตตาล็อก & ERP dashboard ยังเป็น mock** — `HouseCatalog` ปุ่ม "เลือกแบบบ้านนี้" แค่พาไปหน้าวิเคราะห์ (ยังไม่ prefill), `MultiProjectDashboard` ใช้ mock data. ต้องต่อกับ ERP backend (ดูข้อ 13/14)
6. **ไม่มี persistence ข้ามเครื่อง (frontend)** — ผลวิเคราะห์อยู่แค่ localStorage. ERP backend (PostgreSQL) จะเป็นที่เก็บข้อมูลจริงข้ามผู้ใช้/เครื่อง

### 🟢 ปรับปรุงเสริม
7. Bundle ใหญ่ (~1.4MB) — พิจารณา code-splitting (โดยเฉพาะ recharts, jspdf, html2canvas)
8. เพิ่ม unit test (ตอนนี้ไม่มี test เลย)
9. Lint มี error เดิม (pre-existing) ในไฟล์ context (`react-refresh/only-export-components`) — แยก hook ออกจากไฟล์ provider เพื่อแก้

---

## 12. หน้าใหม่: แคตตาล็อก & แดชบอร์ด ERP (Frontend)

### 12.1 HouseCatalog ([src/pages/HouseCatalog.jsx](src/pages/HouseCatalog.jsx)) — route `/catalog`

แคตตาล็อกแบบบ้านพร้อมตัวกรอง **"จับคู่งบประมาณ"**:
- **Mock data** `HOUSE_PLANS` — 5 แบบ (id, title, imageUrl, budget, area, beds, baths, description)
- **Budget Matching:** input "💰 ระบุงบประมาณของคุณ" → กรองแสดงเฉพาะ `plan.budget <= งบที่กรอก` (ว่าง = แสดงทั้งหมด) + แสดงจำนวนที่พบ + ปุ่มล้างตัวกรอง
- **การ์ดแบบบ้าน:** รูป (มี `onError` fallback เป็น emoji 🏠 ถ้ารูปโหลดไม่ได้), ป้ายราคา, สเปก, รายละเอียด, ปุ่ม **"เลือกแบบบ้านนี้"** → `navigate('/')` ไปหน้าวิเคราะห์
- **Empty state** เมื่อไม่พบแบบในงบ

```js
const filtered = useMemo(
  () => (maxBudget > 0 ? HOUSE_PLANS.filter((p) => p.budget <= maxBudget) : HOUSE_PLANS),
  [maxBudget],
)
```

### 12.2 MultiProjectDashboard ([src/pages/MultiProjectDashboard.jsx](src/pages/MultiProjectDashboard.jsx)) — route `/projects`

แดชบอร์ด Mini ERP (mock) รวมภาพรวมหลายโปรเจกต์:
- **Mock data** `MOCK_PROJECTS` — 6 โปรเจกต์ (id, name, client, status, boqBudget, actualCost, installmentPaid, installmentTotal)
- **Summary stat cards:** จำนวนโปรเจกต์ · มูลค่างานรวม · กำไรสะสม (โดยประมาณ)
- **Kanban 3 สถานะ:** `กำลังประเมินราคา` (estimating) · `ระหว่างก่อสร้าง` (building) · `ส่งมอบแล้ว` (delivered) — การ์ดโปรเจกต์แยกคอลัมน์
- **ค่างวดงาน (Installment Tracking):** progress bar จ่ายแล้ว/ยอดรวม ต่อโปรเจกต์
- **BOQ vs ต้นทุนจริง (กำไร-ขาดทุน):** แท่งเทียบ BOQ กับต้นทุนจริง + ป้าย 📈 กำไร / 📉 ขาดทุน (ถ้า actual > boq)

> ทั้ง 2 หน้าใช้ `Header` (มีเมนูนำทาง) + design tokens เดิม (Card, bg-surface, accent) และเป็น **mock ล้วน** — จุดเชื่อมต่อ ERP backend คือข้อ 13/14

---

## 13. ERP Backend Scaffold ([erp-backend/](erp-backend/))

บริการ **แยกอิสระ** (Python/Flask/PostgreSQL) สำหรับโมดูล ERP — **ไม่เกี่ยวกับ** Node proxy (`server.js`). รันที่ **port 5001**.

### ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| [erp-backend/app.py](erp-backend/app.py) | Flask app (factory `create_app`), CORS, อ่าน `DATABASE_URL` จาก `.env`, `db.create_all()` ตอนรัน, port 5001 |
| [erp-backend/models.py](erp-backend/models.py) | SQLAlchemy models (`db = SQLAlchemy()` + 3 models) |
| [erp-backend/requirements.txt](erp-backend/requirements.txt) | `Flask`, `Flask-SQLAlchemy`, `psycopg2-binary`, `python-dotenv`, `flask-cors` |
| erp-backend/.env.example | `DATABASE_URL=postgresql://...` |
| erp-backend/README.md | วิธีติดตั้ง/รัน |

### Endpoints

| Method | Path | หน้าที่ |
|---|---|---|
| GET | `/api/erp/health` | health check |
| GET | `/api/erp/projects` | list โปรเจกต์ |
| GET | `/api/erp/materials` | list ราคาวัสดุตลาด |

### Models (`models.py`)

```python
class Project(db.Model):            # projects
    id, name, status
class FinancialTracking(db.Model):  # financial_tracking
    id, project_id (FK→projects), boq_budget, actual_cost, total_installment_paid
class MaterialMarketPrice(db.Model):# material_market_prices
    id, material_name, current_price, last_updated
```

### รัน

```bash
cd erp-backend
python -m venv venv && venv\Scripts\activate    # (Windows)
pip install -r requirements.txt
cp .env.example .env    # แก้ DATABASE_URL
python app.py           # http://localhost:5001  (ต้องมี PostgreSQL รันอยู่)
```

---

## 14. จุดที่ยังไม่เชื่อมต่อ (Integration TODO)

1. **Frontend ↔ ERP backend ยังไม่เชื่อม** — `MultiProjectDashboard` ใช้ mock; ต้องเรียก `/api/erp/*` (port 5001) จริง
2. **Dev proxy ชนกัน** — Vite proxy `/api` ปัจจุบันชี้ไป Node `:5000`; ต้องเพิ่ม `/api/erp` → `:5001` แยก (หรือให้ frontend เรียก `:5001` ตรง + CORS)
3. **ERP ยังไม่มี write endpoints / seed data** — มีแค่ GET (health/projects/materials); ต้องเพิ่ม POST/PUT + ข้อมูลตั้งต้น
4. **ยังไม่ deploy ERP** — ต้อง provision PostgreSQL + deploy Flask แยก

---

## ภาคผนวก — ค่าคงที่สำคัญ ([src/utils/constants.js](src/utils/constants.js))

```js
STEPS = { INPUT:'input', ANALYZING:'analyzing', RESULT:'result' }
ROLES = { CONTRACTOR:'contractor', HOMEOWNER:'homeowner' }  // HOMEOWNER = legacy (login ถูกลบแล้ว, คงค่าไว้เฉยๆ)
DEMO_CONTRACTOR_PASSWORD = 'admin'
ANTHROPIC_MODEL = 'claude-sonnet-4-6'
ANTHROPIC_MAX_TOKENS = 16000
ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'  // (เหลือเป็นค่าคงที่ ไม่ได้ใช้แล้วฝั่ง client — ย้ายไป server.js)
DEFAULT_TASK_DURATION_DAYS = 7

MATERIAL_GRADES = [
  { id:'economy',  label:'ประหยัด',  multiplier:0.75 },
  { id:'standard', label:'มาตรฐาน',  multiplier:1.0  },
  { id:'premium',  label:'พรีเมียม', multiplier:1.45 },
]
PHASE_COLORS = ['#e07a2f','#2a9d8f','#264653','#457b9d','#8338ec']
// + IMAGE_TAGS, HOUSE_STYLES, PROVINCES

// localStorage keys: 'acp-analysis-v2' (ผลวิเคราะห์), 'acp-theme' (ธีม)
// sessionStorage key: 'acp-auth' (ผู้ใช้)
```
