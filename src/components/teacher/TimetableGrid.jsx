const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const TimetableGrid = ({ slots = [], currentPeriodId = null }) => {
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
              <th key={day} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="px-4 py-4 align-top">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Period {period}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {renderTimeRange(slots.find((slot) => slot.period_number === period))}
                </p>
              </td>

              {DAYS.map((day) => {
                const slot = slotMap.get(`${day}:${period}`)
                return (
                  <td key={`${day}-${period}`} className="px-3 py-3 align-top">
                    {slot ? (
                      <div
                        className="min-h-28 rounded-[24px] border p-4"
                        style={{
                          borderColor: slot.id === currentPeriodId ? '#10b98188' : 'var(--color-border)',
                          backgroundColor: slot.id === currentPeriodId ? 'rgba(16, 185, 129, 0.10)' : 'var(--color-surface-raised)',
                          boxShadow: slot.id === currentPeriodId ? '0 0 0 3px rgba(16, 185, 129, 0.10)' : 'none',
                        }}
                      >
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{slot.subject_name}</p>
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {slot.class_name} {slot.section_name}
                        </p>
                        <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {renderTimeRange(slot)}
                        </p>
                        <p className="mt-2 text-xs" style={{ color: '#0f766e' }}>
                          {slot.room_number ? `Room ${slot.room_number}` : 'Room not set'}
                        </p>
                      </div>
                    ) : (
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
    </div>
  )
}

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

export default TimetableGrid
