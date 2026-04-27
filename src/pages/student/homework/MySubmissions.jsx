import { useEffect, useMemo, useState } from 'react'
import { BookCheck, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentHomework from '@/hooks/useStudentHomework'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const MySubmissions = () => {
  usePageTitle('My Submissions')

  const { toastError, toastInfo } = useToast()
  const { submissions, loading, refreshing, error, refresh } = useStudentHomework()
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const subjects = useMemo(
    () => [...new Map(submissions.map((item) => [item.subject_name, item.subject_name])).values()],
    [submissions]
  )

  const filtered = useMemo(() => submissions
    .filter((item) => statusFilter === 'all' || item.status === statusFilter)
    .filter((item) => subjectFilter === 'all' || item.subject_name === subjectFilter),
  [statusFilter, subjectFilter, submissions])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(22,163,74,0.06) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Homework
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Submissions</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Review what you submitted, when you sent it, and whether it has been graded yet.
            </p>
          </div>

          <Button variant="secondary" onClick={async () => {
            toastInfo('Refreshing submissions')
            await refresh()
          }} loading={refreshing} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
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
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-12 rounded-[20px] border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 rounded-[24px] bg-[var(--color-surface)]" />)}
        </div>
      ) : filtered.length ? (
        <section
          className="overflow-hidden rounded-[28px] border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                <tr>
                  {['Subject', 'Title', 'Due Date', 'Submitted', 'Status', 'Marks'].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{row.subject_name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.title}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(row.due_date, 'short')}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.submitted_at ? formatDate(row.submitted_at, 'short') : '--'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={statusStyle(row.status)}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">{row.marks_obtained ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={BookCheck}
          title="No submissions yet"
          description="Once you submit homework online, it will appear here."
        />
      )}
    </div>
  )
}

function statusStyle(status) {
  if (status === 'graded') return { backgroundColor: '#dcfce7', color: '#15803d' }
  return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
}

export default MySubmissions
