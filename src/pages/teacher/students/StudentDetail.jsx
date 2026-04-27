import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useTeacherStudents from '@/hooks/useTeacherStudents'
import StudentQuickPanel from '@/components/teacher/StudentQuickPanel'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'

const StudentDetail = () => {
  const { id } = useParams()
  usePageTitle('Student Detail')

  const navigate = useNavigate()
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
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
      >
        <ArrowLeft size={16} />
        Back to Student List
      </button>

      {student && (
        <div className="relative min-h-[70vh] rounded-[28px] border p-4 lg:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <StudentQuickPanel
            open={true}
            student={student}
            bundle={getStudentBundle(student.id)}
            loading={loadingStudentId === student.id}
            onClose={() => navigate(ROUTES.TEACHER_STUDENTS)}
          />
        </div>
      )}
    </div>
  )
}

export default StudentDetail
