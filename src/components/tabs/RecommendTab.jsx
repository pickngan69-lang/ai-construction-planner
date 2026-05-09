import Card from '../ui/Card'

function RecommendTab({ result }) {
  const recommendations = result.recommendations || []
  const risks = result.risks || []
  const permits = result.permits || []

  return (
    <div className="space-y-4">
      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          💡 คำแนะนำจาก AI
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-ink-muted">— ยังไม่มีคำแนะนำ —</p>
        ) : (
          <ol className="space-y-2 text-sm text-ink-soft list-decimal pl-6">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ol>
        )}
      </Card>

      {/* Risks */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          ⚠️ ความเสี่ยง & วิธีป้องกัน
        </h3>
        {risks.length === 0 ? (
          <p className="text-sm text-ink-muted">— ยังไม่มีรายการความเสี่ยง —</p>
        ) : (
          <div className="space-y-3">
            {risks.map((r, i) => (
              <div
                key={i}
                className="rounded-lg border border-line bg-elevated/40 p-4"
              >
                <p className="text-sm text-danger flex gap-2">
                  <span className="shrink-0">❌ ความเสี่ยง:</span>
                  <span>{r.risk}</span>
                </p>
                {r.prevention && (
                  <p className="text-sm text-success flex gap-2 mt-1.5">
                    <span className="shrink-0">✅ ป้องกัน:</span>
                    <span>{r.prevention}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Permits */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
          📄 ใบอนุญาตที่ต้องมี
        </h3>
        {permits.length === 0 ? (
          <p className="text-sm text-ink-muted">— ยังไม่มีรายการใบอนุญาต —</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-ink-soft list-disc pl-6">
            {permits.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export default RecommendTab
