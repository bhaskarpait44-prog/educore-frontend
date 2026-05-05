import { useMemo, useState } from 'react'
import { Phone, UserRound, GraduationCap, CalendarCheck, ClipboardList, Info, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { ROUTES } from '@/constants/app'
import { formatDate, formatPercent, getInitials, cn } from '@/utils/helpers'

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: Info },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'results',    label: 'Results',    icon: GraduationCap },
  { id: 'remarks',    label: 'Remarks',    icon: ClipboardList },
  { id: 'parent',     label: 'Parent Info', icon: UserRound },
]

const StudentView = ({
  student,
  bundle,
  loading = false,
  isFullPage = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview')

  const detail = bundle?.detail
  const access = detail?.access || {}
  const attendanceStats = useMemo(() => buildAttendanceStats(bundle?.attendance || []), [bundle?.attendance])

  if (!student) return null

  const visibleTabs = TABS.filter((tab) => tab.id !== 'parent' || access.isClassTeacher)

  return (
    <div className={cn("flex flex-col h-full", isFullPage ? "gap-6" : "gap-5")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar 
            name={`${student.first_name} ${student.last_name}`} 
            photo={student.photo_path || detail?.profile?.photo_path} 
            size={isFullPage ? "h-20 w-20" : "h-14 w-14"}
          />
          <div>
            <h2 className={cn("font-bold", isFullPage ? "text-2xl" : "text-xl")} style={{ color: 'var(--color-text-primary)' }}>
              {student.first_name} {student.last_name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Roll No: <span style={{ color: 'var(--color-text-primary)' }}>{student.roll_number || '--'}</span>
              </p>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {student.class_name} {student.section_name}
              </p>
              {detail?.admission_no && (
                <>
                  <div className="h-1 w-1 rounded-full bg-gray-300" />
                  <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded">
                    {detail.admission_no}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        {!isFullPage && (
          <Link
            to={ROUTES.TEACHER_STUDENT_DETAIL.replace(':id', String(student.id))}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Open full detail"
          >
            <ExternalLink size={18} />
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b overflow-x-auto scrollbar-none" style={{ borderColor: 'var(--color-border)' }}>
        {visibleTabs.map((tab) => {
          const active = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
                active ? "border-[#0f766e] text-[#0f766e]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && !detail ? (
          <ViewSkeleton />
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

      {isFullPage && (
         <div className="mt-auto pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Link
              to={ROUTES.TEACHER_STUDENTS}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-6 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
            >
              Back to List
            </Link>
         </div>
      )}
    </div>
  )
}

const OverviewTab = ({ student, detail, access, attendanceStats }) => (
  <div className="space-y-6 pt-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MiniStat 
        title="Attendance" 
        value={formatPercent(attendanceStats.percentage)} 
        tone={attendanceStats.percentage < 75 ? '#ef4444' : '#10b981'} 
        subtitle={`${attendanceStats.present} days present`}
      />
      <MiniStat 
        title="Last Result" 
        value={student.last_result_percentage != null ? formatPercent(student.last_result_percentage) : '--'} 
        tone="#0f766e"
        subtitle="Current Session"
      />
      {access.isClassTeacher && (
        <MiniStat
          title="Fee Status"
          value={detail?.fee_status?.balance != null ? `₹${Number(detail.fee_status.balance).toLocaleString()}` : '--'}
          tone={Number(detail?.fee_status?.balance || 0) > 0 ? '#f59e0b' : '#10b981'}
          subtitle={Number(detail?.fee_status?.balance || 0) > 0 ? 'Payment Pending' : 'No Dues'}
        />
      )}
    </div>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <InfoCard title="Academic Profile">
        <InfoRow label="Admission Number" value={student.admission_no || detail?.admission_no || '--'} />
        <InfoRow label="Date of Admission" value={formatDate(detail?.admission_date)} />
        <InfoRow label="Roll Number" value={student.roll_number || '--'} />
        <InfoRow label="Section" value={`${student.class_name} — ${student.section_name}`} />
      </InfoCard>

      <InfoCard title="Personal Details">
        <InfoRow label="Gender" value={student.gender || detail?.gender || '--'} />
        <InfoRow label="Date of Birth" value={formatDate(student.date_of_birth || detail?.profile?.date_of_birth)} />
        <InfoRow label="Blood Group" value={detail?.profile?.blood_group || '--'} />
        <InfoRow label="Phone" value={detail?.profile?.phone || '--'} />
      </InfoCard>
    </div>
  </div>
)

const AttendanceTab = ({ attendance, attendanceStats }) => (
  <div className="space-y-6 pt-4">
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatusStat label="Present" value={attendanceStats.present} color="#10b981" />
      <StatusStat label="Absent" value={attendanceStats.absent} color="#ef4444" />
      <StatusStat label="Late" value={attendanceStats.late} color="#f59e0b" />
      <StatusStat label="Half Day" value={attendanceStats.halfDay} color="#3b82f6" />
    </div>

    <InfoCard title="Recent Attendance">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(attendance || []).slice(0, 12).map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-xl border p-3" style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatDate(row.date)}</span>
            <Badge variant={statusBadge(row.status)}>{row.status.replace('_', ' ')}</Badge>
          </div>
        ))}
        {!attendance?.length && (
          <div className="col-span-full py-8 text-center">
            <p className="text-sm text-gray-500">No attendance records found for this student.</p>
          </div>
        )}
      </div>
    </InfoCard>
  </div>
)

const ResultsTab = ({ results, access }) => (
  <div className="space-y-4 pt-4">
    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
      {access.isClassTeacher ? 'Examination History' : 'Subject Wise Performance'}
    </h3>
    <div className="space-y-3">
      {(results || []).map((row) => (
        <div key={row.id} className="group rounded-2xl border p-4 transition-all hover:border-[#0f766e]/30 hover:shadow-sm" style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{row.exam_name}</p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>{row.subject_name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {row.is_absent ? (
                  <span className="text-red-500">Absent</span>
                ) : (
                  <>
                    {row.marks_obtained ?? '--'}
                    <span className="text-xs text-gray-400 font-normal ml-1">/ {row.max_marks || 100}</span>
                  </>
                )}
              </p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <Badge variant={row.is_pass ? 'green' : row.is_absent ? 'grey' : 'red'}>
                  {row.grade || (row.is_pass ? 'Pass' : 'Fail')}
                </Badge>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  {formatPercent(row.percentage)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {!results?.length && (
        <div className="py-12 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--color-border)' }}>
          <GraduationCap className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium">No exam results published yet.</p>
        </div>
      )}
    </div>
  </div>
)

const RemarksTab = ({ remarks, studentId }) => (
  <div className="space-y-4 pt-4">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Teacher Remarks</h3>
      <Link
        to={`${ROUTES.TEACHER_STUDENT_REMARKS}?student=${studentId}`}
        className="text-xs font-bold text-[#0f766e] hover:underline"
      >
        Add Remark
      </Link>
    </div>
    <div className="space-y-4">
      {(remarks || []).map((row) => (
        <div key={row.id} className="relative rounded-2xl border p-4" style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between gap-3 border-b pb-2 mb-3" style={{ borderColor: 'var(--color-border)' }}>
            <Badge variant="blue" className="capitalize">{row.remark_type}</Badge>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{row.teacher_name}</p>
              <p className="text-[10px] text-gray-400">{formatDate(row.created_at)}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{row.remark_text}</p>
        </div>
      ))}
      {!remarks?.length && (
        <div className="py-12 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--color-border)' }}>
          <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium">No remarks recorded for this student.</p>
        </div>
      )}
    </div>
  </div>
)

const ParentTab = ({ detail }) => (
  <div className="space-y-6 pt-4">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <InfoCard title="Father's Details">
        <InfoRow label="Name" value={detail?.profile?.father_name || '--'} />
        <InfoRow label="Phone" value={detail?.profile?.father_phone || '--'} />
        <InfoRow label="Occupation" value={detail?.profile?.father_occupation || '--'} />
      </InfoCard>

      <InfoCard title="Mother's Details">
        <InfoRow label="Name" value={detail?.profile?.mother_name || '--'} />
        <InfoRow label="Phone" value={detail?.profile?.mother_phone || '--'} />
        <InfoRow label="Occupation" value={detail?.profile?.mother_occupation || '--'} />
      </InfoCard>
    </div>

    <InfoCard title="Contact & Emergency">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <InfoRow label="Emergency Contact" value={detail?.profile?.emergency_contact || '--'} />
          <InfoRow label="Relationship" value={detail?.profile?.emergency_relation || '--'} />
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-end">
          {detail?.profile?.father_phone && (
            <a
              href={`tel:${detail.profile.father_phone}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#10b981', color: '#fff' }}
            >
              <Phone size={16} />
              Call Father
            </a>
          )}
          {detail?.profile?.father_phone && (
            <a
              href={`https://wa.me/${String(detail.profile.father_phone).replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#0f766e', color: '#fff' }}
            >
              <UserRound size={16} />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </InfoCard>
  </div>
)

const Avatar = ({ name, photo, size = "h-14 w-14" }) => (
  photo ? (
    <img src={photo} alt={name} className={cn(size, "rounded-2xl object-cover ring-2 ring-gray-100 dark:ring-gray-800")} />
  ) : (
    <div className={cn(size, "flex items-center justify-center rounded-2xl text-lg font-bold shadow-inner")} style={{ backgroundColor: '#0f766e', color: '#fff' }}>
      {getInitials(name)}
    </div>
  )
)

const InfoCard = ({ title, children }) => (
  <div className="rounded-2xl border p-5 transition-shadow hover:shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{title}</h3>
    <div className="space-y-3.5">{children}</div>
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm font-bold text-right" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
)

const MiniStat = ({ title, value, tone, subtitle }) => (
  <div className="rounded-2xl border p-4 transition-all hover:border-gray-300 dark:hover:border-gray-600" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
    <p className="mt-2 text-2xl font-black" style={{ color: tone }}>{value}</p>
    {subtitle && <p className="mt-1 text-[10px] font-medium text-gray-400 uppercase">{subtitle}</p>}
  </div>
)

const StatusStat = ({ label, value, color }) => (
  <div className="text-center p-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border)' }}>
    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-tighter">{label}</p>
    <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
  </div>
)

const ViewSkeleton = () => (
  <div className="space-y-6 pt-4 animate-pulse">
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
    <div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800" />
    </div>
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
  if (status === 'half_day') return 'blue'
  return 'grey'
}

export default StudentView
