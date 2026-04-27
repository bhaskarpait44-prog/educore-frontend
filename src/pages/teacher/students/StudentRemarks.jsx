import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock3, Filter, PencilLine, Quote, UserRound } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAuthStore from '@/store/authStore'
import useTeacherStudents from '@/hooks/useTeacherStudents'
import * as teacherApi from '@/api/teacherApi'
import RemarkForm from '@/components/teacher/RemarkForm'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Textarea from '@/components/ui/Textarea'
import EmptyState from '@/components/ui/EmptyState'

const today = () => new Date().toISOString().slice(0, 10)

const StudentRemarks = () => {
  usePageTitle('Student Remarks')

  const { toastSuccess, toastError } = useToast()
  const user = useAuthStore((state) => state.user)
  const { students, sections, loadingList } = useTeacherStudents()
  const [searchParams] = useSearchParams()
  const preselectedStudent = searchParams.get('student')

  const [remarks, setRemarks] = useState([])
  const [loadingRemarks, setLoadingRemarks] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    student_id: preselectedStudent || '',
    remark_type: 'general',
    remark_text: '',
    visibility: 'private',
    date: today(),
  })
  const [filters, setFilters] = useState({
    sectionKey: '',
    studentId: preselectedStudent || '',
    type: '',
    visibility: '',
    search: '',
  })
  const [editingRemark, setEditingRemark] = useState(null)
  const [editText, setEditText] = useState('')
  const [editVisibility, setEditVisibility] = useState('private')

  const loadRemarks = async () => {
    setLoadingRemarks(true)
    try {
      const res = await teacherApi.getTeacherRemarks()
      setRemarks(res?.data?.remarks || [])
    } finally {
      setLoadingRemarks(false)
    }
  }

  useEffect(() => {
    loadRemarks().catch(() => {
      setLoadingRemarks(false)
    })
  }, [])

  const filteredRemarks = useMemo(() => remarks.filter((remark) => {
    const searchText = `${remark.first_name} ${remark.last_name} ${remark.remark_text} ${remark.teacher_name}`.toLowerCase()
    const matchesSection = !filters.sectionKey || `${remark.class_id}:${remark.section_id}` === filters.sectionKey
    const matchesStudent = !filters.studentId || String(remark.student_id) === String(filters.studentId)
    const matchesType = !filters.type || remark.remark_type === filters.type
    const matchesVisibility = !filters.visibility || remark.visibility === filters.visibility
    const matchesSearch = !filters.search.trim() || searchText.includes(filters.search.trim().toLowerCase())
    return matchesSection && matchesStudent && matchesType && matchesVisibility && matchesSearch
  }), [remarks, filters])

  return (
    <div className="space-y-5">
      <RemarkForm
        students={students}
        value={form}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
        loading={saving}
        onSubmit={async () => {
          if (!form.student_id || !form.remark_type || !form.remark_text.trim()) {
            toastError('Student, remark type, and remark text are required.')
            return
          }
          setSaving(true)
          try {
            await teacherApi.createTeacherRemark({
              student_id: Number(form.student_id),
              remark_type: form.remark_type,
              remark_text: form.remark_text.trim(),
              visibility: form.visibility,
              date: form.date,
            })
            toastSuccess('Remark added.')
            setForm((prev) => ({ ...prev, remark_text: '' }))
            await loadRemarks()
          } catch (error) {
            toastError(error?.message || 'Failed to create remark.')
          } finally {
            setSaving(false)
          }
        }}
      />

      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Remarks List
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Filter remarks by student, class section, type, or visibility. Teachers can edit only their own remarks within 24 hours.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
            <Filter size={16} />
            {filteredRemarks.length} remark(s)
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Select
            label="Section"
            value={filters.sectionKey}
            onChange={(event) => setFilters((prev) => ({ ...prev, sectionKey: event.target.value }))}
            options={sections}
            placeholder="All sections"
          />
          <Select
            label="Student"
            value={filters.studentId}
            onChange={(event) => setFilters((prev) => ({ ...prev, studentId: event.target.value }))}
            options={students.map((student) => ({
              value: String(student.id),
              label: `${student.first_name} ${student.last_name} | ${student.class_name} ${student.section_name}`,
            }))}
            placeholder="All students"
          />
          <Select
            label="Type"
            value={filters.type}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
            options={[
              { value: 'academic', label: 'Academic' },
              { value: 'behavioral', label: 'Behavioral' },
              { value: 'achievement', label: 'Achievement' },
              { value: 'health', label: 'Health' },
              { value: 'parent_communication', label: 'Parent Communication' },
              { value: 'general', label: 'General' },
            ]}
            placeholder="All types"
          />
          <Select
            label="Visibility"
            value={filters.visibility}
            onChange={(event) => setFilters((prev) => ({ ...prev, visibility: event.target.value }))}
            options={[
              { value: 'private', label: 'Private' },
              { value: 'share_student', label: 'Share Student' },
            ]}
            placeholder="All visibility"
          />
          <Input
            label="Search"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search remarks"
          />
        </div>

        <div className="mt-5">
          {loadingRemarks || loadingList ? (
            <RemarkSkeleton />
          ) : !filteredRemarks.length ? (
            <EmptyState
              icon={Quote}
              title="No remarks found"
              description="Create a remark above or change the filters to view existing notes."
            />
          ) : (
            <div className="space-y-3">
              {filteredRemarks.map((remark) => {
                const editable = canEditRemark(remark, user?.id)
                return (
                  <div
                    key={remark.id}
                    className="rounded-[28px] border p-4"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={remarkTypeVariant(remark.remark_type)}>{remark.remark_type.replace(/_/g, ' ')}</Badge>
                          <Badge variant="grey">{remarkVisibilityLabel(remark.visibility)}</Badge>
                          {remark.is_edited && <Badge variant="yellow">Edited</Badge>}
                        </div>
                        <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {remark.first_name} {remark.last_name} | {remark.class_name} {remark.section_name} | Roll {remark.roll_number || '--'}
                        </p>
                        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {remark.remark_text}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <span className="inline-flex items-center gap-1"><UserRound size={12} /> {remark.teacher_name}</span>
                          <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {new Date(remark.created_at).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      {editable && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRemark(remark)
                            setEditText(remark.remark_text)
                            setEditVisibility(remark.visibility)
                          }}
                          className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
                          style={{ backgroundColor: '#0f766e', color: '#fff' }}
                        >
                          <PencilLine size={16} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Modal
        open={!!editingRemark}
        onClose={() => setEditingRemark(null)}
        title="Edit Remark"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setEditingRemark(null)}
              className="min-h-10 rounded-2xl px-4 text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!editingRemark) return
                try {
                  await teacherApi.updateTeacherRemark(editingRemark.id, {
                    remark_text: editText.trim(),
                    visibility: editVisibility,
                  })
                  toastSuccess('Remark updated.')
                  setEditingRemark(null)
                  await loadRemarks()
                } catch (error) {
                  toastError(error?.message || 'Failed to update remark.')
                }
              }}
              className="min-h-10 rounded-2xl px-4 text-sm font-semibold"
              style={{ backgroundColor: '#0f766e', color: '#fff' }}
            >
              Save Changes
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <Select
            label="Visibility"
            value={editVisibility}
            onChange={(event) => setEditVisibility(event.target.value)}
            options={[
              { value: 'private', label: 'Private' },
              { value: 'share_student', label: 'Share with Student' },
            ]}
          />
          <Textarea
            label="Remark Text"
            rows={5}
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

const canEditRemark = (remark, userId) => {
  const createdAt = new Date(remark.created_at).getTime()
  return Number(remark.teacher_id) === Number(userId) &&
    (Date.now() - createdAt <= 24 * 60 * 60 * 1000)
}

const remarkTypeVariant = (type) => {
  if (type === 'academic') return 'blue'
  if (type === 'behavioral') return 'yellow'
  if (type === 'achievement') return 'green'
  if (type === 'health') return 'red'
  return 'grey'
}

const remarkVisibilityLabel = (visibility) => {
  if (visibility === 'share_student' || visibility === 'share_parent') return 'share student'
  return 'private'
}

const RemarkSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="h-32 rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

export default StudentRemarks
