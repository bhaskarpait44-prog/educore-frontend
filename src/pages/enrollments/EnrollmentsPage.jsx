import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Users } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStudentStore from '@/store/studentStore'
import useSessionStore from '@/store/sessionStore'
import useClasses from '@/hooks/useClasses'
import { getSections } from '@/api/classApi'
import { ROUTES } from '@/constants/app'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import { formatDate } from '@/utils/helpers'

const EnrollmentsPage = () => {
  usePageTitle('Enrollments')

  const navigate = useNavigate()
  const { toastError } = useToast()
  const { students, pagination, isLoading, fetchStudents } = useStudentStore()
  const { classes, fetchClasses } = useClasses()
  const {
    sessions,
    currentSession,
    fetchSessions,
    fetchCurrentSession,
  } = useSessionStore()

  const [filters, setFilters] = useState({
    session_id: '',
    class_id: '',
    section_id: '',
  })
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)

  useEffect(() => {
    fetchClasses().catch(() => toastError('Failed to load classes'))
    fetchSessions().catch(() => toastError('Failed to load sessions'))
    fetchCurrentSession().catch(() => {})
  }, [fetchClasses, fetchSessions, fetchCurrentSession, toastError])

  useEffect(() => {
    if (!filters.session_id && currentSession?.id) {
      setFilters(prev => ({ ...prev, session_id: String(currentSession.id) }))
    }
  }, [currentSession, filters.session_id])

  useEffect(() => {
    fetchStudents({
      page: 1,
      perPage: 100,
      class_id: filters.class_id || undefined,
      section_id: filters.section_id || undefined,
      session_id: filters.session_id || undefined,
    }).catch(() => toastError('Failed to load enrollments'))
  }, [filters, fetchStudents, toastError])

  useEffect(() => {
    if (!filters.class_id) {
      setSections([])
      return
    }

    setLoadingSections(true)
    getSections(filters.class_id)
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : []
        setSections(rows.map(section => ({
          value: String(section.id),
          label: `Section ${section.name}`,
        })))
      })
      .catch(() => {
        setSections([])
        toastError('Failed to load sections')
      })
      .finally(() => setLoadingSections(false))
  }, [filters.class_id, toastError])

  const sessionOptions = useMemo(
    () => sessions.map(session => ({
      value: String(session.id),
      label: session.name,
    })),
    [sessions]
  )

  const classOptions = useMemo(
    () => classes.map(cls => ({
      value: String(cls.id),
      label: cls.display_name || cls.name,
    })),
    [classes]
  )

  const activeCount = students.filter(student => student.current_enrollment?.id).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Enrollments
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            View student enrollments by session, class, and section.
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>
          New Admission
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Matching Students"
          value={pagination.total || students.length}
          tone="#2563eb"
        />
        <StatCard
          icon={BookOpen}
          label="With Enrollment"
          value={activeCount}
          tone="#059669"
        />
        <StatCard
          icon={BookOpen}
          label="Current Session"
          value={currentSession?.name || '—'}
          tone="#7c3aed"
        />
      </div>

      <div
        className="rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Session"
          value={filters.session_id}
          options={sessionOptions}
          placeholder="All sessions"
          onChange={e => setFilters(prev => ({ ...prev, session_id: e.target.value }))}
        />
        <Select
          label="Class"
          value={filters.class_id}
          options={classOptions}
          placeholder="All classes"
          onChange={e => setFilters(prev => ({
            ...prev,
            class_id: e.target.value,
            section_id: '',
          }))}
        />
        <Select
          label="Section"
          value={filters.section_id}
          options={sections}
          placeholder={filters.class_id ? (loadingSections ? 'Loading sections…' : 'All sections') : 'Select class first'}
          disabled={!filters.class_id || loadingSections}
          onChange={e => setFilters(prev => ({ ...prev, section_id: e.target.value }))}
        />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {isLoading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No enrollments found"
            description="Try a different session, class, or section filter."
            className="border-0 rounded-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Student', 'Admission No', 'Class', 'Section', 'Session', 'Joined', 'Status'].map(header => (
                    <th
                      key={header}
                      className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const enrollment = student.current_enrollment
                  return (
                    <tr
                      key={student.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: index < students.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                      onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}`)}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            DOB {formatDate(student.date_of_birth)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                        {student.admission_no}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {enrollment?.class || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {enrollment?.section ? `Section ${enrollment.section}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {enrollment?.session || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {enrollment?.joined_date ? formatDate(enrollment.joined_date) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={enrollment?.status === 'active' ? 'green' : enrollment?.id ? 'grey' : 'grey'} dot>
                          {enrollment?.status === 'active' ? 'Active' : enrollment?.id ? 'Inactive' : 'Not enrolled'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div
    className="rounded-2xl p-5 flex items-start gap-4"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${tone}18`, color: tone }}
    >
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="text-xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
    </div>
  </div>
)

export default EnrollmentsPage
