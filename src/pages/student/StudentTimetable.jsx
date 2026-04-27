import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, CalendarRange, Clock3, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import TimetableToday from '@/components/student/TimetableToday'
import TimetableWeekly from '@/components/student/TimetableWeekly'
import ExamCountdown from '@/components/student/ExamCountdown'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentTimetable from '@/hooks/useStudentTimetable'
import useToast from '@/hooks/useToast'

const StudentTimetable = () => {
  usePageTitle('My Timetable')

  const { toastError, toastInfo } = useToast()
  const {
    timetable,
    todaySchedule,
    currentPeriod,
    nextPeriod,
    examSchedule,
    loading,
    refreshing,
    error,
    refresh,
    totalPeriods,
  } = useStudentTimetable()

  const [view, setView] = useState('today')
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const subjectLegend = useMemo(() => buildSubjectLegend(timetable), [timetable])

  const handleRefresh = async () => {
    toastInfo('Refreshing timetable')
    try {
      await refresh()
    } catch {}
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(34,197,94,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Timetable
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Timetable</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              See your day at a glance, switch to weekly planning, and keep upcoming exams in view.
            </p>
          </div>

          <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          title="Current Period"
          icon={Clock3}
          tone="#16a34a"
          value={currentPeriod ? currentPeriod.subject_name : 'No active class'}
          sub={currentPeriod ? `${renderTimeRange(currentPeriod)} • ${currentPeriod.teacher_name}` : 'You are free right now.'}
        />
        <StatCard
          title="Next Period"
          icon={CalendarRange}
          tone="#d97706"
          value={nextPeriod ? nextPeriod.subject_name : 'No upcoming class'}
          sub={nextPeriod ? `${renderTimeRange(nextPeriod)} • ${nextPeriod.teacher_name}` : 'Nothing else is lined up today.'}
        />
        <StatCard
          title="Today Total"
          icon={AlarmClock}
          tone="#2563eb"
          value={String(todaySchedule.length || totalPeriods || 0)}
          sub="Periods in your current view."
        />
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'today', label: 'Today View' },
            { key: 'weekly', label: 'Weekly View' },
            { key: 'exams', label: 'Exam Schedule' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key)}
              className="rounded-2xl px-4 py-2.5 text-sm font-semibold"
              style={{
                backgroundColor: view === tab.key ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                color: view === tab.key ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <TimetableSkeleton />
      ) : !timetable.length && !todaySchedule.length ? (
        <EmptyState
          icon={CalendarRange}
          title="No timetable available yet"
          description="Your class timetable has not been configured for this session."
        />
      ) : (
        <>
          {view === 'today' && (
            <div className="space-y-5">
              <TimetableToday
                schedule={todaySchedule}
                currentPeriodId={currentPeriod?.id || null}
                nextPeriodId={nextPeriod?.id || null}
              />
              <ExamCountdown exams={examSchedule} />
            </div>
          )}

          {view === 'weekly' && (
            <div className="space-y-5">
              <TimetableWeekly slots={timetable} currentPeriodId={currentPeriod?.id || null} />
              <section
                className="rounded-[28px] border p-5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Subject Legend</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {subjectLegend.map((item) => (
                    <button
                      key={item.subject_name}
                      type="button"
                      onClick={() => setSelectedSlot(item.example)}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
                      style={{ backgroundColor: item.soft, color: item.color }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.subject_name}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === 'exams' && <ExamCountdown exams={examSchedule} />}
        </>
      )}

      <Modal
        open={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        title="Timetable Slot"
      >
        {selectedSlot && (
          <div className="space-y-3">
            <InfoRow label="Subject" value={selectedSlot.subject_name} />
            <InfoRow label="Teacher" value={selectedSlot.teacher_name} />
            <InfoRow label="Room" value={selectedSlot.room_number ? `Room ${selectedSlot.room_number}` : 'Room not set'} />
            <InfoRow label="Day" value={capitalize(selectedSlot.day_of_week)} />
            <InfoRow label="Time" value={renderTimeRange(selectedSlot)} />
          </div>
        )}
      </Modal>
    </div>
  )
}

const StatCard = ({ title, icon: Icon, tone, value, sub }) => (
  <div
    className="rounded-[24px] border p-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="flex items-center gap-2">
      <Icon size={16} style={{ color: tone }} />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{title}</p>
    </div>
    <p className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">{value}</p>
    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{sub}</p>
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

const TimetableSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="rounded-[28px] bg-[var(--color-surface)] p-12" />
    <div className="rounded-[28px] bg-[var(--color-surface)] p-12" />
  </div>
)

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

function buildSubjectLegend(timetable) {
  const palette = [
    { color: '#2563eb', soft: 'rgba(37,99,235,0.12)' },
    { color: '#16a34a', soft: 'rgba(22,163,74,0.12)' },
    { color: '#d97706', soft: 'rgba(217,119,6,0.12)' },
    { color: '#7c3aed', soft: 'rgba(124,58,237,0.12)' },
    { color: '#dc2626', soft: 'rgba(220,38,38,0.12)' },
    { color: '#0f766e', soft: 'rgba(15,118,110,0.12)' },
  ]

  return [...new Map(timetable.map((slot) => [slot.subject_name, slot])).values()].map((slot, index) => ({
    subject_name: slot.subject_name,
    example: slot,
    color: palette[index % palette.length].color,
    soft: palette[index % palette.length].soft,
  }))
}

function capitalize(value) {
  return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default StudentTimetable
