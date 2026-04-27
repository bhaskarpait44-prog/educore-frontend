import {
  AlertTriangle,
  Download,
  FileLock2,
  Printer,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/utils/helpers'

export function AccountantHero({ eyebrow, title, description, actions }) {
  return (
    <section
      className="rounded-[2rem] border p-6 sm:p-7"
      style={{
        borderColor : 'rgba(221, 141, 31, 0.22)',
        background  : 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(234,88,12,0.10) 45%, var(--color-surface) 100%)',
      }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          {eyebrow ? (
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-brand)' }}>
              {eyebrow}
            </div>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  )
}

export function AccountantSection({ title, subtitle, actions, children }) {
  return (
    <section
      className="rounded-[1.7rem] border p-5 sm:p-6"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
          {subtitle ? <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function MetricCard({ label, value, hint, accent = 'var(--color-brand)' }) {
  return (
    <div
      className="rounded-[1.4rem] border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div className="mt-2 text-2xl font-bold" style={{ color: accent }}>{value}</div>
      {hint ? <div className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{hint}</div> : null}
    </div>
  )
}

export function LockedAccessCard({ title = 'Access Restricted', description = 'Contact admin to enable this accountant feature.' }) {
  return (
    <EmptyState
      icon={FileLock2}
      title={title}
      description={description}
    />
  )
}

export function SummaryTable({ columns = [], rows = [], emptyTitle = 'No records found', emptyDescription = 'Try changing the filters.' }) {
  if (!rows.length) {
    return <EmptyState icon={AlertTriangle} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto rounded-[1.3rem] border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.key || index} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-top text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {typeof column.render === 'function' ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function statusBadgeForInvoice(status, daysOverdue = 0) {
  if (status === 'paid') return <Badge variant="green">Paid</Badge>
  if (status === 'partial') return <Badge variant="yellow">Partial</Badge>
  if (status === 'waived') return <Badge variant="grey">Waived</Badge>
  if (Number(daysOverdue) > 0) return <Badge variant="red">{daysOverdue}+ overdue</Badge>
  return <Badge variant="red">Pending</Badge>
}

export function paymentModeLabel(value) {
  const key = String(value || '').toLowerCase()
  if (key === 'upi') return 'UPI'
  if (key === 'dd') return 'DD'
  if (key === 'online') return 'Online'
  if (key === 'cheque') return 'Cheque'
  if (key === 'cash') return 'Cash'
  return value || '-'
}

export function exportRowsAsCsv(filename, columns, rows) {
  const header = columns.map((column) => escapeCsv(column.label)).join(',')
  const body = rows.map((row, index) => columns.map((column) => {
    const value = typeof column.csv === 'function'
      ? column.csv(row, index)
      : typeof column.render === 'function'
        ? column.render(row, index)
        : row[column.key]
    return escapeCsv(stripHtml(String(value ?? '')))
  }).join(',')).join('\n')

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function ExportActions({ filename, columns, rows, printTitle, children }) {
  return (
    <>
      <Button
        variant="secondary"
        icon={Download}
        onClick={() => exportRowsAsCsv(filename, columns, rows)}
      >
        Export CSV
      </Button>
      <Button
        variant="outline"
        icon={Printer}
        onClick={() => printTableReport(printTitle, columns, rows)}
      >
        Print / Save PDF
      </Button>
      {children}
    </>
  )
}

export function renderDate(value) {
  return formatDate(value)
}

export function renderCurrency(value) {
  return formatCurrency(Number(value || 0))
}

function escapeCsv(value) {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function printTableReport(title, columns, rows) {
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: Arial, sans-serif; color: #1f2937; padding: 24px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          .meta { margin-bottom: 18px; color: #6b7280; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
          th { background: #fff7ed; color: #9a3412; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Generated on ${formatDate(new Date(), 'long')}</div>
        <table>
          <thead>
            <tr>${columns.map((column) => `<th>${column.label}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => `
              <tr>
                ${columns.map((column) => {
                  const value = typeof column.csv === 'function'
                    ? column.csv(row, index)
                    : typeof column.render === 'function'
                      ? column.render(row, index)
                      : row[column.key]
                  return `<td>${stripHtml(String(value ?? '-'))}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=1100,height=800')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
