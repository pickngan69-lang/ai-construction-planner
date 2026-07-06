# PROJECT SUMMARY — AI Construction Planner

> เอกสารสรุปโปรเจกต์ฉบับสมบูรณ์ (สำหรับให้ AI / นักพัฒนาคนอื่นอ่านแล้วพัฒนาต่อได้ทันที)
> อัปเดตล่าสุด: 2026-07-06 · repo: `pickngan69-lang/ai-construction-planner` · branch: `main`

---

## 1. ภาพรวมโปรเจกต์

| หัวข้อ | รายละเอียด |
|---|---|
| **ชื่อ** | AI Construction Planner (package: `gantt-learning`) |
| **ภาษา UI** | ไทยทั้งหมด |
| **วัตถุประสงค์** | เว็บแอปช่วย **ผู้รับเหมา/เจ้าของบ้านชาวไทย** วางแผนก่อสร้างบ้าน — อัปโหลดรูปแบบบ้าน + กรอกข้อมูลโปรเจกต์ → ให้ Claude (Anthropic API) วิเคราะห์ออกมาเป็น **BOQ (ราคากลาง)**, **รายการวัสดุ 3 เกรด**, **Gantt Chart แบบ interactive**, **คำแนะนำ/ความเสี่ยง**, และ **ร่างสัญญาจ้างเหมาก่อสร้าง** พร้อม **Export PDF** |
| **โมเดล AI** | `claude-sonnet-4-6` (เรียกผ่าน **Express backend proxy** — API key ไม่หลุดฝั่ง browser) |
| **สถาปัตยกรรม** | React SPA (frontend) + **Express backend** (`server.js`) ทำหน้าที่ proxy ซ่อน API key และ serve ไฟล์ static; state ฝั่ง client เก็บใน `localStorage` / `sessionStorage` |

### Tech Stack

| ชั้น | เทคโนโลยี |
|---|---|
| Framework | **React 19** (`react`, `react-dom`) |
| Build tool | **Vite 8** (`@vitejs/plugin-react`) |
| Styling | **Tailwind CSS 4** (ผ่าน `@tailwindcss/vite`) + CSS variables (theme dark/light) |
| Charts | **recharts** (Pie + Bar ใน Dashboard) |
| PDF Export | **jspdf** + **html2canvas-pro** (รองรับ CSS สมัยใหม่ oklch/color-mix) |
| Fonts | Noto Sans Thai + DM Mono (โหลดจาก Google Fonts ใน `index.html`) |
| Routing | **ไม่มี react-router** — ใช้ conditional render ตาม role/step |
| State | React hooks + Context (ไม่มี Redux/Zustand) |
| **Backend** | **Express 5** + **cors** + **dotenv** (`server.js`) — proxy `POST /api/analyze` → Anthropic, serve `dist/` |

---

## 2. โครงสร้างไฟล์

