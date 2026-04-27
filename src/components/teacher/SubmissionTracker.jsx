import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Clock3, FileText, Save } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { formatDate } from '@/utils/helpers'

const SubmissionTracker = ({ submissions = [], maxMarks, submissionType, onTeacherSubmit, onGrade, gradingId }) => {
  const [drafts, setDrafts] = useState({})

  const sortedRows = useMemo(() => (
    [...submissions].sort((a, b) => Number(a.roll_number || 0) - Number(b.roll_number || 0))
  ), [submissions])

  const updateDraft = (row, field, value) => {
    const key = row.id || `pending-${row.enrollment_id}`
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        marks_obtained: row.marks_obtained ?? '',
        teacher_comment: row.teacher_comment || '',
        ...prev[key],
        [field]: value,
      },
    }))
  }

  const getDraft = (row) => {
    const key = row.id || `pending-${row.enrollment_id}`
    return drafts[key] || {
      marks_obtained: row.marks_obtained ?? '',
      teacher_comment: row.teacher_comment || '',
    }
  }

  return (
    <div className="space-y-3">
      {sortedRows.map((row) => {
        const draft = getDraft(row)
        const disabled = row.status === 'pending' || !row.id
        const canTeacherSubmit = submissionType === 'written' && row.status === 'pending' && row.id

        return (
          <div
            key={row.enrollment_id}
            className="rounded-[22px] border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue">Roll {row.roll_number || '--'}</Badge>
                  <StatusBadge status={row.status} />
                  {row.is_late ? <Badge variant="red">Late</Badge> : null}
                </div>
                <p className="mt-3 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {row.first_name} {row.last_name}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Submitted: {row.submitted_at ? formatDate(row.submitted_at, 'long') : 'Pending'}
                </p>
                {row.submission_content ? (
                  <div className="mt-3 rounded-2xl px-3 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
                    <div className="mb-2 flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      <FileText size={14} />
                      Submission
                    </div>
                    {row.submission_content}
                  </div>
                ) : null}
                {canTeacherSubmit ? (
                  <div className="mt-3">
                    <Button variant="outline" onClick={() => onTeacherSubmit(row)} icon={ClipboardCheck}>
                      Mark Submitted
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 lg:max-w-xl lg:grid-cols-[140px_minmax(0,1fr)_auto]">
                <Input
                  type="number"
                  min="0"
                  max={maxMarks ?? undefined}
                  step="0.01"
                  label="Marks"
                  value={draft.marks_obtained}
                  onChange={(event) => updateDraft(row, 'marks_obtained', event.target.value)}
                  disabled={disabled}
                  placeholder={maxMarks != null ? `Out of ${maxMarks}` : 'Enter marks'}
                />
                <Textarea
                  label="Teacher Comment"
                  rows={2}
                  value={draft.teacher_comment}
                  onChange={(event) => updateDraft(row, 'teacher_comment', event.target.value)}
                  disabled={disabled}
                  placeholder={disabled ? 'Waiting for student submission' : 'Feedback for student'}
                />
                <div className="flex items-end">
                  <Button
                    variant="primary"
                    onClick={() => onGrade(row, draft)}
                    loading={gradingId === row.id}
                    disabled={disabled}
                    icon={Save}
                    fullWidth
                  >
                    Save Grade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const StatusBadge = ({ status }) => {
  if (status === 'graded') return <Badge variant="green"><CheckCircle2 size={12} />Graded</Badge>
  if (status === 'submitted') return <Badge variant="yellow"><Clock3 size={12} />Submitted</Badge>
  return <Badge variant="grey">Pending</Badge>
}

export default SubmissionTracker
