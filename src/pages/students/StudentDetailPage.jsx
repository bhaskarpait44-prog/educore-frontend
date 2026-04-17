// src/pages/students/StudentDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, MapPin, BookOpen, ScrollText } from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { getInitials, formatDate } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import TabIdentity   from './tabs/TabIdentity'
import TabProfile    from './tabs/TabProfile'
import TabEnrollment from './tabs/TabEnrollment'
import TabAuditLog   from './tabs/TabAuditLog'

const TABS = [
  { key: 'identity',   label: 'Identity',   icon: User       },
  { key: 'profile',    label: 'Profile',    icon: MapPin     },
  { key: 'enrollment', label: 'Enrollment', icon: BookOpen   },
  { key: 'audit',      label: 'Audit Log',  icon: ScrollText },
]

const StudentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { selectedStudent: student, isLoading, fetchStudent, clearSelected } = useStudentStore()
  const [activeTab, setActiveTab] = useState('identity')

  usePageTitle(student ? `${student.first_name} ${student.last_name}` : 'Student')

  useEffect(() => {
    fetchStudent(id).catch(() => {
      toastError('Student not found')
      navigate(ROUTES.STUDENTS)
    })
    return () => clearSelected()
  }, [id])

  if (isLoading || !student) return <DetailSkeleton />

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(ROUTES.STUDENTS)}
          className="p-2 rounded-xl transition-colors mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={20} />
        </button>

        <div
          className="flex items-center gap-4 flex-1 p-5 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            {getInitials(`${student.first_name} ${student.last_name}`)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {student.first_name} {student.last_name}
              </h1>
              <Badge variant={student.is_deleted ? 'grey' : 'green'} dot>
                {student.is_deleted ? 'Inactive' : 'Active'}
              </Badge>
            </div>
            <p className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {student.admission_no}
            </p>
            {student.current_enrollment && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {student.current_enrollment.class} · Section {student.current_enrollment.section} · Roll {student.current_enrollment.roll_number || '—'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Tab bar */}
        <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === tab.key ? 'var(--color-brand)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'identity'   && <TabIdentity   student={student} studentId={id} />}
          {activeTab === 'profile'    && <TabProfile    student={student} studentId={id} />}
          {activeTab === 'enrollment' && <TabEnrollment studentId={id} />}
          {activeTab === 'audit'      && <TabAuditLog   studentId={id} />}
        </div>
      </div>
    </div>
  )
}

const DetailSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="h-24 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
    <div className="h-96 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
  </div>
)

export default StudentDetailPage