```
gantt-learning/
├── index.html                      # HTML entry, โหลดฟอนต์ไทย, mount #root
├── server.js                       # ⭐ Express backend — proxy POST /api/analyze (ซ่อน API key) + serve dist/
├── vite.config.js                  # Vite config + dev proxy /api → backend (localhost:5000)
├── eslint.config.js                # ESLint (flat config)
├── package.json                    # deps + scripts (dev/build/lint/preview)
├── .env                            # VITE_ANTHROPIC_API_KEY (ห้าม commit — อยู่ใน .gitignore)
├── .env.example                    # ตัวอย่าง env
├── PROJECT_SUMMARY.md              # ← ไฟล์นี้
│
├── public/                         # static assets
└── src/
    ├── main.jsx                    # React entry — <StrictMode><App/></StrictMode>
    ├── App.jsx                     # Provider tree + RoleRouter (เลือกหน้าตาม role)
    ├── index.css                   # Tailwind + CSS variables ธีม (--color-ink, --color-accent ฯลฯ)
    ├── App.css                     # (สไตล์เสริม)
    │
    ├── contexts/
    │   ├── AuthContext.jsx         # login/logout, role (contractor/homeowner), sessionStorage
    │   ├── ThemeContext.jsx        # dark/light theme, localStorage 'acp-theme'
    │   └── AnalysisContext.jsx     # ครอบ useAnalysis() ให้ทุก component ใช้ร่วมกัน
    │
    ├── hooks/
    │   └── useAnalysis.js          # ⭐ หัวใจของแอป — state engine ทั้งหมด (analyze, edits, task/material CRUD)
    │
    ├── services/
    │   ├── aiService.js            # ⭐ เรียก Anthropic API (system prompt + schema + fetch)
    │   └── mockData.js             # ข้อมูลจำลองสำหรับโหมด "🧪 ทดสอบ" (ไม่เรียก API จริง)
    │
    ├── utils/
    │   ├── constants.js            # ค่าคงที่: STEPS, ROLES, MATERIAL_GRADES, PHASE_COLORS, HOUSE_STYLES, PROVINCES, ANTHROPIC_MODEL ฯลฯ
    │   ├── formatters.js           # formatBaht, formatDays, numberToThaiText (แปลงเลข→ตัวอักษรไทยสำหรับสัญญา)
    │   ├── jsonRepair.js           # ซ่อม JSON ที่ AI ตอบมาไม่ครบ (truncated)
    │   ├── exportPdf.js            # ⭐ แปลง DOM → PDF หลายหน้า (html2canvas-pro + jsPDF)
    │   └── cn.js                   # helper รวม className (แบบ clsx เบาๆ)
    │
    ├── pages/
    │   ├── LoginPage.jsx           # หน้า login (แท็บ ผู้รับเหมา/เจ้าของบ้าน)
    │   ├── ContractorDashboard.jsx # ⭐ flow หลักผู้รับเหมา: INPUT → ANALYZING → RESULT
    │   └── HomeownerDashboard.jsx  # หน้าเจ้าของบ้าน (ดูความคืบหน้า/งวดงาน — ส่วนใหญ่เป็น demo)
    │
    └── components/
        ├── Header.jsx              # แถบบน (โลโก้, role badge, ปุ่มย้อนกลับ, Export, Theme, ออก)
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
| **AuthContext** | `user` `{role, name, pin?}` เก็บใน `sessionStorage['acp-auth']` | `user`, `loginContractor(password)`, `loginHomeowner(pin)`, `logout()` |
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

### Pages

| Component | Props | State ภายใน | หน้าที่ |
|---|---|---|---|
| **App** | — | — | Provider tree (`Theme→Auth→Analysis`) + `RoleRouter` |
| **LoginPage** | — | `tab, password, pin, error` | login 2 แท็บ (ผู้รับเหมา=รหัสผ่าน / เจ้าของบ้าน=PIN 6 หลัก) |
| **ContractorDashboard** | — | `images, projectInfo, useMock` + ดึง `step/result/error/run/reset` จาก context | flow หลัก: INPUT → ANALYZING → RESULT |
| **HomeownerDashboard** | — | ดึง `result` จาก context | ดูภาพรวม/ความคืบหน้า/งวดงาน (ส่วนใหญ่ demo) |

### Components หลัก

| Component | Props สำคัญ | State | หน้าที่ |
|---|---|---|---|
| **Header** | `children`, `onBack` | — | แถบบน + role badge + ปุ่ม Export/Theme/ออก |
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

## 4. Application Flow (ตั้งแต่ต้นจนจบ)

```
main.jsx → <App>
             └── ThemeProvider → AuthProvider → AnalysisProvider → RoleRouter
                                                                      │
                    ┌─────────────────────────────────────────────────┤
                    ▼ (ยังไม่ login)         ▼ (contractor)          ▼ (homeowner)
                LoginPage             ContractorDashboard        HomeownerDashboard
```

### เส้นทางผู้รับเหมา (flow หลัก)

```
1. LoginPage → กรอกรหัส 'admin' → AuthContext.loginContractor() → user={role:'contractor'}
2. ContractorDashboard step = INPUT:
   - ImageUploader: ลากรูป → base64 (สูงสุด 7) + ติด tag
   - (ทางเลือก) MockToggle: 🧪 ทดสอบ = ไม่ต้องอัปรูป, ใช้ mockData
   - ProjectForm: กรอกข้อมูล → กด "วิเคราะห์แบบบ้าน"
3. handleAnalyze() → useAnalysis.run(images, projectInfo, {mock:useMock})
   - setStep(ANALYZING) → AnalyzingScreen แสดง
   - mock=false: aiService.analyzeHouse() เรียก Claude API
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

### เส้นทางเจ้าของบ้าน

```
LoginPage (PIN 6 หลักอะไรก็ได้) → HomeownerDashboard
   - ถ้ามี result ใน context → แสดงภาพรวม + ProgressCard + PaymentMilestones + DocumentVault
   - ความคืบหน้า/สถานะเฟส/เอกสาร ยังเป็น DEMO (hardcoded) — ดูข้อ 11
```

---

## 5. AI Service ([src/services/aiService.js](src/services/aiService.js))

### วิธีเรียก API (ผ่าน backend proxy — ซ่อน key)

frontend เรียก **`POST /api/analyze` ของ Express backend** (`server.js`) โดยไม่แตะ API key เลย. backend เติม `x-api-key` (จาก `ANTHROPIC_API_KEY` ฝั่ง server) แล้ว forward ไป Anthropic:

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
| 🔐 **Login 2 role** | ผู้รับเหมา (รหัส `admin`) / เจ้าของบ้าน (PIN 6 หลัก) — demo auth, sessionStorage |
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

### 8.1 Development (ต้องรัน 2 process)

```bash
npm install
node server.js     # Terminal 1: Express backend  → http://localhost:5000
npm run dev        # Terminal 2: Vite dev server   → http://localhost:5173
```

- ต้องมีไฟล์ `.env` ที่มี **`ANTHROPIC_API_KEY`** (ไม่มี prefix `VITE_`)
- `vite.config.js` proxy ทุก `/api/*` → backend อัตโนมัติ:

```js
server: { proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } }
```

> 💡 เปิดเว็บที่ **`http://localhost:5173`** — frontend ยิง `/api/analyze` → Vite proxy → Express (`:5000`) → Anthropic. API key อยู่ฝั่ง server ไม่หลุดมา browser

### 8.2 Production — **Render Web Service** (Node + server.js)

หลัง refactor เป็น backend proxy แล้ว ต้อง deploy เป็น **Web Service** (ต้องเปลี่ยนจาก Static Site เดิม):

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

---

## 9. Environment Variables

| ตัวแปร | ที่ตั้ง | ค่า | หมายเหตุ |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `.env` (local) + Render env (Web Service) | `sk-ant-...` | **จำเป็น** — คีย์ Anthropic API. อยู่ฝั่ง **server เท่านั้น** (ไม่มี prefix `VITE_` จึงไม่ถูกฝังใน client bundle → ไม่หลุด) |
| `PORT` | Render กำหนดให้เอง (local fallback 5000) | (auto) | พอร์ตที่ Express ฟัง |

ไฟล์ `.env` และ `.env.local` อยู่ใน `.gitignore` แล้ว (ห้าม commit) — ดู `.env.example`:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

> ⚠️ ถ้า `.env` เดิมยังใช้ชื่อ `VITE_ANTHROPIC_API_KEY` ต้อง **เปลี่ยนชื่อเป็น `ANTHROPIC_API_KEY`** ไม่งั้น server จะขึ้น `ANTHROPIC_API_KEY is not configured`

---

## 10. ปัญหาที่เคยเจอและวิธีแก้

| ปัญหา | อาการ | วิธีแก้ที่ใช้ |
|---|---|---|
| **Model name 404** | `API error 404: not_found_error, model: claude-sonnet-4-20250514` | `claude-sonnet-4-20250514` เลิกใช้แล้ว → เปลี่ยน `ANTHROPIC_MODEL` เป็น **`claude-sonnet-4-6`** ใน [constants.js](src/utils/constants.js) (commit `e730ea8`) |
| **CORS / เรียก API จากเบราว์เซอร์ไม่ได้** | เบราว์เซอร์บล็อกการเรียก Anthropic โดยตรง | เพิ่ม header **`anthropic-dangerous-direct-browser-access: 'true'`** + ยิงตรงไป endpoint `https://api.anthropic.com/v1/messages` (commits `87b243f`, `dce6a14`) |
| **API key หลุดฝั่ง client** | คีย์ `VITE_ANTHROPIC_API_KEY` ถูก inline ใน bundle → ใครเปิดเว็บก็ดึงไปใช้ได้ | ✅ **แก้แล้ว** — refactor เป็น Express backend proxy (`server.js`): ย้าย key เป็น `ANTHROPIC_API_KEY` ฝั่ง server, frontend เรียกผ่าน `/api/analyze` (ดูข้อ 5/8) |
| **JSON truncated** | AI ตอบ JSON ไม่ครบ (โดนตัดกลางคัน) → `JSON.parse` fail | (1) `repairJSON()` — ตัด fragment ค้าง + เติมวงเล็บ/ปีกกาที่ขาดให้ balance; (2) เพิ่ม `max_tokens` จาก 8k → **16k** เพื่อให้พอสำหรับ BOQ + วัสดุ 3 เกรด |
| **แก้หน้าสัญญา** | (commit `caab3b9`) ปรับ ContractDocument/ContractTab | — |
| **พิมพ์ตกตัวอักษร ImageUploader** | (commits `dd4e863`, `b290c09`) แก้ typo | — |

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
1. ✅ **ซ่อน API key ด้วย backend proxy** — ทำเสร็จแล้ว: Express `server.js` (`POST /api/analyze`) เรียก Anthropic ฝั่ง server ด้วย `ANTHROPIC_API_KEY`, frontend เรียกผ่าน `/api/analyze` (ไม่มี `VITE_` แล้ว). **เหลือแค่ปรับ Render เป็น Web Service + ตั้ง env `ANTHROPIC_API_KEY`** (ดูข้อ 8.2)

