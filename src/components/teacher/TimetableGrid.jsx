// ─── Unchanged logic ──────────────────────────────────────────────────────────

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const renderTimeRange = (slot) => {
  if (!slot) return '--'
  const start = to12Hour(slot.start_time)
  const end = to12Hour(slot.end_time)
  return `${start} - ${end}`
}

const to12Hour = (value) => {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// ─── UI-only: subject colour map ──────────────────────────────────────────────
// Keys must match your subject_name values exactly (case-sensitive).
// Add/rename entries freely — unknown subjects fall back to slate.

const SUBJECT_COLORS = {
  'Physics':      '#7F77DD',
  'Chemistry':    '#1D9E75',
  'Mathematics':  '#D85A30',
  'Math':         '#D85A30',
  'English':      '#D4537E',
  'Biology':      '#378ADD',
  'History':      '#BA7517',
  'Geography':    '#639922',
  'Computer Sc':  '#533AB7',
  'Computer':     '#533AB7',
  'Hindi':        '#E24B4A',
  'Assamese':     '#E24B4A',
  'Economics':    '#0F6E56',
  'Political Sc': '#993556',
  'Physical Ed':  '#185FA5',
}
const FALLBACK_COLOR = '#888780'

const getSubjectColor = (name) => SUBJECT_COLORS[name] || FALLBACK_COLOR

// ─── Component ────────────────────────────────────────────────────────────────

const TimetableGrid = ({ slots = [], currentPeriodId = null }) => {
  // ── exact same logic as original ──
  const periods = [...new Set(slots.map((slot) => slot.period_number))].sort((a, b) => a - b)

  if (!periods.length) {
    return (
      <div
        className="rounded-[28px] border p-10 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No timetable slots are configured yet for this teacher.
        </p>
      </div>
    )
  }

  const slotMap = new Map(slots.map((slot) => [`${slot.day_of_week}:${slot.period_number}`, slot]))
  // ── end unchanged logic ──

  const todayName = new Date().toLocaleDateString('en-IN', { weekday: 'long' }).toLowerCase()

  return (
    <div
      className="overflow-x-auto rounded-[28px] border"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>

        {/* ── Header ── */}
        <thead>
          <tr>
            <th
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--color-text-muted)', borderBottom: '1.5px solid var(--color-border)' }}
            >
              Period
            </th>
            {DAYS.map((day) => {
              const isToday = day === todayName
              return (
                <th
                  key={day}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ borderBottom: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 20,
                    background: isToday ? '#7F77DD' : 'transparent',
                    color: isToday ? '#fff' : 'inherit',
                    fontWeight: isToday ? 800 : 'inherit',
                  }}>
                    {day}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {periods.map((period) => (
            <tr key={period} style={{ borderTop: '1px solid var(--color-border)' }}>

              {/* Period label — unchanged content, same styling */}
              <td className="px-4 py-4 align-top">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Period {period}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {renderTimeRange(slots.find((slot) => slot.period_number === period))}
                </p>
              </td>

              {DAYS.map((day) => {
                const slot = slotMap.get(`${day}:${period}`)
                const isLive = slot?.id === currentPeriodId && currentPeriodId !== null
                const color = slot ? getSubjectColor(slot.subject_name) : null

                return (
                  <td key={`${day}-${period}`} className="px-3 py-3 align-top">
                    {slot ? (
                      <div
                        className="min-h-28 rounded-[24px] p-4"
                        style={{
                          background: isLive
                            ? `linear-gradient(135deg, ${color}ee, ${color}bb)`
                            : `linear-gradient(135deg, ${color}22, ${color}11)`,
                          border: isLive
                            ? `2px solid ${color}`
                            : `1.5px solid ${color}55`,
                          boxShadow: isLive ? `0 0 0 3px ${color}33` : 'none',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'transform .15s',
                        }}
                      >
                        {/* Colour accent strip */}
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0,
                          width: 4, height: '100%',
                          background: color,
                          borderRadius: '24px 0 0 24px',
                        }} />

                        {/* Live pulse dot */}
                        {isLive && (
                          <span style={{
                            position: 'absolute',
                            top: 8, right: 8,
                            width: 8, height: 8,
                            borderRadius: '50%',
                            background: '#fff',
                            opacity: .85,
                            animation: 'ttgPulse 1.8s ease-in-out infinite',
                          }} />
                        )}

                        <div style={{ paddingLeft: 8 }}>
                          {/* Subject name */}
                          <p
                            className="text-sm font-semibold"
                            style={{ color: isLive ? '#fff' : color }}
                          >
                            {slot.subject_name}
                          </p>

                          {/* Class + section — unchanged */}
                          <p className="mt-1 text-xs" style={{ color: isLive ? 'rgba(255,255,255,.8)' : 'var(--color-text-secondary)' }}>
                            {slot.class_name} {slot.section_name}
                          </p>

                          {/* Time range — unchanged */}
                          <p className="mt-2 text-xs" style={{ color: isLive ? 'rgba(255,255,255,.75)' : 'var(--color-text-secondary)' }}>
                            {renderTimeRange(slot)}
                          </p>

                          {/* Room — unchanged */}
                          <p className="mt-2 text-xs font-semibold" style={{ color: isLive ? 'rgba(255,255,255,.9)' : color }}>
                            {slot.room_number ? `Room ${slot.room_number}` : 'Room not set'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Free cell — unchanged */
                      <div
                        className="min-h-28 rounded-[24px] border border-dashed p-4"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                      >
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Free</p>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        @keyframes ttgPulse {
          0%,100% { opacity:.5; transform:scale(1); }
          50% { opacity:1; transform:scale(1.4); }
        }
      `}</style>
    </div>
  )
}

export default TimetableGrid