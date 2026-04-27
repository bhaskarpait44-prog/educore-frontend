import { ChevronRight } from 'lucide-react'
import { formatDate } from '@/utils/helpers'

const HomeworkCard = ({ item, onOpen }) => {
  const tone = urgencyTone(item.student_status)
  const canSubmit = ['online', 'both'].includes(item.submission_type)

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className="w-full rounded-[26px] border p-4 text-left transition hover:-translate-y-0.5"
      style={{
        borderColor: tone.border,
        backgroundColor: 'var(--color-surface)',
        boxShadow: '0 14px 34px rgba(76,29,149,0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ backgroundColor: tone.soft, color: tone.color }}>
              {item.student_status.replace(/_/g, ' ')}
            </span>
            <span className="rounded-full bg-[rgba(124,58,237,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--student-accent)]">
              {item.subject_name}
            </span>
          </div>
          <p className="mt-3 text-base font-semibold text-[var(--color-text-primary)]">{item.title}</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">{item.description}</p>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniCell label="Due" value={formatDate(item.due_date, 'long')} />
        <MiniCell label="Type" value={item.submission_type} />
        <MiniCell label="Teacher" value={item.teacher_name} />
        <MiniCell label="Action" value={canSubmit ? 'Submit online' : 'Submit physically'} tone={canSubmit ? '#16a34a' : '#d97706'} />
      </div>
    </button>
  )
}

const MiniCell = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div className="rounded-[18px] border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold" style={{ color: tone }}>{value || '--'}</p>
  </div>
)

function urgencyTone(status) {
  if (status === 'overdue') return { border: '#fca5a5', soft: 'rgba(239,68,68,0.10)', color: '#dc2626' }
  if (status === 'due_today') return { border: '#fcd34d', soft: 'rgba(245,158,11,0.10)', color: '#b45309' }
  if (status === 'submitted' || status === 'graded') return { border: '#86efac', soft: 'rgba(22,163,74,0.10)', color: '#15803d' }
  return { border: 'var(--color-border)', soft: 'rgba(124,58,237,0.10)', color: '#6d28d9' }
}

export default HomeworkCard
