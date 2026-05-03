import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BellPlus, Info } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import usePermissions from '@/hooks/usePermissions'
import useTeacherNotices from '@/hooks/useTeacherNotices'
import { getTeacherStudents } from '@/api/teacherApi'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { ROUTES } from '@/constants/app'

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'homework', label: 'Homework' },
  { value: 'exam', label: 'Exam' },
  { value: 'event', label: 'Event' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
]

const todayDate = () => new Date().toISOString().slice(0, 10)

const NoticeForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const editingNotice = location.state?.notice || null
  const preferredTargetMode = location.state?.targetMode || ''
  const isEditing = Boolean(editingNotice)

  usePageTitle(isEditing ? 'Edit Notice' : 'Post Notice')

  const { can } = usePermissions()
  const { toastSuccess, toastError } = useToast()
  const { loadingBase, saving, classTeacherSections, assignedSections, saveNotice } = useTeacherNotices()
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    target_mode: '',
    target_key: '',
    target_student_id: '',
    attachment_path: '',
    publish_date: todayDate(),
    expiry_date: '',
  })

  useEffect(() => {
    if (editingNotice) {
      setForm({
        title: editingNotice.title || '',
        content: editingNotice.content || '',
        category: editingNotice.category || 'general',
        target_mode: editingNotice.target_scope === 'specific_student' ? 'student' : editingNotice.target_scope || '',
        target_key: editingNotice.class_id && editingNotice.section_id ? `${editingNotice.class_id}:${editingNotice.section_id}` : '',
        target_student_id: editingNotice.target_student_id ? String(editingNotice.target_student_id) : '',
        attachment_path: editingNotice.attachment_path || '',
        publish_date: editingNotice.publish_date ? String(editingNotice.publish_date).slice(0, 10) : todayDate(),
        expiry_date: editingNotice.expiry_date ? String(editingNotice.expiry_date).slice(0, 10) : '',
      })
      return
    }

    setForm((prev) => ({
      ...prev,
      target_mode: preferredTargetMode || (classTeacherSections.length ? 'my_class_only' : 'specific_section'),
      target_key: classTeacherSections[0]?.value || assignedSections[0]?.value || '',
    }))
  }, [assignedSections, classTeacherSections, editingNotice, preferredTargetMode])

  const canPost = can('notices.post') || assignedSections.length > 0 || classTeacherSections.length > 0
  useEffect(() => {
    let active = true
    setLoadingStudents(true)
    getTeacherStudents()
      .then((res) => {
        if (active) setStudents(res?.data?.students || [])
      })
      .catch(() => {
        if (active) setStudents([])
      })
      .finally(() => {
        if (active) setLoadingStudents(false)
      })
    return () => { active = false }
  }, [])

  const targetOptions = useMemo(() => {
    const options = []
    if (classTeacherSections.length) {
      options.push({ value: 'my_class_only', label: 'Class Wise (Class Teacher)' })
    }
    if (assignedSections.length) {
      options.push({ value: 'specific_section', label: 'Assigned Class / Section' })
      options.push({ value: 'student', label: 'Student Wise' })
    }
    return options
  }, [assignedSections, classTeacherSections])

  const sectionOptions = form.target_mode === 'my_class_only' ? classTeacherSections : assignedSections

  const studentOptions = useMemo(() => {
    const selectedSection = assignedSections.find((item) => item.value === form.target_key)
    return students
      .filter((student) => (
        !selectedSection ||
        (String(student.class_id) === String(selectedSection.class_id) && String(student.section_id) === String(selectedSection.section_id))
      ))
      .map((student) => ({
        value: String(student.id),
        label: `${student.first_name} ${student.last_name} | ${student.class_name} ${student.section_name} | Roll ${student.roll_number || '--'}`,
      }))
  }, [assignedSections, form.target_key, students])

  useEffect(() => {
    if (!sectionOptions.length) return
    if (!sectionOptions.some((item) => item.value === form.target_key)) {
      setForm((prev) => ({ ...prev, target_key: sectionOptions[0]?.value || '', target_student_id: '' }))
    }
  }, [form.target_key, sectionOptions])

  useEffect(() => {
    if (form.target_mode !== 'student') return
    if (!studentOptions.length) return
    if (!studentOptions.some((item) => item.value === form.target_student_id)) {
      setForm((prev) => ({ ...prev, target_student_id: studentOptions[0]?.value || '' }))
    }
  }, [form.target_mode, form.target_student_id, studentOptions])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const selectedTarget = sectionOptions.find((item) => item.value === form.target_key) || null

    try {
      await saveNotice(
        isEditing
          ? {
              title: form.title.trim(),
              content: form.content.trim(),
              category: form.category,
              attachment_path: form.attachment_path.trim() || null,
              expiry_date: form.expiry_date || null,
            }
          : {
              title: form.title.trim(),
              content: form.content.trim(),
              category: form.category,
              target_scope: form.target_mode === 'student' ? 'specific_student' : form.target_mode,
              class_id: form.target_mode === 'student' ? null : selectedTarget?.class_id || null,
              section_id: form.target_mode === 'student' ? null : selectedTarget?.section_id || null,
              target_student_id: form.target_mode === 'student' ? Number(form.target_student_id) : null,
              attachment_path: form.attachment_path.trim() || null,
              publish_date: form.publish_date,
              expiry_date: form.expiry_date || null,
            },
        editingNotice?.id || null
      )

      toastSuccess(isEditing ? 'Notice updated successfully.' : 'Notice posted successfully.')
      navigate(ROUTES.TEACHER_NOTICES)
    } catch (error) {
      toastError(error?.message || 'Unable to save notice.')
    }
  }

  if (!canPost) {
    return (
      <EmptyState
        icon={BellPlus}
        title="Notice posting is restricted"
        description="Your account can view notices, but posting requires an active class or subject assignment."
        action={(
          <Button variant="secondary" onClick={() => navigate(ROUTES.TEACHER_NOTICES)}>
            Back to Notices
          </Button>
        )}
      />
    )
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.16), rgba(16, 185, 129, 0.06) 60%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.TEACHER_NOTICES)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            >
              <ArrowLeft size={16} />
              Back to Notices
            </button>
            <h1 className="mt-4 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {isEditing ? 'Edit Notice' : 'Post Notice'}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {isEditing
                ? 'You can update your own notice within the allowed edit window.'
                : 'Class teachers can post for their class, subject teachers can post for assigned classes, and any teacher can target an accessible student.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {classTeacherSections.length ? <Badge variant="green">Class Teacher Targeting Enabled</Badge> : null}
            {assignedSections.length ? <Badge variant="blue">{assignedSections.length} Assigned Section(s)</Badge> : null}
          </div>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        {loadingBase ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isEditing ? (
              <div className="rounded-[22px] border px-4 py-3" style={{ borderColor: '#14b8a655', backgroundColor: 'rgba(20, 184, 166, 0.08)' }}>
                <div className="flex items-start gap-3">
                  <Info size={16} className="mt-0.5" style={{ color: '#0f766e' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Teachers cannot post school-wide notices. Choose a class-teacher class, one of your assigned class/sections, or a single student from your assigned students.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Unit test reminder"
                required
              />
              <Select
                label="Category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                options={CATEGORY_OPTIONS}
                required
              />
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Select
                  label="Target Scope"
                  value={form.target_mode}
                  onChange={(event) => setForm((prev) => ({ ...prev, target_mode: event.target.value, target_key: '', target_student_id: '' }))}
                  options={targetOptions}
                  placeholder="Select notice target"
                  required
                />
                <Select
                  label={form.target_mode === 'student' ? 'Student Class / Section' : 'Target Class / Section'}
                  value={form.target_key}
                  onChange={(event) => setForm((prev) => ({ ...prev, target_key: event.target.value, target_student_id: '' }))}
                  options={sectionOptions}
                  placeholder="Select class and section"
                  required
                />
                {form.target_mode === 'student' ? (
                  <Select
                    label="Student"
                    value={form.target_student_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, target_student_id: event.target.value }))}
                    options={studentOptions}
                    placeholder={loadingStudents ? 'Loading students...' : 'Select student'}
                    required
                  />
                ) : null}
              </div>
            ) : null}

            <Textarea
              label="Content"
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              rows={6}
              placeholder="Write the full notice here."
              required
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {!isEditing ? (
                <Input
                  type="date"
                  label="Publish Date"
                  value={form.publish_date}
                  onChange={(event) => setForm((prev) => ({ ...prev, publish_date: event.target.value }))}
                  required
                />
              ) : null}
              <Input
                type="date"
                label="Expiry Date"
                value={form.expiry_date}
                onChange={(event) => setForm((prev) => ({ ...prev, expiry_date: event.target.value }))}
              />
              <Input
                label="Attachment Path"
                value={form.attachment_path}
                onChange={(event) => setForm((prev) => ({ ...prev, attachment_path: event.target.value }))}
                placeholder="Optional path or link"
                containerClassName={!isEditing ? 'lg:col-span-1' : 'lg:col-span-2'}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => navigate(ROUTES.TEACHER_NOTICES)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {isEditing ? 'Save Changes' : 'Publish Notice'}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default NoticeForm
