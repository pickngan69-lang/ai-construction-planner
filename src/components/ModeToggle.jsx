function ModeToggle({ mode, onChange, hasEdits, onClearEdits }) {
  const isManual = mode === 'manual'
  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="โหมดแก้ไข"
        className="flex rounded-lg border border-line bg-surface p-0.5"
      >
        <button
          type="button"
          onClick={() => onChange('auto')}
          aria-pressed={!isManual}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            !isManual
              ? 'bg-accent text-canvas'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          🤖 Auto (AI)
        </button>
        <button
          type="button"
          onClick={() => onChange('manual')}
          aria-pressed={isManual}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isManual ? 'bg-accent text-canvas' : 'text-ink-soft hover:text-ink'
          }`}
        >
          ✏️ Manual
        </button>
      </div>
      {isManual && hasEdits && (
        <button
          type="button"
          onClick={onClearEdits}
          title="ล้างการแก้ไขทั้งหมด — กลับไปใช้ค่า AI"
          className="text-xs text-ink-muted hover:text-danger transition-colors"
        >
          ♻️ reset edits
        </button>
      )}
    </div>
  )
}

export default ModeToggle
