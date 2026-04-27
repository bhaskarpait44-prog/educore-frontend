// src/pages/exams/EnterMarksPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'
import useExamStore from '@/store/examStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { getClasses, getClassOptions, getSections } from '@/api/classApi'
import { getSessionReport } from '@/api/attendance'
import { cn, debounce } from '@/utils/helpers'

const EnterMarksPage = () => {
  const { toastSuccess, toastError } = useToast()
  const { exams, subjects, isSaving, fetchExams, fetchExamSubjects, enterMarks } = useExamStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [sessionId,  setSessionId]  = useState('')
  const [examId,     setExamId]     = useState('')
  const [classId,    setClassId]    = useState('')
  const [sectionId,  setSectionId]  = useState('')
  const [classes,    setClasses]    = useState([])
  const [sections,   setSections]   = useState([])
  const [students,   setStudents]   = useState([])
  const [marks,      setMarks]      = useState({})   // { `${enrollmentId}-${subjectId}`: { marks, isAbsent } }
  const [saved,      setSaved]      = useState({})   // cells that have been auto-saved
  const [loading,    setLoading]    = useState(false)

  const autoSaveTimers = useRef({})

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession])

  useEffect(() => {
    if (!sessionId) return
    fetchExams({ session_id: sessionId }).catch(() => {})
  }, [sessionId])

  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return }
    getSections(classId)
      .then(r => setSections((r.data || []).map(s => ({ value: String(s.id), label: `Section ${s.name}` }))))
      .catch(() => {})
  }, [classId])

  useEffect(() => {
    if (!examId) return
    fetchExamSubjects(examId).catch(() => {})
  }, [examId, fetchExamSubjects])

  // Load students when exam + class + section selected
  useEffect(() => {
    if (!examId || !classId || !sectionId || !sessionId) { setStudents([]); return }
    setLoading(true)
    getSessionReport(sessionId, { class_id: classId, section_id: sectionId })
      .then(r => {
        const rows = r.data || []
        setStudents(rows)
        // Pre-populate marks if editing
        const init = {}
        rows.forEach(s => {
          subjects.forEach(sub => {
            const key = `${s.enrollment_id}-${sub.id}`
            init[key] = { marks: '', isAbsent: false }
          })
        })
        setMarks(init)
      })
      .catch(() => toastError('Failed to load students'))
      .finally(() => setLoading(false))
  }, [examId, classId, sectionId, subjects])

  // Auto-save a single student's results for one subject
  const autoSaveCell = useCallback(
    debounce(async (enrollmentId, examId) => {
      if (!examId) return
      const studentResults = subjects
        .map(sub => {
          const key  = `${enrollmentId}-${sub.id}`
          const cell = marks[key]
          if (!cell) return null
          return {
            subject_id    : sub.id,
            marks_obtained: cell.isAbsent ? null : parseFloat(cell.marks || 0),
            is_absent     : cell.isAbsent,
          }
        })
        .filter(Boolean)

      if (studentResults.length === 0) return

      const res = await enterMarks({
        exam_id      : parseInt(examId),
        enrollment_id: enrollmentId,
        results      : studentResults,
      })

      if (res.success) {
        setSaved(prev => ({ ...prev, [enrollmentId]: true }))
        setTimeout(() => setSaved(prev => { const n = {...prev}; delete n[enrollmentId]; return n }), 2000)
      }
    }, 1500),
    [marks, subjects, examId]
  )

  const updateCell = (enrollmentId, subjectId, field, value) => {
    const key = `${enrollmentId}-${subjectId}`
    setMarks(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
    // Clear any existing auto-save timer for this enrollment
    if (autoSaveTimers.current[enrollmentId]) {
      clearTimeout(autoSaveTimers.current[enrollmentId])
    }
    autoSaveTimers.current[enrollmentId] = setTimeout(() => {
      autoSaveCell(enrollmentId, examId)
    }, 1200)
  }

  const handleSubmitAll = async () => {
    let successCount = 0
    for (const student of students) {
      const results = subjects.map(sub => {
        const key  = `${student.enrollment_id}-${sub.id}`
        const cell = marks[key] || { marks: '', isAbsent: false }
        return {
          subject_id    : sub.id,
          marks_obtained: cell.isAbsent ? null : parseFloat(cell.marks || 0),
          is_absent     : cell.isAbsent,
        }
      })

      const res = await enterMarks({
        exam_id      : parseInt(examId),
        enrollment_id: student.enrollment_id,
        results,
      })
      if (res.success) successCount++
    }
    if (successCount > 0) toastSuccess(`Marks saved for ${successCount} students`)
    else toastError('Failed to save marks')
  }

  // Tab key navigation between mark cells
  const handleKeyDown = (e, rowIdx, colIdx) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const totalCols = subjects.length
      const totalRows = students.length
      let nextRow = rowIdx, nextCol = colIdx + 1
      if (nextCol >= totalCols) { nextCol = 0; nextRow++ }
      if (nextRow >= totalRows) { nextRow = 0 }
      const nextId = `cell-${nextRow}-${nextCol}`
      document.getElementById(nextId)?.focus()
    }
  }

  const getCellColor = (value, passingMarks, isAbsent) => {
    if (isAbsent) return { border: '#94a3b8', bg: '#f1f5f9' }
    if (!value) return { border: 'var(--color-border)', bg: 'transparent' }
    const num = parseFloat(value)
    if (num < passingMarks) return { border: '#dc2626', bg: '#fef2f2' }
    return { border: '#16a34a', bg: '#f0fdf4' }
  }

  const selectedExam = exams.find(e => String(e.id) === examId)

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
        />
        <Select
          label="Exam"
          value={examId}
          onChange={e => setExamId(e.target.value)}
          options={exams.map(e => ({ value: String(e.id), label: e.name }))}
          placeholder="Select exam"
        />
        <Select
          label="Class"
          value={classId}
          onChange={e => { setClassId(e.target.value); setSectionId('') }}
          options={classes}
          placeholder="Select class"
        />
        <Select
          label="Section"
          value={sectionId}
          onChange={e => setSectionId(e.target.value)}
          options={sections}
          disabled={!classId}
          placeholder="Select section"
        />
      </div>

      {/* Marks grid */}
      {students.length > 0 && subjects.length > 0 && (
        <>
          {/* Submit button */}
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {students.length} students · {subjects.length} subjects
              {selectedExam && ` · Total: ${selectedExam.total_marks} marks`}
            </p>
            <Button icon={Save} onClick={handleSubmitAll} loading={isSaving}>
              Submit All
            </Button>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* Fixed columns */}
                    <th
                      className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase w-8"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' }}
                    >
                      Roll
                    </th>
                    <th
                      className="sticky left-14 z-10 px-4 py-3 text-left text-xs font-semibold uppercase min-w-36"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' }}
                    >
                      Student
                    </th>

                    {/* Subject columns */}
                    {subjects.map(sub => (
                      <th
                        key={sub.id}
                        className="px-2 py-3 text-center min-w-28"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <p className="text-xs font-semibold uppercase">{sub.code || sub.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#dc2626' }}>
                          Pass: {sub.passing_marks}
                        </p>
                      </th>
                    ))}

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase"
                      style={{ color: 'var(--color-text-muted)' }}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student, rowIdx) => (
                    <tr
                      key={student.enrollment_id}
                      style={{ borderBottom: rowIdx < students.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      {/* Roll */}
                      <td
                        className="sticky left-0 z-10 px-4 py-3 text-xs font-mono text-center"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' }}
                      >
                        {student.roll_number || '—'}
                      </td>

                      {/* Name */}
                      <td
                        className="sticky left-14 z-10 px-4 py-3"
                        style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
                      >
                        <p className="text-sm font-medium truncate max-w-32" style={{ color: 'var(--color-text-primary)' }}>
                          {student.student_name}
                        </p>
                      </td>

                      {/* Mark cells per subject */}
                      {subjects.map((sub, colIdx) => {
                        const key      = `${student.enrollment_id}-${sub.id}`
                        const cell     = marks[key] || { marks: '', isAbsent: false }
                        const colors   = getCellColor(cell.marks, sub.passing_marks, cell.isAbsent)

                        return (
                          <td key={sub.id} className="px-2 py-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {/* Marks input */}
                              <input
                                id={`cell-${rowIdx}-${colIdx}`}
                                type="number"
                                min="0"
                                max={sub.total_marks}
                                step="0.5"
                                value={cell.isAbsent ? '' : (cell.marks || '')}
                                disabled={cell.isAbsent}
                                onChange={e => updateCell(student.enrollment_id, sub.id, 'marks', e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                                className="w-20 text-center text-sm rounded-lg outline-none transition-all"
                                style={{
                                  padding        : '6px 4px',
                                  border         : `1.5px solid ${colors.border}`,
                                  backgroundColor: colors.bg,
                                  color          : 'var(--color-text-primary)',
                                  opacity        : cell.isAbsent ? 0.4 : 1,
                                }}
                                placeholder={cell.isAbsent ? 'AB' : '0'}
                              />

                              {/* Absent checkbox */}
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={cell.isAbsent || false}
                                  onChange={e => updateCell(student.enrollment_id, sub.id, 'isAbsent', e.target.checked)}
                                  className="w-3 h-3 accent-slate-500"
                                />
                                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>AB</span>
                              </label>
                            </div>
                          </td>
                        )
                      })}

                      {/* Auto-save indicator */}
                      <td className="px-4 py-3 text-center">
                        {saved[student.enrollment_id] ? (
                          <CheckCircle size={16} style={{ color: '#16a34a', margin: '0 auto' }} />
                        ) : (
                          <div className="w-4 h-4 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div
              className="flex items-center gap-6 px-4 py-3"
              style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              {[
                { color: '#f0fdf4', border: '#16a34a', label: 'Above passing' },
                { color: '#fef2f2', border: '#dc2626', label: 'Below passing' },
                { color: '#f1f5f9', border: '#94a3b8', label: 'Absent'        },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: l.color, border: `1.5px solid ${l.border}` }} />
                  {l.label}
                </span>
              ))}
              <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>
                Tab key moves to next cell
              </span>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {students.length === 0 && !loading && examId && classId && sectionId && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <AlertCircle size={32} className="mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No students found in this section</p>
        </div>
      )}

      {(!examId || !classId || !sectionId) && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Select exam, class and section to start entering marks
          </p>
        </div>
      )}
    </div>
  )
}

export default EnterMarksPage
