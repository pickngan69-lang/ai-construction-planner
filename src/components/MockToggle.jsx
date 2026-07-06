// Toggle between calling the real Anthropic API and using local mock data.
// Lives on the input page so the UI can be tested without spending money.
function MockToggle({ useMock, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="โหมดข้อมูล"
        className="flex rounded-lg border border-line bg-surface p-0.5"
      >
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!useMock}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            !useMock ? 'bg-accent text-canvas' : 'text-ink-soft hover:text-ink'
          }`}
        >
          🤖 AI จริง
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={useMock}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            useMock ? 'bg-accent text-canvas' : 'text-ink-soft hover:text-ink'
          }`}
        >
          🧪 ทดสอบ
        </button>
      </div>
      {useMock && (
        <span className="text-xs text-ink-muted">
          ใช้ข้อมูลจำลอง — ไม่เรียก API จริง ไม่มีค่าใช้จ่าย
        </span>
      )}
    </div>
  )
}

export default MockToggle
