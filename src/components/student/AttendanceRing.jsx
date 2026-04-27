const AttendanceRing = ({
  percentage = 0,
  band = 'good',
  workingDays = 0,
  presentDays = 0,
  absentDays = 0,
}) => {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(Number(percentage || 0), 100))
  const strokeOffset = circumference - (progress / 100) * circumference
  const tone = bandTone(band)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.18)"
            strokeWidth="12"
          />
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[34px] font-bold leading-none text-[var(--color-text-primary)]">
            {Math.round(progress)}%
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: tone }}>
            {bandLabel(band)}
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {workingDays} total working day(s)
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {presentDays} present • {absentDays} absent
        </p>
      </div>
    </div>
  )
}

function bandTone(band) {
  if (band === 'good') return '#16a34a'
  if (band === 'okay') return '#d97706'
  if (band === 'warning') return '#f97316'
  return '#ef4444'
}

function bandLabel(band) {
  if (band === 'good') return 'Good'
  if (band === 'okay') return 'Okay'
  if (band === 'warning') return 'Warning'
  return 'Critical'
}

export default AttendanceRing
