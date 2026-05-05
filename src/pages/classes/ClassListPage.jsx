// src/pages/classes/ClassListPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, BookOpen, Users, LayoutGrid, Table2,
  Pencil, Trash2, Eye, ToggleLeft, ToggleRight,
  GraduationCap, AlertCircle, Search, Download,
} from 'lucide-react'
import useClasses from '@/hooks/useClasses'
import usePageTitle from '@/hooks/usePageTitle'
import ClassForm from './components/ClassForm'
import { ROUTES } from '@/constants/app'
import { downloadClassStudentsPdf, getSections } from '@/api/classApi'
import useToast from '@/hooks/useToast'
import useSessionStore from '@/store/sessionStore'

// ── Modal wrapper ─────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, onClose, onConfirm, title, description, loading, confirmLabel = 'Delete', danger = true }) => (
  <Modal open={open} onClose={onClose} title={title}>
    <div className="space-y-4">
      <div className={`flex items-start gap-3 p-4 rounded-xl ${danger ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
        <AlertCircle size={18} className={danger ? 'text-red-500 shrink-0 mt-0.5' : 'text-amber-500 shrink-0 mt-0.5'} />
        <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
          {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          {loading ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
)

// ── Status badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
    ${active
      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
)

// ── Stat card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
)

const OccupancyBar = ({ enrolled, capacity }) => {
  const pct = capacity > 0 ? Math.min((enrolled / capacity) * 100, 100) : 0
  const color = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px] font-medium">
        <span className="text-gray-400 dark:text-gray-500 uppercase">Occupancy</span>
        <span className={`${pct >= 95 ? 'text-red-600' : 'text-gray-500'} tabular-nums`}>
          {enrolled} / {capacity}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`} 
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Class card skeleton ───────────────────────────────────────────────────
const ClassCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
    <div className="flex gap-3 mb-4">
      {[1,2,3].map(i => <div key={i} className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
  </div>
)

// ── Table skeleton ──────────────────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    {[1,2,3,4,5].map(i => (
      <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
    ))}
  </div>
)

const classDetailPath = (id) => ROUTES.CLASS_DETAIL.replace(':id', String(id))

const formatStream = (stream) => {
  if (!stream) return null
  const label = `${stream.charAt(0).toUpperCase()}${stream.slice(1)}`
  return stream === 'regular' ? label : `${label} Stream`
}

