import { useEffect } from 'react'
import { GraduationCap } from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatPercent } from '@/utils/helpers'

const RESULT_VARIANT = {
  pass: 'green',
  fail: 'red',
  compartment: 'yellow',
}

const TabResults = ({ studentId }) => {
  const { history, isLoading, fetchHistory } = useStudentStore()

  useEffect(() => {
    fetchHistory(studentId).catch(() => {})
  }, [studentId])

  const results = history?.result_history || []

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      ))}
    </div>
  )

  if (results.length === 0) return (
    <EmptyState
      icon={GraduationCap}
      title="No result history"
      description="Exam results for this student will appear here once published."
      className="border-0 py-10"
    />
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Session', 'Percentage', 'Grade', 'Result', 'Promotion'].map((h) => (
              <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider pr-4" style={{ color: 'var(--color-text-muted)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr
              key={`${r.session}-${i}`}
              style={{ borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none' }}
            >
              <td className="py-3.5 pr-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {r.session}
              </td>
              <td className="py-3.5 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {formatPercent(Number(r.percentage || 0), 2)}
              </td>
              <td className="py-3.5 pr-4 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {r.grade || '—'}
              </td>
              <td className="py-3.5 pr-4">
                <Badge variant={RESULT_VARIANT[r.result] || 'grey'}>
                  {r.result || '—'}
                </Badge>
              </td>
              <td className="py-3.5 pr-4">
                <Badge variant={r.is_promoted ? 'green' : 'grey'} dot>
                  {r.is_promoted ? 'Promoted' : 'Not Promoted'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TabResults
