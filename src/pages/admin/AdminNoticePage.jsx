import { useEffect, useMemo, useState, useCallback } from 'react'
import { Bell, Send, Filter, Eye } from 'lucide-react'
import * as teacherControlApi from '@/api/adminTeacherControlApi'
import { getClasses, getSections, getClassList } from '@/api/classApi'
import { getStudents } from '@/api/students'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAuthStore from '@/store/authStore'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'

const AdminNoticePage = () => {
  usePageTitle('Notices')
  const { toastSuccess, toastError } = useToast()
  const { user: currentUser } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [notices, setNotices] = useState([])
  const [sectionsByClass, setSectionsByClass] = useState({})
  const [noticeStudents, setNoticeStudents] = useState([])
  const [filter, setFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit, setLimit] = useState(7)
  const [selectedNotice, setSelectedNotice] = useState(null)

  const [noticeForm, setNoticeForm] = useState({
    audience: 'all_students',
    teacher_id: '',
    class_id: '',
    section_id: '',
    student_id: '',
    category: 'general',
    title: '',
    content: '',
    expiry_date: '',
  })

  const load = useCallback(async (currentFilter = filter) => {
    setLoading(true)
    try {
      const params = { limit }
      if (currentFilter === 'teacher') params.role = 'teacher'
      else if (currentFilter === 'accountant') params.role = 'accountant'
      else if (currentFilter === 'myself') params.teacher_id = currentUser.id

      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const [noticesRes, teachersRes, classesRes] = await Promise.all([
        teacherControlApi.getTeacherControlNotices(params),
        teacherControlApi.getTeacherControlTeachers(),
        getClasses(),
      ])
      setNotices(noticesRes?.data?.notices || [])
      setTeachers(teachersRes?.data?.teachers || [])
      setClasses(getClassList(classesRes))
    } catch (err) {
      toastError('Failed to load notices.')
    } finally {
      setLoading(false)
    }
  }, [filter, startDate, endDate, limit, currentUser.id, toastError])

  useEffect(() => {
    load()
  }, [load])

  const ensureClassMeta = async (classId) => {
    if (!classId) return
    if (!sectionsByClass[classId]) {
      const r = await getSections(classId)
      setSectionsByClass((p) => ({ ...p, [classId]: Array.isArray(r?.data) ? r.data : (r?.data?.sections || []) }))
    }
  }

  useEffect(() => {
    ensureClassMeta(noticeForm.class_id).catch(() => {})
  }, [noticeForm.class_id])

  useEffect(() => {
    if (noticeForm.audience !== 'student' && noticeForm.audience !== 'section' && noticeForm.audience !== 'class') return
    getStudents({
      class_id: noticeForm.class_id || undefined,
      section_id: noticeForm.section_id || undefined,
      perPage: 100,
    })
      .then((res) => setNoticeStudents(res?.data?.students || res?.data?.data || []))
      .catch(() => setNoticeStudents([]))
  }, [noticeForm.audience, noticeForm.class_id, noticeForm.section_id])

  const classOptions = useMemo(() => classes.map((r) => ({ value: String(r.id), label: r.name })), [classes])
  const teacherOptions = useMemo(() => teachers.map((r) => ({ value: String(r.id), label: r.name })), [teachers])
  const noticeSectionOpts = useMemo(() => (sectionsByClass[noticeForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [sectionsByClass, noticeForm.class_id])
  const noticeStudentOptions = useMemo(() => noticeStudents.map((s) => ({
    value: String(s.id),
    label: `${s.first_name} ${s.last_name} | ${s.class || ''} ${s.section || ''} | Roll ${s.roll_number || '--'}`,
  })), [noticeStudents])

  const handleNoticeCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: noticeForm.title.trim(),
        content: noticeForm.content.trim(),
        category: noticeForm.category,
        expiry_date: noticeForm.expiry_date || null,
      }

      if (noticeForm.audience === 'all_teachers') payload.target_scope = 'teachers'
      if (noticeForm.audience === 'teacher') {
        payload.target_scope = 'specific_teacher'
        payload.target_teacher_id = Number(noticeForm.teacher_id)
      }
      if (noticeForm.audience === 'all_students') payload.target_scope = 'all_students'
      if (noticeForm.audience === 'class') {
        payload.target_scope = 'specific_section'
        payload.class_id = Number(noticeForm.class_id)
      }
      if (noticeForm.audience === 'section') {
        payload.target_scope = 'specific_section'
        payload.class_id = Number(noticeForm.class_id)
        payload.section_id = Number(noticeForm.section_id)
      }
      if (noticeForm.audience === 'student') {
        payload.target_scope = 'specific_student'
        payload.target_student_id = Number(noticeForm.student_id)
      }

      await teacherControlApi.createTeacherControlNotice(payload)
      toastSuccess('Notice sent.')
      setNoticeForm({ audience: 'all_students', teacher_id: '', class_id: '', section_id: '', student_id: '', category: 'general', title: '', content: '', expiry_date: '' })
      await load()
    } catch (err) {
      toastError(err?.message || 'Unable to send notice.')
    } finally {
      setSaving(false)
    }
  }

  const toggleNotice = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlNotice(item.id, { is_active: !item.is_active })
      toastSuccess('Notice updated.')
      await load()
    } catch (err) {
      toastError(err?.message || 'Failed to update notice.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>School Notices</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Create and manage announcements for students and teachers.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mb-4 flex items-center gap-2">
            <Send size={15} style={{ color: '#0f766e' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Create Notice</h2>
          </div>
          <form className="space-y-3" onSubmit={handleNoticeCreate}>
            <Select
              label="Send To"
              value={noticeForm.audience}
              onChange={(e) => setNoticeForm((p) => ({ ...p, audience: e.target.value, teacher_id: '', class_id: '', section_id: '', student_id: '' }))}
              options={[
                { value: 'all_students', label: 'All Students' },
                { value: 'class', label: 'Class Wise' },
                { value: 'section', label: 'Section Wise' },
                { value: 'student', label: 'Student Wise' },
                { value: 'all_teachers', label: 'All Teachers' },
                { value: 'teacher', label: 'Teacher Wise' },
              ]}
              required
            />

            {noticeForm.audience === 'teacher' && (
              <Select label="Teacher" value={noticeForm.teacher_id} onChange={(e) => setNoticeForm((p) => ({ ...p, teacher_id: e.target.value }))} options={teacherOptions} required />
            )}

            {['class', 'section', 'student'].includes(noticeForm.audience) && (
              <Select label="Class" value={noticeForm.class_id} onChange={(e) => setNoticeForm((p) => ({ ...p, class_id: e.target.value, section_id: '', student_id: '' }))} options={classOptions} required={noticeForm.audience !== 'student'} />
            )}

            {['section', 'student'].includes(noticeForm.audience) && noticeForm.class_id && (
              <Select label="Section" value={noticeForm.section_id} onChange={(e) => setNoticeForm((p) => ({ ...p, section_id: e.target.value, student_id: '' }))} options={noticeSectionOpts} required={noticeForm.audience === 'section'} />
            )}

            {noticeForm.audience === 'student' && (
              <Select label="Student" value={noticeForm.student_id} onChange={(e) => setNoticeForm((p) => ({ ...p, student_id: e.target.value }))} options={noticeStudentOptions} placeholder="Select student" required />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Category"
                value={noticeForm.category}
                onChange={(e) => setNoticeForm((p) => ({ ...p, category: e.target.value }))}
                options={[
                  { value: 'general', label: 'General' },
                  { value: 'exam', label: 'Exam' },
                  { value: 'event', label: 'Event' },
                  { value: 'holiday', label: 'Holiday' },
                  { value: 'homework', label: 'Homework' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Input type="date" label="Expiry Date" value={noticeForm.expiry_date} onChange={(e) => setNoticeForm((p) => ({ ...p, expiry_date: e.target.value }))} />
            </div>

            <Input label="Title" value={noticeForm.title} onChange={(e) => setNoticeForm((p) => ({ ...p, title: e.target.value }))} placeholder="Notice title" required />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Message</span>
              <textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm((p) => ({ ...p, content: e.target.value }))}
                className="min-h-32 w-full rounded-2xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="Write notice message"
                required
              />
            </label>
            <Button type="submit" variant="primary" loading={saving} className="w-full">Send Notice</Button>
          </form>
        </section>

        <section className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: 'var(--color-text-secondary)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notice History</h2>
                {notices.length > 0 && (
                  <span className="ml-2 rounded-xl px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>{notices.length}</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-900/20">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-xl border bg-transparent px-3 py-1.5 text-xs font-medium outline-none transition-all focus:ring-2"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', focusRingColor: 'var(--color-brand)' }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-xl border bg-transparent px-3 py-1.5 text-xs font-medium outline-none transition-all focus:ring-2"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', focusRingColor: 'var(--color-brand)' }}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter By</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full rounded-xl border bg-transparent px-3 py-1.5 text-xs font-medium outline-none transition-all focus:ring-2"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', focusRingColor: 'var(--color-brand)' }}
                >
                  <option value="all">All Notices</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="accountant">Accountants Only</option>
                  <option value="myself">My Notices</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Show</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="block w-full rounded-xl border bg-transparent px-3 py-1.5 text-xs font-medium outline-none transition-all focus:ring-2"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', focusRingColor: 'var(--color-brand)' }}
                >
                  <option value={7}>Last 7</option>
                  <option value={15}>Last 15</option>
                  <option value={30}>Last 30</option>
                  <option value={50}>Last 50</option>
                  <option value={100}>Last 100</option>
                </select>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="h-[34px] !rounded-xl"
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setFilter('all')
                  setLimit(7)
                }}
              >
                Reset
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-[22px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
              ))}
            </div>
          ) : !notices.length ? (
            <EmptyState icon={Bell} title="No notices" description="Notices sent by admin and teachers will appear here." />
          ) : (
            <div className="space-y-3">
              {notices.map((item) => (
                <div key={item.id} className="rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.is_active ? 'green' : 'grey'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
                        <Badge variant="blue">{formatNoticeAudience(item)}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
                      <div className="mt-1">
                        <p className="line-clamp-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.content}</p>
                        {item.content?.length > 120 && (
                          <button
                            onClick={() => setSelectedNotice(item)}
                            className="mt-2 flex items-center gap-1.5 text-[10px] font-bold transition-all hover:opacity-70"
                            style={{ color: 'var(--color-brand)' }}
                          >
                            <Eye size={12} strokeWidth={2.5} />
                            <span className="underline decoration-1 underline-offset-2">Read More</span>
                          </button>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>By:</span> {item.teacher_name} ({item.teacher_role})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category:</span> {item.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Published:</span> {formatDateTime(item.publish_date)}
                        </span>
                        <span className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                          <span className="font-bold" style={{ color: 'var(--color-brand)' }}>
                            {Number(item.teacher_read_count || 0) + Number(item.student_read_count || 0)}
                          </span>
                          <span>Views</span>
                        </span>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => toggleNotice(item)} disabled={saving}>
                      {item.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={!!selectedNotice}
        onClose={() => setSelectedNotice(null)}
        title="Notice Details"
        size="lg"
      >
        {selectedNotice && (
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={selectedNotice.is_active ? 'green' : 'grey'}>{selectedNotice.is_active ? 'Active' : 'Inactive'}</Badge>
                <Badge variant="blue">{formatNoticeAudience(selectedNotice)}</Badge>
                <Badge variant="purple">{selectedNotice.category}</Badge>
              </div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{selectedNotice.title}</h3>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Published on {formatDateTime(selectedNotice.publish_date)} by {selectedNotice.teacher_name} ({selectedNotice.teacher_role})
              </p>
            </div>
            
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {selectedNotice.content}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Teacher Views: <strong>{selectedNotice.teacher_read_count || 0}</strong></span>
              <span>Student Views: <strong>{selectedNotice.student_read_count || 0}</strong></span>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const formatNoticeAudience = (item) => {
  const scope = item.target_scope
  if (scope === 'whole_school') return 'Whole School (Students & Teachers)'
  if (scope === 'teachers') return 'All Teachers'
  if (scope === 'specific_teacher') return `Teacher: ${item.target_teacher_name || 'Selected Teacher'}`
  if (scope === 'all_students') return 'All Students'
  if (scope === 'specific_student') return `Student: ${item.target_student_name || 'Selected Student'}`
  if (scope === 'specific_subject') return `Subject: ${item.subject_name || 'Subject'} (${item.class_name || ''} ${item.section_name || ''})`.trim()
  if (scope === 'specific_section') return `Section: ${item.class_name || ''} ${item.section_name || ''}`.trim()
  if (scope === 'whole_class' || scope === 'my_class_only') return `Class: ${item.class_name || ''} ${item.section_name || ''}`.trim()
  return 'General Notice'
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default AdminNoticePage
