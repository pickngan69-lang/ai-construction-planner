import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const COMPANY_NAME = 'AI Construction Planner'
const COMPANY_TAGLINE = 'วางแผนก่อสร้างอัจฉริยะ • Powered by Claude'
const ACCENT = '#e07a2f'

const dateFmt = new Intl.DateTimeFormat('th-TH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function safeFilenamePart(s) {
  return (s || '')
    .toString()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

export function buildFilename(tabLabel, projectName) {
  const tab = safeFilenamePart(tabLabel) || 'Report'
  const proj = safeFilenamePart(projectName) || 'Project'
  return `${tab}_${proj}.pdf`
}

async function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      })
    }),
  )
}

function buildBrandedHeader({ projectName, tabLabel }) {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    padding-bottom: 12px;
    border-bottom: 2px solid ${ACCENT};
    margin-bottom: 16px;
    font-family: 'Noto Sans Thai', system-ui, sans-serif;
    color: #111111;
    background: #ffffff;
  `
  const today = dateFmt.format(new Date())
  wrapper.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
      <div>
        <div style="font-size:18px; font-weight:700; color:#111111;">
          🏗️ ${COMPANY_NAME}
        </div>
        <div style="font-size:11px; color:#666666; margin-top:2px;">
          ${COMPANY_TAGLINE}
        </div>
      </div>
      <div style="text-align:right; font-size:11px; color:#666666; white-space:nowrap;">
        <div>วันที่ออกเอกสาร</div>
        <div style="font-weight:600; color:#111111;">${today}</div>
      </div>
    </div>
    <div style="margin-top:10px;">
      <div style="font-size:14px; font-weight:600; color:${ACCENT};">
        📄 ${tabLabel || 'รายงาน'}
      </div>
      ${
        projectName
          ? `<div style="font-size:12px; color:#333333; margin-top:2px;">โครงการ: <strong>${projectName}</strong></div>`
          : ''
      }
    </div>
  `
  return wrapper
}

function buildBrandedFooter() {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    margin-top: 18px;
    padding-top: 8px;
    border-top: 1px solid #dddddd;
    font-size: 10px;
    color: #888888;
    font-family: 'Noto Sans Thai', system-ui, sans-serif;
    display: flex;
    justify-content: space-between;
  `
  wrapper.innerHTML = `
    <span>เอกสารจัดทำโดย ${COMPANY_NAME}</span>
    <span>เอกสารนี้สร้างโดยอัตโนมัติ — โปรดตรวจสอบก่อนใช้งานจริง</span>
  `
  return wrapper
}

/**
 * Export a DOM element to a PDF file. Uses html2canvas-pro (which supports
 * modern CSS color functions like oklab/oklch/color-mix) + jsPDF for
 * multi-page A4 layout with smart page-aware breaks.
 */
export async function exportElementToPdf({
  element,
  filename = 'export.pdf',
  projectName,
  tabLabel,
  orientation = 'portrait',
  bare = false,
}) {
  if (!element) {
    throw new Error('exportElementToPdf: element is required')
  }

  // A4 width at 96dpi: portrait≈794, landscape≈1123. Use generous values for
  // sharper output.
  const targetWidth = orientation === 'landscape' ? 1100 : 800

  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-theme', 'light')
  wrapper.style.cssText = `
    background: #ffffff;
    color: #111111;
    padding: ${bare ? '0' : '16px'};
    font-family: 'Noto Sans Thai', system-ui, sans-serif;
    width: ${targetWidth}px;
    position: fixed;
    left: -99999px;
    top: 0;
    z-index: -1;
  `

  const clone = element.cloneNode(true)

  // Strip UI chrome that shouldn't appear in PDF.
  // Both attribute (`data-print-hide`) and class (`.no-print`) are honored —
  // any element marked either way is removed from the cloned tree before
  // rendering to canvas.
  clone
    .querySelectorAll('[data-print-hide], .no-print')
    .forEach((el) => el.remove())

  // Force overflow visible so wide content (Gantt) prints fully
  clone
    .querySelectorAll('.overflow-x-auto, .overflow-y-auto, .overflow-auto')
    .forEach((el) => {
      el.style.overflow = 'visible'
    })

  // Strip ALL box-shadows in the clone — shadows produce a dark band at the
  // bottom edge that reads as a black line when sliced across pages.
  clone.style.boxShadow = 'none'
  clone.querySelectorAll('*').forEach((el) => {
    el.style.boxShadow = 'none'
  })

  // In bare mode, also normalize the outermost element so it fills the
  // page edge-to-edge (useful for formal A4 documents like contracts).
  if (bare) {
    clone.style.margin = '0'
    clone.style.maxWidth = 'none'
    clone.style.width = '100%'
    clone.style.minHeight = 'auto'
    clone.style.border = 'none'
    clone.style.boxShadow = 'none'
    clone.style.borderRadius = '0'
  }

  if (!bare) wrapper.appendChild(buildBrandedHeader({ projectName, tabLabel }))
  wrapper.appendChild(clone)
  if (!bare) wrapper.appendChild(buildBrandedFooter())

  document.body.appendChild(wrapper)

  // Allow fonts/images/layout to settle
  await waitForImages(wrapper)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  // ---- Capture no-break ranges (CSS-px relative to wrapper) ----
  const SCALE = 2
  const wrapperRect = wrapper.getBoundingClientRect()
  const noBreakRangesCss = []
  wrapper
    .querySelectorAll('[data-no-break], .break-inside-avoid')
    .forEach((el) => {
      const r = el.getBoundingClientRect()
      noBreakRangesCss.push({
        top: r.top - wrapperRect.top,
        bottom: r.bottom - wrapperRect.top,
      })
    })

  try {
    const canvas = await html2canvas(wrapper, {
      scale: SCALE,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: targetWidth,
      logging: false,
    })

    const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const margin = bare ? 0 : 10
    const usableWidth = pdfWidth - margin * 2
    const usableHeight = pdfHeight - margin * 2
    const fullImgHeight = (usableWidth * canvas.height) / canvas.width

    // Conversion helpers
    const cssPxToMm = (usableWidth / canvas.width) * SCALE // CSS-px → mm
    const mmToCanvasPx = canvas.width / usableWidth // mm → canvas-px

    const noBreakMm = noBreakRangesCss.map((r) => ({
      top: r.top * cssPxToMm,
      bottom: r.bottom * cssPxToMm,
    }))

    if (fullImgHeight <= usableHeight + 0.5) {
      // Fits on one page — single-shot path
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, fullImgHeight)
    } else {
      // Multi-page: cut canvas into separate slices per page (no overlap, no
      // duplication — each page gets its own clean image).
      const sliceCanvas = document.createElement('canvas')
      const sliceCtx = sliceCanvas.getContext('2d')
      let cursorMm = 0
      let pageNum = 0
      const safety = 50 // hard cap

      while (cursorMm < fullImgHeight - 0.5 && pageNum < safety) {
        // Default page consumes a full A4 worth of mm
        let pageAdvance = Math.min(usableHeight, fullImgHeight - cursorMm)
        const pageEnd = cursorMm + pageAdvance

        // Snap break before any no-break range that would otherwise be cut
        for (const range of noBreakMm) {
          const rangeHeight = range.bottom - range.top
          if (rangeHeight > usableHeight) continue // can't avoid breaking
          if (
            range.top > cursorMm + 1 &&
            range.top < pageEnd &&
            range.bottom > pageEnd
          ) {
            const newAdvance = range.top - cursorMm
            if (newAdvance > 5 && newAdvance < pageAdvance) {
              pageAdvance = newAdvance
            }
          }
        }

        // Slice in canvas-pixel coords
        const sliceStartPx = Math.round(cursorMm * mmToCanvasPx)
        const sliceHeightPx = Math.min(
          Math.round(pageAdvance * mmToCanvasPx),
          canvas.height - sliceStartPx,
        )
        if (sliceHeightPx <= 0) break

        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceHeightPx
        sliceCtx.fillStyle = '#ffffff'
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        sliceCtx.drawImage(
          canvas,
          0,
          sliceStartPx,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx,
        )
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95)
        const sliceHeightMm = (sliceHeightPx / canvas.width) * usableWidth

        if (pageNum > 0) pdf.addPage()
        pdf.addImage(
          sliceData,
          'JPEG',
          margin,
          margin,
          usableWidth,
          sliceHeightMm,
        )

        cursorMm += pageAdvance
        pageNum++
      }
    }

    pdf.save(filename)
  } finally {
    wrapper.remove()
  }
}

/**
 * Find the active export target in the DOM and export it. Strict-mode targets
 * (`[data-export-section-strict]`) take priority over the page-level
 * (`[data-export-section]`) wrapper, so a tab can scope export to only its
 * own content (e.g. ContractTab targets just the A4 paper).
 */
export async function exportCurrentSection() {
  const target =
    document.querySelector('[data-export-section-strict]') ||
    document.querySelector('[data-export-section]')
  if (!target) {
    alert('ไม่พบเนื้อหาให้ Export — โปรดเปิดหน้าที่มีข้อมูลก่อน')
    return
  }
  const tabLabel = target.getAttribute('data-export-label') || 'รายงาน'
  const projectName = target.getAttribute('data-export-project') || ''
  const orientation =
    target.getAttribute('data-export-orientation') === 'landscape'
      ? 'landscape'
      : 'portrait'
  const bare = target.getAttribute('data-export-bare') === 'true'

  const filenamePrefix =
    target.getAttribute('data-export-filename') || tabLabel
  const filename = buildFilename(filenamePrefix, projectName)

  await exportElementToPdf({
    element: target,
    filename,
    projectName,
    tabLabel,
    orientation,
    bare,
  })
}
