// src/pages/attendance/AttendancePage.jsx
// Entry point — tab switcher between Mark, Register, Report
import { useState } from 'react'
import { ClipboardCheck, Grid3x3, TrendingUp } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import MarkAttendancePage   from './MarkAttendancePage'
import AttendanceRegisterPage from './AttendanceRegisterPage'
import AttendanceReportPage from './AttendanceReportPage'
import { cn } from '@/utils/helpers'

const TABS = [
  { key: 'mark',     label: 'Mark Attendance', icon: ClipboardCheck },
  { key: 'register', label: 'Register',         icon: Grid3x3 },
  { key: 'report',   label: 'Student Report',   icon: TrendingUp },
]

const AttendancePage = () => {
  usePageTitle('Attendance')
  const [tab, setTab] = useState('mark')

  return (
    <div className="space-y-6">
      {/* ── Tab switcher ────────────────────────────────────────────────── */}
      <div
        className="flex p-1 rounded-2xl gap-1 w-fit"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
            )}
            style={{
              backgroundColor : tab === t.key ? 'var(--color-brand)'         : 'transparent',
              color           : tab === t.key ? '#fff'                        : 'var(--color-text-secondary)',
            }}
          >
            <t.icon size={15} />
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'mark'     && <MarkAttendancePage />}
      {tab === 'register' && <AttendanceRegisterPage />}
      {tab === 'report'   && <AttendanceReportPage />}
    </div>
  )
}

export default AttendancePage