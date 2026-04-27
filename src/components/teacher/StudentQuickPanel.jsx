import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Phone, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { ROUTES } from '@/constants/app'

const TABS = ['overview', 'attendance', 'results', 'remarks', 'parent']

const StudentQuickPanel = ({
  open,
  student,
  bundle,
  loading = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!open) return
    setActiveTab('overview')
  }, [open, student?.id])

  const detail = bundle?.detail
  const access = detail?.access || {}
  const attendanceStats = useMemo(() => buildAttendanceStats(bundle?.attendance || []), [bundle?.attendance])

  if (!open || !student) return null

  const visibleTabs = TABS.filter((tab) => tab !== 'parent' || access.isClassTeacher)

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l p-5 shadow-2xl transition-transform"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={`${student.first_name} ${student.last_name}`} photo={student.photo_path || detail?.profile?.photo_path} />
            <div>
              <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {student.first_name} {student.last_name}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Roll {student.roll_number || '--'} | {student.class_name} {student.section_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="min-h-10 rounded-2xl px-4 text-sm font-semibold capitalize"
              style={{
                backgroundColor: activeTab === tab ? '#0f766e' : 'var(--color-surface-raised)',
                color: activeTab === tab ? '#fff' : 'var(--color-text-primary)',
              }}
            >
              {tab === 'parent' ? 'Parent Info' : tab}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {loading && !detail ? (
            <PanelSkeleton />
          ) : activeTab === 'overview' ? (
            <OverviewTab student={student} detail={detail} access={access} attendanceStats={attendanceStats} />
          ) : activeTab === 'attendance' ? (
            <AttendanceTab attendance={bundle?.attendance || []} attendanceStats={attendanceStats} />
          ) : activeTab === 'results' ? (
            <ResultsTab results={bundle?.results || []} access={access} />
          ) : activeTab === 'remarks' ? (
            <RemarksTab remarks={bundle?.remarks || []} studentId={student.id} />
          ) : (
            <ParentTab detail={detail} />
          )}
        </div>

        <div className="mt-6">
          <Link
            to={ROUTES.TEACHER_STUDENT_DETAIL.replace(':id', String(student.id))}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
            style={{ backgroundColor: '#0f766e', color: '#fff' }}
          >
            Open Full Detail
            <ExternalLink size={16} />
          </Link>
        </div>
      </aside>
    </>
  )
}

const OverviewTab = ({ student, detail, access, attendanceStats }) => (
  <div className="space-y-4">
    <InfoCard title="Basic Details">
      <InfoRow label="Admission No" value={student.admission_no || detail?.admission_no || '--'} />
      <InfoRow label="Gender" value={student.gender || detail?.gender || '--'} />
      <InfoRow label="Parent Contact" value={detail?.profile?.father_phone || detail?.profile?.mother_phone || detail?.profile?.phone || '--'} />
    </InfoCard>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MiniStat title="Attendance" value={`${attendanceStats.percentage.toFixed(0)}%`} tone={attendanceStats.percentage < 75 ? '#ef4444' : '#10b981'} />
      <MiniStat title="Last Result" value={student.last_result_percentage != null ? `${Number(student.last_result_percentage).toFixed(0)}%` : '--'} tone="#0f766e" />
      {access.isClassTeacher && (
        <MiniStat
          title="Fee Status"
          value={detail?.fee_status?.balance != null ? `Rs ${Number(detail.fee_status.balance).toFixed(0)}` : '--'}
          tone={Number(detail?.fee_status?.balance || 0) > 0 ? '#f59e0b' : '#10b981'}
        />
      )}
    </div>
  </div>
)

const AttendanceTab = ({ attendance, attendanceStats }) => (
  <div className="space-y-4">
    <InfoCard title="Attendance Summary">
      <InfoRow label="Present" value={String(attendanceStats.present)} />
      <InfoRow label="Absent" value={String(attendanceStats.absent)} />
      <InfoRow label="Late" value={String(attendanceStats.late)} />
      <InfoRow label="Half Day" value={String(attendanceStats.halfDay)} />
      <InfoRow label="Overall" value={`${attendanceStats.percentage.toFixed(2)}%`} />
    </InfoCard>

    <InfoCard title="Recent Records">
      {(attendance || []).slice(0, 12).map((row) => (
        <div key={row.id} className="flex items-center justify-between rounded-2xl px-3 py-2" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.date}</span>
          <Badge variant={statusBadge(row.status)}>{row.status}</Badge>
        </div>
      ))}
      {!attendance?.length && <EmptyLine text="No attendance records available." />}
    </InfoCard>
  </div>
)