// ── Class table row ─────────────────────────────────────────────────────────
const ClassTableRow = ({ cls, onEdit, onDelete, onToggle, onView }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0">
    <td className="px-4 py-3">
      <div>
        <button
          type="button"
          onClick={() => onView(cls.id)}
          className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {cls.name}
        </button>
        {cls.display_name && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{cls.display_name}</div>
        )}
        {cls.stream && (
          <div className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{formatStream(cls.stream)}</div>
        )}
      </div>
    </td>
    <td className="px-4 py-3">
      <span className="text-sm text-gray-600 dark:text-gray-300">#{cls.order_number}</span>
    </td>
    <td className="px-4 py-3">
      <div className="flex flex-col gap-2 min-w-[140px]">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{cls.section_count || 0}</span> sec
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{cls.subject_count || 0}</span> sub
          </span>
        </div>
        <OccupancyBar enrolled={cls.student_count || 0} capacity={cls.total_capacity || 0} />
      </div>
    </td>
    <td className="px-4 py-3">
      {(cls.min_age || cls.max_age) ? (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {cls.min_age && cls.max_age ? `${cls.min_age}–${cls.max_age} yrs` : cls.min_age ? `${cls.min_age}+ yrs` : `Up to ${cls.max_age} yrs`}
        </span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
      )}
    </td>
    <td className="px-4 py-3">
      <StatusBadge active={cls.is_active} />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onView(cls.id)}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => onEdit(cls)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onToggle(cls)}
          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
          title={cls.is_active ? 'Deactivate' : 'Activate'}
        >
          {cls.is_active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
        </button>
        <button
          onClick={() => onDelete(cls)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </td>
  </tr>
)

// ── Class card ────────────────────────────────────────────────────────────
const ClassCard = ({ cls, onEdit, onDelete, onToggle, onView }) => {
  const miniStat = (value, label) => (
    <div className="flex-1 text-center">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value || 0}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all hover:shadow-md
      ${cls.is_active
        ? 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
        : 'border-gray-200 dark:border-gray-700 opacity-75'
      }`}>

      {/* Card header */}
      <button type="button" onClick={() => onView(cls.id)} className="block w-full p-5 pb-3 text-left">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{cls.name}</h3>
            {cls.display_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{cls.display_name}</p>
            )}
            {cls.stream && (
              <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{formatStream(cls.stream)}</p>
            )}
          </div>
          <StatusBadge active={cls.is_active} />
        </div>
      </button>

      {/* Mini stats */}
      <div className="mx-5 mb-3 flex divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-700/40 rounded-xl py-3">
        {miniStat(cls.section_count, 'Sections')}
        {miniStat(cls.subject_count, 'Subjects')}
      </div>

      <div className="mx-5 mb-4">
        <OccupancyBar enrolled={cls.student_count || 0} capacity={cls.total_capacity || 0} />
      </div>

      {/* Tags */}
      <div className="px-5 pb-4 flex flex-wrap gap-2">
        {(cls.min_age || cls.max_age) && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            {cls.min_age && cls.max_age ? `${cls.min_age}–${cls.max_age} yrs` : cls.min_age ? `${cls.min_age}+ yrs` : `Up to ${cls.max_age} yrs`}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
          Order #{cls.order_number}
        </span>
        {cls.stream && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            {formatStream(cls.stream)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => onView(cls.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
        >
          <Eye size={13} /> View Details
        </button>
        <button
          onClick={() => onEdit(cls)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onToggle(cls)}
          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
          title={cls.is_active ? 'Deactivate' : 'Activate'}
        >
          {cls.is_active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
        </button>
        <button
          onClick={() => onDelete(cls)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
const ClassListPage = () => {
  usePageTitle('Class Management')
  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()
  const { currentSession, fetchCurrentSession } = useSessionStore()

  const {
    classes, stats, isLoading, isSaving,
    fetchClasses, createClass, updateClass, deleteClass, toggleClassStatus,
  } = useClasses()

  // View and search states
  const [viewMode, setViewMode] = useState('table') // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [createModal, setCreateModal] = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [deleteTarget,setDeleteTarget]= useState(null)
  const [toggleTarget,setToggleTarget]= useState(null)
  const [downloadModal,setDownloadModal]=useState(false)
  const [downloadClassId,setDownloadClassId]=useState('')
  const [downloadSectionId,setDownloadSectionId]=useState('')
  const [downloadSections,setDownloadSections]=useState([])
  const [sectionsLoading,setSectionsLoading]=useState(false)
  const [downloadingPdf,setDownloadingPdf]=useState(false)

  useEffect(() => { fetchClasses() }, [])
  useEffect(() => {
    if (!currentSession?.id) fetchCurrentSession?.().catch(() => {})
  }, [currentSession?.id, fetchCurrentSession])
  useEffect(() => {
    if (!downloadClassId) {
      setDownloadSections([])
      setDownloadSectionId('')
      return
    }

    const loadSections = async () => {
      setSectionsLoading(true)
      try {
        const res = await getSections(downloadClassId)
        setDownloadSections(res?.data || [])
      } catch (err) {
        toastError(err.message || 'Failed to load sections')
        setDownloadSections([])
      } finally {
        setSectionsLoading(false)
      }
    }

    loadSections()
  }, [downloadClassId, toastError])

  // Filter classes based on search
  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cls.display_name && cls.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreate = async (data) => {
    const result = await createClass(data)
    if (result.success) setCreateModal(false)
  }

  const handleUpdate = async (data) => {
    const result = await updateClass(editTarget.id, data)
    if (result.success) setEditTarget(null)
  }

  const handleDelete = async () => {
    const result = await deleteClass(deleteTarget.id, 'Deleted from class management', { force: true })
    if (result.success) setDeleteTarget(null)
  }

  const handleToggle = async () => {
    await toggleClassStatus(toggleTarget.id)
    setToggleTarget(null)
  }

  const handleDownloadPdf = async () => {
    if (!downloadClassId) {
      toastError('Select a class first.')
      return
    }
    if (!currentSession?.id) {
      toastError('No active session found.')
      return
    }

    setDownloadingPdf(true)
    try {
      const response = await downloadClassStudentsPdf(downloadClassId, {
        session_id: currentSession.id,
        ...(downloadSectionId ? { section_id: downloadSectionId } : {}),
      })
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const className = classes.find((cls) => String(cls.id) === String(downloadClassId))?.name || 'class'
      link.href = url
      link.download = `${className.replace(/[^a-z0-9-_]+/gi, '-')}-students.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 5000)
      setDownloadModal(false)
      toastSuccess('Class PDF downloaded successfully.')
    } catch (err) {
      toastError(err.message || 'Failed to download class PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Class Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage classes, sections and subjects
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Table2 size={16} /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <LayoutGrid size={16} /> Grid
            </button>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add New Class
          </button>
          <button
            onClick={() => setDownloadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-gray-100"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total Classes"   value={stats?.total_classes}   color="bg-indigo-500" />
        <StatCard icon={LayoutGrid}    label="Total Sections"  value={stats?.total_sections}  color="bg-sky-500"    />
        <StatCard icon={BookOpen}      label="Total Subjects"  value={stats?.total_subjects}  color="bg-violet-500" />
        <StatCard icon={Users}         label="Active Students" value={stats?.total_students}  color="bg-emerald-500"/>
      </div>

      {/* ── Class display ───────────────────────────────────────────── */}
      {isLoading ? (
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <TableSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <ClassCardSkeleton key={i}/>)}
          </div>
        )
      ) : filteredClasses.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
            <GraduationCap size={28} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {searchTerm ? 'No classes found' : 'No classes added yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Start by adding your first class. Then add sections and subjects to it.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={15}/> Add your first class
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Counts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age Range</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredClasses.map(cls => (
                  <ClassTableRow
                    key={cls.id}
                    cls={cls}
                    onView={(id) => navigate(classDetailPath(id))}
                    onEdit={(cls) => setEditTarget(cls)}
                    onDelete={(cls) => setDeleteTarget(cls)}
                    onToggle={(cls) => setToggleTarget(cls)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map(cls => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onView={(id) => navigate(classDetailPath(id))}
              onEdit={(cls) => setEditTarget(cls)}
              onDelete={(cls) => setDeleteTarget(cls)}
              onToggle={(cls) => setToggleTarget(cls)}
            />
          ))}
        </div>
      )}

      {/* ── Create modal ──────────────────────────────────────────────── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Add New Class">
        <ClassForm onSubmit={handleCreate} onCancel={() => setCreateModal(false)} isSaving={isSaving} />
      </Modal>

      <Modal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Class Student PDF">
        <div className="space-y-4">
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 p-3 text-sm text-gray-700 dark:text-gray-300">
            Download using filters. Current session: <span className="font-semibold">{currentSession?.name || 'Not loaded'}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Class</label>
            <select
              value={downloadClassId}
              onChange={(e) => {
                setDownloadClassId(e.target.value)
                setDownloadSectionId('')
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Section</label>
            <select
              value={downloadSectionId}
              onChange={(e) => setDownloadSectionId(e.target.value)}
              disabled={!downloadClassId || sectionsLoading}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">{sectionsLoading ? 'Loading sections...' : 'All sections'}</option>
              {downloadSections.map((section) => (
                <option key={section.id} value={section.id}>Section {section.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDownloadModal(false)}
              disabled={downloadingPdf}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!downloadClassId || downloadingPdf || !currentSession?.id}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              <Download size={14} />
              {downloadingPdf ? 'Preparing PDF...' : 'Download'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit modal ────────────────────────────────────────────────── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Class">
        {editTarget && (
          <ClassForm
            defaultValues={editTarget}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            isSaving={isSaving}
            isEdit
          />
        )}
      </Modal>

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        description={`Delete "${deleteTarget?.name}"? This will soft-delete the class, sections, and subjects. If students are currently enrolled, their active enrollments will be closed as withdrawn.`}
        loading={isSaving}
        confirmLabel="Delete Class"
      />

      {/* ── Toggle active confirm ──────────────────────────────────────── */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.is_active ? 'Deactivate Class' : 'Activate Class'}
        description={toggleTarget?.is_active
          ? `Deactivating "${toggleTarget?.name}" will prevent new enrollments. Existing students will not be affected.`
          : `Activating "${toggleTarget?.name}" will allow new enrollments.`}
        loading={isSaving}
        confirmLabel={toggleTarget?.is_active ? 'Deactivate' : 'Activate'}
        danger={toggleTarget?.is_active}
      />
    </div>
  )
}

export default ClassListPage
