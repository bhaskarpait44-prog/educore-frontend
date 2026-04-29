import { formatCurrency, formatDate } from '@/utils/helpers'

const ReportScaffold = ({ title, data, rowsKey = 'transactions', columns = [] }) => {
  const rows = data?.[rowsKey] || data?.days || data?.students || data?.defaulters || []

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
      </div>

      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(data.summary).slice(0, 6).map(([key, value]) => (
            <div key={key} className="rounded-[22px] border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{key.replace(/_/g, ' ')}</div>
              <div className="mt-2 text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {typeof value === 'number' && value > 999 ? formatCurrency(value) : String(value)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-[28px] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || row.student_id || row.date || index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm" style={{ color: column.key.includes('amount') || column.key.includes('balance') || column.key.includes('collection') ? '#15803d' : 'var(--color-text-secondary)' }}>
                    {column.format === 'currency' ? formatCurrency(row[column.key] || 0) : column.format === 'date' ? formatDate(row[column.key]) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReportScaffold
