import { useMemo, useState } from 'react'
import { BookOpenText, Filter, NotebookPen, Search, Send } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useHomework from '@/hooks/useHomework'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import HomeworkCard from '@/components/teacher/HomeworkCard'
import HomeworkForm from './HomeworkForm'
import HomeworkSubmissions from './HomeworkSubmissions'

const HomeworkList = () => {
  usePageTitle('Homework')

  const { toastSuccess, toastError, toastInfo } = useToast()
  const {
    sections,
    homework,
    loadingBase,
    loadingHomework,
    savingHomework,
    submissionDrawer,
    getSectionSubjects,
    saveHomework,
    cancelHomework,
    loadSubmissions,
    clearSubmissions,
    submitSubmission,
    gradeSubmission,
    sendReminder,
  } = useHomework()

  const [filters, setFilters] = useState({
    search: '',
    sectionKey: '',
    status: '',
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editingHomework, setEditingHomework] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [gradingId, setGradingId] = useState(null)

  const filteredHomework = useMemo(() => homework.filter((item) => {
    const haystack = `${item.title} ${item.description} ${item.subject_name} ${item.class_name} ${item.section_name}`.toLowerCase()
    const matchesSearch = !filters.search.trim() || haystack.includes(filters.search.trim().toLowerCase())
    const matchesSection = !filters.sectionKey || `${item.class_id}:${item.section_id}` === filters.sectionKey
    const matchesStatus = filters.status
      ? item.workflow_status === filters.status
      : item.workflow_status !== 'cancelled'
    return matchesSearch && matchesSection && matchesStatus
  }), [filters, homework])

  const stats = useMemo(() => (
    filteredHomework.reduce((acc, item) => {
      acc.total += 1
      acc.pendingStudents += Number(item.pending_count || 0)
      acc.submittedStudents += Number(item.submitted_count || 0)
      if (item.workflow_status === 'overdue') acc.overdue += 1
      return acc
    }, { total: 0, pendingStudents: 0, submittedStudents: 0, overdue: 0 })
  ), [filteredHomework])

  const handleSaveHomework = async (payload) => {
    try {
      await saveHomework(payload, editingHomework?.id || null)
      toastSuccess(editingHomework ? 'Homework updated.' : 'Homework assigned.')
      setFormOpen(false)
      setEditingHomework(null)
    } catch (error) {
      toastError(error?.message || 'Unable to save homework.')
    }
  }

  const handleOpenSubmissions = async (item) => {
    try {
      await loadSubmissions(item.id)
    } catch (error) {
      toastError(error?.message || 'Unable to load submissions.')
    }
  }

  const handleGrade = async (row, draft) => {
    if (!submissionDrawer.homework) return
    try {
      setGradingId(row.id)
      await gradeSubmission(submissionDrawer.homework.id, {
        submission_id: row.id,
        marks_obtained: draft.marks_obtained === '' ? null : Number(draft.marks_obtained),
        teacher_comment: draft.teacher_comment?.trim() || null,
      })
      toastSuccess(`Saved grade for ${row.first_name} ${row.last_name}.`)
    } catch (error) {
      toastError(error?.message || 'Unable to save grade.')
    } finally {
      setGradingId(null)
    }
  }

  const handleTeacherSubmit = async (row) => {
    if (!submissionDrawer.homework) return
    try {
      await submitSubmission(submissionDrawer.homework.id, {
        submission_id: row.id,
      })
      toastSuccess(`Marked ${row.first_name} ${row.last_name} as submitted.`)
    } catch (error) {
      toastError(error?.message || 'Unable to mark homework as submitted.')
    }
  }

  const handleReminder = async (item) => {
    try {
      const data = await sendReminder(item.id)
      toastInfo(`Reminder logged for ${data?.pending_students || 0} pending student(s).`)
      if (submissionDrawer.homework?.id === item.id) {
        await loadSubmissions(item.id)
      }
    } catch (error) {
      toastError(error?.message || 'Unable to log reminder.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await cancelHomework(deleteTarget.id)
      toastSuccess('Homework deleted.')
      setDeleteTarget(null)
    } catch (error) {
      toastError(error?.message || 'Unable to delete homework.')
    }
  }

  return (
    <div className="space-y-5 pb-24">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.18), rgba(16, 185, 129, 0.06) 58%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Homework
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Assign homework quickly, track every student, grade submissions, and send reminders from one teacher-first workflow.
            </p>
          </div>
          <Button variant="primary" icon={NotebookPen} onClick={() => { setEditingHomework(null); setFormOpen(true) }}>
            Assign Homework
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Homework Items" value={stats.total} tone="#0f766e" />
          <StatCard title="Submitted" value={stats.submittedStudents} tone="#10b981" />
          <StatCard title="Pending" value={stats.pendingStudents} tone="#f59e0b" />
          <StatCard title="Overdue" value={stats.overdue} tone="#ef4444" />
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Filter Homework
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Input
            label="Search"
            icon={Search}
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search title, class, section, or subject"
          />
          <Select
            label="Class and Section"
            value={filters.sectionKey}
            onChange={(event) => setFilters((prev) => ({ ...prev, sectionKey: event.target.value }))}
            options={sections.map((section) => ({ value: `${section.class_id}:${section.section_id}`, label: section.label }))}
            placeholder="All assigned sections"
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            placeholder="All statuses"
          />
        </div>
      </section>

      <section className="space-y-4">
        {loadingBase || loadingHomework ? (
          [...Array(4)].map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          ))
        ) : filteredHomework.length === 0 ? (
          <EmptyState
            icon={BookOpenText}
            title="No homework found"
            description="Create a new assignment or adjust the current filters to see homework from your assigned sections."
            action={(
              <Button variant="primary" onClick={() => { setEditingHomework(null); setFormOpen(true) }}>
                Create Homework
              </Button>
            )}
          />
        ) : (
          filteredHomework.map((item) => (
            <HomeworkCard
              key={item.id}
              item={item}
              onEdit={(homeworkItem) => {
                setEditingHomework(homeworkItem)
                setFormOpen(true)
              }}
              onViewSubmissions={handleOpenSubmissions}
              onRemind={handleReminder}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </section>

      <div className="fixed inset-x-0 bottom-4 z-30 px-4 lg:hidden">
        <Button variant="primary" fullWidth icon={Send} onClick={() => { setEditingHomework(null); setFormOpen(true) }}>
          Assign Homework
        </Button>
      </div>

      <HomeworkForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingHomework(null)
        }}
        onSubmit={handleSaveHomework}
        loading={savingHomework}
        sections={sections}
        getSectionSubjects={getSectionSubjects}
        initialData={editingHomework}
      />

      <HomeworkSubmissions
        open={Boolean(submissionDrawer.homework) || submissionDrawer.loading}
        onClose={() => {
          setGradingId(null)
          clearSubmissions()
        }}
        homework={submissionDrawer.homework}
        submissions={submissionDrawer.submissions}
        summary={submissionDrawer.summary}
        loading={submissionDrawer.loading}
        gradingId={gradingId}
        onTeacherSubmit={handleTeacherSubmit}
        onGrade={handleGrade}
        onRemind={handleReminder}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={savingHomework}
        title="Delete homework?"
        description={`This will delete "${deleteTarget?.title || 'this homework'}" from the active homework list.`}
        confirmLabel="Delete Homework"
      />
    </div>
  )
}

const StatCard = ({ title, value, tone }) => (
  <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
      {title}
    </p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>
      {value}
    </p>
  </div>
)

export default HomeworkList
