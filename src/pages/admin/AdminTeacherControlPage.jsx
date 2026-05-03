import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell, BookOpenText, CalendarRange, ChevronDown, ChevronRight, Clock,
  Grid3x3, School2, Send, ShieldCheck, UserRoundCheck, Users, Zap,
} from 'lucide-react'
import * as teacherControlApi from '@/api/adminTeacherControlApi'
import { getClasses, getClassList, getSections } from '@/api/classApi'
import { getSubjects } from '@/api/classApi'
import { getStudents } from '@/api/students'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'

const DAY_OPTIONS = [
  { value: 'monday',    label: 'Mon' },
  { value: 'tuesday',   label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday',  label: 'Thu' },
  { value: 'friday',    label: 'Fri' },
  { value: 'saturday',  label: 'Sat' },
]

const DAY_FULL = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

const PERIOD_TIMES = {
  1: '08:00–08:45', 2: '08:45–09:30', 3: '09:30–10:15',
  4: '10:30–11:15', 5: '11:15–12:00', 6: '12:30–13:15', 7: '13:15–14:00',
}

const SUBJECT_COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
]

/* ─── helpers ─── */
const subjectColor = (id) => SUBJECT_COLORS[(id || 0) % SUBJECT_COLORS.length]

/* ════════════════════════════════════════════════════════════════════════════
   Main page
════════════════════════════════════════════════════════════════════════════ */
const AdminTeacherControlPage = () => {
  const location = useLocation()
  const isNoticeRoute = location.pathname === ROUTES.ADMIN_NOTICES
  usePageTitle(isNoticeRoute ? 'Notices' : 'Teacher Control')
  const { toastSuccess, toastError } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [session, setSession] = useState(null)
  const [overview, setOverview]     = useState({})
  const [teachers, setTeachers]     = useState([])
  const [classes,  setClasses]      = useState([])
  const [sectionsByClass, setSectionsByClass] = useState({})
  const [subjectsByClass, setSubjectsByClass] = useState({})
  const [assignments, setAssignments] = useState([])
  const [timetable,   setTimetable]   = useState([])
  const [leaves,      setLeaves]      = useState([])
  const [corrections, setCorrections] = useState([])
  const [homework,    setHomework]    = useState([])
  const [notices,     setNotices]     = useState([])
  const [noticeStudents, setNoticeStudents] = useState([])

  const [tab, setTab] = useState(isNoticeRoute ? 'notices' : 'assignments')

  useEffect(() => {
    if (isNoticeRoute) setTab('notices')
  }, [isNoticeRoute])

  /* timetable view mode */
  const [ttView, setTtView]       = useState('grid') // 'grid' | 'list'
  const [ttFilterClass, setTtFilterClass]     = useState('')
  const [ttFilterSection, setTtFilterSection] = useState('')
  const [ttFilterTeacher, setTtFilterTeacher] = useState('')

  /* assignment filter */
  const [aFilterClass, setAFilterClass]     = useState('')
  const [aFilterSection, setAFilterSection] = useState('')

  /* forms */
  const [assignmentForm, setAssignmentForm] = useState({
    teacher_id: '', class_id: '', section_id: '', subject_id: '', is_class_teacher: false,
  })
  const [slotForm, setSlotForm] = useState({
    teacher_id: '', class_id: '', section_id: '', subject_id: '',
    day_of_week: 'monday', period_number: '1',
    start_time: '08:00', end_time: '08:45', room_number: '',
  })
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [showSlotForm,   setShowSlotForm]   = useState(false)
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

  /* ── load ── */
  const load = async () => {
    setLoading(true)
    try {
      const [
        overviewRes, assignmentsRes, timetableRes, homeworkRes,
        noticesRes, leaveRes, correctionsRes, teachersRes, classesRes,
      ] = await Promise.all([
        teacherControlApi.getTeacherControlOverview(),
        teacherControlApi.getTeacherControlAssignments(),
        teacherControlApi.getTeacherControlTimetable(),
        teacherControlApi.getTeacherControlHomework(),
        teacherControlApi.getTeacherControlNotices(),
        teacherControlApi.getTeacherControlLeave(),
        teacherControlApi.getTeacherControlCorrections(),
        teacherControlApi.getTeacherControlTeachers(),
        getClasses(),
      ])
      setSession(overviewRes?.data?.session || null)
      setOverview(overviewRes?.data?.counts  || {})
      setAssignments(assignmentsRes?.data?.assignments || [])
      setTimetable(timetableRes?.data?.timetable || [])
      setHomework(homeworkRes?.data?.homework || [])
      setNotices(noticesRes?.data?.notices || [])
      setLeaves(leaveRes?.data?.applications || [])
      setCorrections(correctionsRes?.data?.requests || [])
      setTeachers(teachersRes?.data?.teachers || [])
      setClasses(getClassList(classesRes))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch(() => toastError('Failed to load.')) }, [])

  /* ── lazy load sections/subjects ── */
  const ensureClassMeta = async (classId) => {
    if (!classId) return
    if (!sectionsByClass[classId]) {
      const r = await getSections(classId)
      setSectionsByClass((p) => ({ ...p, [classId]: Array.isArray(r?.data) ? r.data : (r?.data?.sections || []) }))
    }
    if (!subjectsByClass[classId]) {
      const r = await getSubjects(classId)
      setSubjectsByClass((p) => ({ ...p, [classId]: Array.isArray(r?.data) ? r.data : (r?.data?.subjects || []) }))
    }
  }
  useEffect(() => { ensureClassMeta(assignmentForm.class_id).catch(() => {}) }, [assignmentForm.class_id])
  useEffect(() => { ensureClassMeta(slotForm.class_id).catch(() => {}) },       [slotForm.class_id])
  useEffect(() => { ensureClassMeta(noticeForm.class_id).catch(() => {}) },      [noticeForm.class_id])
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

  /* ── derived options ── */
  const classOptions   = useMemo(() => classes.map((r) => ({ value: String(r.id), label: r.name })), [classes])
  const teacherOptions = useMemo(() => teachers.map((r) => ({ value: String(r.id), label: r.name })), [teachers])

  const aSection = useMemo(() => (sectionsByClass[assignmentForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [sectionsByClass, assignmentForm.class_id])
  const aSubject = useMemo(() => (subjectsByClass[assignmentForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [subjectsByClass, assignmentForm.class_id])

  const slotSectionOpts  = useMemo(() => (sectionsByClass[slotForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [sectionsByClass, slotForm.class_id])
  const noticeSectionOpts = useMemo(() => (sectionsByClass[noticeForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [sectionsByClass, noticeForm.class_id])
  const noticeStudentOptions = useMemo(() => noticeStudents.map((s) => ({
    value: String(s.id),
    label: `${s.first_name} ${s.last_name} | ${s.class || ''} ${s.section || ''} | Roll ${s.roll_number || '--'}`,
  })), [noticeStudents])
  const slotSubjectOpts  = useMemo(() => assignments.filter((a) =>
    !a.is_class_teacher && a.is_active &&
    (!slotForm.teacher_id || String(a.teacher_id) === String(slotForm.teacher_id)) &&
    (!slotForm.class_id   || String(a.class_id)   === String(slotForm.class_id))   &&
    (!slotForm.section_id || String(a.section_id) === String(slotForm.section_id))
  ).map((a) => ({ value: String(a.subject_id), label: a.subject_name })), [assignments, slotForm])

  /* ── assignment groups ── */
  const assignmentsByClass = useMemo(() => {
    const groups = new Map()
    assignments.forEach((item) => {
      const key = `${item.class_id}:${item.section_id}`
      if (!groups.has(key)) groups.set(key, { key, class_name: item.class_name, section_name: item.section_name, session_name: item.session_name, classTeacher: null, subjectTeachers: [], inactiveCount: 0 })
      const g = groups.get(key)
      if (!item.is_active) g.inactiveCount++
      if (item.is_class_teacher) g.classTeacher = item
      else g.subjectTeachers.push(item)
    })
    return Array.from(groups.values())
      .map((g) => ({ ...g, subjectTeachers: g.subjectTeachers.sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || '')) }))
      .sort((a, b) => (a.class_name || '').localeCompare(b.class_name || '') || (a.section_name || '').localeCompare(b.section_name || ''))
  }, [assignments])

  const filteredGroups = useMemo(() => assignmentsByClass.filter((g) =>
    (!aFilterClass   || String(g.class_id)   === aFilterClass) &&
    (!aFilterSection || String(g.section_id) === aFilterSection)
  ), [assignmentsByClass, aFilterClass, aFilterSection])

  /* ── timetable grid ── */
  const filteredSlots = useMemo(() => timetable.filter((s) =>
    (!ttFilterClass   || String(s.class_id)   === ttFilterClass)   &&
    (!ttFilterSection || String(s.section_id) === ttFilterSection) &&
    (!ttFilterTeacher || String(s.teacher_id) === ttFilterTeacher)
  ), [timetable, ttFilterClass, ttFilterSection, ttFilterTeacher])

  /* grid: day × period matrix */
  const ttMatrix = useMemo(() => {
    const matrix = {}
    filteredSlots.forEach((s) => {
      const day = s.day_of_week
      const p   = s.period_number
      if (!matrix[day]) matrix[day] = {}
      if (!matrix[day][p]) matrix[day][p] = []
      matrix[day][p].push(s)
    })
    return matrix
  }, [filteredSlots])

  /* ── actions ── */
  const handleAssignmentCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await teacherControlApi.createTeacherControlAssignment({
        teacher_id: Number(assignmentForm.teacher_id),
        class_id:   Number(assignmentForm.class_id),
        section_id: Number(assignmentForm.section_id),
        subject_id: assignmentForm.is_class_teacher ? null : Number(assignmentForm.subject_id),
        is_class_teacher: assignmentForm.is_class_teacher,
      })
      toastSuccess('Assignment created.')
      setAssignmentForm({ teacher_id: '', class_id: '', section_id: '', subject_id: '', is_class_teacher: false })
      setShowAssignForm(false)
      await load()
    } catch (err) { toastError(err?.message || 'Unable to create.') }
    finally { setSaving(false) }
  }

  const toggleAssignment = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlAssignment(item.id, { is_active: !item.is_active })
      toastSuccess('Updated.')
      await load()
    } catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const handleSlotCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await teacherControlApi.createTeacherControlTimetableSlot({
        teacher_id:    Number(slotForm.teacher_id),
        class_id:      Number(slotForm.class_id),
        section_id:    Number(slotForm.section_id),
        subject_id:    Number(slotForm.subject_id),
        day_of_week:   slotForm.day_of_week,
        period_number: Number(slotForm.period_number),
        start_time:    slotForm.start_time,
        end_time:      slotForm.end_time,
        room_number:   slotForm.room_number || null,
      })
      toastSuccess('Slot created.')
      setSlotForm((p) => ({ ...p, section_id: '', subject_id: '', room_number: '' }))
      setShowSlotForm(false)
      await load()
    } catch (err) { toastError(err?.message || 'Unable to create.') }
    finally { setSaving(false) }
  }

  const toggleSlot = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlTimetableSlot(item.id, { is_active: !item.is_active })
      toastSuccess('Updated.')
      await load()
    } catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const reviewLeave = async (item, status) => {
    setSaving(true)
    try { await teacherControlApi.reviewTeacherControlLeave(item.id, { status }); toastSuccess(`Leave ${status}.`); await load() }
    catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const reviewCorrection = async (item, status) => {
    setSaving(true)
    try { await teacherControlApi.reviewTeacherControlCorrection(item.id, { status }); toastSuccess(`Correction ${status}.`); await load() }
    catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const toggleNotice = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlNotice(item.id, { is_active: !item.is_active })
      toastSuccess('Notice updated.')
      await load()
    } catch (err) { toastError(err?.message || 'Failed to update notice.') }
    finally { setSaving(false) }
  }

  const handleNoticeCreate = async (e) => {
    e.preventDefault(); setSaving(true)
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
    } catch (err) { toastError(err?.message || 'Unable to send notice.') }
    finally { setSaving(false) }
  }

  /* ── render ── */
  return (
    <div className="space-y-5 pb-20">

      {/* ── Hero ── */}
      <header className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', background: 'linear-gradient(135deg,rgba(2,132,199,.14),rgba(13,148,136,.09) 60%,var(--color-surface))' }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#0369a1' }}>
              {session?.name || '—'}
            </p>
            <h1 className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Teacher Control Center</h1>
            <p className="mt-1 max-w-xl text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Manage assignments, timetable, leave approvals and correction requests from one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[320px]">
            <HeroStat label="Teachers"    value={overview.teachers            || 0} color="#0369a1" />
            <HeroStat label="Assignments" value={overview.active_assignments  || 0} color="#0f766e" />
            <HeroStat label="Leaves"      value={overview.pending_leaves      || 0} color="#d97706" />
            <HeroStat label="Corrections" value={overview.pending_corrections || 0} color="#dc2626" />
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav className="flex flex-wrap gap-2">
        {[
          { id: 'assignments', label: 'Assignments', icon: School2 },
          { id: 'timetable',   label: 'Timetable',   icon: CalendarRange },
          { id: 'notices',     label: 'Notices',     icon: Bell },
          { id: 'workflows',   label: 'Workflows',    icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id} type="button" onClick={() => setTab(id)}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all"
            style={{
              backgroundColor: tab === id ? '#0f766e' : 'var(--color-surface)',
              color: tab === id ? '#fff' : 'var(--color-text-primary)',
              border: `1px solid ${tab === id ? '#0f766e' : 'var(--color-border)'}`,
            }}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </nav>

      {/* ════════════════════════════════════════
          TAB: ASSIGNMENTS
      ════════════════════════════════════════ */}
      {tab === 'assignments' && (
        <div className="space-y-4">

          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <SmallSelect
                value={aFilterClass}
                onChange={(e) => { setAFilterClass(e.target.value); setAFilterSection('') }}
                options={[{ value: '', label: 'All Classes' }, ...classOptions]}
              />
              {aFilterClass && (
                <SmallSelect
                  value={aFilterSection}
                  onChange={(e) => setAFilterSection(e.target.value)}
                  options={[{ value: '', label: 'All Sections' }, ...(sectionsByClass[aFilterClass] || []).map((s) => ({ value: String(s.id), label: s.name }))]}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAssignForm((p) => !p)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all"
              style={{ backgroundColor: '#0f766e', color: '#fff', border: 'none' }}
            >
              <Zap size={14} />{showAssignForm ? 'Cancel' : 'New Assignment'}
            </button>
          </div>

          {/* create form */}
          {showAssignForm && (
            <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Create Assignment</p>
              <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" onSubmit={handleAssignmentCreate}>
                <Select label="Teacher" value={assignmentForm.teacher_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, teacher_id: e.target.value }))} options={teacherOptions} required />
                <Select label="Class"   value={assignmentForm.class_id}   onChange={(e) => setAssignmentForm((p) => ({ ...p, class_id: e.target.value, section_id: '', subject_id: '' }))} options={classOptions} required />
                <Select label="Section" value={assignmentForm.section_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, section_id: e.target.value }))} options={aSection} required />
                <Select label="Subject" value={assignmentForm.subject_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, subject_id: e.target.value }))} options={aSubject} disabled={assignmentForm.is_class_teacher} placeholder={assignmentForm.is_class_teacher ? 'N/A for class teacher' : 'Select subject'} />
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentForm((p) => ({ ...p, is_class_teacher: !p.is_class_teacher, subject_id: '' }))}
                    className="flex-1 min-h-11 rounded-2xl px-3 text-xs font-semibold transition-all"
                    style={{ backgroundColor: assignmentForm.is_class_teacher ? '#0f766e' : 'var(--color-surface-raised)', color: assignmentForm.is_class_teacher ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  >
                    {assignmentForm.is_class_teacher ? 'Class Teacher' : 'Subject Teacher'}
                  </button>
                  <Button type="submit" variant="primary" loading={saving}>Add</Button>
                </div>
              </form>
            </div>
          )}

          {/* assignment list */}
          {loading ? <GridSkeleton /> : !filteredGroups.length ? (
            <EmptyState icon={School2} title="No assignments" description="Create a teacher assignment to get started." />
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => (
                <AssignmentCard key={group.key} group={group} onToggle={toggleAssignment} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: TIMETABLE
      ════════════════════════════════════════ */}
      {tab === 'timetable' && (
        <div className="space-y-4">

          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SmallSelect value={ttFilterClass} onChange={(e) => { setTtFilterClass(e.target.value); setTtFilterSection('') }} options={[{ value: '', label: 'All Classes' }, ...classOptions]} />
              {ttFilterClass && (
                <SmallSelect value={ttFilterSection} onChange={(e) => setTtFilterSection(e.target.value)} options={[{ value: '', label: 'All Sections' }, ...(sectionsByClass[ttFilterClass] || []).map((s) => ({ value: String(s.id), label: s.name }))]} />
              )}
              <SmallSelect value={ttFilterTeacher} onChange={(e) => setTtFilterTeacher(e.target.value)} options={[{ value: '', label: 'All Teachers' }, ...teacherOptions]} />
              {/* view toggle */}
              <div className="flex overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                {[{ id: 'grid', Icon: Grid3x3 }, { id: 'list', Icon: CalendarRange }].map(({ id, Icon }) => (
                  <button key={id} type="button" onClick={() => setTtView(id)}
                    className="flex min-h-9 items-center gap-1.5 px-3 text-xs font-semibold transition-all"
                    style={{ backgroundColor: ttView === id ? '#0f766e' : 'var(--color-surface)', color: ttView === id ? '#fff' : 'var(--color-text-secondary)' }}>
                    <Icon size={13} />{id === 'grid' ? 'Grid' : 'List'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSlotForm((p) => !p)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
              style={{ backgroundColor: '#0f766e', color: '#fff', border: 'none' }}
            >
              <Zap size={14} />{showSlotForm ? 'Cancel' : 'New Slot'}
            </button>
          </div>

          {/* slot form */}
          {showSlotForm && (
            <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Create Timetable Slot</p>
              <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={handleSlotCreate}>
                <Select label="Teacher" value={slotForm.teacher_id} onChange={(e) => setSlotForm((p) => ({ ...p, teacher_id: e.target.value, subject_id: '' }))} options={teacherOptions} required />
                <Select label="Class"   value={slotForm.class_id}   onChange={(e) => setSlotForm((p) => ({ ...p, class_id: e.target.value, section_id: '', subject_id: '' }))} options={classOptions} required />
                <Select label="Section" value={slotForm.section_id} onChange={(e) => setSlotForm((p) => ({ ...p, section_id: e.target.value, subject_id: '' }))} options={slotSectionOpts} required />
                <Select label="Subject" value={slotForm.subject_id} onChange={(e) => setSlotForm((p) => ({ ...p, subject_id: e.target.value }))} options={slotSubjectOpts} placeholder="Select assigned subject" required />
                <Select label="Day" value={slotForm.day_of_week} onChange={(e) => setSlotForm((p) => ({ ...p, day_of_week: e.target.value }))} options={DAY_OPTIONS.map((d) => ({ value: d.value, label: DAY_FULL[d.value] }))} required />
                <Input type="number" label="Period #" value={slotForm.period_number} onChange={(e) => setSlotForm((p) => ({ ...p, period_number: e.target.value }))} min="1" max="10" required />
                <Input type="time"   label="Start"    value={slotForm.start_time}    onChange={(e) => setSlotForm((p) => ({ ...p, start_time: e.target.value }))} required />
                <Input type="time"   label="End"      value={slotForm.end_time}      onChange={(e) => setSlotForm((p) => ({ ...p, end_time: e.target.value }))} required />
                <div className="sm:col-span-2 xl:col-span-3">
                  <Input label="Room (optional)" value={slotForm.room_number} onChange={(e) => setSlotForm((p) => ({ ...p, room_number: e.target.value }))} placeholder="e.g. 6-A" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" loading={saving} className="w-full">Add Slot</Button>
                </div>
              </form>
            </div>
          )}

          {/* timetable view */}
          {loading ? <GridSkeleton /> : !filteredSlots.length ? (
            <EmptyState icon={CalendarRange} title="No timetable slots" description="Add slots or adjust your filters." />
          ) : ttView === 'grid' ? (
            <TimetableGrid matrix={ttMatrix} onToggle={toggleSlot} />
          ) : (
            <TimetableList slots={filteredSlots} onToggle={toggleSlot} />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: WORKFLOWS
      ════════════════════════════════════════ */}
      {tab === 'notices' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
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

          <WorkflowSection title="Notice History" icon={Bell} items={notices} loading={loading}
            renderItem={(item) => (
              <div key={item.id} className="rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.is_active ? 'green' : 'grey'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
                      <Badge variant="blue">{formatNoticeAudience(item)}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.content}</p>
                    <p className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {item.category} | {formatDateTime(item.publish_date)} | Reads {Number(item.teacher_read_count || 0) + Number(item.student_read_count || 0)}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => toggleNotice(item)} disabled={saving}>
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            )}
            emptyTitle="No notices" emptyDesc="Notices sent by admin and teachers will appear here."
          />
        </div>
      )}

      {tab === 'workflows' && (
        <div className="space-y-4">
          <WorkflowSection title="Leave Approval Queue" icon={UserRoundCheck} items={leaves} loading={loading}
            renderItem={(item) => (
              <WorkflowCard key={item.id}
                title={`${item.teacher_name} • ${(item.leave_type || '').replace('_', ' ')}`}
                meta={`${item.from_date} → ${item.to_date} | ${Number(item.days_count || 0)} day(s)`}
                description={item.reason} status={item.status}
                onApprove={item.status === 'pending' ? () => reviewLeave(item, 'approved') : null}
                onReject={item.status  === 'pending' ? () => reviewLeave(item, 'rejected') : null}
              />
            )}
            emptyTitle="No leave requests" emptyDesc="Teacher leave applications will appear here."
          />
          <WorkflowSection title="Profile Correction Requests" icon={ShieldCheck} items={corrections} loading={loading}
            renderItem={(item) => (
              <WorkflowCard key={item.id}
                title={`${item.teacher_name} • ${item.field_name}`}
                meta={`${item.current_value || '--'} → ${item.requested_value}`}
                description={item.reason} status={item.status}
                onApprove={item.status === 'pending' ? () => reviewCorrection(item, 'approved') : null}
                onReject={item.status  === 'pending' ? () => reviewCorrection(item, 'rejected') : null}
              />
            )}
            emptyTitle="No correction requests" emptyDesc="Correction requests will appear here."
          />
          <WorkflowSection title="Homework Oversight" icon={BookOpenText} items={homework} loading={loading}
            renderItem={(item) => (
              <div key={item.id} className="rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.teacher_name} • {item.title}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.class_name} {item.section_name} | {item.subject_name} | Due {item.due_date}</p>
                <Badge className="mt-2" variant={item.status === 'active' ? 'green' : 'grey'}>{item.status}</Badge>
              </div>
            )}
            emptyTitle="No homework" emptyDesc="Homework assigned by teachers will appear here."
          />
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Assignment Card
════════════════════════════════════════════════════════════════════════════ */
const AssignmentCard = ({ group, onToggle }) => {
  const [open, setOpen] = useState(false)
  const active = group.subjectTeachers.filter((s) => s.is_active).length

  return (
    <article className="overflow-hidden rounded-[24px] border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* header row */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {/* class pill */}
          <span className="inline-flex h-8 items-center rounded-xl px-3 text-xs font-bold" style={{ backgroundColor: '#0c4a6e', color: '#e0f2fe' }}>
            {group.class_name} — {group.section_name}
          </span>
          {group.classTeacher ? (
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              CT: <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{group.classTeacher.teacher_name}</span>
            </span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>No class teacher</span>
          )}
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {active}/{group.subjectTeachers.length} subjects active
          </span>
          {group.inactiveCount > 0 && (
            <span className="rounded-lg px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
              {group.inactiveCount} inactive
            </span>
          )}
        </div>
        {open ? <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />}
      </button>

      {/* expanded body */}
      {open && (
        <div className="p-5">
          {/* subject grid */}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.subjectTeachers.map((item) => (
              <SubjectChip key={item.id} item={item} onToggle={onToggle} />
            ))}
            {!group.subjectTeachers.length && (
              <p className="col-span-full text-sm" style={{ color: 'var(--color-text-secondary)' }}>No subject teachers assigned.</p>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

const SubjectChip = ({ item, onToggle }) => (
  <div
    className="flex items-center justify-between gap-3 rounded-[18px] border p-3"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', opacity: item.is_active ? 1 : 0.55 }}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: subjectColor(item.subject_id) }} />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.subject_name || 'Subject'}</p>
        <p className="truncate text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{item.teacher_name}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onToggle(item)}
      className="flex-shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all"
      style={{ backgroundColor: item.is_active ? '#d1fae5' : '#fee2e2', color: item.is_active ? '#065f46' : '#991b1b' }}
    >
      {item.is_active ? 'Active' : 'Off'}
    </button>
  </div>
)

/* ════════════════════════════════════════════════════════════════════════════
   Timetable Grid
════════════════════════════════════════════════════════════════════════════ */
const TimetableGrid = ({ matrix, onToggle }) => {
  const periods = [1, 2, 3, 4, 5, 6, 7]
  const days    = ['monday','tuesday','wednesday','thursday','friday','saturday']

  return (
    <div className="overflow-x-auto rounded-[24px] border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <th className="border-b border-r p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', width: 80 }}>Period</th>
            {days.map((d) => (
              <th key={d} className="border-b border-r p-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                {DAY_FULL[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {/* period label */}
              <td className="border-r p-3 align-top" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>P{p}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{PERIOD_TIMES[p] || ''}</p>
              </td>
              {days.map((d) => {
                const slots = (matrix[d]?.[p]) || []
                return (
                  <td key={d} className="border-r p-2 align-top" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', minWidth: 100 }}>
                    {slots.length ? (
                      <div className="space-y-1">
                        {slots.map((s) => (
                          <TimetableCell key={s.id} slot={s} onToggle={onToggle} />
                        ))}
                      </div>
                    ) : (
                      <div className="h-12 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TimetableCell = ({ slot, onToggle }) => {
  const color = subjectColor(slot.subject_id)
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl p-2 transition-all"
      style={{ backgroundColor: `${color}18`, border: `1px solid ${color}40`, opacity: slot.is_active ? 1 : 0.45 }}
      title={`${slot.subject_name} • ${slot.teacher_name}${slot.room_number ? ` • Room ${slot.room_number}` : ''}`}
    >
      <div className="h-1 w-8 rounded-full mb-1.5" style={{ backgroundColor: color }} />
      <p className="truncate text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
        {slot.subject_name}
      </p>
      <p className="truncate text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
        {slot.teacher_name?.split(' ')[0]}
        {slot.section_name ? ` · ${slot.class_name} ${slot.section_name}` : ''}
      </p>
      {/* hover toggle */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(slot) }}
        className="absolute inset-0 flex items-center justify-center rounded-xl text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: slot.is_active ? 'rgba(220,38,38,.85)' : 'rgba(5,150,105,.85)', color: '#fff' }}
      >
        {slot.is_active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Timetable List
════════════════════════════════════════════════════════════════════════════ */
const TimetableList = ({ slots, onToggle }) => {
  const grouped = useMemo(() => {
    const g = {}
    slots.forEach((s) => {
      const d = s.day_of_week
      if (!g[d]) g[d] = []
      g[d].push(s)
    })
    return g
  }, [slots])

  return (
    <div className="space-y-4">
      {['monday','tuesday','wednesday','thursday','friday','saturday'].filter((d) => grouped[d]).map((d) => (
        <section key={d}>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{DAY_FULL[d]}</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(grouped[d] || []).sort((a, b) => a.period_number - b.period_number).map((slot) => (
              <TimetableListRow key={slot.id} slot={slot} onToggle={onToggle} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const TimetableListRow = ({ slot, onToggle }) => {
  const color = subjectColor(slot.subject_id)
  return (
    <div
      className="flex items-center gap-3 rounded-[20px] border p-3"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', opacity: slot.is_active ? 1 : 0.55 }}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>
        P{slot.period_number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{slot.subject_name}</p>
        <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {slot.teacher_name} · {slot.class_name} {slot.section_name}
          {slot.room_number ? ` · Room ${slot.room_number}` : ''}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          <Clock size={10} />{slot.start_time} – {slot.end_time}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(slot)}
        className="flex-shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: slot.is_active ? '#d1fae5' : '#fee2e2', color: slot.is_active ? '#065f46' : '#991b1b' }}
      >
        {slot.is_active ? 'On' : 'Off'}
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Workflow helpers
════════════════════════════════════════════════════════════════════════════ */
const WorkflowSection = ({ title, icon: Icon, items, loading, renderItem, emptyTitle, emptyDesc }) => (
  <section className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <div className="mb-4 flex items-center gap-2">
      <Icon size={15} style={{ color: 'var(--color-text-secondary)' }} />
      <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      {items.length > 0 && (
        <span className="ml-auto rounded-xl px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>{items.length}</span>
      )}
    </div>
    {loading ? <GridSkeleton rows={2} /> : !items.length ? (
      <EmptyState icon={Icon} title={emptyTitle} description={emptyDesc} />
    ) : (
      <div className="space-y-2">{items.map(renderItem)}</div>
    )}
  </section>
)

const WorkflowCard = ({ title, meta, description, status, onApprove, onReject }) => (
  <article className="rounded-[20px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl px-2.5 py-0.5 text-[11px] font-bold capitalize" style={{
            backgroundColor: status === 'approved' ? '#d1fae5' : status === 'rejected' ? '#fee2e2' : '#fef3c7',
            color: status === 'approved' ? '#065f46' : status === 'rejected' ? '#991b1b' : '#92400e',
          }}>{status}</span>
        </div>
        <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{meta}</p>
        {description && <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>}
      </div>
      {(onApprove || onReject) && (
        <div className="flex flex-shrink-0 gap-2">
          {onReject  && <Button variant="secondary" size="sm" onClick={onReject}>Reject</Button>}
          {onApprove && <Button variant="primary"   size="sm" onClick={onApprove}>Approve</Button>}
        </div>
      )}
    </div>
  </article>
)

/* ════════════════════════════════════════════════════════════════════════════
   Small helpers
════════════════════════════════════════════════════════════════════════════ */
const formatNoticeAudience = (item) => {
  if (item.target_scope === 'teachers') return 'All Teachers'
  if (item.target_scope === 'specific_teacher') return item.target_teacher_name || 'Teacher'
  if (item.target_scope === 'all_students') return 'All Students'
  if (item.target_scope === 'specific_student') return item.target_student_name || 'Student'
  if (item.target_scope === 'specific_section' && item.section_name) return `${item.class_name || 'Class'} ${item.section_name}`
  if (item.target_scope === 'specific_section') return item.class_name || 'Class'
  if (item.target_scope === 'my_class_only') return `${item.class_name || 'Class'} ${item.section_name || ''}`.trim()
  return 'Notice'
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const HeroStat = ({ label, value, color }) => (
  <div className="rounded-[20px] border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
    <p className="mt-1.5 text-2xl font-bold" style={{ color }}>{value}</p>
  </div>
)

const SmallSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    className="min-h-9 rounded-2xl px-3 text-xs font-semibold"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
  >
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

const GridSkeleton = ({ rows = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 animate-pulse rounded-[22px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

export default AdminTeacherControlPage
