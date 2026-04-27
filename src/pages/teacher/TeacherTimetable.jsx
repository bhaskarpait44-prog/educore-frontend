import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarRange, Clock3, Printer } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as teacherApi from '@/api/teacherApi'
import TimetableGrid from '@/components/teacher/TimetableGrid'
import TimetableToday from '@/components/teacher/TimetableToday'

const TeacherTimetable = () => {
  usePageTitle('Timetable')

  const navigate = useNavigate()
  const { toastError } = useToast()
  const [timetable, setTimetable] = useState([])
  const [todaySchedule, setTodaySchedule] = useState([])
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const [weeklyRes, todayRes, currentRes] = await Promise.all([
          teacherApi.getTeacherTimetable(),
          teacherApi.getTeacherTimetableToday(),
          teacherApi.getTeacherCurrentPeriod(),
        ])

        if (!active) return

        setTimetable(weeklyRes?.data?.timetable || [])
        setTodaySchedule(todayRes?.data?.schedule || [])
        setCurrentPeriod(currentRes?.data?.current_period || null)
      } catch (error) {
        if (active) toastError(error?.message || 'Failed to load timetable.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [toastError])

  const nextPeriod = useMemo(() => (
    todaySchedule.find((slot) => slot.status === 'upcoming') || null
  ), [todaySchedule])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Timetable
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Weekly desktop grid and today-first mobile timeline for faster classroom flow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
          >
            <Printer size={16} />
            Print Timetable
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatCard
            title="Current Period"
            icon={Clock3}
            tone="#10b981"
            value={currentPeriod ? `${currentPeriod.subject_name}` : 'No active period'}
            sub={currentPeriod ? `${currentPeriod.class_name} ${currentPeriod.section_name} | ${renderTimeRange(currentPeriod)}` : 'You are free right now.'}
          />
          <StatCard
            title="Next Period"
            icon={CalendarRange}
            tone="#f59e0b"
            value={nextPeriod ? nextPeriod.subject_name : 'No upcoming period'}
            sub={nextPeriod ? `${nextPeriod.class_name} ${nextPeriod.section_name} | ${renderTimeRange(nextPeriod)}` : 'No more classes later today.'}
          />
          <StatCard
            title="Weekly Slots"
            icon={CalendarRange}
            tone="#0f766e"
            value={String(timetable.length)}
            sub="Active timetable periods in this session."
          />
        </div>
      </section>

      {loading ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading timetable...
          </p>
        </section>
      ) : (
        <>
          {!timetable.length && !todaySchedule.length ? (
            <section
              className="rounded-[28px] border p-12 text-center"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <AlertTriangle size={20} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
              <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No timetable slots are configured yet.
              </p>
            </section>
          ) : (
            <>
              <section className="space-y-4 lg:hidden">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Today View
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Mobile-first list of today&apos;s classes with quick actions.
                  </p>
                </div>
                <TimetableToday
                  schedule={todaySchedule}
                  currentPeriodId={currentPeriod?.id || null}
                  onNavigate={navigate}
                />
              </section>

              <section className="hidden lg:block">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Weekly View
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Desktop grid of your full teaching week with current-period highlight.
                  </p>
                </div>
                <TimetableGrid slots={timetable} currentPeriodId={currentPeriod?.id || null} />
              </section>

              <section className="hidden lg:block">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Today Snapshot
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Today&apos;s timeline stays visible on desktop too for quick review.
                  </p>
                </div>
                <TimetableToday
                  schedule={todaySchedule}
                  currentPeriodId={currentPeriod?.id || null}
                  onNavigate={navigate}
                />
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}

const StatCard = ({ title, icon: Icon, tone, value, sub }) => (
  <div
    className="rounded-[24px] border p-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
  >
    <div className="flex items-center gap-2">
      <Icon size={16} style={{ color: tone }} />
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
    </div>
    <p className="mt-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{sub}</p>
  </div>
)

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

export default TeacherTimetable
