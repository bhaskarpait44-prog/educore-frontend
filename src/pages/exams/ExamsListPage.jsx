import { useEffect, useState } from 'react'
import { Plus, ClipboardList, PenLine, Trash2, ShieldCheck, Send } from 'lucide-react'
import useExamStore from '@/store/examStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CreateExamModal from './CreateExamModal'
import ReviewExamSubjectsModal from './ReviewExamSubjectsModal'
import { formatDate, getExamTypeLabel } from '@/utils/helpers'

const STATUS_CFG = {
  draft: { label: 'Draft', variant: 'grey' },
  published: { label: 'Published', variant: 'green' },
  upcoming: { label: 'Upcoming', variant: 'blue' },
  ongoing: { label: 'Ongoing', variant: 'green' },
  completed: { label: 'Completed', variant: 'grey' },
}

const TYPE_CFG = {
  term: { variant: 'blue' },
  midterm: { variant: 'yellow' },
  final: { variant: 'green' },
  compartment: { variant: 'red' },
}

const ExamsListPage = ({ onNavigate }) => {
  const { toastError, toastSuccess } = useToast()
  const { exams, isLoading, isSaving, fetchExams, deleteExam, changeExamStatus } = useExamStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()
  const [sessionId, setSessionId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)

  useEffect(() => {
    fetchSessions().catch(() => {})
  }, [fetchSessions])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!sessionId) return
    fetchExams({ session_id: sessionId }).catch(() => toastError('Failed to load exams'))
  }, [sessionId, fetchExams, toastError])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteExam(deleteTarget.id)
    if (result.success) {
      toastSuccess('Exam deleted successfully')
      setDeleteTarget(null)
    } else {
      toastError(result.message || 'Failed to delete exam')
    }
  }

  return (
    <div className="space-y-5">
      <div
        className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Session"
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          options={(sessions || []).map((session) => ({ value: String(session.id), label: session.name }))}
          containerClassName="flex-1"
        />
        <div className="flex items-end">
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Create Exam
          </Button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {isLoading ? (
          <TableSkeleton cols={7} rows={4} />
        ) : exams.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No exams yet"
            description="Create your first subject-linked exam for this session."
            action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Exam</Button>}
            className="border-0 rounded-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Exam Name', 'Type', 'Class', 'Dates', 'Subjects', 'Status', ''].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, index) => {
                  const statusConfig = STATUS_CFG[exam.status] || { label: exam.status, variant: 'grey' }
                  const typeConfig = TYPE_CFG[exam.exam_type] || { variant: 'grey' }
                  return (
                    <tr
                      key={exam.id}
                      style={{ borderBottom: index < exams.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{exam.name}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={typeConfig.variant}>{getExamTypeLabel(exam.exam_type, exam.name)}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {exam.class_name || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDate(exam.start_date)} - {formatDate(exam.end_date)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="space-y-1">
                          <p>{exam.subject_count || 0}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {exam.approved_subject_count || 0} approved
                            {Number(exam.pending_review_count || 0) > 0 ? ` | ${exam.pending_review_count} review pending` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={statusConfig.variant} dot>{statusConfig.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="xs" icon={ShieldCheck} onClick={() => setReviewTarget(exam)}>
                            Review
                          </Button>
                          {exam.status !== 'draft' && (
                            <Button variant="ghost" size="xs" icon={PenLine} onClick={() => onNavigate('marks')}>
                              Enter Marks
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Send}
                            onClick={async () => {
                              const nextStatus = exam.status === 'published' ? 'draft' : 'published'
                              const result = await changeExamStatus(exam.id, { status: nextStatus })
                              if (result.success) {
                                toastSuccess(nextStatus === 'published' ? 'Exam published' : 'Exam moved to draft')
                              } else {
                                toastError(result.message || 'Failed to update exam status')
                              }
                            }}
                          >
                            {exam.status === 'published' ? 'Draft' : 'Publish'}
                          </Button>
                          <Button variant="ghost" size="xs" icon={Trash2} onClick={() => setDeleteTarget(exam)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateExamModal open={createOpen} onClose={() => setCreateOpen(false)} sessionId={sessionId} />

      <ReviewExamSubjectsModal exam={reviewTarget} open={!!reviewTarget} onClose={() => setReviewTarget(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Exam"
        description={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone. Exams with entered marks cannot be deleted.` : ''}
        confirmLabel={isSaving ? 'Deleting...' : 'Delete'}
        loading={isSaving}
        variant="danger"
      />
    </div>
  )
}

export default ExamsListPage
