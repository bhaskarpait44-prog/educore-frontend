import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, CalendarRange, Clock3, Printer, Sparkles } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as teacherApi from '@/api/teacherApi'
import TimetableGrid from '@/components/teacher/TimetableGrid'
import TimetableToday from '@/components/teacher/TimetableToday'

// ─── Helpers ─────────────────────────────────────── (unchanged) ──────────────

const to12Hour = (value) => {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const renderTimeRange = (slot) => {
  if (!slot) return '--'
  return `${to12Hour(slot.start_time)} – ${to12Hour(slot.end_time)}`
}

const getDayName = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long' })

const getDateStr = () =>
  new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

// ─── Page ────────────────────────────────────────── (logic unchanged) ────────

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

  const nextPeriod = useMemo(() =>
    todaySchedule.find((slot) => slot.status === 'upcoming') || null,
  [todaySchedule])

  const completedCount = useMemo(() =>
    todaySchedule.filter((s) => s.status === 'completed').length,
  [todaySchedule])

  const totalToday = todaySchedule.length

  return (
    <div className="space-y-6">

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(2,132,199,0.07) 50%, var(--color-surface) 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0f766e 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(15,118,110,0.12)', color: '#0f766e' }}
              >
                <Sparkles size={10} />
                Teacher Portal
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
              My Timetable
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {getDayName()}, {getDateStr()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            <Printer size={14} />
            Print Timetable
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PeriodCard
            label="Current Period"
            icon={Clock3}
            accent="#10b981"
            accentBg="rgba(16,185,129,0.1)"
            primary={currentPeriod ? currentPeriod.subject_name : 'No active period'}
            secondary={
              currentPeriod
                ? `${currentPeriod.class_name} ${currentPeriod.section_name}  ·  ${renderTimeRange(currentPeriod)}`
                : 'You are free right now'
            }
            live={Boolean(currentPeriod)}
          />
          <PeriodCard
            label="Next Up"
            icon={CalendarRange}
            accent="#f59e0b"
            accentBg="rgba(245,158,11,0.1)"
            primary={nextPeriod ? nextPeriod.subject_name : 'No upcoming period'}
            secondary={
              nextPeriod
                ? `${nextPeriod.class_name} ${nextPeriod.section_name}  ·  ${renderTimeRange(nextPeriod)}`
                : 'No more classes today'
            }
          />
          <ProgressCard
            done={completedCount}
            total={totalToday}
            slots={timetable.length}
          />
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingState />
      ) : !timetable.length && !todaySchedule.length ? (
        <EmptyTimetable />
      ) : (
        <>
          {/* Mobile — today only */}
          <section className="space-y-3 lg:hidden">
            <SectionHeader
              title="Today's Classes"
              description="Your schedule for the rest of the day."
            />
            <TimetableToday
              schedule={todaySchedule}
              currentPeriodId={currentPeriod?.id || null}
              onNavigate={navigate}
            />
          </section>

          {/* Desktop — full week grid */}
          <section className="hidden space-y-3 lg:block">
            <SectionHeader
              title="Weekly Schedule"
              description="Full teaching week — current period is highlighted."
            />
            {/* ── Colorful subject legend ── */}
            <SubjectLegend slots={timetable} />
            <TimetableGrid slots={timetable} currentPeriodId={currentPeriod?.id || null} />
          </section>

          {/* Desktop — today snapshot */}
          <section className="hidden space-y-3 lg:block">
            <SectionHeader
              title="Today's Snapshot"
              description="Quick overview of today's classes alongside your weekly grid."
            />
            <TimetableToday
              schedule={todaySchedule}
              currentPeriodId={currentPeriod?.id || null}
              onNavigate={navigate}
            />
          </section>
        </>
      )}
    </div>
  )
}

// ─── Subject colour map ───────────────────────────────────────────────────────
// Keys must match subject_name values from your API exactly (case-sensitive).
// Add more entries as needed; unknown subjects fall back to slate grey.

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
  'Art':          '#D4537E',
}
const SUBJECT_COLOR_FALLBACK = '#888780'

export const getSubjectColor = (name) => SUBJECT_COLORS[name] || SUBJECT_COLOR_FALLBACK

// ─── Subject legend strip ─────────────────────────────────────────────────────

const SubjectLegend = ({ slots = [] }) => {
  const subjects = useMemo(() =>
    [...new Set(slots.filter(s => !s.is_break && s.subject_name).map(s => s.subject_name))].sort(),
  [slots])

  if (!subjects.length) return null

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      padding: '10px 14px',
      borderRadius: 12,
      border: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
    }}>
      {subjects.map(subj => (
        <span key={subj} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
        }}>
          <span style={{
            display: 'inline-block',
            width: 10, height: 10,
            borderRadius: '50%',
            background: getSubjectColor(subj),
            flexShrink: 0,
          }} />
          {subj}
        </span>
      ))}
    </div>
  )
}

// ─── Period stat card ─────────────────────────────────────────────────────────
// Unchanged from original — only the subject name badge gets a colour dot

const PeriodCard = ({ label, icon: Icon, accent, accentBg, primary, secondary, live = false }) => (
  <div
    className="relative overflow-hidden rounded-xl border p-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div
      className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
      style={{ backgroundColor: accent }}
      aria-hidden="true"
    />
    <div className="ml-3">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: accentBg }}
        >
          <Icon size={14} style={{ color: accent }} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        {live && (
          <span className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            LIVE
          </span>
        )}
      </div>

      {/* Subject name with colour dot */}
      <div className="flex items-center gap-1.5">
        {live && (
          <span style={{
            display: 'inline-block',
            width: 8, height: 8,
            borderRadius: '50%',
            background: getSubjectColor(primary),
            flexShrink: 0,
          }} />
        )}
        <p className="text-base font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {primary}
        </p>
      </div>

      <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
        {secondary}
      </p>
    </div>
  </div>
)

// ─── Progress card ────────────────────────────────────────────────────────────
// Unchanged from original

const ProgressCard = ({ done, total, slots }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: '#0f766e' }}
        aria-hidden="true"
      />
      <div className="ml-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(15,118,110,0.1)' }}
          >
            <BookOpen size={14} style={{ color: '#0f766e' }} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            Today's Progress
          </p>
        </div>

        <div className="flex items-baseline gap-1.5">
          <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {done} / {total} classes
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>done</p>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: '#0f766e' }}
          />
        </div>

        <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {slots} weekly slots in session
        </p>
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
// Unchanged from original

const SectionHeader = ({ title, description }) => (
  <div>
    <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {title}
    </h2>
    <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
      {description}
    </p>
  </div>
)

// ─── States ───────────────────────────────────────────────────────────────────
// Unchanged from original

const LoadingState = () => (
  <div
    className="animate-pulse rounded-2xl border p-10 text-center"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="mx-auto h-4 w-32 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="mx-auto mt-3 h-3 w-48 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
  </div>
)

const EmptyTimetable = () => (
  <div
    className="rounded-2xl border p-12 text-center"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div
      className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
    >
      <AlertTriangle size={20} style={{ color: 'var(--color-text-muted)' }} />
    </div>
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      No timetable configured
    </p>
    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
      No timetable slots are set up for this session yet.
    </p>
  </div>
)

export default TeacherTimetable