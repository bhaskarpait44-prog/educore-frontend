import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useMarksEntry from '@/hooks/useMarksEntry'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const normalizeMarksError = (error) => {
  const message = error?.message || ''
  if (message.includes('Only the assigned subject teacher can enter or review marks for this subject')) {
    return 'This subject is not assigned to you for marks review. Choose one of your assigned subjects.'
  }
  if (message.includes('Selected exam does not belong to this class or active session')) {
    return 'This exam does not match the selected section. Choose the section from the same class as the exam.'
  }
  return message || 'Failed to load marks summary.'
}

const MarksSummary = () => {
  usePageTitle('Marks Summary')

  const { toastError } = useToast()
  const location = useLocation()
  const {
    uniqueSections,
    exams,
    baseError,
    loadingBase,
    summaryLoading,
    summaryPayload,
    getAvailableSubjects,
    loadSummary,
  } = useMarksEntry()
  const [examId, setExamId] = useState('')
  const [sectionKey, setSectionKey] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [subjectOptions, setSubjectOptions] = useState([])
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
    loadSummary({
      exam_id: examId,
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      subject_id: subjectId,
    }).catch((error) => {
      toastError(normalizeMarksError(error))
    })
  }, [examId, selectedSection, subjectId, loadSummary, toastError, selectionMismatch])

  const distribution = useMemo(() => buildDistribution(summaryPayload?.students || []), [summaryPayload])
  const gradeDistribution = useMemo(() => buildGradeDistribution(summaryPayload?.students || []), [summaryPayload])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Marks Summary
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Subject-wise analysis for subject teachers across their assigned sections.
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

      {!loadingBase && baseError ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: '#ef444455', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Unable to load subject-teacher summary options
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
            Marks summary is available only for assigned subject teachers.
          </p>
        </section>
      ) : !examId || !sectionKey || !subjectId ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Select exam, section, and subject to load the marks summary.
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
            Choose a section from the same class as the selected exam before loading summary.
          </p>
        </section>
      ) : loadingBase || summaryLoading ? (
        <section
          className="rounded-[28px] border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading marks summary...
          </p>
        </section>
      ) : (
        <>
          <section
            className="rounded-[28px] border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Review status
            </p>
            <p className="mt-1 text-sm" style={{ color: summaryPayload?.review_status?.status === 'completed' ? '#10b981' : '#f59e0b' }}>
              {summaryPayload?.review_status?.label || 'Review not completed'}
            </p>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <Stat title="Highest" value={summaryPayload?.summary?.highest ?? '--'} sub={summaryPayload?.summary?.highest_student || 'No data'} />
            <Stat title="Lowest" value={summaryPayload?.summary?.lowest ?? '--'} sub={summaryPayload?.summary?.lowest_student || 'No data'} />
            <Stat title="Average" value={summaryPayload?.summary?.average ?? '--'} sub="Class average" />
            <Stat title="Pass Count" value={summaryPayload?.summary?.pass_count ?? 0} sub="Students passed" tone="#10b981" />
            <Stat title="Fail Count" value={summaryPayload?.summary?.fail_count ?? 0} sub="Students failed" tone="#ef4444" />
            <Stat title="Absent" value={summaryPayload?.summary?.absent_count ?? 0} sub="Students absent" tone="#94a3b8" />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ChartCard title="Marks Distribution" onExport={() => exportStudents(summaryPayload?.students || [])}>
              <div className="space-y-3">
                {distribution.map((item) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...distribution.map((row) => row.count), 1)} tone="#0f766e" />
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Grade Distribution" onExport={() => exportStudents(summaryPayload?.students || [])}>
              <div className="space-y-3">
                {gradeDistribution.map((item) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...gradeDistribution.map((row) => row.count), 1)} tone="#14b8a6" />
                ))}
              </div>
            </ChartCard>
          </section>

          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Student Performance
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Sorted by marks descending for quick review and export.
                </p>
              </div>
              <Button variant="secondary" onClick={() => exportStudents(summaryPayload?.students || [])}>
                Export marks sheet
              </Button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    {['Roll', 'Name', 'Marks', 'Grade', 'Status'].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(summaryPayload?.students || []).map((student) => (
                    <tr key={`${student.roll_number}-${student.first_name}`} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{student.roll_number || '--'}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>{student.is_absent ? 'AB' : (student.marks_obtained ?? '--')}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>{student.grade || '--'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: student.is_pass ? '#10b981' : student.is_absent ? '#94a3b8' : '#ef4444' }}>
                        {student.is_absent ? 'Absent' : student.is_pass ? 'Pass' : 'Fail'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const Stat = ({ title, value, sub, tone = 'var(--color-text-primary)' }) => (
  <div
    className="rounded-[28px] border p-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>{value}</p>
    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{sub}</p>
  </div>
)

const ChartCard = ({ title, children, onExport }) => (
  <section
    className="rounded-[28px] border p-5 sm:p-6"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      <Button variant="secondary" onClick={onExport}>Export</Button>
    </div>
    <div className="mt-5">{children}</div>
  </section>
)

const BarRow = ({ label, value, max, tone }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-sm">
      <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
    </div>
    <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
      <div className="h-full rounded-full" style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: tone }} />
    </div>
  </div>
)

const buildDistribution = (students) => {
  const buckets = [
    { label: '0-20', min: 0, max: 20, count: 0 },
    { label: '21-40', min: 21, max: 40, count: 0 },
    { label: '41-60', min: 41, max: 60, count: 0 },
    { label: '61-80', min: 61, max: 80, count: 0 },
    { label: '81-100', min: 81, max: 1000, count: 0 },
  ]
  students.forEach((student) => {
    if (student.is_absent || student.marks_obtained == null) return
    const mark = Number(student.marks_obtained)
    const bucket = buckets.find((item) => mark >= item.min && mark <= item.max)
    if (bucket) bucket.count += 1
  })
  return buckets
}

const buildGradeDistribution = (students) => {
  const map = new Map()
  students.forEach((student) => {
    const key = student.grade || 'NA'
    map.set(key, (map.get(key) || 0) + 1)
  })
  return [...map.entries()].map(([label, count]) => ({ label, count }))
}

const exportStudents = (students) => {
  const rows = [
    ['Roll', 'Name', 'Marks', 'Grade', 'Status'],
    ...students.map((student) => [
      student.roll_number || '',
      `${student.first_name} ${student.last_name}`,
      student.is_absent ? 'AB' : (student.marks_obtained ?? ''),
      student.grade || '',
      student.is_absent ? 'Absent' : student.is_pass ? 'Pass' : 'Fail',
    ]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'marks-summary.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default MarksSummary
