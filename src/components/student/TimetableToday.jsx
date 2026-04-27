import { CalendarClock } from 'lucide-react'

const TimetableToday = ({ schedule = [], currentPeriodId = null, nextPeriodId = null }) => {
  if (!schedule.length) {
    return (
      <div
        className="rounded-[28px] border p-10 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <CalendarClock size={20} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No classes are scheduled for today.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {schedule.map((slot, index) => {
        const current = slot.id === currentPeriodId || slot.status === 'current'
        const next = slot.id === nextPeriodId || (!current && slot.status === 'upcoming' && slot.id === nextPeriodId)
        const done = slot.status === 'done'
        return (
          <div key={slot.id || `${slot.period_number}-${index}`} className="flex gap-3">
            <div className="flex w-12 flex-col items-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold"
                style={{
                  backgroundColor: current ? 'rgba(22,163,74,0.14)' : next ? 'rgba(245,158,11,0.14)' : done ? 'rgba(148,163,184,0.14)' : 'var(--color-surface-raised)',
                  color: current ? '#16a34a' : next ? '#d97706' : done ? '#64748b' : 'var(--color-text-secondary)',
                }}
              >
                P{slot.period_number}
              </div>
              <div className="mt-2 h-full w-px" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>

            <div
              className="flex-1 rounded-[24px] border p-4"
              style={{
                borderColor: current ? '#16a34a66' : next ? '#f59e0b66' : 'var(--color-border)',
                backgroundColor: current ? 'rgba(22,163,74,0.08)' : next ? 'rgba(245,158,11,0.08)' : 'var(--color-surface)',
                opacity: done ? 0.7 : 1,
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Period {slot.period_number}</p>
                    <span className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={badgeStyle(slot.status, current, next)}>
                      {current ? 'Current' : next ? 'Next' : done ? 'Done' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">{slot.subject_name}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{slot.teacher_name}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {to12Hour(slot.start_time)} - {to12Hour(slot.end_time)} {slot.room_number ? `| Room ${slot.room_number}` : ''}
                  </p>
                </div>

                {(current || next) && typeof slot.countdown_minutes === 'number' && (
                  <div className="rounded-[18px] px-3 py-2" style={{ backgroundColor: current ? 'rgba(22,163,74,0.10)' : 'rgba(245,158,11,0.10)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: current ? '#15803d' : '#b45309' }}>
                      {current ? 'Ends In' : 'Starts In'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{formatMinutes(slot.countdown_minutes)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function badgeStyle(status, current, next) {
  if (current) return { backgroundColor: 'rgba(22,163,74,0.14)', color: '#15803d' }
  if (next) return { backgroundColor: 'rgba(245,158,11,0.14)', color: '#b45309' }
  if (status === 'done') return { backgroundColor: 'rgba(148,163,184,0.16)', color: '#64748b' }
  return { backgroundColor: 'rgba(124,58,237,0.14)', color: '#6d28d9' }
}

function to12Hour(value) {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function formatMinutes(value) {
  const minutes = Number(value || 0)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export default TimetableToday