const ResultsTab = ({ results, access }) => (
  <InfoCard title={access.isClassTeacher ? 'All Exam Results' : 'Subject Results'}>
    {(results || []).map((row) => (
      <div key={row.id} className="rounded-2xl px-3 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.exam_name}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.subject_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {row.is_absent ? 'AB' : row.marks_obtained ?? '--'}
            </p>
            <p className="text-xs" style={{ color: row.is_pass ? '#10b981' : row.is_absent ? '#94a3b8' : '#ef4444' }}>
              {row.grade || '--'} | {row.is_absent ? 'Absent' : row.is_pass ? 'Pass' : 'Fail'}
            </p>
          </div>
        </div>
      </div>
    ))}
    {!results?.length && <EmptyLine text="No results available." />}
  </InfoCard>
)

const RemarksTab = ({ remarks, studentId }) => (
  <InfoCard title="Remarks">
    {(remarks || []).map((row) => (
      <div key={row.id} className="rounded-2xl px-3 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>{row.remark_type}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.teacher_name}</p>
        </div>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.remark_text}</p>
      </div>
    ))}
    {!remarks?.length && <EmptyLine text="No remarks yet." />}
    <div className="pt-2">
      <Link
        to={`${ROUTES.TEACHER_STUDENT_REMARKS}?student=${studentId}`}
        className="text-sm font-semibold"
        style={{ color: '#0f766e' }}
      >
        Manage remarks for this student
      </Link>
    </div>
  </InfoCard>
)

const ParentTab = ({ detail }) => (
  <div className="space-y-4">
    <InfoCard title="Parent Information">
      <InfoRow label="Father" value={detail?.profile?.father_name || '--'} />
      <InfoRow label="Father Phone" value={detail?.profile?.father_phone || '--'} />
      <InfoRow label="Mother" value={detail?.profile?.mother_name || '--'} />
      <InfoRow label="Mother Phone" value={detail?.profile?.mother_phone || '--'} />
      <InfoRow label="Emergency Contact" value={detail?.profile?.emergency_contact || '--'} />
    </InfoCard>

    <div className="flex gap-3">
      {detail?.profile?.father_phone && (
        <a
          href={`tel:${detail.profile.father_phone}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}
        >
          <Phone size={16} />
          Call Parent
        </a>
      )}
      {detail?.profile?.father_phone && (
        <a
          href={`https://wa.me/${String(detail.profile.father_phone).replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
          style={{ backgroundColor: 'rgba(15, 118, 110, 0.14)', color: '#0f766e' }}
        >
          <UserRound size={16} />
          WhatsApp
        </a>
      )}
    </div>
  </div>
)

const Avatar = ({ name, photo }) => (
  photo ? (
    <img src={photo} alt={name} className="h-14 w-14 rounded-2xl object-cover" />
  ) : (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold" style={{ backgroundColor: '#0f766e', color: '#fff' }}>
      {name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
    </div>
  )
)

const InfoCard = ({ title, children }) => (
  <div className="rounded-[28px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <div className="mt-3 space-y-3">{children}</div>
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <span className="text-sm font-medium text-right" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
)

const MiniStat = ({ title, value, tone }) => (
  <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
    <p className="mt-2 text-xl font-bold" style={{ color: tone }}>{value}</p>
  </div>
)

const EmptyLine = ({ text }) => (
  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
)

const PanelSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(3)].map((_, index) => (
      <div key={index} className="h-28 rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

const buildAttendanceStats = (attendance) => {
  const present = attendance.filter((row) => row.status === 'present').length
  const absent = attendance.filter((row) => row.status === 'absent').length
  const late = attendance.filter((row) => row.status === 'late').length
  const halfDay = attendance.filter((row) => row.status === 'half_day').length
  const total = attendance.length
  const percentage = total ? ((present + late + halfDay * 0.5) / total) * 100 : 0
  return { present, absent, late, halfDay, total, percentage }
}

const statusBadge = (status) => {
  if (status === 'present') return 'green'
  if (status === 'late') return 'yellow'
  if (status === 'absent') return 'red'
  return 'blue'
}

export default StudentQuickPanel
