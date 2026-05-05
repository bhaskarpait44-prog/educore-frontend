// src/pages/exams/EnterMarksPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, CheckCircle, AlertCircle, ChevronDown, Users, BookOpen, FileSpreadsheet } from 'lucide-react'
import BulkUploadModal from './BulkUploadModal'
import useExamStore from '@/store/examStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import { getClasses, getClassOptions, getSections } from '@/api/classApi'
import { getSessionReport } from '@/api/attendance'
import { cn, debounce } from '@/utils/helpers'

// ─── Mini Select ────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options = [], disabled, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          appearance: 'none',
          padding: '8px 32px 8px 12px',
          fontSize: 13,
          fontWeight: 500,
          borderRadius: 10,
          border: '1.5px solid var(--color-border)',
          backgroundColor: disabled ? 'var(--color-surface-raised)' : 'var(--color-surface)',
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={13}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)', pointerEvents: 'none',
        }}
      />
    </div>
  </div>
)

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ passed, failed, absent }) => {
  if (absent) return (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 99, backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
      ABSENT
    </span>
  )
  if (!passed && !failed) return null
  return passed ? (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 99, backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
      PASS
    </span>
  ) : (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 99, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
      FAIL
    </span>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
const EnterMarksPage = () => {
  const { toastSuccess, toastError } = useToast()
  const { exams, subjects, isSaving, fetchExams, fetchExamSubjects, enterMarks } = useExamStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [sessionId, setSessionId] = useState('')
  const [examId, setExamId] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [saved, setSaved] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const autoSaveTimers = useRef({})

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses().then(r => setClasses(getClassOptions(r))).catch(() => {})
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

  useEffect(() => {
    if (!examId || !classId || !sectionId || !sessionId) { setStudents([]); return }
    setLoading(true)
    getSessionReport(sessionId, { class_id: classId, section_id: sectionId })
      .then(r => {
        const rows = r.data || []
        setStudents(rows)
        const init = {}
        rows.forEach(s => {
          subjects.forEach(sub => {
            init[`${s.enrollment_id}-${sub.id}`] = { marks: '', isAbsent: false }
          })
        })
        setMarks(init)
      })
      .catch(() => toastError('Failed to load students'))
      .finally(() => setLoading(false))
  }, [examId, classId, sectionId, subjects])

  const autoSaveCell = useCallback(
    debounce(async (enrollmentId, examId) => {
      if (!examId) return
      const studentResults = subjects
        .map(sub => {
          const cell = marks[`${enrollmentId}-${sub.id}`]
          if (!cell) return null
          return { subject_id: sub.id, marks_obtained: cell.isAbsent ? null : parseFloat(cell.marks || 0), is_absent: cell.isAbsent }
        })
        .filter(Boolean)
      if (!studentResults.length) return
      const res = await enterMarks({ exam_id: parseInt(examId), enrollment_id: enrollmentId, results: studentResults })
      if (res.success) {
        setSaved(prev => ({ ...prev, [enrollmentId]: true }))
        setTimeout(() => setSaved(prev => { const n = { ...prev }; delete n[enrollmentId]; return n }), 2000)
      }
    }, 1500),
    [marks, subjects, examId]
  )

  const updateCell = (enrollmentId, subjectId, field, value) => {
    setMarks(prev => ({ ...prev, [`${enrollmentId}-${subjectId}`]: { ...prev[`${enrollmentId}-${subjectId}`], [field]: value } }))
    clearTimeout(autoSaveTimers.current[enrollmentId])
    autoSaveTimers.current[enrollmentId] = setTimeout(() => autoSaveCell(enrollmentId, examId), 1200)
  }

  const handleSubmitAll = async () => {
    setSubmitting(true)
    let ok = 0
    for (const student of students) {
      const res = await enterMarks({
        exam_id: parseInt(examId),
        enrollment_id: student.enrollment_id,
        results: subjects.map(sub => {
          const cell = marks[`${student.enrollment_id}-${sub.id}`] || { marks: '', isAbsent: false }
          return { subject_id: sub.id, marks_obtained: cell.isAbsent ? null : parseFloat(cell.marks || 0), is_absent: cell.isAbsent }
        }),
      })
      if (res.success) ok++
    }
    setSubmitting(false)
    ok > 0 ? toastSuccess(`Marks saved for ${ok} students`) : toastError('Failed to save marks')
  }

  const handleKeyDown = (e, rowIdx, colIdx) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      let nr = rowIdx, nc = colIdx + 1
      if (nc >= subjects.length) { nc = 0; nr++ }
      if (nr >= students.length) nr = 0
      document.getElementById(`cell-${nr}-${nc}`)?.focus()
    }
  }

  const getInputStyle = (value, passingMarks, isAbsent) => {
    if (isAbsent) return { borderColor: '#cbd5e1', background: '#f8fafc', color: '#94a3b8' }
    if (!value && value !== 0) return { borderColor: 'var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)' }
    const num = parseFloat(value)
    if (num < passingMarks) return { borderColor: '#fca5a5', background: '#fef2f2', color: '#dc2626' }
    return { borderColor: '#86efac', background: '#f0fdf4', color: '#15803d' }
  }

  const getRowTotal = (enrollmentId) => {
    let total = 0, allAbsent = true
    subjects.forEach(sub => {
      const cell = marks[`${enrollmentId}-${sub.id}`]
      if (cell && !cell.isAbsent) { total += parseFloat(cell.marks || 0); allAbsent = false }
    })
    return allAbsent ? null : total
  }

  const isRowPassing = (enrollmentId) =>
    subjects.every(sub => {
      const cell = marks[`${enrollmentId}-${sub.id}`]
      if (!cell || cell.isAbsent) return false
      return parseFloat(cell.marks || 0) >= sub.passing_marks
    })

  const selectedExam = exams.find(e => String(e.id) === examId)
  const isReady = examId && classId && sectionId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        padding: '16px 20px',
        borderRadius: 16,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}>
        <FilterSelect
          label="Academic session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
          placeholder="Select session"
        />
        <FilterSelect
          label="Examination"
          value={examId}
          onChange={e => setExamId(e.target.value)}
          options={exams.map(e => ({ value: String(e.id), label: e.name }))}
          placeholder="Select exam"
        />
        <FilterSelect
          label="Class"
          value={classId}
          onChange={e => { setClassId(e.target.value); setSectionId('') }}
          options={classes}
          placeholder="Select class"
        />
        <FilterSelect
          label="Section"
          value={sectionId}
          onChange={e => setSectionId(e.target.value)}
          options={sections}
          disabled={!classId}
          placeholder="Select section"
        />
      </div>

      {/* ── Empty / Prompt State ────────────────────────────────────────────── */}
      {!isReady && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '52px 24px', borderRadius: 16,
          backgroundColor: 'var(--color-surface)', border: '1.5px dashed var(--color-border)',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--color-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Select an exam, class, and section to begin entering marks
          </p>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && isReady && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '52px 24px', borderRadius: 16,
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Loading students…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── No Students ─────────────────────────────────────────────────────── */}
      {isReady && !loading && students.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '52px 24px',
          borderRadius: 16, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        }}>
          <AlertCircle size={28} style={{ color: 'var(--color-text-muted)', opacity: 0.35 }} />
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>No students found in this section</p>
        </div>
      )}

      {/* ── Marks Table ─────────────────────────────────────────────────────── */}
      {students.length > 0 && subjects.length > 0 && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={13} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{students.length} students</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={13} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{subjects.length} subjects</span>
              </div>
              {selectedExam && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Max {selectedExam.total_marks} marks
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="outline"
                icon={FileSpreadsheet}
                onClick={() => setBulkOpen(true)}
                disabled={submitting || isSaving}
              >
                Bulk Upload
              </Button>
              <button
                onClick={handleSubmitAll}
                disabled={submitting || isSaving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  backgroundColor: submitting ? 'var(--color-surface-raised)' : 'var(--color-text-primary)',
                  color: submitting ? 'var(--color-text-muted)' : 'var(--color-surface)',
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Save size={14} />
                {submitting ? 'Saving…' : 'Submit all'}
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-border)' }}>
                    {/* Roll */}
                    <th style={{
                      position: 'sticky', left: 0, zIndex: 10,
                      padding: '11px 14px', textAlign: 'center', width: 52,
                      backgroundColor: 'var(--color-surface-raised)',
                      borderRight: '1px solid var(--color-border)',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--color-text-muted)',
                    }}>
                      Roll
                    </th>
                    {/* Student */}
                    <th style={{
                      position: 'sticky', left: 52, zIndex: 10,
                      padding: '11px 16px', textAlign: 'left', minWidth: 160,
                      backgroundColor: 'var(--color-surface-raised)',
                      borderRight: '1px solid var(--color-border)',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--color-text-muted)',
                    }}>
                      Student
                    </th>
                    {/* Subject cols */}
                    {subjects.map(sub => (
                      <th key={sub.id} style={{
                        padding: '10px 8px', textAlign: 'center', minWidth: 110,
                        backgroundColor: 'var(--color-surface-raised)',
                      }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                          {sub.code || sub.name}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 10, color: '#ef4444', fontWeight: 500 }}>
                          Pass {sub.passing_marks}
                        </p>
                      </th>
                    ))}
                    {/* Total */}
                    <th style={{
                      padding: '11px 14px', textAlign: 'center', minWidth: 80,
                      backgroundColor: 'var(--color-surface-raised)',
                      borderLeft: '1px solid var(--color-border)',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--color-text-muted)',
                    }}>
                      Total
                    </th>
                    {/* Status */}
                    <th style={{
                      padding: '11px 14px', textAlign: 'center', minWidth: 70,
                      backgroundColor: 'var(--color-surface-raised)',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--color-text-muted)',
                    }}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student, rowIdx) => {
                    const rowTotal = getRowTotal(student.enrollment_id)
                    const passing  = isRowPassing(student.enrollment_id)
                    const isSaved  = saved[student.enrollment_id]

                    return (
                      <tr
                        key={student.enrollment_id}
                        style={{
                          borderBottom: rowIdx < students.length - 1 ? '1px solid var(--color-border)' : 'none',
                          backgroundColor: isSaved ? '#f0fdf4' : 'transparent',
                          transition: 'background-color 0.4s',
                        }}
                      >
                        {/* Roll */}
                        <td style={{
                          position: 'sticky', left: 0, zIndex: 5,
                          padding: '10px 14px', textAlign: 'center',
                          backgroundColor: isSaved ? '#f0fdf4' : 'var(--color-surface)',
                          borderRight: '1px solid var(--color-border)',
                          fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)',
                          transition: 'background-color 0.4s',
                        }}>
                          {student.roll_number || '—'}
                        </td>

                        {/* Name */}
                        <td style={{
                          position: 'sticky', left: 52, zIndex: 5,
                          padding: '10px 16px',
                          backgroundColor: isSaved ? '#f0fdf4' : 'var(--color-surface)',
                          borderRight: '1px solid var(--color-border)',
                          transition: 'background-color 0.4s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            {/* Avatar */}
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              backgroundColor: 'var(--color-surface-raised)',
                              border: '1px solid var(--color-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)',
                            }}>
                              {(student.student_name || '?')[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                              {student.student_name}
                            </span>
                          </div>
                        </td>

                        {/* Mark cells */}
                        {subjects.map((sub, colIdx) => {
                          const key    = `${student.enrollment_id}-${sub.id}`
                          const cell   = marks[key] || { marks: '', isAbsent: false }
                          const styles = getInputStyle(cell.marks, sub.passing_marks, cell.isAbsent)

                          return (
                            <td key={sub.id} style={{ padding: '8px 6px', textAlign: 'center' }}>
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
                                placeholder={cell.isAbsent ? 'AB' : '—'}
                                style={{
                                  display: 'block', width: 72, margin: '0 auto',
                                  textAlign: 'center', fontSize: 13, fontWeight: 500,
                                  padding: '6px 4px', borderRadius: 8,
                                  border: `1.5px solid ${styles.borderColor}`,
                                  backgroundColor: styles.background,
                                  color: styles.color,
                                  outline: 'none', transition: 'all 0.15s',
                                  opacity: cell.isAbsent ? 0.45 : 1,
                                }}
                                onFocus={e => { if (!cell.isAbsent) e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
                                onBlur={e => { e.target.style.boxShadow = 'none' }}
                              />
                              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 5, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={cell.isAbsent || false}
                                  onChange={e => updateCell(student.enrollment_id, sub.id, 'isAbsent', e.target.checked)}
                                  style={{ width: 11, height: 11, accentColor: '#64748b' }}
                                />
                                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>AB</span>
                              </label>
                            </td>
                          )
                        })}

                        {/* Total */}
                        <td style={{ padding: '10px 14px', textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: rowTotal !== null ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                            {rowTotal !== null ? rowTotal : '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isSaved ? (
                            <CheckCircle size={15} style={{ color: '#16a34a', margin: '0 auto' }} />
                          ) : rowTotal !== null ? (
                            <StatusBadge passed={passing} failed={!passing} />
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
              padding: '10px 20px', borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
            }}>
              {[
                { bg: '#f0fdf4', border: '#86efac', label: 'Above passing' },
                { bg: '#fef2f2', border: '#fca5a5', label: 'Below passing' },
                { bg: '#f8fafc', border: '#cbd5e1', label: 'Absent'        },
              ].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: l.bg, border: `1.5px solid ${l.border}`, display: 'inline-block' }} />
                  {l.label}
                </span>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)', opacity: 0.7 }}>
                Tab key navigates between cells
              </span>
            </div>
          </div>
        </>
      )}

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        examId={examId}
        subjects={subjects}
      />
    </div>
  )
}

export default EnterMarksPage