import { formatBaht, numberToThaiText } from '../utils/formatters'
import { useCompany } from '../contexts/CompanyContext'

const longDateFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function fmtThaiDate(iso) {
  if (!iso) return ''
  try {
    return longDateFmt.format(new Date(iso))
  } catch {
    return iso
  }
}

function addDaysIso(iso, addDays) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    d.setDate(d.getDate() + Number(addDays || 0))
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function quotationNo(iso) {
  let year
  try {
    year = new Date(iso || Date.now()).getFullYear() + 543
  } catch {
    year = new Date().getFullYear() + 543
  }
  return `QT-${year}-001`
}

// สรุปยอดต่อเฟส (จาก allTasks) ไว้แสดงเป็นรายการงาน
function phaseBreakdown(result) {
  const map = new Map()
  for (const t of result?.allTasks || []) {
    const name = t.phaseName || `เฟส ${(t.phaseIdx ?? 0) + 1}`
    const amount =
      (Number(t.material_cost) || 0) + (Number(t.labor_cost) || 0)
    map.set(name, (map.get(name) || 0) + amount)
  }
  return [...map.entries()].map(([name, amount]) => ({ name, amount }))
}

function QuotationDocument({ form, result, projectInfo }) {
  const { company } = useCompany()
  const houseInfo = result?.house_analysis || {}
  const projectName =
    projectInfo?.name?.trim() || houseInfo.type || 'งานก่อสร้าง'

  const totalMaterial = result?.total_material_cost_adjusted || 0
  const totalLabor = result?.total_labor_cost || 0
  const subtotal = totalMaterial + totalLabor
  const vat = form.vatEnabled ? Math.round(subtotal * 0.07) : 0
  const grandTotal = subtotal + vat

  const quoteNo = quotationNo(form.quoteDate)
  const validUntil = addDaysIso(form.quoteDate, form.validDays)
  const rows = phaseBreakdown(result)

  const contact = [
    company.phone && `โทร. ${company.phone}`,
    company.email,
    company.taxId && `เลขผู้เสียภาษี ${company.taxId}`,
  ]
    .filter(Boolean)
    .join('  ·  ')

  const cellR = { textAlign: 'right', fontFamily: 'DM Mono, monospace' }

  return (
    <div
      data-export-section-strict
      data-export-label="ใบเสนอราคา"
      data-export-filename="Quotation"
      data-export-project={projectName}
      data-export-orientation="portrait"
      data-export-bare="true"
      className="contract-page shadow-md"
    >
      {/* หัวกระดาษบริษัท */}
      <div
        data-no-break
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '2px solid #333',
          paddingBottom: '8px',
          marginBottom: '14px',
        }}
      >
        {company.logo && (
          <img
            src={company.logo}
            alt="logo"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>
            {company.name || '(ตั้งชื่อบริษัทที่เมนู ⚙️ ตั้งค่าบริษัท)'}
          </div>
          {company.address && (
            <div style={{ fontSize: '11px', color: '#555' }}>{company.address}</div>
          )}
          {contact && (
            <div style={{ fontSize: '11px', color: '#555' }}>{contact}</div>
          )}
        </div>
      </div>

      {/* หัวเอกสาร */}
      <div data-no-break>
        <h1 className="contract-title">ใบเสนอราคา</h1>
        <div className="contract-subtitle">
          เลขที่ <strong>{quoteNo}</strong>
        </div>
        <div className="contract-meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>วันที่ {fmtThaiDate(form.quoteDate)}</span>
          <span>ยืนราคาถึง {fmtThaiDate(validUntil)}</span>
        </div>
      </div>

      {/* เรียนลูกค้า */}
      <div data-no-break className="clause-block" style={{ marginTop: '10px' }}>
        <p>
          <strong>เรียน</strong> {form.clientName || '.................................'}
        </p>
        {form.clientAddress && <p>ที่อยู่ {form.clientAddress}</p>}
        {form.clientPhone && <p>โทรศัพท์ {form.clientPhone}</p>}
        <p style={{ marginTop: '6px' }}>
          บริษัทฯ ขอเสนอราคางานก่อสร้าง <strong>{projectName}</strong>
          {houseInfo.estimated_size_sqm ? ` พื้นที่ใช้สอยประมาณ ${houseInfo.estimated_size_sqm} ตร.ม.` : ''} ดังนี้
        </p>
      </div>

      {/* ตารางเสนอราคา */}
      <table className="spec-table" data-no-break style={{ marginTop: '8px' }}>
        <thead>
          <tr>
            <th style={{ width: '48px', textAlign: 'center' }}>ลำดับ</th>
            <th>รายการ</th>
            <th style={{ width: '150px', textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{r.name}</td>
              <td style={cellR}>{formatBaht(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600 }}>
              รวมค่าวัสดุ + ค่าแรง (ก่อน VAT)
            </td>
            <td style={{ ...cellR, fontWeight: 600 }}>{formatBaht(subtotal)}</td>
          </tr>
          {form.vatEnabled && (
            <tr>
              <td colSpan={2} style={{ textAlign: 'right' }}>
                ภาษีมูลค่าเพิ่ม 7%
              </td>
              <td style={cellR}>{formatBaht(vat)}</td>
            </tr>
          )}
          <tr>
            <td colSpan={2} style={{ textAlign: 'right', fontWeight: 700 }}>
              รวมทั้งสิ้น
            </td>
            <td style={{ ...cellR, fontWeight: 700 }}>{formatBaht(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: '12px', marginTop: '4px' }}>
        ({numberToThaiText(grandTotal)})
      </p>

      {/* เงื่อนไข */}
      <div data-no-break className="clause-block" style={{ marginTop: '12px' }}>
        <div className="clause-number">เงื่อนไขการเสนอราคา</div>
        <ol style={{ paddingLeft: '18px', fontSize: '13px', lineHeight: 1.6 }}>
          <li>ราคานี้ยืนราคา {form.validDays} วัน (ถึง {fmtThaiDate(validUntil)})</li>
          <li>ราคานี้เป็นราคาโดยประมาณจากการประเมินแบบ อาจเปลี่ยนแปลงตามหน้างานจริง</li>
          <li>
            การชำระเงินแบ่งตามงวดงานที่ตกลงในสัญญาจ้าง
            {form.warrantyYears ? ` · รับประกันงาน ${form.warrantyYears} ปี` : ''}
          </li>
          {form.notes && <li>{form.notes}</li>}
        </ol>
      </div>

      {/* ลงชื่อ */}
      <div
        data-no-break
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}
      >
        <div style={{ textAlign: 'center', width: '260px' }}>
          <div style={{ borderBottom: '1px dotted #333', height: '28px' }} />
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            ({company.name || 'ผู้เสนอราคา'})
          </div>
          <div style={{ fontSize: '11px', color: '#555' }}>ผู้เสนอราคา</div>
        </div>
      </div>
    </div>
  )
}

export default QuotationDocument
