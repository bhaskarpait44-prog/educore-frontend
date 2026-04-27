import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useMarksEntry from '@/hooks/useMarksEntry'
import Select from '@/components/ui/Select'
import MarksEntryTable from '@/components/teacher/MarksEntryTable'

const normalizeMarksError = (error) => {
  const message = error?.message || ''
  if (message.includes('Only the assigned subject teacher can enter or review marks for this subject')) {
    return 'This subject is not assigned to you for marks entry. Choose one of your assigned subjects.'
  }
  if (message.includes('Selected exam does not belong to this class or active session')) {
    return 'This exam does not match the selected section. Choose the section from the same class as the exam.'
  }
  return message || 'Failed to load marks entry.'
}

const EnterMarks = () => {
  usePageTitle('Enter Marks')

  const { toastError, toastSuccess, toastInfo } = useToast()
  const location = useLocation()
  const {
    uniqueSections,
    exams,
    baseError,
    loadingBase,
    loadingEntry,
    saving,
    entryPayload,
    getAvailableSubjects,
    loadEntry,
    saveEntry,
    submitForReview,
  } = useMarksEntry()

  const [examId, setExamId] = useState('')
  const [sectionKey, setSectionKey] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [subjectOptions, setSubjectOptions] = useState([])
  const [state, setState] = useState({})
  const [lastSavedAt, setLastSavedAt] = useState('')
  const autoSaveRef = useRef(null)
  const preferredAssignment = location.state || {}

  const selectedSection = useMemo(() => {
    const [classId, sectionId] = sectionKey.split(':')
    return uniqueSections.find((section) =>
      String(section.class_id) === String(classId) &&
      String(section.section_id) === String(sectionId)
    ) || null
  }, [sectionKey, uniqueSections])

  const selectedExam = useMemo(() => (
    exams.find((exam) => String(exam.id) === String(examId)) || null
  ), [examId, exams])

  const visibleSections = useMemo(() => (
    selectedExam
      ? uniqueSections.filter((section) => String(section.class_id) === String(selectedExam.class_id))
      : uniqueSections
  ), [selectedExam, uniqueSections])

  const selectionMismatch = useMemo(() => {
    if (!selectedExam || !selectedSection) return false
    return String(selectedExam.class_id) !== String(selectedSection.class_id)
  }, [selectedExam, selectedSection])

  useEffect(() => {
    if (baseError) toastError(baseError)
  }, [baseError, toastError])

  useEffect(() => {
    if (!uniqueSections.length || sectionKey) return
    const matched = uniqueSections.find((section) =>
      String(section.class_id) === String(preferredAssignment.class_id || '') &&
      String(section.section_id) === String(preferredAssignment.section_id || '') &&
      (
        !preferredAssignment.assignment_role ||
        (preferredAssignment.assignment_role === 'class_teacher' && section.is_class_teacher) ||
        preferredAssignment.assignment_role === 'subject_teacher'
      )
    )
    const first = matched || uniqueSections[0]
    setSectionKey(`${first.class_id}:${first.section_id}:${first.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`)
  }, [preferredAssignment.assignment_role, preferredAssignment.class_id, preferredAssignment.section_id, uniqueSections, sectionKey])

  useEffect(() => {
    if (!exams.length) return
    const hasCurrentExam = exams.some((exam) => String(exam.id) === String(examId))
    if (hasCurrentExam) return

    const preferredExam = exams.find((exam) => String(exam.id) === String(preferredAssignment.exam_id || ''))
    setExamId(String((preferredExam || exams[0]).id))
  }, [examId, exams, preferredAssignment.exam_id])

  useEffect(() => {
    if (!visibleSections.length) {
      if (sectionKey) setSectionKey('')
      return
    }

    const hasCurrentSection = visibleSections.some((section) => (
      `${section.class_id}:${section.section_id}:${section.is_class_teacher ? 'class_teacher' : 'subject_teacher'}` === sectionKey
    ))
    if (hasCurrentSection) return

    const preferredSection = visibleSections.find((section) =>
      String(section.class_id) === String(preferredAssignment.class_id || '') &&
      String(section.section_id) === String(preferredAssignment.section_id || '')
    )
    const nextSection = preferredSection || visibleSections[0]
    setSectionKey(`${nextSection.class_id}:${nextSection.section_id}:${nextSection.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`)
  }, [preferredAssignment.class_id, preferredAssignment.section_id, sectionKey, visibleSections])

  useEffect(() => {
    if (!selectedSection || !examId) {
      setSubjectOptions([])
      setSubjectId('')
      return
    }

    getAvailableSubjects({
      examId,
      classId: selectedSection.class_id,
      sectionId: selectedSection.section_id,
    }).then((subjects) => {
      setSubjectOptions(subjects)
      if (!subjects.length) {
        setSubjectId('')
        return
      }

      const hasCurrentSubject = subjects.some((subject) => String(subject.id) === String(subjectId))
      if (hasCurrentSubject) return

      const preferredSubject = subjects.find((subject) => String(subject.id) === String(preferredAssignment.subject_id || ''))
      if (preferredSubject) {
        setSubjectId(String(preferredSubject.id))
        return
      }

      setSubjectId(String(subjects[0].id))
    }).catch(() => {
      setSubjectOptions([])
      setSubjectId('')
    })
  }, [selectedSection, getAvailableSubjects, subjectId, examId, preferredAssignment.subject_id])

  useEffect(() => {
    if (!examId || !selectedSection || !subjectId || selectionMismatch) return
    loadEntry({
      exam_id: examId,
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      subject_id: subjectId,
    }).then((data) => {
      const next = {}
      ;(data?.rows || []).forEach((row) => {
        next[row.enrollment_id] = {
          marks_obtained: row.marks_obtained ?? '',
          theory_marks_obtained: row.theory_marks_obtained ?? '',
          practical_marks_obtained: row.practical_marks_obtained ?? '',
          is_absent: !!row.is_absent,
        }
      })
      setState(next)
    }).catch((error) => {
      toastError(normalizeMarksError(error))
    })
  }, [examId, selectedSection, subjectId, loadEntry, toastError, selectionMismatch])

  const currentSubject = useMemo(() => {
    if (!entryPayload?.rows?.length) return subjectOptions.find((subject) => String(subject.id) === String(subjectId)) || null
    const row = entryPayload.rows[0]
    return {
      id: Number(subjectId),
      name: row.subject_name,
      code: row.subject_code,
      subject_type: row.subject_type,
      combined_total_marks: row.combined_total_marks,
      combined_passing_marks: row.combined_passing_marks,
      theory_total_marks: row.theory_total_marks,
      theory_passing_marks: row.theory_passing_marks,
      practical_total_marks: row.practical_total_marks,
      practical_passing_marks: row.practical_passing_marks,
    }
  }, [entryPayload, subjectId, subjectOptions])

  const persistAll = async () => {
    if (!selectedSection || !subjectId || !examId || !entryPayload?.rows?.length) return

    const entries = entryPayload.rows.map((row) => {
      const record = state[row.enrollment_id] || {}
      return {
        exam_id: Number(examId),
        class_id: Number(selectedSection.class_id),
        section_id: Number(selectedSection.section_id),
        subject_id: Number(subjectId),
        enrollment_id: Number(row.enrollment_id),
        is_absent: !!record.is_absent,
        marks_obtained: currentSubject?.subject_type === 'both'
          ? null
          : (record.marks_obtained === '' ? null : Number(record.marks_obtained)),
        theory_marks_obtained: currentSubject?.subject_type === 'both'
          ? (record.theory_marks_obtained === '' ? null : Number(record.theory_marks_obtained))
          : null,
        practical_marks_obtained: currentSubject?.subject_type === 'both'
          ? (record.practical_marks_obtained === '' ? null : Number(record.practical_marks_obtained))
          : null,
      }
    })

    await saveEntry({ entries }, true)
    setLastSavedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
  }

  useEffect(() => {
    if (!entryPayload?.rows?.length) return
    if (autoSaveRef.current) window.clearInterval(autoSaveRef.current)
    autoSaveRef.current = window.setInterval(() => {
      persistAll().catch(() => {})
    }, 30000)

    return () => {
      if (autoSaveRef.current) window.clearInterval(autoSaveRef.current)
    }
  }, [entryPayload, state, currentSubject, examId, selectedSection, subjectId])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Enter Marks
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Subject teachers can enter marks only for their assigned subjects and sections.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Select
            label="Exam"
            value={examId}
            onChange={(event) => setExamId(event.target.value)}
            options={exams.map((exam) => ({ value: String(exam.id), label: `${exam.name} | ${exam.class_name}` }))}
            placeholder="Select exam"
          />
          <Select
            label="Section"
            value={sectionKey}
            onChange={(event) => setSectionKey(event.target.value)}
            options={visibleSections.map((section) => ({
              value: `${section.class_id}:${section.section_id}:${section.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`,
              label: `${section.class_name} ${section.section_name}${section.is_class_teacher ? ' | Class Teacher' : ''}`,
            }))}
            placeholder="Select section"
          />
          <Select
            label="Subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            options={subjectOptions.map((subject) => ({ value: String(subject.id), label: `${subject.name}${subject.code ? ` (${subject.code})` : ''}` }))}
            placeholder="Select subject"
          />
        </div>

      </section>

      {baseError && !loadingBase ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: '#ef444455', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Unable to load subject-teacher marks options
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {baseError}
          </p>
        </section>
      ) : !loadingBase && !uniqueSections.length ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            No subject-teacher marks assignment found
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Only assigned subject teachers can enter marks. Ask admin to assign this subject to the teacher.
          </p>
        </section>
      ) : entryPayload?.locked && (
        <div
          className="rounded-[28px] border px-4 py-3"
          style={{ borderColor: '#0f766e55', backgroundColor: 'rgba(15, 118, 110, 0.10)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Marks are locked for this subject
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            The teacher has already submitted these marks for review. Admin unlock is required for edits.
          </p>
        </div>
      )}

      {!examId || !sectionKey || !subjectId ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Select exam, section, and subject to start entering marks.
          </p>
        </section>
      ) : selectionMismatch ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: '#f59e0b55', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Exam and section do not match
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Choose a section from the same class as the selected exam before entering marks.
          </p>
        </section>
      ) : loadingBase || loadingEntry ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading marks entry...
          </p>
        </section>
      ) : entryPayload?.rows?.length ? (
        <MarksEntryTable
          rows={entryPayload.rows}
          subject={currentSubject}
          state={state}
          locked={entryPayload.locked}
          reviewStatus={entryPayload.review_status}
          saving={saving}
          lastSavedAt={lastSavedAt}
          onChange={(enrollmentId, field, value) => {
            setState((prev) => ({
              ...prev,
              [enrollmentId]: {
                ...prev[enrollmentId],
                ...(field === 'is_absent'
                  ? value
                    ? { is_absent: true, marks_obtained: '', theory_marks_obtained: '', practical_marks_obtained: '' }
                    : { ...prev[enrollmentId], is_absent: false }
                  : { [field]: value }),
              },
            }))
          }}
          onSaveAll={async () => {
            try {
              await persistAll()
              toastSuccess('Marks saved.')
            } catch (error) {
              toastError(error?.message || 'Failed to save marks.')
            }
          }}
          onSubmit={async () => {
            try {
              await persistAll()
              await submitForReview({
                exam_id: Number(examId),
                class_id: Number(selectedSection.class_id),
                section_id: Number(selectedSection.section_id),
                subject_id: Number(subjectId),
              })
              toastSuccess('Marks submitted for review.')
              const refreshed = await loadEntry({
                exam_id: examId,
                class_id: selectedSection.class_id,
                section_id: selectedSection.section_id,
                subject_id: subjectId,
              })
              setState(Object.fromEntries((refreshed?.rows || []).map((row) => [row.enrollment_id, {
                marks_obtained: row.marks_obtained ?? '',
                theory_marks_obtained: row.theory_marks_obtained ?? '',
                practical_marks_obtained: row.practical_marks_obtained ?? '',
                is_absent: !!row.is_absent,
              }])))
            } catch (error) {
              toastError(error?.message || 'Failed to submit marks.')
            }
          }}
        />
      ) : (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <AlertTriangle size={20} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No students found for this marks entry selection.
          </p>
        </section>
      )}

      {currentSubject && (
        <section
          className="rounded-[28px] border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Subject setup
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Type: {currentSubject.subject_type || 'theory'} | Total: {currentSubject.combined_total_marks || '--'} | Passing: {currentSubject.combined_passing_marks || '--'}
          </p>
          {currentSubject.subject_type === 'both' && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Theory {currentSubject.theory_total_marks}/{currentSubject.theory_passing_marks} | Practical {currentSubject.practical_total_marks}/{currentSubject.practical_passing_marks}
            </p>
          )}
          <p className="mt-2 text-xs font-semibold" style={{ color: entryPayload?.review_status?.status === 'completed' ? '#10b981' : '#f59e0b' }}>
            {entryPayload?.review_status?.label || 'Review not completed'}
          </p>
        </section>
      )}
    </div>
  )
}

export default EnterMarks
