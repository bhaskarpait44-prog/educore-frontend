import { BookCheck, Clock3, Send } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SubmissionTracker from '@/components/teacher/SubmissionTracker'
import { formatDate } from '@/utils/helpers'

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
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={homework ? `Submissions • ${homework.title}` : 'Homework Submissions'}
    size="xl"
    footer={(
      <>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button
          variant="outline"
          onClick={() => onRemind(homework)}
          icon={Send}
          disabled={!homework || Number(summary?.pending || 0) === 0}
        >
          Remind Pending
        </Button>
      </>
    )}
  >
    {loading ? (
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[24px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    ) : !homework ? (
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        No homework selected.
      </p>
    ) : (
      <div className="space-y-4">
        <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="blue">{homework.class_name} {homework.section_name}</Badge>
                <Badge variant="yellow">{homework.subject_name}</Badge>
              </div>
              <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Due on {formatDate(homework.due_date, 'long')} | {homework.submission_type} submission
                {homework.max_marks != null ? ` | ${Number(homework.max_marks)} marks` : ''}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryPill icon={Clock3} label="Pending" value={summary?.pending || 0} tone="#f59e0b" />
              <SummaryPill icon={BookCheck} label="Submitted" value={summary?.submitted || 0} tone="#14b8a6" />
              <SummaryPill icon={BookCheck} label="Graded" value={summary?.graded || 0} tone="#10b981" />
              <SummaryPill icon={Clock3} label="Late" value={summary?.late || 0} tone="#ef4444" />
            </div>
          </div>
        </div>

        <SubmissionTracker
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

const SummaryPill = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <div className="flex items-center gap-2">
      <Icon size={14} style={{ color: tone }} />
      <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
    </div>
    <p className="mt-2 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {value}
    </p>
  </div>
)

export default HomeworkSubmissions
