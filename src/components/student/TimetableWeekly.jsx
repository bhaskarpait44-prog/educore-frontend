const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const TimetableWeekly = ({ slots = [], currentPeriodId = null }) => {
  const periods = [...new Set(slots.map((s) => s.period_number))].sort((a, b) => a - b)
  const slotMap = new Map(slots.map((s) => [`${s.day_of_week}:${s.period_number}`, s]))
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  if (!periods.length) {
    return (
      <div
        className="rounded-2xl border p-10 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No timetable slots are configured yet.
        </p>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-2xl border"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <table className="min-w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {/* Period column header */}
            <th
              className="w-24 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}
            >
              Period
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-widest"
                style={{
                  color: day === todayName ? '#0f766e' : 'var(--color-text-muted)',
                  backgroundColor: day === todayName ? 'rgba(15,118,110,0.05)' : 'transparent',
                  borderLeft: '1px solid var(--color-border)',
                }}
              >
                <span className="flex items-center gap-1.5">
                  {day}
                  {day === todayName && (
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: '#0f766e' }}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => {
            const refSlot = slots.find((s) => s.period_number === period)
            return (
              <tr key={period} style={{ borderTop: '1px solid var(--color-border)' }}>
                {/* Period label cell */}
                <td
                  className="w-24 px-4 py-3 align-top"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    P{period}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                    {renderTimeRange(refSlot)}
                  </p>
                </td>

                {DAYS.map((day) => {
                  const slot = slotMap.get(`${day}:${period}`)
                  const isToday = day === todayName
                  const isCurrent = slot?.id === currentPeriodId

                  return (
                    <td
                      key={`${day}-${period}`}
                      className="px-2 py-2 align-top"
                      style={{
                        backgroundColor: isToday ? 'rgba(15,118,110,0.03)' : 'transparent',
                        borderLeft: '1px solid var(--color-border)',
                      }}
                    >
                      {slot ? (
                        <div
                          className="flex h-full min-h-[7rem] flex-col rounded-xl p-3"
                          style={{
                            backgroundColor: isCurrent
                              ? 'rgba(22,163,74,0.08)'
                              : 'rgba(0,0,0,0.025)',
                            border: isCurrent
                              ? '1px solid rgba(22,163,74,0.35)'
                              : '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          {isCurrent && (
                            <span
                              className="mb-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                              style={{ backgroundColor: 'rgba(22,163,74,0.14)', color: '#15803d' }}
                            >
                              <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-green-600" />
                              Live
                            </span>
                          )}
                          <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                            {slot.subject_name}
                          </p>
                          {slot.teacher_name && (
                            <p className="mt-1 text-[11px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                              {slot.teacher_name}
                            </p>
                          )}
                          <p className="mt-auto pt-2 text-[11px]" style={{ color: isCurrent ? '#15803d' : '#0f766e' }}>
                            {slot.room_number ? `Room ${slot.room_number}` : 'No room'}
                          </p>
                        </div>
                      ) : (
                        <div
                          className="flex min-h-[7rem] items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.015)',
                            border: '1px dashed rgba(0,0,0,0.08)',
                          }}
                        >
                          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                            Free
                          </p>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function renderTimeRange(slot) {
  if (!slot) return '--'
  return `${to12Hour(slot.start_time)} – ${to12Hour(slot.end_time)}`
}

function to12Hour(value) {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default TimetableWeekly