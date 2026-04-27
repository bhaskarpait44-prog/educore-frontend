import { AlarmClock } from 'lucide-react'
import { formatDate } from '@/utils/helpers'

const ExamCountdown = ({ exams = [] }) => {
  if (!exams.length) {
    return (
      <div
        className="rounded-[28px] border p-6 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <AlarmClock size={20} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No upcoming exams right now.</p>
      </div>
    )
  }

  return (
    <section
      className="rounded-[28px] border p-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.10)] text-[var(--student-accent)]">
          <AlarmClock size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Exam Countdown</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Upcoming exams and a quick nudge to stay ahead.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {exams.slice(0, 4).map((exam) => (
          <div
            key={exam.id}
            className="rounded-[22px] border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{exam.subject_name}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{formatDate(exam.start_date, 'long')}</p>
              </div>
              <span className="rounded-full bg-[rgba(124,58,237,0.12)] px-3 py-1 text-xs font-semibold text-[var(--student-accent)]">
                In {exam.days_remaining} day(s)
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(22,163,74,0.06)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700 dark:text-green-300">Study Tip</p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Review one weak topic first, then one strong topic. That rhythm usually sticks better than long cram sessions.
        </p>
      </div>
    </section>
  )
}

export default ExamCountdown
