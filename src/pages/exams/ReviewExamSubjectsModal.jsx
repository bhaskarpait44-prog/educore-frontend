import { useEffect, useMemo, useState } from 'react'
import { CheckCheck, ChevronDown, ChevronUp, FileCheck2, ShieldCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import useExamStore from '@/store/examStore'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const STATUS_VARIANT = {
  draft: 'grey',
  submitted: 'yellow',
  approved: 'green',
  rejected: 'red',
}

const ReviewExamSubjectsModal = ({ exam, open, onClose }) => {
  const { toastError, toastSuccess } = useToast()
  const {
    examSubjects,
    fetchExamSubjects,
    reviewExamSubject,
    approveAllExamSubjects,
    overrideExamMark,
    isSaving,
  } = useExamStore()

  const [expandedSubjectId, setExpandedSubjectId] = useState(null)
  const [overrideTarget, setOverrideTarget] = useState(null)

  useEffect(() => {
    if (!open || !exam?.id) return
    fetchExamSubjects(exam.id).catch(() => {})
  }, [open, exam?.id, fetchExamSubjects])

  useEffect(() => {
    if (!open) {
      setExpandedSubjectId(null)
      setOverrideTarget(null)
    }
  }, [open])

  const rows = exam?.id ? (examSubjects[exam.id] || []) : []

  const summary = useMemo(() => rows.reduce((acc, row) => {
    acc.total += 1
    if (row.review_status === 'approved') acc.approved += 1
    else if (row.review_status === 'submitted') acc.submitted += 1
    else if (row.review_status === 'rejected') acc.rejected += 1
    else acc.draft += 1
    return acc
  }, { total: 0, approved: 0, submitted: 0, rejected: 0, draft: 0 }), [rows])

  const handleApproveAll = async () => {
    if (!exam?.id) return
    const result = await approveAllExamSubjects(exam.id)
    if (result.success) {
      toastSuccess(result.data?.approved_count ? `${result.data.approved_count} submitted subjects approved.` : 'No submitted subjects were pending approval.')
    } else {
      toastError(result.message || 'Failed to approve submitted subjects.')
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={exam ? `Review Marks - ${exam.name}` : 'Review Marks'} size="xl">
        <div className="space-y-5">
          <section
            className="rounded-[28px] border p-5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Teacher-submitted marks review
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Review submitted subject marks, approve everything together when ready, and override a mark after approval if a correction is needed.
                </p>
              </div>
              <Button
                icon={CheckCheck}
                onClick={handleApproveAll}
                loading={isSaving}
                disabled={!summary.submitted}
              >
                Approve All Submitted
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryTile label="Approved" value={summary.approved} tone="#15803d" bg="#f0fdf4" />
              <SummaryTile label="Awaiting Review" value={summary.submitted} tone="#b45309" bg="#fffbeb" />
              <SummaryTile label="Rejected" value={summary.rejected} tone="#b91c1c" bg="#fef2f2" />
              <SummaryTile label="Draft" value={summary.draft} tone="#475569" bg="#f8fafc" />
            </div>
          </section>

          {rows.length === 0 ? (
            <div className="rounded-2xl px-4 py-8 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
              No configured subjects found for this exam.
            </div>
          ) : rows.map((row) => {
            const isExpanded = expandedSubjectId === row.subject_id
            return (
              <section
                key={row.subject_id}
                className="rounded-[28px] border p-5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {row.name}
                      </p>
                      <Badge variant={STATUS_VARIANT[row.review_status] || 'grey'}>{row.review_status}</Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {row.code || '--'} | {row.subject_type} | Total {row.combined_total_marks} | Passing {row.combined_passing_marks}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Teacher: {row.assigned_teacher_name || 'Not assigned'} | Entered {row.entered_students || 0}/{row.total_students || 0} students
                    </p>
                    {(row.submitted_at || row.reviewed_at) && (
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {row.submitted_at ? `Submitted ${formatDate(row.submitted_at)}${row.submitted_by_name ? ` by ${row.submitted_by_name}` : ''}` : 'Not submitted yet'}
                        {row.reviewed_at ? ` | Reviewed ${formatDate(row.reviewed_at)}${row.reviewed_by_name ? ` by ${row.reviewed_by_name}` : ''}` : ''}
                      </p>
                    )}
                    {row.review_note && (
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Note: {row.review_note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      icon={isExpanded ? ChevronUp : ChevronDown}
                      onClick={() => setExpandedSubjectId(isExpanded ? null : row.subject_id)}
                    >
                      {isExpanded ? 'Hide Marks' : 'View Marks'}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={isSaving || row.review_status === 'approved'}
                      onClick={async () => {
                        const result = await reviewExamSubject(exam.id, row.subject_id, { review_status: 'approved', review_note: null })
                        if (result.success) toastSuccess(`${row.name} approved.`)
                        else toastError(result.message || 'Failed to approve subject.')
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      disabled={isSaving}
                      onClick={async () => {
                        const result = await reviewExamSubject(exam.id, row.subject_id, {
                          review_status: 'rejected',
                          review_note: 'Needs correction before final approval',
                        })
                        if (result.success) toastSuccess(`${row.name} sent back for correction.`)
                        else toastError(result.message || 'Failed to reject subject.')
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <MetricChip label="Students" value={`${row.entered_students || 0}/${row.total_students || 0}`} />
                  <MetricChip label="Average" value={formatMarks(row.average_marks)} />
                  <MetricChip label="Highest" value={formatMarks(row.highest_marks)} />
                  <MetricChip label="Lowest" value={formatMarks(row.lowest_marks)} />
                  <MetricChip label="Absentees" value={String(row.absent_students || 0)} />
                </div>

                {isExpanded && (
                  <div className="mt-5 overflow-x-auto rounded-[24px] border" style={{ borderColor: 'var(--color-border)' }}>
                    <table className="min-w-full">
                      <thead style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                        <tr>
                          {['Roll', 'Student', 'Teacher Mark', 'Grade', 'Override', ''].map((head) => (
                            <th
                              key={head}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(row.student_marks || []).map((studentRow, index) => (
                          <tr
                            key={`${row.subject_id}-${studentRow.enrollment_id}`}
                            style={{ borderTop: index === 0 ? 'none' : '1px solid var(--color-border)' }}
                          >
                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {studentRow.roll_number || '--'}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                {studentRow.first_name} {studentRow.last_name}
                              </p>
                              <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                                {studentRow.admission_no}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {renderMarks(row, studentRow)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={studentRow.is_absent ? 'grey' : studentRow.is_pass ? 'green' : 'red'}>
                                {studentRow.is_absent ? 'Absent' : studentRow.grade || 'Pending'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {studentRow.override_reason ? (
                                <div className="space-y-1">
                                  <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                    {studentRow.override_by_name || 'Admin override'}
                                  </p>
                                  <p>{studentRow.override_reason}</p>
                                </div>
                              ) : (
                                'No override'
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  icon={ShieldCheck}
                                  onClick={() => setOverrideTarget({ subject: row, student: studentRow })}
                                >
                                  Override
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </Modal>

      <MarkOverrideModal
        open={!!overrideTarget}
        target={overrideTarget}
        saving={isSaving}
        onClose={() => setOverrideTarget(null)}
        onSubmit={async (payload) => {
          const result = await overrideExamMark(payload)
          if (result.success) {
            toastSuccess('Mark overridden successfully.')
            setOverrideTarget(null)
            await fetchExamSubjects(exam.id)
          } else {
            toastError(result.message || 'Failed to override mark.')
          }
        }}
      />
    </>
  )
}

const MarkOverrideModal = ({ open, target, saving, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    is_absent: false,
    marks_obtained: '',
    theory_marks_obtained: '',
    practical_marks_obtained: '',
    reason: '',
  })

  useEffect(() => {
    if (!target?.student || !target?.subject) return
    setForm({
      is_absent: !!target.student.is_absent,
      marks_obtained: target.student.marks_obtained ?? '',
      theory_marks_obtained: target.student.theory_marks_obtained ?? '',
      practical_marks_obtained: target.student.practical_marks_obtained ?? '',
      reason: '',
    })
  }, [target])

  if (!target?.student || !target?.subject) return null

  const { subject, student } = target

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override Student Mark"
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            icon={FileCheck2}
            loading={saving}
            onClick={() => {
              onSubmit({
                exam_id: subject.exam_id,
                enrollment_id: student.enrollment_id,
                subject_id: subject.subject_id,
                is_absent: form.is_absent,
                marks_obtained: form.is_absent ? null : nullableNumber(form.marks_obtained),
                theory_marks_obtained: form.is_absent ? null : nullableNumber(form.theory_marks_obtained),
                practical_marks_obtained: form.is_absent ? null : nullableNumber(form.practical_marks_obtained),
                reason: form.reason.trim(),
              })
            }}
            disabled={
              !form.reason.trim() || (
                !form.is_absent && (
                  subject.subject_type === 'both'
                    ? form.theory_marks_obtained === '' || form.practical_marks_obtained === ''
                    : form.marks_obtained === ''
                )
              )
            }
          >
            Save Override
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {student.first_name} {student.last_name}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {subject.name} | Roll {student.roll_number || '--'}
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Current mark: {renderMarks(subject, student)}
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={form.is_absent}
            onChange={(event) => setForm((prev) => ({ ...prev, is_absent: event.target.checked }))}
          />
          Mark student absent
        </label>

        {subject.subject_type === 'both' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={`Theory / ${subject.theory_total_marks}`}
              type="number"
              min="0"
              step="0.5"
              max={subject.theory_total_marks}
              disabled={form.is_absent}
              value={form.theory_marks_obtained}
              onChange={(event) => setForm((prev) => ({ ...prev, theory_marks_obtained: event.target.value }))}
            />
            <Input
              label={`Practical / ${subject.practical_total_marks}`}
              type="number"
              min="0"
              step="0.5"
              max={subject.practical_total_marks}
              disabled={form.is_absent}
              value={form.practical_marks_obtained}
              onChange={(event) => setForm((prev) => ({ ...prev, practical_marks_obtained: event.target.value }))}
            />
          </div>
        ) : (
          <Input
            label={`Marks / ${subject.combined_total_marks}`}
            type="number"
            min="0"
            step="0.5"
            max={subject.combined_total_marks}
            disabled={form.is_absent}
            value={form.marks_obtained}
            onChange={(event) => setForm((prev) => ({ ...prev, marks_obtained: event.target.value }))}
          />
        )}

        <Textarea
          label="Override reason"
          rows={3}
          required
          value={form.reason}
          onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
          placeholder="Explain why this approved mark needs to be corrected."
        />
      </div>
    </Modal>
  )
}

const SummaryTile = ({ label, value, tone, bg }) => (
  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: bg }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>{label}</p>
    <p className="mt-1 text-2xl font-bold" style={{ color: tone }}>{value}</p>
  </div>
)

const MetricChip = ({ label, value }) => (
  <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
  </div>
)

const formatMarks = (value) => {
  if (value === null || value === undefined || value === '') return '--'
  return Number(value) % 1 === 0 ? String(Number(value)) : Number(value).toFixed(2)
}

const renderMarks = (subject, row) => {
  if (row.is_absent) return 'AB'
  if (subject.subject_type === 'both') {
    return `${formatMarks(row.theory_marks_obtained)} + ${formatMarks(row.practical_marks_obtained)} = ${formatMarks(row.marks_obtained)}`
  }
  return formatMarks(row.marks_obtained)
}

const nullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  return Number(value)
}

export default ReviewExamSubjectsModal
