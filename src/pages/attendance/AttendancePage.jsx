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
        className="flex w-fit gap-1 rounded-2xl p-1"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150')}
            style={{
              backgroundColor: tab === item.key ? 'var(--color-brand)' : 'transparent',
              color: tab === item.key ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            <item.icon size={15} />
            <span className="hidden sm:block">{item.label}</span>
          </button>
        ))}
      </div>

      {tab === 'mark' && <MarkAttendancePage />}
      {tab === 'register' && <AttendanceRegisterPage mode="register" />}
      {tab === 'override' && <AttendanceRegisterPage mode="override" />}
      {tab === 'report' && <AttendanceReportPage />}
    </div>
  )
}

export default AttendancePage
