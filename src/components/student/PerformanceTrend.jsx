const PerformanceTrend = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-[24px] p-10 text-sm"
        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
      >
        No performance trend data yet.
      </div>
    )
  }

  const points = data.map((item, index) => ({
    ...item,
    x: data.length === 1 ? 50 : (index / (data.length - 1)) * 100,
    y: 100 - Math.max(0, Math.min(Number(item.percentage || 0), 100)),
  }))

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible">
        {[0, 25, 50, 75, 100].map((mark) => (
          <g key={mark}>
            <line x1="0" x2="100" y1={100 - mark} y2={100 - mark} stroke="rgba(148,163,184,0.18)" strokeWidth="0.6" />
            <text x="0" y={100 - mark - 1.5} fontSize="3.4" fill="var(--color-text-muted)">{mark}%</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.session_name}>
            <circle cx={point.x} cy={point.y} r="2.4" fill="#7c3aed" />
            <text x={point.x} y="106" textAnchor="middle" fontSize="3.2" fill="var(--color-text-secondary)">
              {point.session_name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default PerformanceTrend
