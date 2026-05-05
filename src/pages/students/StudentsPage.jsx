// src/pages/students/StudentsPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Users, ChevronRight,
  ChevronLeft, X, LayoutGrid, LayoutList,
  MoreVertical, Eye, Pencil, Trash2,
  Filter, Download, ExternalLink
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

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDER_BADGE = {
  male   : { label: 'Male',   variant: 'blue'  },
  female : { label: 'Female', variant: 'green' },
  other  : { label: 'Other',  variant: 'grey'  },
}

const formatStream = (stream) => {
  if (!stream) return null
  const label = stream.charAt(0).toUpperCase() + stream.slice(1)
  return stream === 'regular' ? label : `${label} Stream`
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
const AvatarCircle = ({ name, size = "h-9 w-9", fontSize = "text-xs" }) => {
  const initials = getInitials(name)
  return (
    <div className={`${size} rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center ${fontSize} font-bold text-indigo-600 dark:text-indigo-400 shrink-0`}>
      {initials}
    </div>
  )
}

// ─── Three-dot dropdown menu ──────────────────────────────────────────────────
const CardMenu = ({ onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items = [
    { icon: ExternalLink, label: 'Full Profile', action: onView },
    { icon: Pencil, label: 'Edit Profile',  action: onEdit },
    { icon: Trash2, label: 'Delete Student', action: onDelete, danger: true },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${open ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute top-10 right-0 z-50 min-w-[180px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-1 animate-in fade-in slide-in-from-top-2">
          {items.map(({ icon: Icon, label, action, danger }) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); setOpen(false); action?.() }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <Icon size={14} className={danger ? 'text-red-500' : 'text-gray-400'} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
const StudentGridCard = ({ student, onView, onEdit, onDelete }) => {
  const fullName = `${student.first_name} ${student.last_name}`
  const enrollment = student.current_enrollment
  const gCfg = GENDER_BADGE[student.gender] || { label: student.gender, variant: 'grey' }

  const classLabel = enrollment
    ? [enrollment.class, formatStream(enrollment.stream)].filter(Boolean).join(', ')
    : 'Not Enrolled'

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50">
        <span 
          onClick={onView}
          className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded"
        >
          {student.admission_no}
        </span>
        <CardMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Profile Info */}
      <div className="p-5 flex flex-col items-center text-center flex-1" onClick={onView} style={{ cursor: 'pointer' }}>
        <div className="mb-4 relative">
          <AvatarCircle name={fullName} size="h-16 w-16" fontSize="text-lg" />
          {!student.is_deleted && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
          )}
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">{fullName}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">{classLabel}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 w-full gap-2 border-t border-gray-50 dark:border-gray-700/50 pt-4 mt-auto">
          <div className="text-left">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Roll No</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{enrollment?.roll_number || '--'}</p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Gender</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{gCfg.label}</p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between gap-2">
        <button 
          onClick={onView}
          className="flex-1 text-xs font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────
const StudentTableRow = ({ student, onView }) => {
  const fullName = `${student.first_name} ${student.last_name}`
  const enrollment = student.current_enrollment
  const gCfg = GENDER_BADGE[student.gender] || { label: student.gender, variant: 'grey' }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <AvatarCircle name={fullName} />
          <div className="min-w-0">
            <p 
              onClick={onView}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              {fullName}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {enrollment ? `${enrollment.class} · ${enrollment.section || '-'}` : 'Not Enrolled'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded">
          {student.admission_no}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(student.date_of_birth)}</span>
      </td>
      <td className="px-6 py-4">
        <Badge variant={gCfg.variant}>{gCfg.label}</Badge>
      </td>
      <td className="px-6 py-4">
        <Badge variant={student.is_deleted ? 'grey' : 'green'} dot>
          {student.is_deleted ? 'Inactive' : 'Active'}
        </Badge>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onView}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────
const StudentsPage = () => {
  usePageTitle('Students')
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { isAdmin } = useAuth()
  const { students, pagination, isLoading, fetchStudents } = useStudentStore()
  const { classes, fetchClasses } = useClasses()
  const { currentSession } = useSessionStore()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ class_id: '', section_id: '' })
  const [page, setPage] = useState(1)
  const [view, setView] = useState('grid')

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
  }, [search, filters, page, currentSession?.id, doFetch])

  useEffect(() => {
    fetchClasses().catch(() => toastError('Failed to load classes'))
  }, [fetchClasses, toastError])

  const clearFilters = () => {
    setSearch('')
    setFilters({ class_id: '', section_id: '' })
    setPage(1)
  }

  const hasActiveFilters = search || filters.class_id || filters.section_id

  const goToDetail = (id) => navigate(`${ROUTES.STUDENTS}/${id}`)
  const goToEdit   = (id) => navigate(`${ROUTES.STUDENTS}/${id}?tab=profile`)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            Students
            {pagination.total > 0 && (
              <span className="text-xs font-medium bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                {pagination.total} Total
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Managing enrollment for <span className="font-semibold text-gray-700 dark:text-gray-300">{currentSession?.name || 'current session'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutList size={18} />
            </button>
          </div>

          {isAdmin && (
            <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>
              Admit Student
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or admission number…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <select
              value={filters.class_id}
              onChange={e => { setFilters(f => ({ ...f, class_id: e.target.value })); setPage(1) }}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.display_name || cls.name}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className={`animate-pulse bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl ${view === 'grid' ? 'h-64' : 'h-16'}`} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasActiveFilters ? "No students found" : "No students yet"}
            description={hasActiveFilters ? "Try adjusting your search or filters." : "Start by admitting your first student."}
            action={!hasActiveFilters && isAdmin && (
              <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>Admit Student</Button>
            )}
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map(student => (
              <StudentGridCard
                key={student.id}
                student={student}
                onView={() => goToDetail(student.id)}
                onEdit={() => goToEdit(student.id)}
                onDelete={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    {['Student', 'Admission No', 'Date of Birth', 'Gender', 'Status', ''].map(h => (
                      <th key={h} className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {students.map(student => (
                    <StudentTableRow
                      key={student.id}
                      student={student}
                      onView={() => goToDetail(student.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500">
            Showing <span className="text-gray-900 dark:text-gray-100">{students.length}</span> of <span className="text-gray-900 dark:text-gray-100">{pagination.total}</span> students
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = pagination.page <= 3 ? i + 1 : pagination.page + i - 2
                if (p < 1 || p > pagination.totalPages) return null
                const active = p === pagination.page
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsPage
