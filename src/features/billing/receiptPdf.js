import { exportElementToPdf } from '../../utils/exportPdf'

export const RECEIPT_A4_WIDTH_PX = 794
export const RECEIPT_A4_HEIGHT_PX = 1123
const SIGNATURE_IMAGE_URL = '/billing/authorized-signature.png'

const ISSUER = {
  englishName: 'SAMART PROPERTY BROKER COMPANY LIMITED',
  thaiName: 'บริษัท สามารถ พร็อบเปอร์ตี้ โบรกเกอร์ จำกัด',
  productName: 'AI Construction Planner',
  tel: '088-268-6934',
  email: 'Samartpropertybroker@gmail.com',
  address: '154 หมู่ที่ 7 ตำบลน้ำแพร่ อำเภอพร้าว จ.เชียงใหม่ 50190',
  taxId: '0505566023075',
  branch: 'สำนักงานใหญ่',
}

const moneyFmt = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFmt = new Intl.DateTimeFormat('th-TH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getReceiptNo(payment) {
  if (payment?.receiptNo) return payment.receiptNo
  if (payment?.isSample || String(payment?.id || '').startsWith('sample_')) return 'DRAFT'
  if (payment?.status === 'paid') return 'รอออกเลขเอกสาร'
  return 'DRAFT'
}

function baht(value) {
  return `${moneyFmt.format(Number(value) || 0)} บาท`
}

function getAmounts(payment, plan) {
  const subtotal = Number(payment?.subtotal ?? payment?.subtotalAmount ?? plan?.subtotal ?? plan?.price ?? 0)
  const vatAmount = Number(payment?.vatAmount ?? plan?.vatAmount ?? 0)
  const totalAmount = Number(payment?.totalAmount ?? plan?.totalAmount ?? subtotal + vatAmount)
  return { subtotal, vatAmount, totalAmount }
}

function valueOrDash(value) {
  return value ? String(value) : '-'
}

