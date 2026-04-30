// src/pages/students/StudentsPage.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Users, ChevronRight,
  ChevronLeft, Filter, X
} from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import useSessionStore from '@/store/sessionStore'
import useClasses from '@/hooks/useClasses'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, getInitials, debounce } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import useAuth from '@/hooks/useAuth'

const GENDER_BADGE = {
  male   : { label: 'Male',   variant: 'blue'  },
  female : { label: 'Female', variant: 'green' },
  other  : { label: 'Other',  variant: 'grey'  },
}

const formatStream = (stream) => {
  if (!stream) return null
  return stream.charAt(0).toUpperCase() + stream.slice(1)
}

const StudentsPage = () => {
  usePageTitle('Students')
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { isAdmin } = useAuth()
  const { students, pagination, isLoading, fetchStudents } = useStudentStore()
  const { classes, fetchClasses } = useClasses()
  const { currentSession } = useSessionStore()

  const [search,  setSearch]  = useState('')
  const [filters, setFilters] = useState({ class_id: '', section_id: '' })
  const [page,    setPage]    = useState(1)

  // Debounced search fetch
  const doFetch = useCallback(
    debounce((q, f, p) => {
      fetchStudents({ search: q, ...f, page: p, perPage: 20 })
        .catch(() => toastError('Failed to load students'))
    }, 350),
    []
  )

  useEffect(() => {
    if (!currentSession?.id) return
    doFetch(search, { ...filters, session_id: String(currentSession.id) }, page)
  }, [search, filters, page, currentSession?.id])
  useEffect(() => {
    fetchClasses().catch(() => toastError('Failed to load classes'))
  }, [fetchClasses, toastError])

  const clearFilters = () => {
    setSearch('')
    setFilters({ class_id: '', section_id: '' })
    setPage(1)
  }

  const hasActiveFilters = search || filters.class_id || filters.section_id

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Students
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {pagination.total > 0
              ? `${pagination.total} students enrolled in ${currentSession?.name || 'the current session'}`
              : 'Manage current-session student admissions and profiles'}
          </p>
        </div>
        {isAdmin && (
          <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>
            Admit New Student
          </Button>
        )}
      </div>

      {/* ── Search + filters ────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search current-session students by name or admission number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--color-bg)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
            onBlur={e   => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>

        <select
          value={filters.class_id}
          onChange={e => {
            setFilters(f => ({ ...f, class_id: e.target.value }))
            setPage(1)
          }}
          className="px-4 py-2 rounded-xl text-sm outline-none min-w-[180px]"
          style={{ backgroundColor: 'var(--color-bg)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        >
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.display_name || cls.name}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {isLoading ? (
          <TableSkeleton />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasActiveFilters ? 'No students match' : 'No students yet'}
            description={hasActiveFilters ? 'Try adjusting your search.' : 'Admit your first student to get started.'}
            action={!hasActiveFilters && isAdmin && (
              <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>Admit New Student</Button>
            )}
            className="border-0 rounded-none"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Student', 'Admission No', 'Date of Birth', 'Gender', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, i) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      isLast={i === students.length - 1}
                      onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {students.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary" size="sm" icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => setPage(p => p - 1)}
            />
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const p = pagination.page <= 3
                ? i + 1
                : pagination.page + i - 2
              if (p < 1 || p > pagination.totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: p === pagination.page ? 'var(--color-brand)' : 'var(--color-surface)',
                    color          : p === pagination.page ? '#fff' : 'var(--color-text-secondary)',
                    border         : '1px solid var(--color-border)',
                  }}
                >
                  {p}
                </button>
              )
            })}
            <Button
              variant="secondary" size="sm" icon={ChevronRight}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const AvatarCircle = ({ name, size = 36 }) => (
  <div
    className="rounded-full flex items-center justify-center shrink-0 font-semibold text-white text-xs"
    style={{ width: size, height: size, backgroundColor: 'var(--color-brand)' }}
  >
    {getInitials(name)}
  </div>
)

const StudentRow = ({ student, isLast, onClick }) => {
  const gCfg = GENDER_BADGE[student.gender] || { label: student.gender, variant: 'grey' }
  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <AvatarCircle name={`${student.first_name} ${student.last_name}`} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {student.first_name} {student.last_name}
            </p>
            {student.current_enrollment && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {[
                  `Class ${student.current_enrollment.class}`,
                  student.current_enrollment.stream ? `${formatStream(student.current_enrollment.stream)} Stream` : null,
                  `Section ${student.current_enrollment.section}`,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
        {student.admission_no}
      </td>
      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {formatDate(student.date_of_birth)}
      </td>
      <td className="px-5 py-3.5">
        <Badge variant={gCfg.variant}>{gCfg.label}</Badge>
      </td>
      <td className="px-5 py-3.5">
        <Badge variant={student.is_deleted ? 'grey' : 'green'} dot>
          {student.is_deleted ? 'Inactive' : 'Active'}
        </Badge>
      </td>
      <td className="px-5 py-3.5">
        <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
      </td>
    </tr>
  )
}

const StudentCard = ({ student, onClick }) => (
  <div
    className="p-4 flex items-center gap-4 cursor-pointer"
    onClick={onClick}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    <AvatarCircle name={`${student.first_name} ${student.last_name}`} size={40} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {student.first_name} {student.last_name}
      </p>
      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
        {student.admission_no}
      </p>
      {student.current_enrollment && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {[
            `Class ${student.current_enrollment.class}`,
            student.current_enrollment.stream ? `${formatStream(student.current_enrollment.stream)} Stream` : null,
            `Section ${student.current_enrollment.section}`,
          ].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
  </div>
)

const TableSkeleton = () => (
  <div className="p-5 space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        {[120, 100, 90, 70, 70].map((w, j) => (
          <div key={j} className="h-4 rounded animate-pulse" style={{ width: w, backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    ))}
  </div>
)

export default StudentsPage
