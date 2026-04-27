import { BookOpenText, CalendarClock, CheckCheck, Clock3, MessageSquareMore, Pencil, Send, XCircle } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate } from '@/utils/helpers'

const STATUS_META = {
  active: { label: 'Active', variant: 'green' },
  overdue: { label: 'Overdue', variant: 'red' },
  completed: { label: 'Completed', variant: 'grey' },
  cancelled: { label: 'Cancelled', variant: 'dark' },
}

const HomeworkCard = ({ item, onEdit, onViewSubmissions, onRemind, onDelete }) => {
  const status = STATUS_META[item.workflow_status] || STATUS_META.active

  return (
    <article
      className="rounded-[24px] border p-4 sm:p-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="blue">{item.class_name} {item.section_name}</Badge>
            <Badge variant="yellow">{item.subject_name}</Badge>
          </div>
          <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {item.title}
          </h3>
          <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
            {item.description}
          </p>
        </div>

        <div className="rounded-2xl px-4 py-3 sm:min-w-48" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
            Due Date
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatDate(item.due_date, 'long')}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {item.submission_type} submission
            {item.max_marks != null ? ` | ${Number(item.max_marks)} marks` : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={CheckCheck} label="Submitted" value={`${item.submitted_count}/${item.student_count}`} tone="#10b981" />
        <MiniStat icon={Clock3} label="Pending" value={String(item.pending_count || 0)} tone="#f59e0b" />
        <MiniStat icon={BookOpenText} label="Graded" value={String(item.graded_count || 0)} tone="#0f766e" />
        <MiniStat icon={CalendarClock} label="Late" value={String(item.late_count || 0)} tone="#ef4444" />
      </div>

      <div className="mt-4 flex flex-col gap-2 lg:flex-row">
        <Button variant="primary" fullWidth onClick={() => onViewSubmissions(item)} icon={MessageSquareMore}>
          View Submissions
        </Button>
        <Button variant="secondary" fullWidth onClick={() => onEdit(item)} icon={Pencil}>
          Edit
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => onRemind(item)}
          icon={Send}
          disabled={Number(item.pending_count || 0) === 0 || item.workflow_status === 'cancelled'}
        >
          Remind Pending
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => onDelete(item)}
          icon={XCircle}
          disabled={item.workflow_status === 'cancelled'}
        >
          Delete
        </Button>
      </div>
    </article>
  )
}

const MiniStat = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex items-center gap-2">
      <Icon size={15} style={{ color: tone }} />
      <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
    </div>
    <p className="mt-2 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {value}
    </p>
  </div>
)

export default HomeworkCard
