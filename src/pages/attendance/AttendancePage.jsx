// src/pages/attendance/AttendancePage.jsx
// Entry point - tab switcher between Mark, Register, Override, Report
import { useMemo, useState } from 'react'
import { ClipboardCheck, Grid3x3, ShieldCheck, TrendingUp } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import { ROLES } from '@/constants/app'
import useAuthStore from '@/store/authStore'
import MarkAttendancePage from './MarkAttendancePage'
import AttendanceRegisterPage from './AttendanceRegisterPage'
import AttendanceReportPage from './AttendanceReportPage'
import { cn } from '@/utils/helpers'

const AttendancePage = () => {
  usePageTitle('Attendance')

  const role = useAuthStore((state) => state.user?.role)
  const isAdmin = role === ROLES.ADMIN
  const tabs = useMemo(() => ([
    { key: 'mark', label: 'Mark Attendance', icon: ClipboardCheck },
    { key: 'register', label: 'Register', icon: Grid3x3 },
    ...(isAdmin ? [{ key: 'override', label: 'Override Attendance', icon: ShieldCheck }] : []),
    { key: 'report', label: 'Student Report', icon: TrendingUp },
  ]), [isAdmin])
  const [tab, setTab] = useState(isAdmin ? 'override' : 'mark')

  return (
    <div className="space-y-6">
      <div
        className="sticky top-0 z-20 rounded-3xl border p-3 backdrop-blur"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-surface) 92%, white)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Attendance
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-150',
                  tab === item.key ? 'shadow-sm' : '',
                )}
                style={{
                  backgroundColor: tab === item.key ? 'var(--color-brand)' : 'var(--color-surface)',
                  color: tab === item.key ? '#fff' : 'var(--color-text-secondary)',
                  border: tab === item.key ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
                }}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'mark' && <MarkAttendancePage />}
      {tab === 'register' && <AttendanceRegisterPage mode="register" />}
      {tab === 'override' && <AttendanceRegisterPage mode="override" />}
      {tab === 'report' && <AttendanceReportPage />}
    </div>
  )
}

export default AttendancePage