### 🟠 ความถูกต้องของข้อมูล
2. **`permits` ไม่อยู่ใน AI schema** — UI แสดง "ใบอนุญาตที่ต้องมี" แต่ system prompt ไม่ได้สั่งให้ AI ส่ง `permits` (มีเฉพาะ mock). ควรเพิ่ม `permits: ["string"]` เข้า schema ใน `SYSTEM_PROMPT` หรือเอาการ์ด permits ออก
3. **Gantt schedule ไม่ sync กลับ BOQ/context** — การลากปรับวันใน Gantt เป็น state แยก (`ganttTasks`) ไม่ย้อนกลับไป `edits`. ถ้าต้องการให้ตารางที่ลากมีผลต่อ BOQ/สัญญา ต้องเชื่อม `onTasksChange` → `updateTask` ใน context

### 🟡 ความสมบูรณ์ของฟีเจอร์
4. **Auth เป็น demo เท่านั้น** — รหัสผ่านผู้รับเหมา hardcode `'admin'` ([DEMO_CONTRACTOR_PASSWORD](src/utils/constants.js)), PIN เจ้าของบ้านรับตัวเลข 6 หลักอะไรก็ได้. ต้องต่อ backend auth จริงก่อน production
5. **HomeownerDashboard ส่วนใหญ่เป็น demo** — สถานะเฟส (`DEMO_PHASE_STATUS`), เอกสาร (`DEMO_DOCS`), ความคืบหน้า เป็นค่า hardcoded. ต้องต่อระบบอัปเดตสถานะจริงจากผู้รับเหมา
6. **ไม่มี backend/DB** — ข้อมูลอยู่แค่ localStorage ต่อ browser/เครื่อง. เจ้าของบ้านกับผู้รับเหมาไม่ได้แชร์ข้อมูลกันจริง (คนละ localStorage). ควรมี backend + โครงการที่ผูก user
7. **โหมด Mock ยังไม่ commit/deploy** — ณ เวลาที่เขียนเอกสารนี้ ไฟล์ `mockData.js` + `MockToggle.jsx` และการแก้ `useAnalysis/ContractorDashboard/ProjectForm` ยัง**ไม่ได้ commit ขึ้น GitHub** (ต้อง push ก่อนถึงจะขึ้นเว็บจริง)

### 🟢 ปรับปรุงเสริม
8. Bundle ใหญ่ (~1.35MB) — พิจารณา code-splitting (โดยเฉพาะ recharts, jspdf, html2canvas)
9. README ยังเป็น template เริ่มต้นของ Vite — ควรเขียนใหม่ให้ตรงโปรเจกต์
10. เพิ่ม unit test (ตอนนี้ไม่มี test เลย)

---

## ภาคผนวก — ค่าคงที่สำคัญ ([src/utils/constants.js](src/utils/constants.js))

```js
STEPS = { INPUT:'input', ANALYZING:'analyzing', RESULT:'result' }
ROLES = { CONTRACTOR:'contractor', HOMEOWNER:'homeowner' }
DEMO_CONTRACTOR_PASSWORD = 'admin'
ANTHROPIC_MODEL = 'claude-sonnet-4-6'
ANTHROPIC_MAX_TOKENS = 16000
ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
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
