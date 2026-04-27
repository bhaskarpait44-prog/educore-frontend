import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'

const EMPTY_FORM = {
  section_key: '',
  subject_id: '',
  title: '',
  description: '',
  due_date: new Date().toISOString().slice(0, 10),
  submission_type: 'written',
  max_marks: '',
  attachment_path: '',
  status: 'active',
}

const HomeworkForm = ({
  open,
  onClose,
  onSubmit,
  loading,
  sections,
  getSectionSubjects,
  initialData = null,
}) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [subjectOptions, setSubjectOptions] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  useEffect(() => {
    if (!open) return

    if (initialData) {
      setForm({
        section_key: `${initialData.class_id}:${initialData.section_id}`,
        subject_id: String(initialData.subject_id || ''),
        title: initialData.title || '',
        description: initialData.description || '',
        due_date: initialData.due_date || new Date().toISOString().slice(0, 10),
        submission_type: initialData.submission_type || 'written',
        max_marks: initialData.max_marks ?? '',
        attachment_path: initialData.attachment_path || '',
        status: initialData.status || 'active',
      })
      return
    }

    const firstSection = sections[0]
    setForm({
      ...EMPTY_FORM,
      section_key: firstSection ? `${firstSection.class_id}:${firstSection.section_id}` : '',
    })
  }, [open, initialData, sections])

  useEffect(() => {
    let active = true

    const loadSubjects = async () => {
      if (!open || !form.section_key) {
        setSubjectOptions([])
        return
      }

      const section = sections.find((item) => `${item.class_id}:${item.section_id}` === form.section_key)
      if (!section) {
        setSubjectOptions([])
        return
      }

      setLoadingSubjects(true)
      try {
        const rows = await getSectionSubjects({
          classId: section.class_id,
          sectionId: section.section_id,
          isClassTeacher: section.is_class_teacher,
        })

        if (!active) return

        const options = rows.map((subject) => ({
          value: String(subject.id),
          label: subject.code ? `${subject.name} (${subject.code})` : subject.name,
        }))
        setSubjectOptions(options)

        setForm((prev) => ({
          ...prev,
          subject_id: options.some((option) => option.value === prev.subject_id)
            ? prev.subject_id
            : (options[0]?.value || ''),
        }))
      } finally {
        if (active) setLoadingSubjects(false)
      }
    }

    loadSubjects().catch(() => {
      if (active) setLoadingSubjects(false)
    })

    return () => { active = false }
  }, [form.section_key, getSectionSubjects, open, sections])

  const selectedSection = useMemo(() => (
    sections.find((item) => `${item.class_id}:${item.section_id}` === form.section_key) || null
  ), [form.section_key, sections])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedSection) return

    await onSubmit({
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      subject_id: Number(form.subject_id),
      title: form.title.trim(),
      description: form.description.trim(),
      due_date: form.due_date,
      submission_type: form.submission_type,
      max_marks: form.max_marks === '' ? null : Number(form.max_marks),
      attachment_path: form.attachment_path.trim() || null,
      ...(initialData ? { status: form.status } : {}),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Homework' : 'Assign Homework'}
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {initialData ? 'Save Changes' : 'Assign Homework'}
          </Button>
        </>
      )}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {selectedSection ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={selectedSection.is_class_teacher ? 'green' : 'blue'}>
              {selectedSection.is_class_teacher ? 'Class Teacher Access' : 'Subject Teacher Access'}
            </Badge>
            <Badge variant="grey">{selectedSection.class_name} {selectedSection.section_name}</Badge>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Class and Section"
            value={form.section_key}
            onChange={(event) => setForm((prev) => ({ ...prev, section_key: event.target.value, subject_id: '' }))}
            options={sections.map((section) => ({ value: `${section.class_id}:${section.section_id}`, label: section.label }))}
            disabled={Boolean(initialData)}
            required
          />
          <Select
            label="Subject"
            value={form.subject_id}
            onChange={(event) => setForm((prev) => ({ ...prev, subject_id: event.target.value }))}
            options={subjectOptions}
            placeholder={loadingSubjects ? 'Loading subjects...' : 'Select subject'}
            disabled={loadingSubjects || Boolean(initialData)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Chapter 4 worksheet"
            required
          />
          <Input
            type="date"
            label="Due Date"
            value={form.due_date}
            onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
            required
          />
        </div>

        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          rows={4}
          placeholder="Write the instructions students should follow."
          required
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Submission Type"
            value={form.submission_type}
            onChange={(event) => setForm((prev) => ({ ...prev, submission_type: event.target.value }))}
            options={[
              { value: 'written', label: 'Written' },
              { value: 'online', label: 'Online' },
              { value: 'both', label: 'Both' },
            ]}
            required
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            label="Max Marks"
            value={form.max_marks}
            onChange={(event) => setForm((prev) => ({ ...prev, max_marks: event.target.value }))}
            placeholder="Optional"
          />
          {initialData ? (
            <Select
              label="Status"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          ) : (
            <Input
              label="Attachment Path"
              value={form.attachment_path}
              onChange={(event) => setForm((prev) => ({ ...prev, attachment_path: event.target.value }))}
              placeholder="Optional link or file path"
            />
          )}
        </div>

        {initialData ? (
          <Input
            label="Attachment Path"
            value={form.attachment_path}
            onChange={(event) => setForm((prev) => ({ ...prev, attachment_path: event.target.value }))}
            placeholder="Optional link or file path"
          />
        ) : null}
      </form>
    </Modal>
  )
}

export default HomeworkForm
