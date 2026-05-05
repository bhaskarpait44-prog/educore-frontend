import Modal from '@/components/ui/Modal'
import StudentView from './StudentView'

const StudentQuickPanel = ({
  open,
  student,
  bundle,
  loading = false,
  onClose,
}) => {
  if (!open || !student) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Student Quick View"
      size="xl"
    >
      <div className="py-2">
        <StudentView
          student={student}
          bundle={bundle}
          loading={loading}
          onClose={onClose}
        />
      </div>
    </Modal>
  )
}

export default StudentQuickPanel

