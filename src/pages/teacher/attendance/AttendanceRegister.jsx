import { useEffect, useMemo, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import AttendanceGrid from '@/components/teacher/AttendanceGrid'

const AttendanceRegister = () => {
  usePageTitle('Attendance Register')

  const { toastError, toastSuccess } = useToast()
  const {
    assignmentOptions,
    loadingAssignments,
    loadRegister,
    registerData,
    loadingRegister,
    overrideAttendance,
  } = useAttendance()
  const [assignmentKey, setAssignmentKey] = useState('')
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const registerAssignments = useMemo(
    () => dedupeAssignmentsForRegister(assignmentOptions),
    [assignmentOptions]
  )

  useEffect(() => {
    if (!registerAssignments.length) {
      if (assignmentKey) setAssignmentKey('')
      return
    }

    const exists = registerAssignments.some((option) => option.value === assignmentKey)
    if (!assignmentKey || !exists) {
      setAssignmentKey(registerAssignments[0].value)
    }
  }, [registerAssignments, assignmentKey])

  const currentAssignment = useMemo(() => {
    const [classId, sectionId] = assignmentKey.split(':')
    return assignmentOptions.find((assignment) =>
      assignment.is_class_teacher &&
      String(assignment.class_id) === String(classId) &&
      String(assignment.section_id) === String(sectionId)
    ) || assignmentOptions.find((assignment) =>
      String(assignment.class_id) === String(classId) &&
      String(assignment.section_id) === String(sectionId)
    ) || null
  }, [assignmentOptions, assignmentKey])

  useEffect(() => {
    if (!currentAssignment) return
    loadRegister({
      class_id: currentAssignment.class_id,
      section_id: currentAssignment.section_id,
      month,
      year,
    }).catch((error) => {
      toastError(error?.message || 'Failed to load attendance register.')
    })
  }, [currentAssignment, month, year, loadRegister, toastError])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Attendance Register
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Monthly attendance grid for your assigned sections with quick override support and summary blocks for parent meetings.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Assigned Section"
            value={assignmentKey}
            onChange={(e) => setAssignmentKey(e.target.value)}
            options={registerAssignments}
            placeholder="Select section"
          />
          <Select
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={[...Array(12)].map((_, index) => ({
              value: String(index + 1),
              label: new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' }),
            }))}
          />
          <Select
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={buildYearOptions()}
          />
        </div>
      </section>

      <AttendanceGrid
        registerData={registerData}
        loading={loadingAssignments || loadingRegister}
        canEdit={!!currentAssignment?.is_class_teacher}
        onOverride={async (id, payload) => {
          try {
            await overrideAttendance(id, payload)
            toastSuccess('Attendance updated.')
            if (currentAssignment) {
              await loadRegister({
                class_id: currentAssignment.class_id,
                section_id: currentAssignment.section_id,
                month,
                year,
              })
            }
          } catch (error) {
            toastError(error?.message || 'Failed to update attendance.')
          }
        }}
      />
    </div>
  )
}

const dedupeAssignmentsForRegister = (assignments) => {
  const map = new Map()
  assignments.forEach((assignment) => {
    const key = `${assignment.class_id}:${assignment.section_id}`
    const existing = map.get(key)
    if (!existing || assignment.is_class_teacher) {
      map.set(key, {
        value: key,
        label: `${assignment.class_name} ${assignment.section_name}${assignment.is_class_teacher ? ' | Class Teacher' : ''}`,
      })
    }
  })
  return [...map.values()]
}

const buildYearOptions = () => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1].map((year) => ({
    value: String(year),
    label: String(year),
  }))
}

export default AttendanceRegister
