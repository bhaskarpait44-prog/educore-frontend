// src/components/ui/AttendanceBarChart.jsx
// Pure CSS bar chart — no external chart library needed
const AttendanceBarChart = ({ data = [], height = 160 }) => {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ height, backgroundColor: 'var(--color-surface-raised)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No data available</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => toNumber(d.percentage ?? d.value)), 100)

  return (
    <div className="w-full" style={{ height: height + 32 }}>
      {/* Chart area */}
      <div className="flex items-end gap-0.5 w-full" style={{ height }}>
        {data.map((point, i) => {
          const pct    = toNumber(point.percentage ?? point.value)
          const barH   = Math.max((pct / maxVal) * height, 2)
          const color  = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
          const isToday = point.isToday

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group relative"
              style={{ height }}
            >
              {/* Tooltip */}
              <div
                className="absolute bottom-full mb-1 px-2 py-1 rounded-lg text-xs font-semibold
                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10
                  whitespace-nowrap"
                style={{
                  backgroundColor : '#0f172a',
                  color           : '#f1f5f9',
                  transform       : 'translateX(-50%)',
                  left            : '50%',
                }}
              >
                {point.date ? new Date(point.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : `Day ${i + 1}`}
                {': '}{pct.toFixed(1)}%
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{
                  height          : barH,
                  backgroundColor : color,
                  opacity         : isToday ? 1 : 0.75,
                  outline         : isToday ? `2px solid ${color}` : 'none',
                  outlineOffset   : '1px',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels — show every 7th */}
      <div className="flex gap-0.5 mt-1">
        {data.map((point, i) => {
          const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0
          return (
            <div key={i} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                  {point.date
                    ? new Date(point.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                    : `${i + 1}`}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export default AttendanceBarChart
