import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Users } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useTeacherStudents from '@/hooks/useTeacherStudents'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import StudentQuickPanel from '@/components/teacher/StudentQuickPanel'

const StudentList = () => {
  usePageTitle('Student List')

  const location = useLocation()
  const { students, sections, loadingList, loadingStudentId, loadStudentBundle, getStudentBundle } = useTeacherStudents()
  const [search, setSearch] = useState('')
  const [sectionKey, setSectionKey] = useState('')
  const [gender, setGender] = useState('')
  const [attendanceRange, setAttendanceRange] = useState('')
  const [resultStatus, setResultStatus] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  useEffect(() => {
    const classId = location.state?.class_id
    const sectionId = location.state?.section_id
    if (!classId || !sectionId) return
    setSectionKey(`${classId}:${sectionId}`)
  }, [location.state?.class_id, location.state?.section_id])

  const filteredStudents = useMemo(() => students.filter((student) => {
    const searchText = `${student.first_name} ${student.last_name} ${student.roll_number || ''}`.toLowerCase()
    const matchesSearch = !search.trim() || searchText.includes(search.trim().toLowerCase())
    const matchesSection = !sectionKey || `${student.class_id}:${student.section_id}` === sectionKey
    const matchesGender = !gender || student.gender === gender
    const attendanceValue = Number(student.attendance_percentage || 0)
    const resultValue = Number(student.last_result_percentage || 0)
    const matchesAttendance = !attendanceRange || (
      attendanceRange === 'below75' ? attendanceValue < 75 :
      attendanceRange === '75to90' ? attendanceValue >= 75 && attendanceValue < 90 :
      attendanceValue >= 90
    )
    const matchesResult = !resultStatus || (
      resultStatus === 'good' ? resultValue >= 60 :
      resultStatus === 'warning' ? resultValue >= 40 && resultValue < 60 :
      resultValue < 40
    )

    return matchesSearch && matchesSection && matchesGender && matchesAttendance && matchesResult
  }), [students, search, sectionKey, gender, attendanceRange, resultStatus])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Student List
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          View students from your assigned sections. Class teachers get full student context, while subject teachers stay limited to their teaching scope.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Input
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or roll number"
            icon={Search}
          />
          <Select
            label="Section"
            value={sectionKey}
            onChange={(event) => setSectionKey(event.target.value)}
            options={sections}
            placeholder="All sections"
          />
          <Select
            label="Gender"
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="All genders"
          />
          <Select
            label="Attendance"
            value={attendanceRange}
            onChange={(event) => setAttendanceRange(event.target.value)}
            options={[
              { value: 'below75', label: 'Below 75%' },
              { value: '75to90', label: '75% to 89%' },
              { value: '90plus', label: '90% and above' },
            ]}
            placeholder="All ranges"
          />
          <Select
            label="Result Status"
            value={resultStatus}
            onChange={(event) => setResultStatus(event.target.value)}
            options={[
              { value: 'good', label: 'Good' },
              { value: 'warning', label: 'Warning' },
              { value: 'critical', label: 'Critical' },
            ]}
            placeholder="All statuses"
          />
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              My Students
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {filteredStudents.length} student(s) match your current filters.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
            <SlidersHorizontal size={16} />
            Filtered view
          </div>
        </div>

        {loadingList ? (
          <ListSkeleton />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description="Adjust the search or filter values to see students from your assigned classes."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {['Student', 'Gender', 'Attendance', 'Last Result', 'Status', 'Fee', ''].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const attendance = Number(student.attendance_percentage || 0)
                  const result = Number(student.last_result_percentage || 0)
                  return (
                    <tr key={student.enrollment_id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold" style={{ backgroundColor: '#0f766e', color: '#fff' }}>
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              Roll {student.roll_number || '--'} | {student.class_name} {student.section_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{student.gender || '--'}</td>
                      <td className="px-4 py-4 text-sm" style={{ color: attendance < 75 ? '#ef4444' : '#10b981' }}>{attendance ? `${attendance.toFixed(0)}%` : '--'}</td>
                      <td className="px-4 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{student.last_result_percentage != null ? `${result.toFixed(0)}%` : '--'}</td>
                      <td className="px-4 py-4">
                        <Badge variant={attendance < 75 ? 'red' : 'green'}>{attendance < 75 ? 'Warning' : 'Good'}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {student.fee_balance == null ? 'Restricted' : Number(student.fee_balance) > 0 ? `Rs ${Number(student.fee_balance).toFixed(0)}` : 'Clear'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={async () => {
                            setSelectedStudent(student)
                            await loadStudentBundle(student.id)
                          }}
                          className="min-h-10 rounded-2xl px-4 text-sm font-semibold"
                          style={{ backgroundColor: '#0f766e', color: '#fff' }}
                        >
                          Quick View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <StudentQuickPanel
        open={!!selectedStudent}
        student={selectedStudent}
        bundle={selectedStudent ? getStudentBundle(selectedStudent.id) : null}
        loading={loadingStudentId === selectedStudent?.id}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  )
}

const ListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[...Array(6)].map((_, index) => (
      <div key={index} className="h-16 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

export default StudentList
