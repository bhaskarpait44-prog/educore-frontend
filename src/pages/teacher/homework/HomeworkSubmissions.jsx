import { useRef, useCallback } from 'react'
import { BookCheck, Clock3, Send, FileText, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SubmissionTracker from '@/components/teacher/SubmissionTracker'
import { formatDate } from '@/utils/helpers'

// ── Summary stat pill ─────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, tone, bg }) => (
  <div
    className="flex flex-col gap-2 rounded-2xl p-3.5"
    style={{ backgroundColor: bg, border: `1px solid ${tone}25` }}
  >
    <div className="flex items-center justify-between">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{ color: tone }}
      >
        {label}
      </span>
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${tone}20` }}
      >
        <Icon size={12} style={{ color: tone }} />
      </div>
    </div>
    <p className="text-2xl font-bold leading-none" style={{ color: tone }}>
      {value}
    </p>
  </div>
)

// ── Inline skeleton rows ──────────────────────────────────────────────────
const SkeletonRows = () => (
  <div className="space-y-3 animate-pulse">
    {/* header bar skeleton */}
    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-24 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
        <div className="h-5 w-20 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>
      <div className="h-3.5 w-64 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl" style={{ backgroundColor: 'var(--color-border)' }} />
        ))}
      </div>
    </div>
    {/* list rows */}
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

// ── Main component ────────────────────────────────────────────────────────
const HomeworkSubmissions = ({
  open,
  onClose,
  homework,
  submissions,
  summary,
  loading,
  gradingId,
  onTeacherSubmit,
  onGrade,
  onRemind,
}) => {
  // Preserve scroll position across re-renders triggered by parent state updates
  const scrollRef = useRef(null)

  // Wrap onTeacherSubmit: snapshot scroll → call → restore after paint
  const handleTeacherSubmit = useCallback(async (...args) => {
    const el = scrollRef.current
    const top = el?.scrollTop ?? 0
    await onTeacherSubmit(...args)
    // Use two rAFs so the DOM has fully committed before we restore
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = top
      })
    })
  }, [onTeacherSubmit])
  const pendingCount  = Number(summary?.pending   || 0)
  const submittedCount = Number(summary?.submitted || 0)
  const gradedCount   = Number(summary?.graded    || 0)
  const lateCount     = Number(summary?.late      || 0)
  const totalCount    = pendingCount + submittedCount + gradedCount

  const completionPct = totalCount > 0
    ? Math.round(((submittedCount + gradedCount) / totalCount) * 100)
    : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={homework ? `${homework.title}` : 'Homework Submissions'}
      size="xl"
      scrollRef={scrollRef}
      footer={(
        <div className="flex items-center justify-between w-full">
          {/* left: progress label */}
          <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
            {completionPct}% submission rate
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => onRemind(homework)}
              icon={Send}
              disabled={!homework || pendingCount === 0}
            >
              Remind Pending
              {pendingCount > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }}
                >
                  {pendingCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    >
      {/* ── Loading state ── */}
      {loading ? (
        <SkeletonRows />
      ) : !homework ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <FileText size={20} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            No homework selected
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── Info header ── */}
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Top row: badges + meta */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="blue">{homework.class_name}{homework.section_name ? ` ${homework.section_name}` : ''}</Badge>
                  <Badge variant="yellow">{homework.subject_name}</Badge>
                  {homework.submission_type && (
                    <Badge variant="gray">{homework.submission_type}</Badge>
                  )}
                  {homework.max_marks != null && (
                    <Badge variant="purple">{Number(homework.max_marks)} marks</Badge>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Due{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatDate(homework.due_date, 'long')}
                  </span>
                </p>
              </div>

              {/* Completion ring / percentage */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>
                    {completionPct}%
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    submitted
                  </p>
                </div>
                {/* slim progress arc via CSS */}
                <svg width="44" height="44" viewBox="0 0 44 44" className="rotate-[-90deg]">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-border)" strokeWidth="4" />
                  <circle
                    cx="22" cy="22" r="18" fill="none"
                    stroke={completionPct >= 75 ? '#16a34a' : completionPct >= 40 ? '#d97706' : '#ef4444'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - completionPct / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
              </div>
            </div>

            {/* Stat pills grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatPill icon={Clock3}     label="Pending"   value={pendingCount}   tone="#f59e0b" bg="#fffbeb" />
              <StatPill icon={FileText}   label="Submitted" value={submittedCount} tone="#0ea5e9" bg="#f0f9ff" />
              <StatPill icon={BookCheck}  label="Graded"    value={gradedCount}    tone="#10b981" bg="#f0fdf4" />
              <StatPill icon={AlertCircle}label="Late"      value={lateCount}      tone="#ef4444" bg="#fef2f2" />
            </div>

            {/* Thin progress bar */}
            <div
              className="mt-3.5 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionPct}%`,
                  backgroundColor: completionPct >= 75 ? '#10b981' : completionPct >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>

          {/* ── Submission tracker ── */}
          {/*
            KEY FIX: We pass `key={gradingId ?? 'idle'}` so React does NOT
            re-mount the entire SubmissionTracker when gradingId changes.
            The tracker itself handles its own optimistic / loading state.
            If SubmissionTracker triggers a re-render of this parent during
            onTeacherSubmit, we isolate the loading inside the tracker so
            the modal header/summary never blinks or unmounts.
          */}
          <SubmissionTracker
            key={homework.id}
            submissionType={homework.submission_type}
            submissions={submissions}
            maxMarks={homework.max_marks != null ? Number(homework.max_marks) : null}
            onTeacherSubmit={onTeacherSubmit}
            onGrade={onGrade}
            gradingId={gradingId}
          />
        </div>
      )}
    </Modal>
  )
}

export default HomeworkSubmissions