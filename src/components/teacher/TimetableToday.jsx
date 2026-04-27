import { CalendarClock } from 'lucide-react'
import { ROUTES } from '@/constants/app'

const TimetableToday = ({ schedule = [], currentPeriodId = null, onNavigate }) => {
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
      {schedule.map((slot) => (
        <div key={slot.id} className="flex gap-3">
          <div className="flex w-12 flex-col items-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold"
              style={{
                backgroundColor: slot.id === currentPeriodId || slot.status === 'current' ? 'rgba(16, 185, 129, 0.14)' : 'var(--color-surface-raised)',
                color: slot.id === currentPeriodId || slot.status === 'current' ? '#10b981' : 'var(--color-text-secondary)',
              }}
            >
              P{slot.period_number}
            </div>
            <div className="mt-2 h-full w-px" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>

          <div
            className="flex-1 rounded-[24px] border p-4"
            style={{
              borderColor: slot.id === currentPeriodId || slot.status === 'current' ? '#10b98166' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{slot.subject_name}</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {slot.class_name} {slot.section_name}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {to12Hour(slot.start_time)} - {to12Hour(slot.end_time)} | {slot.room_number ? `Room ${slot.room_number}` : 'Room not set'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <QuickAction label="Mark Attendance" onClick={() => onNavigate(ROUTES.TEACHER_ATTENDANCE_MARK)} tone="#10b981" />
                <QuickAction
                  label="View Students"
                  onClick={() => onNavigate(ROUTES.TEACHER_STUDENTS, {
                    state: {
                      class_id: String(slot.class_id),
                      section_id: String(slot.section_id),
                    },
                  })}
                  tone="#0f766e"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const QuickAction = ({ label, onClick, tone }) => (
  <button
    type="button"
    onClick={onClick}
    className="min-h-10 rounded-2xl px-4 text-sm font-semibold"
    style={{ backgroundColor: `${tone}16`, color: tone }}
  >
    {label}
  </button>
)

const to12Hour = (value) => {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default TimetableToday
