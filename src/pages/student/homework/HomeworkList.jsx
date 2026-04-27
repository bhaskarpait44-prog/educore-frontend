import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import HomeworkCard from '@/components/student/HomeworkCard'
import HomeworkSubmitForm from '@/components/student/HomeworkSubmitForm'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentHomework from '@/hooks/useStudentHomework'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const statusTabs = ['all', 'due_today', 'pending', 'submitted', 'overdue', 'graded']

const HomeworkList = () => {
  usePageTitle('Homework')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    homework,
    selectedHomework,
    loading,
    refreshing,
    detailLoading,
    submitting,
    error,
    refresh,
    openHomework,
    closeHomework,
    submitHomework,
    subjects,
  } = useStudentHomework()

  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState('due_date')

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredHomework = useMemo(() => {
    const rows = homework
      .filter((item) => statusFilter === 'all' || item.student_status === statusFilter)
      .filter((item) => subjectFilter === 'all' || item.subject_name === subjectFilter)

    return [...rows].sort((a, b) => {
      if (sortBy === 'subject') return String(a.subject_name).localeCompare(String(b.subject_name))
      if (sortBy === 'status') return String(a.student_status).localeCompare(String(b.student_status))
      return String(a.due_date).localeCompare(String(b.due_date))
    })
  }, [homework, sortBy, statusFilter, subjectFilter])

  const calendarDays = useMemo(() => {
    const map = new Map()
    homework.forEach((item) => {
      const key = String(item.due_date)
      const tone = item.student_status === 'submitted' || item.student_status === 'graded'
        ? 'green'
        : item.student_status === 'overdue'
          ? 'amber'
          : 'red'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push({ title: item.title, tone })
    })
    return [...map.entries()].slice(0, 12)
  }, [homework])

  const handleRefresh = async () => {
    toastInfo('Refreshing homework')
    try {
      await refresh()
    } catch {}
  }

  const handleOpen = async (item) => {
    try {
      await openHomework(item.id)
    } catch (err) {
      toastError(err?.message || 'Unable to open homework.')
    }
  }

  const handleSubmit = async (payload) => {
    if (!selectedHomework) return
    try {
      await submitHomework(selectedHomework.id, payload)
      toastSuccess('Homework submitted successfully.')
    } catch (err) {
      toastError(err?.message || 'Unable to submit homework.')
    }
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(245,158,11,0.06) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Homework
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Assigned Homework</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Filter what is due today, spot overdue work quickly, and submit online homework without leaving your student view.
            </p>
          </div>

          <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap"
                style={{
                  backgroundColor: statusFilter === tab ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                  color: statusFilter === tab ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="min-h-12 rounded-[20px] border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <option value="all">All subjects</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-h-12 rounded-[20px] border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <option value="due_date">Sort by due date</option>
              <option value="subject">Sort by subject</option>
              <option value="status">Sort by status</option>
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 rounded-[26px] bg-[var(--color-surface)]" />)}
        </div>
      ) : filteredHomework.length ? (
        <div className="space-y-4">
          {filteredHomework.map((item) => (
            <HomeworkCard key={item.id} item={item} onOpen={handleOpen} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpenText}
          title="No homework in this view"
          description="Try another status or subject filter to find your assignments."
        />
      )}

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Homework Calendar</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {calendarDays.length ? calendarDays.map(([date, items]) => (
            <div
              key={date}
              className="rounded-[22px] border px-4 py-4"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatDate(date, 'long')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <span key={`${item.title}-${index}`} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={calendarDotStyle(item.tone)}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: calendarDotStyle(item.tone).color }} />
                    {item.title}
                  </span>
                ))}
              </div>
            </div>
          )) : (
            <div className="rounded-[22px] border px-4 py-6 text-sm text-[var(--color-text-secondary)]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              No homework dates to show yet.
            </div>
          )}
        </div>
      </section>

      <Modal
        open={Boolean(selectedHomework) || detailLoading}
        onClose={closeHomework}
        title={selectedHomework ? selectedHomework.title : 'Homework Detail'}
        size="lg"
      >
        {detailLoading && !selectedHomework ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-2xl bg-[var(--color-surface-raised)]" />
            <div className="h-48 rounded-2xl bg-[var(--color-surface-raised)]" />
          </div>
        ) : selectedHomework && (
          <div className="space-y-5">
            <section className="space-y-3">
              <InfoCard label="Subject" value={selectedHomework.subject_name} />
              <InfoCard label="Assigned By" value={selectedHomework.teacher_name} />
              <InfoCard label="Due Date" value={formatDate(selectedHomework.due_date, 'long')} />
              <InfoCard label="Submission Type" value={selectedHomework.submission_type} />
              <InfoCard label="Description" value={selectedHomework.description} />
              <InfoCard label="Teacher Attachment" value={selectedHomework.attachment_path || 'No attachment provided'} />
            </section>

            {selectedHomework.submission_id ? (
              <section className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Submission Status</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard label="Submitted At" value={selectedHomework.submitted_at ? formatDate(selectedHomework.submitted_at, 'long') : '--'} />
                  <InfoCard label="Status" value={selectedHomework.submission_status || 'submitted'} />
                  <InfoCard label="Marks" value={selectedHomework.marks_obtained ?? '--'} />
                  <InfoCard label="Teacher Comment" value={selectedHomework.teacher_comment || 'No feedback yet'} />
                </div>
              </section>
            ) : null}

            {['online', 'both'].includes(selectedHomework.submission_type) ? (
              <section className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Submit Homework</h3>
                <div className="mt-4">
                  <HomeworkSubmitForm homework={selectedHomework} loading={submitting} onSubmit={handleSubmit} />
                </div>
              </section>
            ) : (
              <section className="rounded-[24px] border px-4 py-4 text-sm text-[var(--color-text-secondary)]" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(245,158,11,0.08)' }}>
                Submit physically to your teacher for this homework item.
              </section>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

const InfoCard = ({ label, value }) => (
  <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

function calendarDotStyle(tone) {
  if (tone === 'green') return { backgroundColor: 'rgba(22,163,74,0.10)', color: '#15803d' }
  if (tone === 'amber') return { backgroundColor: 'rgba(245,158,11,0.10)', color: '#b45309' }
  return { backgroundColor: 'rgba(239,68,68,0.10)', color: '#dc2626' }
}

export default HomeworkList
