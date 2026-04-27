const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const TimetableWeekly = ({ slots = [], currentPeriodId = null }) => {
  const periods = [...new Set(slots.map((slot) => slot.period_number))].sort((a, b) => a - b)
  const slotMap = new Map(slots.map((slot) => [`${slot.day_of_week}:${slot.period_number}`, slot]))
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  if (!periods.length) {
    return (
      <div
        className="rounded-[28px] border p-10 text-center"
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
      className="overflow-x-auto rounded-[28px] border"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
              Period
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'var(--color-text-muted)', backgroundColor: day === todayName ? 'rgba(124,58,237,0.06)' : 'transparent' }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-4 py-4 align-top">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Period {period}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {renderTimeRange(slots.find((slot) => slot.period_number === period))}
                </p>
              </td>
              {DAYS.map((day) => {
                const slot = slotMap.get(`${day}:${period}`)
                return (
                  <td
                    key={`${day}-${period}`}
                    className="px-3 py-3 align-top"
                    style={{ backgroundColor: day === todayName ? 'rgba(124,58,237,0.04)' : 'transparent' }}
                  >
                    {slot ? (
                      <div
                        className="min-h-28 rounded-[22px] border p-4"
                        style={{
                          borderColor: slot.id === currentPeriodId ? '#16a34a88' : 'var(--color-border)',
                          backgroundColor: slot.id === currentPeriodId ? 'rgba(22,163,74,0.10)' : 'var(--color-surface-raised)',
                          boxShadow: slot.id === currentPeriodId ? '0 0 0 3px rgba(22,163,74,0.10)' : 'none',
                        }}
                      >
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{slot.subject_name}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{initials(slot.teacher_name)}</p>
                        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{renderTimeRange(slot)}</p>
                        <p className="mt-2 text-xs" style={{ color: slot.id === currentPeriodId ? '#15803d' : '#0f766e' }}>
                          {slot.room_number ? `Room ${slot.room_number}` : 'Room not set'}
                        </p>
                      </div>
                    ) : (
                      <div
                        className="min-h-28 rounded-[22px] border border-dashed p-4"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                      >
                        <p className="text-sm font-medium text-[var(--color-text-muted)]">Free</p>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderTimeRange(slot) {
  if (!slot) return '--'
  return `${to12Hour(slot.start_time)} - ${to12Hour(slot.end_time)}`
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
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default TimetableWeekly
