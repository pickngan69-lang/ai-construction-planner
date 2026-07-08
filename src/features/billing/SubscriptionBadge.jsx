import { getPlanByCode } from './plans'

const STATUS_LABELS = {
  trialing: 'ทดลองใช้',
  active: 'ใช้งานได้',
  past_due: 'รอชำระ',
  canceled: 'ยกเลิกแล้ว',
}

function SubscriptionBadge({ planCode = 'trial', status = 'trialing' }) {
  const plan = getPlanByCode(planCode)
  const tone =
    status === 'active'
      ? 'border-success/40 bg-success/10 text-success'
      : status === 'past_due'
        ? 'border-danger/40 bg-danger/10 text-danger'
        : 'border-accent/40 bg-accent/10 text-accent'

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
      <span>{plan?.name || 'ไม่มีแพ็กเกจ'}</span>
      <span className="text-ink-muted">•</span>
      <span>{STATUS_LABELS[status] || status}</span>
    </span>
  )
}

export default SubscriptionBadge
