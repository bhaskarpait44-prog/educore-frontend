import { useEffect, useMemo, useState } from 'react'
import { BellRing, Send } from 'lucide-react'
import * as accountantApi from '@/api/accountantApi'
import { getClasses, getClassList } from '@/api/classApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

const initialForm = {
  audience: 'all_classes',
  class_id: '',
  student_id: '',
  title: '',
  content: '',
  expiry_date: '',
}

const AccountantNotices = () => {
  usePageTitle('Fee Notices')
  const { toastSuccess, toastError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [notices, setNotices] = useState([])
  const [form, setForm] = useState(initialForm)

  const classOptions = useMemo(() => classes.map((row) => ({ value: String(row.id), label: row.name })), [classes])
  const studentOptions = useMemo(() => students.map((row) => ({
    value: String(row.id || row.student_id),
    label: `${row.student_name || `${row.first_name || ''} ${row.last_name || ''}`.trim()} | ${row.class_name || row.class || ''} ${row.section_name || row.section || ''}`,
  })), [students])

  const load = async () => {
    setLoading(true)
    try {
      const [classesRes, studentsRes, noticesRes] = await Promise.all([
        getClasses(),
        accountantApi.getStudentFeesList({ sort: 'name' }),
        accountantApi.getAccountantNotices(),
      ])
      setClasses(getClassList(classesRes))
      setStudents(studentsRes?.data?.students || studentsRes?.data?.data || [])
      setNotices(noticesRes?.data?.notices || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => toastError('Failed to load fee notices.'))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await accountantApi.createAccountantNotice({
        audience: form.audience,
        class_id: form.audience === 'class' ? Number(form.class_id) : null,
        student_id: form.audience === 'student' ? Number(form.student_id) : null,
        title: form.title.trim(),
        content: form.content.trim(),
        expiry_date: form.expiry_date || null,
      })
      toastSuccess('Fee notice created.')
      setForm(initialForm)
      await load()
    } catch (err) {
      toastError(err?.message || 'Unable to create fee notice.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Fee Notices</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Create fee-only notices for all classes, one class, or one student. These appear in the student portal notice board and notification bell.
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mb-4 flex items-center gap-2">
            <Send size={16} style={{ color: 'var(--color-brand)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Create Notice</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Select
              label="Audience"
              value={form.audience}
              onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value, class_id: '', student_id: '' }))}
              options={[
                { value: 'all_classes', label: 'All Classes' },
                { value: 'class', label: 'Class Wise' },
                { value: 'student', label: 'Student Only' },
              ]}
              required
            />
            {form.audience === 'class' ? (
              <Select label="Class" value={form.class_id} onChange={(event) => setForm((prev) => ({ ...prev, class_id: event.target.value }))} options={classOptions} required />
            ) : null}
            {form.audience === 'student' ? (
              <Select label="Student" value={form.student_id} onChange={(event) => setForm((prev) => ({ ...prev, student_id: event.target.value }))} options={studentOptions} placeholder="Select student" required />
            ) : null}
            <Input label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Fee payment reminder" required />
            <label className="block">
              <span className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Message*</span>
              <textarea
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                className="min-h-32 w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="Write the fee notice message."
                required
              />
            </label>
            <Input type="date" label="Expiry Date" value={form.expiry_date} onChange={(event) => setForm((prev) => ({ ...prev, expiry_date: event.target.value }))} />
            <Button type="submit" variant="primary" loading={saving} className="w-full">Send Fee Notice</Button>
          </form>
        </section>

        <section className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mb-4 flex items-center gap-2">
            <BellRing size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Fee Notices</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />)}
            </div>
          ) : notices.length === 0 ? (
            <EmptyState icon={BellRing} title="No fee notices" description="Fee notices created by accountant users will appear here." />
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => (
                <article key={notice.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="yellow">Fee</Badge>
                    <Badge variant={notice.is_active ? 'green' : 'grey'}>{notice.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Badge variant="blue">{notice.target_scope === 'all_students' ? 'All Classes' : notice.target_student_name || notice.class_name || 'Class'}</Badge>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{notice.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{notice.content}</p>
                  <p className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Read by {notice.student_read_count || 0}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AccountantNotices
