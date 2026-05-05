import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useTeacherStudents from '@/hooks/useTeacherStudents'
import StudentView from '@/components/teacher/StudentView'
import EmptyState from '@/components/ui/EmptyState'

const StudentDetail = () => {
  const { id } = useParams()
  usePageTitle('Student Detail')

  const { students, loadingList, loadingStudentId, loadStudentBundle, getStudentBundle } = useTeacherStudents()
  const student = students.find((row) => String(row.id) === String(id))

  useEffect(() => {
    if (student) {
      loadStudentBundle(student.id).catch(() => {})
    }
  }, [student, loadStudentBundle])

  if (!loadingList && !student) {
    return (
      <EmptyState
        title="Student not found"
        description="This student is not available in your assigned sections."
      />
    )
  }

  return (
    <div className="min-h-[70vh] rounded-[28px] border p-6 lg:p-8" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {student && (
        <StudentView
          student={student}
          bundle={getStudentBundle(student.id)}
          loading={loadingStudentId === student.id}
          isFullPage={true}
        />
      )}
    </div>
  )
}

export default StudentDetail

