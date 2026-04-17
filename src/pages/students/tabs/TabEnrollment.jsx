// src/pages/students/tabs/TabEnrollment.jsx
import { useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/helpers'

const JOIN_VARIANT = {
  fresh      : 'blue',
  promoted   : 'green',
  failed     : 'red',
  transfer_in: 'yellow',
  rejoined   : 'grey',
}
const LEAVE_VARIANT = {
  promoted   : 'green',
  failed     : 'red',
  transfer_out:'yellow',
  withdrawn  : 'grey',
  graduated  : 'blue',
  expelled   : 'dark',
}

const TabEnrollment = ({ studentId }) => {
  const { history, isLoading, fetchHistory } = useStudentStore()

  useEffect(() => {
    fetchHistory(studentId).catch(() => {})
  }, [studentId])

  const enrollments = history?.enrollment_history || []

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      ))}
    </div>
  )

  if (enrollments.length === 0) return (
    <EmptyState icon={BookOpen} title="No enrollment history" description="Student has not been enrolled in any session yet." className="border-0 py-10" />
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Session', 'Class', 'Section', 'Roll', 'Joined As', 'Left As', 'Status'].map(h => (
              <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider pr-4" style={{ color: 'var(--color-text-muted)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enrollments.map((e, i) => (
            <tr
              key={i}
              style={{ borderBottom: i < enrollments.length - 1 ? '1px solid var(--color-border)' : 'none' }}
            >
              <td className="py-3.5 pr-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {e.session}
              </td>
              <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{e.class}</td>
              <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{e.section}</td>
              <td className="py-3.5 pr-4 text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {e.roll_number || '—'}
              </td>
              <td className="py-3.5 pr-4">
                <Badge variant={JOIN_VARIANT[e.joining_type] || 'grey'}>
                  {e.joining_type?.replace('_', ' ')}
                </Badge>
              </td>
              <td className="py-3.5 pr-4">
                {e.leaving_type
                  ? <Badge variant={LEAVE_VARIANT[e.leaving_type] || 'grey'}>{e.leaving_type?.replace('_', ' ')}</Badge>
                  : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                }
              </td>
              <td className="py-3.5">
                <Badge variant={e.status === 'active' ? 'green' : 'grey'} dot>
                  {e.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TabEnrollment