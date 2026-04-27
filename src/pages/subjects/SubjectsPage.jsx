// src/pages/subjects/SubjectsPage.jsx
import { useEffect, useState } from 'react'
import { BookOpen, AlertCircle, ArrowLeft } from 'lucide-react'
import * as subjectApi from '@/api/subjectApi'
import * as classApi from '@/api/classApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'

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

// ── Type badge ────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const config = {
    theory: { label: 'Theory', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    practical: { label: 'Practical', class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    both: { label: 'Theory + Practical', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  }
  const cfg = config[type] || config.theory
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.class}`}>
      {cfg.label}
    </span>
  )
}

// ── Core badge ────────────────────────────────────────────────────────────
const CoreBadge = ({ isCore }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
    ${isCore ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
    {isCore ? 'Core' : 'Optional'}
  </span>
)


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

// ── Class card ────────────────────────────────────────────────────────────
const ClassCard = ({ cls, onClick }) => {
  const miniStat = (value, label) => (
    <div className="flex-1 text-center">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value || 0}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )

  return (
    <div
      onClick={() => onClick(cls.id)}
      className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all hover:shadow-lg cursor-pointer
        ${cls.is_active
          ? 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
          : 'border-gray-200 dark:border-gray-700 opacity-75'
        }`}>
      {/* Card header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{cls.name}</h3>
            {cls.display_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{cls.display_name}</p>
            )}
          </div>
          <StatusBadge active={cls.is_active} />
        </div>
      </div>

      {/* Mini stats */}
      <div className="mx-5 mb-3 flex divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-700/40 rounded-xl py-3">
        {miniStat(cls.section_count, 'Sections')}
        {miniStat(cls.subject_count, 'Subjects')}
        {miniStat(cls.student_count, 'Students')}
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
      </div>

      {/* Click hint */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
          <BookOpen size={13} /> Click to view subjects
        </div>
      </div>
    </div>
  )
}

// ── Subject table row ──────────────────────────────────────────────────────
const SubjectTableRow = ({ subject }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0">
    <td className="px-4 py-3">
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</div>
        {subject.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
            {subject.description}
          </div>
        )}
      </div>
    </td>
    <td className="px-4 py-3">
      <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{subject.code}</span>
    </td>
    <td className="px-4 py-3">
      <TypeBadge type={subject.subject_type} />
    </td>
    <td className="px-4 py-3">
      <CoreBadge isCore={subject.is_core} />
    </td>
    <td className="px-4 py-3">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {subject.combined_total_marks}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          (Pass: {subject.combined_passing_marks})
        </span>
      </div>
    </td>
    <td className="px-4 py-3">
      <StatusBadge active={subject.is_active} />
    </td>
  </tr>
)

// ── Main Page ─────────────────────────────────────────────────────────────
const SubjectsPage = () => {
  usePageTitle('Subjects')
  const { toastError } = useToast()

  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClass?.id) {
      fetchSubjectsForClass(selectedClass.id)
    }
  }, [selectedClass])

  const fetchClasses = async () => {
    setIsLoading(true)
    try {
      const res = await classApi.getClasses()
      console.log('Classes API response:', res)
      // API returns { success: true, data: { classes, stats }, ... }
      const classesData = res?.data?.classes || []
      console.log('Classes data:', classesData)
      setClasses(classesData)
    } catch (err) {
      console.error('Error fetching classes:', err)
      toastError(err.message || 'Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubjectsForClass = async (classId) => {
    if (!classId) {
      console.warn('fetchSubjectsForClass called with invalid classId:', classId)
      return
    }
    try {
      console.log('Fetching subjects for class:', classId)
      const res = await subjectApi.getSubjects(classId)
      console.log('Subjects API response:', res)
      // API returns { success: true, data: [...], message, errors: [] }
      const subjectsArray = Array.isArray(res?.data) ? res.data : []
      console.log('Subjects array:', subjectsArray)
      setSubjects(subjectsArray)
    } catch (err) {
      console.error('Error fetching subjects:', err)
      toastError(err.message || 'Failed to load subjects')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleClassClick = (classId) => {
    if (!classId) return
    const cls = classes.find(c => String(c.id) === String(classId))
    setSelectedClass(cls || { id: classId, name: classId })
    setSearchTerm('')
  }

  const handleBackToClasses = () => {
    setSelectedClass(null)
    setSubjects([])
    setSearchTerm('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {selectedClass ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToClasses}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedClass.name} - Subjects
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedClass.display_name || 'Class subjects'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subjects</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select a class to view its subjects
              </p>
            </div>
          )}
        </div>
      </div>

      {!selectedClass ? (
        /* ── Class Grid View ───────────────────────────────────────── */
        <>
          {/* Classes Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => <ClassCardSkeleton key={i}/>)}
                </div>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  No classes available
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Classes will appear here once created
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls) => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      onClick={handleClassClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Click on a class card</p>
              <p className="text-blue-600 dark:text-blue-400">
                Select any class above to view and manage its subjects. To create, edit, or delete subjects, use the class detail page.
              </p>
            </div>
          </div>
        </>
      ) : (
        /* ── Subject List View ─────────────────────────────────────── */
        <>
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-gray-100"
              />
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {searchTerm ? 'No subjects found matching your search' : 'No subjects for this class'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Subjects will appear here once created'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredSubjects.map((subject) => (
                      <SubjectTableRow key={subject.id} subject={subject} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default SubjectsPage