export function buildReceiptHtml({ payment, plan, member, receiptProfile }) {
  const issuedAt = payment?.receiptIssuedAt || payment?.paidAt || payment?.updatedAt || payment?.createdAt || Date.now()
  const customerName = receiptProfile?.receiptName || member?.name || member?.email || '-'
  const customerEmail = receiptProfile?.billingEmail || member?.email || '-'
  const customerAddress = receiptProfile?.address || '-'
  const customerTaxId = receiptProfile?.taxId || '-'
  const customerBranch = receiptProfile?.branch || '-'
  const note = receiptProfile?.note || '-'
  const { subtotal, vatAmount, totalAmount } = getAmounts(payment, plan)
  const isSample = payment?.isSample || String(payment?.id || '').startsWith('sample_')

  return `
    <div style="display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #e07a2f;padding-bottom:16px;">
      <div style="max-width:470px;">
        <div style="font-size:22px;font-weight:800;color:#111;line-height:1.25;">ใบเสร็จรับเงิน/ใบกำกับภาษี</div>
        <div style="margin-top:8px;font-size:15px;font-weight:800;color:#111;line-height:1.45;">${escapeHtml(ISSUER.englishName)}</div>
        <div style="font-size:15px;font-weight:700;color:#111;line-height:1.45;">${escapeHtml(ISSUER.thaiName)}</div>
        <div style="margin-top:6px;font-size:12px;color:#555;line-height:1.6;">${escapeHtml(ISSUER.productName)}</div>
        ${isSample ? '<div style="display:inline-block;margin-top:8px;border:1px solid #e07a2f;color:#e07a2f;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;">DRAFT / ตัวอย่าง</div>' : ''}
      </div>
      <div style="text-align:right;font-size:12px;color:#555;line-height:1.7;min-width:210px;">
        <div>เลขที่: <strong style="color:#111;">${escapeHtml(getReceiptNo(payment))}</strong></div>
        <div>วันที่ออก: <strong style="color:#111;">${escapeHtml(dateFmt.format(new Date(issuedAt)))}</strong></div>
        <div>ช่องทางชำระเงิน: <strong style="color:#111;">${escapeHtml(payment?.provider || '-')}</strong></div>
      </div>
    </div>

    <div style="margin-top:18px;border:1px solid #ddd;border-radius:8px;padding:14px;font-size:12px;color:#555;line-height:1.7;">
      <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:4px;">ผู้ขาย/ผู้ให้บริการ</div>
      <div>${escapeHtml(ISSUER.thaiName)}</div>
      <div>${escapeHtml(ISSUER.address)}</div>
      <div>เลขประจำตัวผู้เสียภาษีอากร ${escapeHtml(ISSUER.taxId)} (${escapeHtml(ISSUER.branch)})</div>
      <div>Tel : ${escapeHtml(ISSUER.tel)} &nbsp; Email : ${escapeHtml(ISSUER.email)}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px;">
      <div style="border:1px solid #ddd;border-radius:8px;padding:14px;">
        <div style="font-size:13px;color:#777;margin-bottom:8px;">ลูกค้า/ผู้ซื้อ</div>
        <div style="font-size:16px;font-weight:700;color:#111;">${escapeHtml(customerName)}</div>
        <div style="margin-top:6px;font-size:12px;color:#555;line-height:1.7;">เลขประจำตัวผู้เสียภาษี: ${escapeHtml(valueOrDash(customerTaxId))}</div>
        <div style="font-size:12px;color:#555;line-height:1.7;">สาขา: ${escapeHtml(valueOrDash(customerBranch))}</div>
        <div style="font-size:12px;color:#555;line-height:1.7;">อีเมล: ${escapeHtml(customerEmail)}</div>
        <div style="margin-top:6px;font-size:12px;color:#555;line-height:1.7;white-space:pre-wrap;">${escapeHtml(customerAddress)}</div>
      </div>
      <div style="border:1px solid #ddd;border-radius:8px;padding:14px;">
        <div style="font-size:13px;color:#777;margin-bottom:8px;">รายละเอียดสมาชิก</div>
        <div style="font-size:12px;color:#555;line-height:1.8;">ผู้ใช้งาน: <strong style="color:#111;">${escapeHtml(member?.name || '-')}</strong></div>
        <div style="font-size:12px;color:#555;line-height:1.8;">อีเมล: <strong style="color:#111;">${escapeHtml(member?.email || '-')}</strong></div>
        <div style="font-size:12px;color:#555;line-height:1.8;">สถานะรายการ: <strong style="color:#111;">ชำระเงินสำเร็จ</strong></div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:13px;">
      <thead>
        <tr style="background:#f4f4f4;color:#333;">
          <th style="text-align:left;padding:12px;border:1px solid #ddd;">รายการ</th>
          <th style="text-align:center;padding:12px;border:1px solid #ddd;width:90px;">จำนวน</th>
          <th style="text-align:right;padding:12px;border:1px solid #ddd;width:160px;">มูลค่าก่อน VAT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:14px;border:1px solid #ddd;">
            <div style="font-weight:700;color:#111;">${escapeHtml(plan?.name || payment?.planCode || '-')}</div>
            <div style="font-size:12px;color:#777;margin-top:4px;">${escapeHtml(note)}</div>
          </td>
          <td style="text-align:center;padding:14px;border:1px solid #ddd;">1</td>
          <td style="text-align:right;padding:14px;border:1px solid #ddd;font-weight:700;">${escapeHtml(baht(subtotal))}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="text-align:right;padding:10px 12px;border:1px solid #ddd;font-weight:700;">มูลค่าก่อน VAT</td>
          <td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">${escapeHtml(baht(subtotal))}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align:right;padding:10px 12px;border:1px solid #ddd;font-weight:700;">VAT 7%</td>
          <td style="text-align:right;padding:10px 12px;border:1px solid #ddd;">${escapeHtml(baht(vatAmount))}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align:right;padding:12px;border:1px solid #ddd;font-weight:800;">ยอดชำระรวม</td>
          <td style="text-align:right;padding:12px;border:1px solid #ddd;font-size:16px;font-weight:800;color:#e07a2f;">${escapeHtml(baht(totalAmount))}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:20px;border:1px solid #eee;border-radius:8px;padding:14px;font-size:12px;color:#555;line-height:1.7;">
      เอกสารฉบับนี้เป็นใบเสร็จรับเงิน/ใบกำกับภาษีสำหรับยืนยันการรับชำระค่าบริการ ${escapeHtml(ISSUER.productName)} โดยแสดงมูลค่าก่อน VAT, VAT 7% และยอดชำระรวมครบถ้วน
    </div>

    <div style="margin-top:46px;display:flex;justify-content:flex-end;">
      <div style="width:250px;text-align:center;color:#555;font-size:12px;">
        <img src="${SIGNATURE_IMAGE_URL}" alt="" style="display:block;width:170px;height:62px;object-fit:contain;margin:0 auto 6px;" />
        <div style="border-top:1px solid #aaa;padding-top:10px;">ผู้รับเงิน/ผู้มีอำนาจลงนาม</div>
        <div style="margin-top:4px;color:#777;">${escapeHtml(ISSUER.thaiName)}</div>
      </div>
    </div>
  `
}

export function buildReceiptElement({ payment, plan, member, receiptProfile }) {
  const element = document.createElement('section')
  element.style.cssText = `
    background:#ffffff;
    color:#151515;
    width:${RECEIPT_A4_WIDTH_PX}px;
    height:${RECEIPT_A4_HEIGHT_PX}px;
    min-height:${RECEIPT_A4_HEIGHT_PX}px;
    padding:40px;
    overflow:hidden;
    font-family:'Noto Sans Thai', 'Tahoma', system-ui, sans-serif;
    box-sizing:border-box;
  `
  element.innerHTML = buildReceiptHtml({ payment, plan, member, receiptProfile })
  return element
}

export async function downloadReceiptPdf({ payment, plan, member, receiptProfile }) {
  const element = buildReceiptElement({ payment, plan, member, receiptProfile })
  await exportElementToPdf({
    element,
    filename: `${getReceiptNo(payment)}.pdf`,
    tabLabel: 'ใบเสร็จรับเงิน/ใบกำกับภาษี',
    projectName: plan?.name || payment?.planCode || '',
    bare: true,
  })
}
