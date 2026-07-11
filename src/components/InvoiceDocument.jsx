import { formatBaht, numberToThaiText } from '../utils/formatters'
import { installmentAmount } from '../data/mockProjects'
import { useCompany } from '../contexts/CompanyContext'

const longDateFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function fmtThaiDate(iso) {
  try {
    return longDateFmt.format(iso ? new Date(iso) : new Date())
  } catch {
    return iso || ''
  }
}

function docNo(project, installment) {
  const year = new Date().getFullYear() + 543
  const pid = String(project?.id || 'P').replace(/[^A-Za-z0-9]/g, '')
  return `INV-${year}-${pid}-${String(installment?.no || 1).padStart(2, '0')}`
}

// ใบแจ้งหนี้ / ใบเสร็จรับเงิน สำหรับงวดงานหนึ่ง — คิด VAT 7% + หัก ณ ที่จ่าย 3%
function InvoiceDocument({ project, installment, vat = true, wht = false, docType = 'invoice' }) {
  const { company } = useCompany()

  const base = installmentAmount(project, installment)
  const vatAmount = vat ? Math.round(base * 0.07) : 0
  const whtAmount = wht ? Math.round(base * 0.03) : 0
  const totalInclVat = base + vatAmount
  const netPayable = base + vatAmount - whtAmount

  const isReceipt = docType === 'receipt'
  const title = isReceipt ? 'ใบเสร็จรับเงิน / ใบกำกับภาษี' : 'ใบแจ้งหนี้ / ใบวางบิล'

  const contact = [
    company.phone && `โทร. ${company.phone}`,
    company.email,
    company.taxId && `เลขผู้เสียภาษี ${company.taxId}`,
  ]
    .filter(Boolean)
    .join('  ·  ')

  const cellR = { textAlign: 'right', fontFamily: 'DM Mono, monospace' }
  const totalRow = (label, value, strong) => (
    <tr>
      <td colSpan={2} style={{ textAlign: 'right', fontWeight: strong ? 700 : 400 }}>
        {label}
      </td>
      <td style={{ ...cellR, fontWeight: strong ? 700 : 400 }}>{formatBaht(value)}</td>
    </tr>
  )

  return (
    <div
      data-export-section-strict
      data-export-label={title}
      data-export-filename={isReceipt ? 'Receipt' : 'Invoice'}
      data-export-project={project?.name || ''}
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
          <img src={company.logo} alt="logo" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
        )}
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>
            {company.name || '(ตั้งชื่อบริษัทที่เมนู ⚙️ ตั้งค่าบริษัท)'}
          </div>
          {company.address && <div style={{ fontSize: '11px', color: '#555' }}>{company.address}</div>}
          {contact && <div style={{ fontSize: '11px', color: '#555' }}>{contact}</div>}
        </div>
      </div>

      {/* หัวเอกสาร */}
      <div data-no-break>
        <h1 className="contract-title">{title}</h1>
        <div className="contract-meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>เลขที่ <strong>{docNo(project, installment)}</strong></span>
          <span>วันที่ {fmtThaiDate(installment?.date)}</span>
        </div>
      </div>

      {/* ลูกค้า */}
      <div data-no-break className="clause-block" style={{ marginTop: '10px' }}>
        <p><strong>ลูกค้า</strong> {project?.customerName || project?.client || '-'}</p>
        {project?.location && <p>สถานที่ {project.location}</p>}
        <p>อ้างอิงโครงการ {project?.name || '-'}</p>
      </div>

      {/* ตาราง */}
      <table className="spec-table" data-no-break style={{ marginTop: '8px' }}>
        <thead>
          <tr>
            <th style={{ width: '48px', textAlign: 'center' }}>ลำดับ</th>
            <th>รายการ</th>
            <th style={{ width: '150px', textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center' }}>1</td>
            <td>
              งวดที่ {installment?.no}: {installment?.label}
              <div style={{ fontSize: '11px', color: '#555' }}>
                ({installment?.percent}% ของมูลค่าสัญญา {formatBaht(project?.boqBudget || 0)})
              </div>
            </td>
            <td style={cellR}>{formatBaht(base)}</td>
          </tr>
          {totalRow('รวมเป็นเงิน', base)}
          {vat && totalRow('ภาษีมูลค่าเพิ่ม 7%', vatAmount)}
          {vat && totalRow('รวมเป็นเงินทั้งสิ้น', totalInclVat, true)}
          {wht && totalRow('หัก ภาษี ณ ที่จ่าย 3%', -whtAmount)}
          {totalRow('ยอดชำระสุทธิ', netPayable, true)}
        </tbody>
      </table>
      <p style={{ fontSize: '12px', marginTop: '4px' }}>({numberToThaiText(netPayable)})</p>

      {wht && (
        <p style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
          * หักภาษี ณ ที่จ่าย 3% สำหรับงานรับเหมา (กรณีผู้ว่าจ้างเป็นนิติบุคคล)
        </p>
      )}

      {/* ลงชื่อ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <div style={{ textAlign: 'center', width: '230px' }}>
          <div style={{ borderBottom: '1px dotted #333', height: '28px' }} />
          <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>ผู้รับเงิน</div>
        </div>
        <div style={{ textAlign: 'center', width: '230px' }}>
          <div style={{ borderBottom: '1px dotted #333', height: '28px' }} />
          <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>ผู้ว่าจ้าง / ผู้จ่ายเงิน</div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDocument
