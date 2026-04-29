import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenText, CalendarRange, ClipboardList, LayoutGrid, School2, ShieldCheck, UserRoundCheck,
} from 'lucide-react'
import * as teacherControlApi from '@/api/adminTeacherControlApi'
import { getClasses, getClassList, getSections } from '@/api/classApi'
import { getSubjects } from '@/api/classApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Textarea from '@/components/ui/Textarea'

const AdminTeacherControlPage = () => {
  usePageTitle('Teacher Control')

  const { toastSuccess, toastError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState(null)
  const [overview, setOverview] = useState({})
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [sectionsByClass, setSectionsByClass] = useState({})
  const [subjectsByClass, setSubjectsByClass] = useState({})
  const [assignments, setAssignments] = useState([])
  const [timetable, setTimetable] = useState([])
  const [homework, setHomework] = useState([])
  const [notices, setNotices] = useState([])
  const [marks, setMarks] = useState([])
  const [remarks, setRemarks] = useState([])
  const [leaves, setLeaves] = useState([])
  const [corrections, setCorrections] = useState([])
  const [assignmentForm, setAssignmentForm] = useState({
    teacher_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    is_class_teacher: false,
  })
  const [slotForm, setSlotForm] = useState({
    teacher_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    day_of_week: 'monday',
    period_number: '1',
    start_time: '09:00',
    end_time: '09:40',
    room_number: '',
  })
  const [tab, setTab] = useState('workflows')

  const load = async () => {
    setLoading(true)
    try {
      const [
        overviewRes,
        assignmentsRes,
        timetableRes,
        homeworkRes,
        noticesRes,
        marksRes,
        remarksRes,
        leaveRes,
        correctionsRes,
        teachersRes,
        classesRes,
      ] = await Promise.all([
        teacherControlApi.getTeacherControlOverview(),
        teacherControlApi.getTeacherControlAssignments(),
        teacherControlApi.getTeacherControlTimetable(),
        teacherControlApi.getTeacherControlHomework(),
        teacherControlApi.getTeacherControlNotices(),
        teacherControlApi.getTeacherControlMarks(),
        teacherControlApi.getTeacherControlRemarks(),
        teacherControlApi.getTeacherControlLeave(),
        teacherControlApi.getTeacherControlCorrections(),
        teacherControlApi.getTeacherControlTeachers(),
        getClasses(),
      ])

      setSession(overviewRes?.data?.session || null)
      setOverview(overviewRes?.data?.counts || {})
      setAssignments(assignmentsRes?.data?.assignments || [])
      setTimetable(timetableRes?.data?.timetable || [])
      setHomework(homeworkRes?.data?.homework || [])
      setNotices(noticesRes?.data?.notices || [])
      setMarks(marksRes?.data?.marks || [])
      setRemarks(remarksRes?.data?.remarks || [])
      setLeaves(leaveRes?.data?.applications || [])
      setCorrections(correctionsRes?.data?.requests || [])
      setTeachers(teachersRes?.data?.teachers || [])
      setClasses(getClassList(classesRes))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((error) => {
      setLoading(false)
      toastError(error?.message || 'Failed to load teacher control center.')
    })
  }, [])

  const ensureClassMeta = async (classId) => {
    if (!classId) return
    if (!sectionsByClass[classId]) {
      const sectionRes = await getSections(classId)
      const sectionRows = Array.isArray(sectionRes?.data) ? sectionRes.data : (sectionRes?.data?.sections || [])
      setSectionsByClass((prev) => ({ ...prev, [classId]: sectionRows }))
    }
    if (!subjectsByClass[classId]) {
      const subjectRes = await getSubjects(classId)
      const subjectRows = Array.isArray(subjectRes?.data) ? subjectRes.data : (subjectRes?.data?.subjects || [])
      setSubjectsByClass((prev) => ({ ...prev, [classId]: subjectRows }))
    }
  }

  useEffect(() => {
    ensureClassMeta(assignmentForm.class_id).catch(() => {})
  }, [assignmentForm.class_id])

  useEffect(() => {
    ensureClassMeta(slotForm.class_id).catch(() => {})
  }, [slotForm.class_id])

  const slotRelevantAssignments = useMemo(() => (
    assignments.filter((item) =>
      !item.is_class_teacher &&
      item.is_active &&
      (!slotForm.teacher_id || String(item.teacher_id) === String(slotForm.teacher_id)) &&
      (!slotForm.class_id || String(item.class_id) === String(slotForm.class_id)) &&
      (!slotForm.section_id || String(item.section_id) === String(slotForm.section_id))
    )
  ), [assignments, slotForm.teacher_id, slotForm.class_id, slotForm.section_id])

  const assignmentsByClass = useMemo(() => {
    const groups = new Map()

    assignments.forEach((item) => {
      const key = `${item.class_id}:${item.section_id}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          class_name: item.class_name,
          section_name: item.section_name,
          session_name: item.session_name,
          classTeacher: null,
          subjectTeachers: [],
          inactiveCount: 0,
        })
      }

      const group = groups.get(key)
      if (!item.is_active) group.inactiveCount += 1

      if (item.is_class_teacher) group.classTeacher = item
      else group.subjectTeachers.push(item)
    })

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        subjectTeachers: group.subjectTeachers.sort((a, b) => {
          if (Number(b.is_active) !== Number(a.is_active)) return Number(b.is_active) - Number(a.is_active)
          if ((a.subject_name || '') !== (b.subject_name || '')) return (a.subject_name || '').localeCompare(b.subject_name || '')
          return (a.teacher_name || '').localeCompare(b.teacher_name || '')
        }),
      }))
      .sort((a, b) => {
        if ((a.class_name || '') !== (b.class_name || '')) return (a.class_name || '').localeCompare(b.class_name || '')
        return (a.section_name || '').localeCompare(b.section_name || '')
      })
  }, [assignments])

  const classOptions = useMemo(() => classes.map((row) => ({ value: String(row.id), label: row.name })), [classes])
  const teacherOptions = useMemo(() => teachers.map((row) => ({ value: String(row.id), label: row.name })), [teachers])
  const assignmentSectionOptions = useMemo(() => (sectionsByClass[assignmentForm.class_id] || []).map((row) => ({ value: String(row.id), label: row.name })), [sectionsByClass, assignmentForm.class_id])
  const assignmentSubjectOptions = useMemo(() => (subjectsByClass[assignmentForm.class_id] || []).map((row) => ({ value: String(row.id), label: row.name })), [subjectsByClass, assignmentForm.class_id])
  const slotSectionOptions = useMemo(() => (sectionsByClass[slotForm.class_id] || []).map((row) => ({ value: String(row.id), label: row.name })), [sectionsByClass, slotForm.class_id])
  const slotSubjectOptions = useMemo(() => (
    slotRelevantAssignments.map((row) => ({ value: String(row.subject_id), label: row.subject_name }))
  ), [slotRelevantAssignments])

  useEffect(() => {
    if (!slotForm.subject_id) return
    const isValidSubject = slotSubjectOptions.some((option) => option.value === String(slotForm.subject_id))
    if (!isValidSubject) {
      setSlotForm((prev) => ({ ...prev, subject_id: '' }))
    }
  }, [slotForm.subject_id, slotSubjectOptions])

  const handleAssignmentCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await teacherControlApi.createTeacherControlAssignment({
        teacher_id: Number(assignmentForm.teacher_id),
        class_id: Number(assignmentForm.class_id),
        section_id: Number(assignmentForm.section_id),
        subject_id: assignmentForm.is_class_teacher ? null : Number(assignmentForm.subject_id),
        is_class_teacher: assignmentForm.is_class_teacher,
      })
      toastSuccess('Teacher assignment created.')
      setAssignmentForm({ teacher_id: '', class_id: '', section_id: '', subject_id: '', is_class_teacher: false })
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to create teacher assignment.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAssignment = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlAssignment(item.id, { is_active: !item.is_active })
      toastSuccess('Teacher assignment updated.')
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to update teacher assignment.')
    } finally {
      setSaving(false)
    }
  }

  const handleSlotCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await teacherControlApi.createTeacherControlTimetableSlot({
        teacher_id: Number(slotForm.teacher_id),
        class_id: Number(slotForm.class_id),
        section_id: Number(slotForm.section_id),
        subject_id: Number(slotForm.subject_id),
        day_of_week: slotForm.day_of_week,
        period_number: Number(slotForm.period_number),
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        room_number: slotForm.room_number || null,
      })
      toastSuccess('Timetable slot created.')
      setSlotForm((prev) => ({ ...prev, section_id: '', subject_id: '', room_number: '' }))
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to create timetable slot.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSlot = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlTimetableSlot(item.id, { is_active: !item.is_active })
      toastSuccess('Timetable slot updated.')
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to update timetable slot.')
    } finally {
      setSaving(false)
    }
  }

  const updateHomeworkStatus = async (item, status) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlHomework(item.id, { status })
      toastSuccess('Homework status updated.')
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to update homework status.')
    } finally {
      setSaving(false)
    }
  }

  const toggleNotice = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlNotice(item.id, { is_active: !item.is_active })
      toastSuccess('Notice status updated.')
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to update notice.')
    } finally {
      setSaving(false)
    }
  }

  const reviewLeave = async (item, status) => {
    setSaving(true)
    try {
      await teacherControlApi.reviewTeacherControlLeave(item.id, { status })
      toastSuccess(`Leave ${status}.`)
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to review leave request.')
    } finally {
      setSaving(false)
    }
  }

  const reviewCorrection = async (item, status) => {
    setSaving(true)
    try {
      await teacherControlApi.reviewTeacherControlCorrection(item.id, { status })
      toastSuccess(`Correction request ${status}.`)
      await load()
    } catch (error) {
      toastError(error?.message || 'Unable to review correction request.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-20">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.16), rgba(13, 148, 136, 0.10) 58%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Teacher Control Center
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Manage teacher assignments, timetable slots, notices, homework oversight, leave approvals, and profile correction requests from one admin console.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: '#0369a1' }}>
              Current Session: {session?.name || 'Not available'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Teachers" value={overview.teachers || 0} tone="#0369a1" />
            <StatCard title="Assignments" value={overview.active_assignments || 0} tone="#0f766e" />
            <StatCard title="Pending Leaves" value={overview.pending_leaves || 0} tone="#f59e0b" />
            <StatCard title="Corrections" value={overview.pending_corrections || 0} tone="#ef4444" />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'workflows'} onClick={() => setTab('workflows')} icon={ShieldCheck} label="Workflow Controls" />
        <TabButton active={tab === 'assignments'} onClick={() => setTab('assignments')} icon={School2} label="Assignments" />
        <TabButton active={tab === 'timetable'} onClick={() => setTab('timetable')} icon={CalendarRange} label="Timetable" />
        <TabButton active={tab === 'overrides'} onClick={() => setTab('overrides')} icon={ClipboardList} label="Overrides" />
      </div>

      {tab === 'assignments' && (
        <>
          <Panel title="Create Teacher Assignment" icon={School2}>
            <form className="grid grid-cols-1 gap-4 xl:grid-cols-5" onSubmit={handleAssignmentCreate}>
              <Select label="Teacher" value={assignmentForm.teacher_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, teacher_id: e.target.value }))} options={teacherOptions} required />
              <Select label="Class" value={assignmentForm.class_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, class_id: e.target.value, section_id: '', subject_id: '' }))} options={classOptions} required />
              <Select label="Section" value={assignmentForm.section_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, section_id: e.target.value }))} options={assignmentSectionOptions} required />
              <Select label="Subject" value={assignmentForm.subject_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, subject_id: e.target.value }))} options={assignmentSubjectOptions} placeholder={assignmentForm.is_class_teacher ? 'Not needed for class teacher' : 'Select subject'} disabled={assignmentForm.is_class_teacher} />
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignmentForm((p) => ({ ...p, is_class_teacher: !p.is_class_teacher, subject_id: '' }))}
                  className="min-h-11 rounded-2xl px-4 text-sm font-semibold"
                  style={{ backgroundColor: assignmentForm.is_class_teacher ? '#0f766e' : 'var(--color-surface-raised)', color: assignmentForm.is_class_teacher ? '#fff' : 'var(--color-text-primary)' }}
                >
                  {assignmentForm.is_class_teacher ? 'Class Teacher' : 'Subject Teacher'}
                </button>
                <Button type="submit" variant="primary" loading={saving}>Add</Button>
              </div>
            </form>
          </Panel>

          <Panel title="Current Assignments" icon={ClipboardList}>
            {loading ? <Skeleton rows={5} /> : !assignments.length ? <EmptyState icon={School2} title="No assignments yet" description="Create teacher assignments for the current session." /> : (
              <div className="space-y-3">
                {assignmentsByClass.map((group) => (
                  <ClassAssignmentGroup key={group.key} group={group} onToggle={toggleAssignment} />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'timetable' && (
        <>
          <Panel title="Create Timetable Slot" icon={CalendarRange}>
            <form className="grid grid-cols-1 gap-4 xl:grid-cols-4" onSubmit={handleSlotCreate}>
              <Select label="Teacher" value={slotForm.teacher_id} onChange={(e) => setSlotForm((p) => ({ ...p, teacher_id: e.target.value, subject_id: '' }))} options={teacherOptions} required />
              <Select label="Class" value={slotForm.class_id} onChange={(e) => setSlotForm((p) => ({ ...p, class_id: e.target.value, section_id: '', subject_id: '' }))} options={classOptions} required />
              <Select label="Section" value={slotForm.section_id} onChange={(e) => setSlotForm((p) => ({ ...p, section_id: e.target.value, subject_id: '' }))} options={slotSectionOptions} required />
              <Select label="Subject" value={slotForm.subject_id} onChange={(e) => setSlotForm((p) => ({ ...p, subject_id: e.target.value }))} options={slotSubjectOptions} placeholder="Select assigned subject" required />
              <Select label="Day" value={slotForm.day_of_week} onChange={(e) => setSlotForm((p) => ({ ...p, day_of_week: e.target.value }))} options={DAY_OPTIONS} required />
              <Input type="number" label="Period" value={slotForm.period_number} onChange={(e) => setSlotForm((p) => ({ ...p, period_number: e.target.value }))} required />
              <Input type="time" label="Start" value={slotForm.start_time} onChange={(e) => setSlotForm((p) => ({ ...p, start_time: e.target.value }))} required />
              <Input type="time" label="End" value={slotForm.end_time} onChange={(e) => setSlotForm((p) => ({ ...p, end_time: e.target.value }))} required />
              <Input label="Room" value={slotForm.room_number} onChange={(e) => setSlotForm((p) => ({ ...p, room_number: e.target.value }))} placeholder="Optional room" />
              <div className="flex items-end">
                <Button type="submit" variant="primary" loading={saving}>Add Slot</Button>
              </div>
            </form>
          </Panel>

          <Panel title="Timetable Slots" icon={LayoutGrid}>
            {loading ? <Skeleton rows={5} /> : !timetable.length ? <EmptyState icon={CalendarRange} title="No timetable slots" description="Create timetable slots for teachers in the current session." /> : (
              <div className="space-y-3">
                {timetable.map((item) => (
                  <RowCard
                    key={item.id}
                    title={`${item.teacher_name} • ${item.subject_name}`}
                    meta={`${labelDay(item.day_of_week)} period ${item.period_number} | ${item.class_name} ${item.section_name} | ${item.start_time} - ${item.end_time}${item.room_number ? ` | Room ${item.room_number}` : ''}`}
                    badge={item.is_active ? 'Active' : 'Inactive'}
                    badgeVariant={item.is_active ? 'green' : 'grey'}
                    actionLabel={item.is_active ? 'Deactivate' : 'Activate'}
                    onAction={() => toggleSlot(item)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'workflows' && (
        <>
          <Panel title="Teacher Leave Approval Queue" icon={UserRoundCheck}>
            {loading ? <Skeleton rows={4} /> : !leaves.length ? <EmptyState icon={UserRoundCheck} title="No leave requests" description="Teacher leave applications will appear here." /> : (
              <div className="space-y-3">
                {leaves.map((item) => (
                  <WorkflowCard
                    key={item.id}
                    title={`${item.teacher_name} • ${item.leave_type.replace('_', ' ')}`}
                    meta={`${item.from_date} to ${item.to_date} | ${Number(item.days_count || 0)} day(s)`}
                    description={item.reason}
                    status={item.status}
                    onApprove={item.status === 'pending' ? () => reviewLeave(item, 'approved') : null}
                    onReject={item.status === 'pending' ? () => reviewLeave(item, 'rejected') : null}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Profile Correction Approvals" icon={ShieldCheck}>
            {loading ? <Skeleton rows={4} /> : !corrections.length ? <EmptyState icon={ShieldCheck} title="No correction requests" description="Teacher profile correction requests will appear here." /> : (
              <div className="space-y-3">
                {corrections.map((item) => (
                  <WorkflowCard
                    key={item.id}
                    title={`${item.teacher_name} • ${item.field_name}`}
                    meta={`${item.current_value || '--'} -> ${item.requested_value}`}
                    description={item.reason}
                    status={item.status}
                    onApprove={item.status === 'pending' ? () => reviewCorrection(item, 'approved') : null}
                    onReject={item.status === 'pending' ? () => reviewCorrection(item, 'rejected') : null}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Homework Oversight" icon={BookOpenText}>
            {loading ? <Skeleton rows={4} /> : !homework.length ? <EmptyState icon={BookOpenText} title="No homework items" description="Teacher homework for the current session will appear here." /> : (
              <div className="space-y-3">
                {homework.map((item) => (
                  <ActionSelectCard
                    key={item.id}
                    title={`${item.teacher_name} • ${item.title}`}
                    meta={`${item.class_name} ${item.section_name} | ${item.subject_name} | Due ${item.due_date}`}
                    status={item.status}
                    options={['active', 'completed', 'cancelled']}
                    onSave={(status) => updateHomeworkStatus(item, status)}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Teacher Notices Oversight" icon={ClipboardList}>
            {loading ? <Skeleton rows={4} /> : !notices.length ? <EmptyState icon={ClipboardList} title="No notices" description="Teacher notices will appear here." /> : (
              <div className="space-y-3">
                {notices.map((item) => (
                  <RowCard
                    key={item.id}
                    title={`${item.teacher_name} • ${item.title}`}
                    meta={`${item.category} | ${item.class_name ? `${item.class_name} ${item.section_name}` : 'Teachers'} | Read by ${item.read_count || 0}`}
                    badge={item.is_active ? 'Active' : 'Inactive'}
                    badgeVariant={item.is_active ? 'green' : 'grey'}
                    actionLabel={item.is_active ? 'Disable' : 'Enable'}
                    onAction={() => toggleNotice(item)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'overrides' && (
        <>
          <Panel title="Marks Overrides" icon={BookOpenText}>
            {loading ? <Skeleton rows={4} /> : !marks.length ? <EmptyState icon={BookOpenText} title="No mark records" description="Exam result rows will appear here for admin override." /> : (
              <div className="space-y-3">
                {marks.map((item) => (
                  <MarkOverrideCard
                    key={item.id}
                    item={item}
                    onSave={async (payload) => {
                      setSaving(true)
                      try {
                        await teacherControlApi.updateTeacherControlMark(item.id, payload)
                        toastSuccess('Marks updated.')
                        await load()
                      } catch (error) {
                        toastError(error?.message || 'Unable to update marks.')
                      } finally {
                        setSaving(false)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Remark Overrides" icon={ShieldCheck}>
            {loading ? <Skeleton rows={4} /> : !remarks.length ? <EmptyState icon={ShieldCheck} title="No remarks" description="Teacher remarks will appear here for admin edit." /> : (
              <div className="space-y-3">
                {remarks.map((item) => (
                  <RemarkOverrideCard
                    key={item.id}
                    item={item}
                    onSave={async (payload) => {
                      setSaving(true)
                      try {
                        await teacherControlApi.updateTeacherControlRemark(item.id, payload)
                        toastSuccess('Remark updated.')
                        await load()
                      } catch (error) {
                        toastError(error?.message || 'Unable to update remark.')
                      } finally {
                        setSaving(false)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}

const DAY_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
]

const labelDay = (value) => value ? `${value[0].toUpperCase()}${value.slice(1)}` : '--'

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
    style={{
      backgroundColor: active ? '#0f766e' : 'var(--color-surface)',
      color: active ? '#fff' : 'var(--color-text-primary)',
      border: `1px solid ${active ? '#0f766e' : 'var(--color-border)'}`,
    }}
  >
    <Icon size={16} />
    {label}
  </button>
)

const Panel = ({ title, icon: Icon, children }) => (
  <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <div className="mb-4 flex items-center gap-2">
      <Icon size={16} style={{ color: 'var(--color-text-secondary)' }} />
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
    </div>
    {children}
  </section>
)

const StatCard = ({ title, value, tone }) => (
  <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>{value}</p>
  </div>
)

const RowCard = ({ title, meta, badge, badgeVariant, actionLabel, onAction }) => (
  <article className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
        <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{meta}</p>
      </div>
      <Button variant="secondary" onClick={onAction}>{actionLabel}</Button>
    </div>
  </article>
)

const ClassAssignmentGroup = ({ group, onToggle }) => (
  <article className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="blue">{group.class_name} {group.section_name}</Badge>
          <Badge variant={group.inactiveCount ? 'yellow' : 'green'}>
            {group.inactiveCount ? `${group.inactiveCount} inactive` : 'Fully active'}
          </Badge>
        </div>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{group.session_name}</p>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>
        {1 + group.subjectTeachers.length} assignment{1 + group.subjectTeachers.length === 1 ? '' : 's'}
      </p>
    </div>

    <div className="mt-4 space-y-3">
      {group.classTeacher ? (
        <AssignmentLineItem
          item={group.classTeacher}
          label="Class Teacher"
          detail={group.classTeacher.teacher_name}
          onToggle={onToggle}
        />
      ) : (
        <div className="rounded-2xl border border-dashed p-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Class Teacher</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>No class teacher assigned yet.</p>
        </div>
      )}

      {group.subjectTeachers.length ? (
        group.subjectTeachers.map((item) => (
          <AssignmentLineItem
            key={item.id}
            item={item}
            label={item.subject_name || 'Subject Teacher'}
            detail={item.teacher_name}
            onToggle={onToggle}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-dashed p-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Subject Teachers</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>No subject teacher assignments for this class yet.</p>
        </div>
      )}
    </div>
  </article>
)

const AssignmentLineItem = ({ item, label, detail, onToggle }) => (
  <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.is_active ? 'green' : 'grey'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
          <Badge variant={item.is_class_teacher ? 'teal' : 'blue'}>{label}</Badge>
        </div>
        <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{detail}</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {item.is_class_teacher ? 'Full class responsibility' : `${item.subject_code ? `${item.subject_code} | ` : ''}Subject assignment`}
        </p>
      </div>
      <Button variant="secondary" onClick={() => onToggle(item)}>{item.is_active ? 'Deactivate' : 'Activate'}</Button>
    </div>
  </div>
)

const WorkflowCard = ({ title, meta, description, status, onApprove, onReject }) => (
  <article className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : status === 'pending' ? 'yellow' : 'grey'}>
            {status}
          </Badge>
        </div>
        <p className="mt-3 break-words text-sm font-semibold leading-5" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        <p className="mt-1 break-words text-xs leading-5 sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>{meta}</p>
        <p className="mt-2 break-words text-xs leading-5 sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-[220px] lg:justify-end">
        {onReject ? <Button variant="secondary" onClick={onReject}>Reject</Button> : null}
        {onApprove ? <Button variant="primary" onClick={onApprove}>Approve</Button> : null}
      </div>
    </div>
  </article>
)

const ActionSelectCard = ({ title, meta, status, options, onSave }) => {
  const [value, setValue] = useState(status)

  useEffect(() => {
    setValue(status)
  }, [status])

  return (
    <article className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{meta}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-11 rounded-2xl px-3 text-sm"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <Button variant="primary" onClick={() => onSave(value)}>Save</Button>
        </div>
      </div>
    </article>
  )
}

const AttendanceOverrideCard = ({ item, onSave }) => {
  const [status, setStatus] = useState(item.status)
  const [reason, setReason] = useState(item.override_reason || '')

  useEffect(() => {
    setStatus(item.status)
    setReason(item.override_reason || '')
  }, [item.id, item.override_reason, item.status])

  return (
    <article className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_160px_minmax(220px,320px)_auto] xl:items-end">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {item.first_name} {item.last_name} • {item.class_name} {item.section_name} • Roll {item.roll_number || '--'}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {item.date} | Marked by {item.marked_by_name || 'Unknown'} | Current: {item.status}
          </p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 rounded-2xl px-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          {['present', 'absent', 'late', 'half_day'].map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Override reason" />
        <Button variant="primary" onClick={() => onSave({ status, reason })}>Save</Button>
      </div>
    </article>
  )
}

const MarkOverrideCard = ({ item, onSave }) => {
  const [marksObtained, setMarksObtained] = useState(item.marks_obtained ?? '')
  const [isAbsent, setIsAbsent] = useState(Boolean(item.is_absent))
  const [reason, setReason] = useState(item.override_reason || '')

  useEffect(() => {
    setMarksObtained(item.marks_obtained ?? '')
    setIsAbsent(Boolean(item.is_absent))
    setReason(item.override_reason || '')
  }, [item.id, item.is_absent, item.marks_obtained, item.override_reason])

  return (
    <article className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_110px_130px_minmax(220px,320px)_auto] xl:items-end">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {item.first_name} {item.last_name} • {item.exam_name} • {item.subject_name}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {item.class_name} {item.section_name} • Roll {item.roll_number || '--'} | Current: {item.is_absent ? 'Absent' : item.marks_obtained}
          </p>
        </div>
        <Input type="number" value={marksObtained} onChange={(e) => setMarksObtained(e.target.value)} disabled={isAbsent} placeholder="Marks" />
        <button
          type="button"
          onClick={() => setIsAbsent((prev) => !prev)}
          className="min-h-11 rounded-2xl px-4 text-sm font-semibold"
          style={{ backgroundColor: isAbsent ? '#ef4444' : 'var(--color-surface)', color: isAbsent ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          {isAbsent ? 'Absent' : 'Present'}
        </button>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Override reason" />
        <Button variant="primary" onClick={() => onSave({ marks_obtained: marksObtained === '' ? null : Number(marksObtained), is_absent: isAbsent, reason })}>Save</Button>
      </div>
    </article>
  )
}

const RemarkOverrideCard = ({ item, onSave }) => {
  const [text, setText] = useState(item.remark_text)
  const [visibility, setVisibility] = useState(item.visibility)
  const [reason, setReason] = useState('')

  useEffect(() => {
    setText(item.remark_text)
    setVisibility(item.visibility)
    setReason('')
  }, [item.id, item.remark_text, item.visibility])

  return (
    <article className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {item.first_name} {item.last_name} • {item.class_name} {item.section_name} • {item.remark_type}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Teacher: {item.teacher_name} | Roll {item.roll_number || '--'}
          </p>
        </div>
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[180px_minmax(220px,320px)_auto] xl:items-end">
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="min-h-11 rounded-2xl px-3 text-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
            {['private', 'share_parent', 'share_student'].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Override reason" />
          <Button variant="primary" onClick={() => onSave({ remark_text: text, visibility, reason })}>Save</Button>
        </div>
      </div>
    </article>
  )
}

const Skeleton = ({ rows = 4 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, index) => (
      <div key={index} className="h-20 animate-pulse rounded-[24px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

export default AdminTeacherControlPage
