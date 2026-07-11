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

// Add `addDays` days to ISO date and return a new ISO date string (yyyy-mm-dd)
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

// Generate a contract number like "CT-2569-001" (Buddhist year)
function generateContractNo(iso) {
  let year
  try {
    year = new Date(iso || Date.now()).getFullYear() + 543
  } catch {
    year = new Date().getFullYear() + 543
  }
  return `CT-${year}-001`
}

// Filled value (bold + dotted underline) or dotted blank
function Filled({ value, blank = 'medium' }) {
  if (value && String(value).trim()) {
    return <span className="filled-data">{value}</span>
  }
  return <span className={`blank-line ${blank}`}>&nbsp;</span>
}

// Inline-money shown as bold non-breaking
function Money({ value }) {
  return <span className="filled-data">{formatBaht(value)}</span>
}

function ContractDocument({
  form,
  installments,
  customTotal,
  customDays,
  daysToStart,
  warrantyYears,
  lateFinePercent,
  result,
  projectInfo,
  totalMaterial,
  totalLabor,
}) {
  const { company } = useCompany()
  const houseInfo = result?.house_analysis || {}
  const projectName =
    projectInfo?.name?.trim() || houseInfo.type || 'แผนก่อสร้าง'

  const companyContact = [
    company.phone && `โทร. ${company.phone}`,
    company.email,
    company.taxId && `เลขผู้เสียภาษี ${company.taxId}`,
  ]
    .filter(Boolean)
    .join('  ·  ')

  const contractNo = generateContractNo(form.contractDate)
  const startIso = addDaysIso(form.contractDate, daysToStart)
  const endIso = addDaysIso(startIso, customDays)
  const totalText = numberToThaiText(customTotal)
  const lateFinePerDay = (customTotal * (Number(lateFinePercent) || 0)) / 100

  return (
    <div
      data-export-section-strict
      data-export-label="สัญญาจ้างเหมาก่อสร้างบ้าน"
      data-export-filename="Contract"
      data-export-project={projectName}
      data-export-orientation="portrait"
      data-export-bare="true"
      className="contract-page shadow-md"
    >
      {/* ============ หัวกระดาษบริษัท (ผู้รับเหมา) ============ */}
      {company.name && (
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
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{company.name}</div>
            {company.address && (
              <div style={{ fontSize: '11px', color: '#555' }}>{company.address}</div>
            )}
            {companyContact && (
              <div style={{ fontSize: '11px', color: '#555' }}>{companyContact}</div>
            )}
          </div>
        </div>
      )}

      {/* ============ HEADER ============ */}
      <div data-no-break>
        <h1 className="contract-title">สัญญาจ้างเหมาก่อสร้างบ้าน</h1>
        <div className="contract-subtitle">
          เลขที่สัญญา: <strong>{contractNo}</strong>
        </div>
        <div className="contract-meta">
          ทำที่ <Filled value={form.location} blank="medium" /> เมื่อวันที่{' '}
          <Filled value={fmtThaiDate(form.contractDate)} blank="medium" />
        </div>
      </div>

      {/* ============ คู่สัญญา ============ */}
      <div data-no-break className="clause-block">
        <p className="mb-2">สัญญานี้ทำขึ้นระหว่าง</p>
        <div className="pl-6 mb-4">
          <p>
            ชื่อ <Filled value={form.ownerName} blank="long" /> อายุ{' '}
            <Filled value={form.ownerAge} blank="short" /> ปี
          </p>
          <p>
            เลขประจำตัวประชาชน{' '}
            <Filled value={form.ownerId} blank="medium" />
          </p>
          <p>
            ที่อยู่ <Filled value={form.ownerAddress} blank="long" />
          </p>
          <p>
            โทรศัพท์ <Filled value={form.ownerPhone} blank="medium" />
          </p>
          <p className="mt-1">
            ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"ผู้ว่าจ้าง"</strong> ฝ่ายหนึ่ง
          </p>
        </div>

        <p className="mb-2">กับ</p>
        <div className="pl-6 mb-4">
          <p>
            ชื่อ <Filled value={form.contractorName} blank="long" /> อายุ{' '}
            <Filled value={form.contractorAge} blank="short" /> ปี
          </p>
          <p>
            เลขประจำตัวประชาชน/ผู้เสียภาษี{' '}
            <Filled value={form.contractorId} blank="medium" />
          </p>
          {form.contractorRegistration && (
            <p>
              ทะเบียนนิติบุคคลเลขที่{' '}
              <Filled value={form.contractorRegistration} blank="medium" />
            </p>
          )}
          <p>
            ที่อยู่ <Filled value={form.contractorAddress} blank="long" />
          </p>
          <p>
            โทรศัพท์ <Filled value={form.contractorPhone} blank="medium" />
          </p>
          <p className="mt-1">
            ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"ผู้รับจ้าง"</strong> อีกฝ่ายหนึ่ง
          </p>
        </div>
      </div>

      <p className="mt-4 mb-2">
        คู่สัญญาตกลงทำสัญญากันดังมีข้อความต่อไปนี้
      </p>

      {/* ============ ข้อ 1. ขอบเขตงาน ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 1. ขอบเขตงาน</div>
        <p className="clause-body">
          ผู้ว่าจ้างตกลงว่าจ้าง และผู้รับจ้างตกลงรับจ้างทำการก่อสร้าง/ปรับปรุง
          ตามรายการในใบเสนอราคาและแบบรูปรายการที่แนบท้ายสัญญานี้
          ดังรายละเอียดต่อไปนี้:
        </p>
        <table className="spec-table">
          <tbody>
            <tr>
              <td>ประเภทอาคาร</td>
              <td>
                <Filled
                  value={houseInfo.type || projectName}
                  blank="long"
                />
              </td>
            </tr>
            {houseInfo.style && (
              <tr>
                <td>สไตล์</td>
                <td>{houseInfo.style}</td>
              </tr>
            )}
            <tr>
              <td>พื้นที่ใช้สอย</td>
              <td>
                <Filled
                  value={
                    houseInfo.estimated_size_sqm
                      ? `${houseInfo.estimated_size_sqm} ตารางเมตร`
                      : projectInfo?.area
                        ? `${projectInfo.area} ตารางเมตร`
                        : ''
                  }
                  blank="medium"
                />
              </td>
            </tr>
            <tr>
              <td>จำนวนชั้น</td>
              <td>
                <Filled
                  value={
                    houseInfo.floors || projectInfo?.floors
                      ? `${houseInfo.floors || projectInfo.floors} ชั้น`
                      : ''
                  }
                  blank="short"
                />
              </td>
            </tr>
            <tr>
              <td>จำนวนห้องนอน</td>
              <td>
                <Filled
                  value={
                    projectInfo?.bedrooms
                      ? `${projectInfo.bedrooms} ห้อง`
                      : ''
                  }
                  blank="short"
                />
              </td>
            </tr>
            <tr>
              <td>จำนวนห้องน้ำ</td>
              <td>
                <Filled
                  value={
                    projectInfo?.bathrooms
                      ? `${projectInfo.bathrooms} ห้อง`
                      : ''
                  }
                  blank="short"
                />
              </td>
            </tr>
            <tr>
              <td>สถานที่ก่อสร้าง</td>
              <td>
                <Filled
                  value={projectInfo?.province || form.location}
                  blank="medium"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ============ ข้อ 2. ค่าจ้าง ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 2. ค่าจ้าง</div>
        <p className="clause-body">
          ผู้ว่าจ้างตกลงจ่ายค่าจ้างเหมา (รวมค่าวัสดุและค่าแรงงาน)
          ซึ่งรวมภาษีอากรและค่าใช้จ่ายอื่น ๆ ทั้งปวงแล้ว เป็นเงินทั้งสิ้น
        </p>
        <div className="total-price-box">
          <div className="total-price-amount">{formatBaht(customTotal)}</div>
          <div className="total-price-text">({totalText})</div>
          <div className="total-price-breakdown">
            <div>
              <span>ค่าวัสดุ</span>
              <span className="filled-data">{formatBaht(totalMaterial)}</span>
            </div>
            <div>
              <span>ค่าแรงงาน</span>
              <span className="filled-data">{formatBaht(totalLabor)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ข้อ 3. การชำระเงิน ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 3. การชำระเงิน</div>
        <p className="clause-body">
          ผู้ว่าจ้างตกลงชำระเงินค่าจ้างให้แก่ผู้รับจ้าง โดยแบ่งออกเป็น{' '}
          <strong>{installments.length}</strong> งวด ดังนี้
        </p>
        <table className="payment-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>งวด</th>
              <th style={{ width: '70px' }}>ร้อยละ</th>
              <th style={{ width: '120px' }}>จำนวนเงิน</th>
              <th>เงื่อนไขการจ่าย</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((inst, index) => {
              const amount =
                (customTotal * (Number(inst.percent) || 0)) / 100
              return (
                <tr key={inst.id} className="break-inside-avoid">
                  <td className="center">{index + 1}</td>
                  <td className="center">{inst.percent || 0}%</td>
                  <td className="num">{formatBaht(amount)}</td>
                  <td>{inst.condition || '—'}</td>
                </tr>
              )
            })}
            <tr className="total-row">
              <td className="center" colSpan={2}>
                รวม 100%
              </td>
              <td className="num">{formatBaht(customTotal)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ============ ข้อ 4. กำหนดเวลาแล้วเสร็จ ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 4. กำหนดเวลาแล้วเสร็จ</div>
        <p className="clause-body">
          ผู้รับจ้างจะเริ่มลงมือทำงานภายใน{' '}
          <Filled value={daysToStart} blank="short" /> วัน นับแต่วันทำสัญญา
          และจะต้องทำงานให้แล้วเสร็จบริบูรณ์ภายใน{' '}
          <Filled value={customDays} blank="short" /> วัน นับแต่วันเริ่มงาน
        </p>
        <table className="spec-table">
          <tbody>
            <tr>
              <td>กำหนดวันเริ่มงาน</td>
              <td>
                <Filled value={fmtThaiDate(startIso)} blank="medium" />
              </td>
            </tr>
            <tr>
              <td>กำหนดวันแล้วเสร็จ</td>
              <td>
                <Filled value={fmtThaiDate(endIso)} blank="medium" />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ============ ข้อ 5. การปรับ ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 5. การปรับ</div>
        <p className="clause-body">
          หากผู้รับจ้างไม่สามารถทำงานให้แล้วเสร็จภายในกำหนดเวลาตามข้อ 4
          ผู้รับจ้างยินยอมให้ผู้ว่าจ้างปรับเป็นรายวันในอัตราร้อยละ{' '}
          <strong>{lateFinePercent}</strong> ของค่าจ้างเหมา คิดเป็นวันละ{' '}
          <Money value={lateFinePerDay} /> นับแต่วันถัดจากวันครบกำหนด
          จนถึงวันที่ผู้รับจ้างทำงานให้แล้วเสร็จและส่งมอบงาน
        </p>
      </section>

      {/* ============ ข้อ 6. การรับประกัน ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 6. การรับประกันผลงาน</div>
        <p className="clause-body">
          ผู้รับจ้างรับประกันผลงานเป็นเวลา{' '}
          <strong>{warrantyYears}</strong> ปี นับแต่วันส่งมอบงาน
          หากปรากฏความชำรุดบกพร่องอันเกิดจากความผิดพลาดของวัสดุหรือฝีมือแรงงาน
          ผู้รับจ้างจะดำเนินการแก้ไขให้เรียบร้อยโดยไม่คิดค่าใช้จ่ายเพิ่มเติม
          ภายในระยะเวลาที่ผู้ว่าจ้างกำหนดอันสมควร
        </p>
      </section>

      {/* ============ ข้อ 7. การเปลี่ยนแปลง ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 7. การเปลี่ยนแปลงงาน</div>
        <p className="clause-body">
          การเปลี่ยนแปลง เพิ่มเติม หรือยกเลิกรายการงานใด ๆ
          จากที่ตกลงไว้ในเอกสารแนบท้ายสัญญา จะต้องได้รับความยินยอมเป็น
          ลายลักษณ์อักษรจากคู่สัญญาทั้งสองฝ่าย
          และให้ทำเป็นเอกสารแนบท้ายสัญญาเพิ่มเติมเป็นรายกรณีไป
        </p>
      </section>

      {/* ============ ข้อ 8. เหตุสุดวิสัย ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 8. เหตุสุดวิสัย</div>
        <p className="clause-body">
          หากเกิดเหตุสุดวิสัย เช่น ภัยพิบัติทางธรรมชาติ
          คำสั่งของหน่วยงานราชการ หรือสถานการณ์ที่อยู่นอกเหนือการควบคุมของ
          คู่สัญญา อันทำให้การปฏิบัติตามสัญญาล่าช้าหรือไม่อาจกระทำได้
          ผู้รับจ้างมีสิทธิขอขยายเวลาตามจริงได้ โดยต้องแจ้งเหตุเป็น
          ลายลักษณ์อักษรภายใน 7 วันนับแต่วันเกิดเหตุ
        </p>
      </section>

      {/* ============ ข้อ 9. การบอกเลิก ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 9. การบอกเลิกสัญญา</div>
        <p className="clause-body">
          คู่สัญญาฝ่ายใดฝ่ายหนึ่งมีสิทธิบอกเลิกสัญญาได้
          หากอีกฝ่ายผิดสัญญาในสาระสำคัญและไม่แก้ไขภายในระยะเวลาอันสมควร
          ที่ได้รับการบอกกล่าวเป็นลายลักษณ์อักษร
          การบอกเลิกสัญญาต้องทำเป็นหนังสือ
          และให้คู่สัญญาทั้งสองฝ่ายสะสางหนี้สินให้เรียบร้อย
        </p>
      </section>

      {/* ============ ข้อ 10. ระงับข้อพิพาท ============ */}
      <section className="clause-block" data-no-break>
        <div className="clause-number">ข้อ 10. การระงับข้อพิพาท</div>
        <p className="clause-body">
          หากมีข้อพิพาทเกิดขึ้นจากการตีความหรือปฏิบัติตามสัญญานี้
          คู่สัญญาตกลงเจรจาให้ได้ข้อยุติโดยสุจริต
          หากเจรจาไม่อาจตกลงกันได้ภายใน 30 วัน ให้นำข้อพิพาทขึ้นสู่ศาลที่
          มีเขตอำนาจ ณ ท้องที่ที่ก่อสร้าง
        </p>
      </section>

      {/* ============ Closing ============ */}
      <p
        className="mt-8 mb-4 clause-block break-inside-avoid"
        data-no-break
      >
        สัญญานี้ทำขึ้นเป็นสองฉบับ มีข้อความถูกต้องตรงกัน
        คู่สัญญาได้อ่านและเข้าใจข้อความโดยตลอดแล้ว
        จึงได้ลงลายมือชื่อต่อหน้าพยานไว้เป็นสำคัญ
      </p>

      {/* ============ Signatures ============ */}
      <div className="signature-section" data-no-break>
        <div className="signature-row">
          <div className="signature-block">
            <div className="signature-line">
              <span>ลงชื่อ</span>
              <span className="dots" />
              <span className="lbl">ผู้ว่าจ้าง</span>
            </div>
            <div className="signature-name">
              ( {form.ownerName || '..............................'} )
            </div>
            <div className="signature-date">
              วันที่ ......./........./...........
            </div>
          </div>
          <div className="signature-block">
            <div className="signature-line">
              <span>ลงชื่อ</span>
              <span className="dots" />
              <span className="lbl">ผู้รับจ้าง</span>
            </div>
            <div className="signature-name">
              ( {form.contractorName || '..............................'} )
            </div>
            <div className="signature-date">
              วันที่ ......./........./...........
            </div>
          </div>
        </div>

        <div className="signature-row witnesses">
          <div className="signature-block">
            <div className="signature-line">
              <span>ลงชื่อ</span>
              <span className="dots" />
              <span className="lbl">พยาน</span>
            </div>
            <div className="signature-name">
              ( {form.witness1 || '..............................'} )
            </div>
          </div>
          <div className="signature-block">
            <div className="signature-line">
              <span>ลงชื่อ</span>
              <span className="dots" />
              <span className="lbl">พยาน</span>
            </div>
            <div className="signature-name">
              ( {form.witness2 || '..............................'} )
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractDocument
