import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
import { getClasses } from '@/api/classApi'
import { getSessions } from '@/api/sessions'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import { PERMISSION } from '@/utils/permissions'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { AccountantHero, AccountantSection, ExportActions, LockedAccessCard, MetricCard, SummaryTable } from './portalUtils'

const REPORT_CONFIG = {
  daily: {
    title: 'Daily Collection Report',
    eyebrow: 'Step 12',
    description: 'Collection summary and transaction list for a selected date.',
    load: (filters) => accountantApi.getDailyReport({ date: filters.date }),
    defaultFilters: () => ({ date: new Date().toISOString().split('T')[0] }),
    build: (data) => ({
      metrics: [
        { label: 'Total Collection', value: formatCurrency(data.summary?.total_collection || 0), accent: '#15803d' },
        { label: 'Transactions', value: data.summary?.total_transactions || 0, accent: '#2563eb' },
      ],
      columns: [
        { key: 'created_at', label: 'Time', render: (row) => new Date(row.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
        { key: 'student_name', label: 'Student' },
        { key: 'class_name', label: 'Class' },
        { key: 'fee_type', label: 'Fee Type' },
        { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
        { key: 'payment_mode', label: 'Mode', render: (row) => row.payment_mode },
      ],
      rows: data.items || [],
    }),
  },
  monthly: {
    title: 'Monthly Collection Report',
    eyebrow: 'Step 12',
    description: 'Day-wise collection summary for the selected month and year.',
    load: (filters) => accountantApi.getMonthlyReport({ month: filters.month, year: filters.year }),
    defaultFilters: () => ({ month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) }),
    build: (data) => ({
      metrics: [
        { label: 'Month Total', value: formatCurrency(data.total_collected || 0), accent: '#15803d' },
        { label: 'Collection Days', value: (data.day_wise || []).length, accent: '#2563eb' },
      ],
      columns: [
        { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
        { key: 'date', label: 'Day', render: (row) => new Date(row.date).toLocaleDateString('en-IN', { weekday: 'long' }) },
        { key: 'collection', label: 'Collection', render: (row) => formatCurrency(row.collection) },
        { key: 'transactions', label: 'Transactions' },
      ],
      rows: data.day_wise || [],
    }),
  },
  classwise: {
    title: 'Class Wise Fee Report',
    eyebrow: 'Step 12',
    description: 'Class-level fee expectation, collection, and pending balance.',
    load: (filters) => accountantApi.getClasswiseReport({ session_id: filters.session_id, class_id: filters.class_id }),
    defaultFilters: () => ({ session_id: '', class_id: '' }),
    build: (data) => ({
      metrics: [
        { label: 'Classes', value: (data.items || []).length },
        { label: 'Expected', value: formatCurrency((data.items || []).reduce((sum, row) => sum + Number(row.expected || 0), 0)), accent: '#ea580c' },
        { label: 'Collected', value: formatCurrency((data.items || []).reduce((sum, row) => sum + Number(row.collected || 0), 0)), accent: '#15803d' },
      ],
      columns: [
        { key: 'class_name', label: 'Class' },
        { key: 'students', label: 'Students' },
        { key: 'expected', label: 'Expected', render: (row) => formatCurrency(row.expected) },
        { key: 'collected', label: 'Collected', render: (row) => formatCurrency(row.collected) },
        { key: 'pending', label: 'Pending', render: (row) => formatCurrency(row.pending) },
      ],
      rows: data.items || [],
    }),
  },
  session: {
    title: 'Session Summary Report',
    eyebrow: 'Step 12',
    description: 'High-level overview of enrollment, expected fee, collection, pending, and concessions for a session.',
    load: (filters) => accountantApi.getSessionReport({ session_id: filters.session_id }),
    defaultFilters: () => ({ session_id: '' }),
    build: (data) => ({
      metrics: [
        { label: 'Enrollment', value: data.overview?.total_enrollment || 0 },
        { label: 'Expected', value: formatCurrency(data.overview?.expected || 0), accent: '#ea580c' },
        { label: 'Collected', value: formatCurrency(data.overview?.collected || 0), accent: '#15803d' },
        { label: 'Pending', value: formatCurrency(data.overview?.pending || 0), accent: '#dc2626' },
      ],
      columns: [
        { key: 'label', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ],
      rows: [
        { id: 'enrollment', label: 'Total Enrollment', value: data.overview?.total_enrollment || 0 },
        { id: 'expected', label: 'Total Expected', value: formatCurrency(data.overview?.expected || 0) },
        { id: 'collected', label: 'Total Collected', value: formatCurrency(data.overview?.collected || 0) },
        { id: 'pending', label: 'Total Pending', value: formatCurrency(data.overview?.pending || 0) },
        { id: 'concessions', label: 'Total Concessions', value: formatCurrency(data.overview?.concessions || 0) },
      ],
    }),
  },
  defaulters: {
    title: 'Defaulter Report',
    eyebrow: 'Step 12',
    description: 'Students grouped by overdue amount and days overdue for follow-up calls or management review.',
    load: (filters) => accountantApi.getDefaultersReport({ days: filters.days, class_id: filters.class_id }),
    defaultFilters: () => ({ days: '30', class_id: '' }),
    build: (data) => ({
      metrics: [
        { label: 'Defaulters', value: (data.items || []).length },
        { label: 'Amount At Risk', value: formatCurrency((data.items || []).reduce((sum, row) => sum + Number(row.total_due || 0), 0)), accent: '#dc2626' },
      ],
      columns: [
        { key: 'student_name', label: 'Student' },
        { key: 'class_name', label: 'Class', render: (row) => `${row.class_name} ${row.section_name || ''}` },
        { key: 'total_due', label: 'Total Due', render: (row) => formatCurrency(row.total_due) },
        { key: 'overdue_since', label: 'Overdue Since', render: (row) => formatDate(row.overdue_since) },
        { key: 'days_overdue', label: 'Days Overdue' },
        { key: 'parent_phone', label: 'Parent Phone' },
      ],
      rows: data.items || [],
    }),
  },
  concessions: {
    title: 'Concession Report',
    eyebrow: 'Step 12',
    description: 'Totals of concession amounts grouped by class and concession type.',
    load: () => accountantApi.getWaiversReport(),
    defaultFilters: () => ({}),
    build: (data) => ({
      metrics: [
        { label: 'Entries', value: (data.items || []).length },
        { label: 'Total Concession', value: formatCurrency((data.items || []).reduce((sum, row) => sum + Number(row.total_concession || 0), 0)), accent: '#2563eb' },
      ],
      columns: [
        { key: 'concession_type', label: 'Type' },
        { key: 'class_name', label: 'Class' },
        { key: 'invoices', label: 'Invoices' },
        { key: 'total_concession', label: 'Total Concession', render: (row) => formatCurrency(row.total_concession) },
      ],
      rows: data.items || [],
    }),
  },
  custom: {
    title: 'Custom Report Builder',
    eyebrow: 'Step 12',
    description: 'Build a custom fee report with selected data blocks for export-ready review.',
    permission: PERMISSION.REPORTS_EXPORT,
    load: (filters) => accountantApi.getCustomReport({
      include: filters.include,
      session_id: filters.session_id,
      class_id: filters.class_id,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    }),
    defaultFilters: () => ({
      include   : ['student_details', 'class_and_section', 'fee_breakdown', 'payment_history', 'balance', 'contact_details'],
      session_id: '',
      class_id  : '',
      status    : '',
      from      : '',
      to        : '',
    }),
    build: (data) => ({
      metrics: [
        { label: 'Rows', value: (data.items || []).length },
        { label: 'Expected', value: formatCurrency((data.items || []).reduce((sum, row) => sum + Number(row.expected || 0), 0)), accent: '#ea580c' },
        { label: 'Balance', value: formatCurrency((data.items || []).reduce((sum, row) => sum + Number(row.balance || 0), 0)), accent: '#dc2626' },
      ],
      columns: [
        { key: 'student_name', label: 'Student' },
        { key: 'admission_no', label: 'Adm No' },
        { key: 'class_name', label: 'Class', render: (row) => `${row.class_name} ${row.section_name || ''}` },
        { key: 'expected', label: 'Expected', render: (row) => formatCurrency(row.expected) },
        { key: 'paid', label: 'Paid', render: (row) => formatCurrency(row.paid) },
        { key: 'balance', label: 'Balance', render: (row) => formatCurrency(row.balance) },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
      ],
      rows: data.items || [],
    }),
  },
}

export default function ReportsHub({ reportKey }) {
  const config = REPORT_CONFIG[reportKey]
  usePageTitle(config?.title || 'Report')
  const { can } = usePermissions()
  const { toastError } = useToast()
  const [sessions, setSessions] = useState([])
  const [classes, setClasses] = useState([])
  const [filters, setFilters] = useState(config.defaultFilters())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSessions(), getClasses()])
      .then(([sessionsRes, classesRes]) => {
        setSessions(sessionsRes.data?.sessions || sessionsRes.data || [])
        setClasses(classesRes.data?.classes || classesRes.data || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!config || (config.permission && !can(config.permission))) return
    setLoading(true)
    config.load(filters)
      .then((res) => setReport(config.build(res.data || {})))
      .catch((error) => toastError(error.message || `Failed to load ${config.title}`))
      .finally(() => setLoading(false))
  }, [can, config, filters, toastError])

  if (!config) {
    return <EmptyState title="Report not found" description="This accountant report route is not configured." />
  }

  if (config.permission && !can(config.permission)) {
    return <LockedAccessCard title="Export Permission Required" description="Contact admin to enable reports.export before using the custom report builder." />
  }

  if (!can(PERMISSION.FEES_REPORT)) {
    return <LockedAccessCard title="Reporting Locked" description="Contact admin to enable fees.report for this accountant role." />
  }

  return (
    <div className="space-y-6">
      <AccountantHero
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={report ? <ExportActions filename={`${reportKey}-report.csv`} columns={report.columns} rows={report.rows} printTitle={config.title} /> : null}
      />

      <AccountantSection title="Filters" subtitle="Update the report inputs and the data refreshes automatically.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {'date' in filters ? (
            <Input label="Date" type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} />
          ) : null}
          {'month' in filters ? (
            <Select
              label="Month"
              value={filters.month}
              onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}
              options={Array.from({ length: 12 }).map((_, index) => ({ value: String(index + 1), label: new Date(2026, index, 1).toLocaleDateString('en-IN', { month: 'long' }) }))}
            />
          ) : null}
          {'year' in filters ? <Input label="Year" value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))} /> : null}
          {'session_id' in filters ? (
            <Select
              label="Session"
              value={filters.session_id}
              onChange={(event) => setFilters((current) => ({ ...current, session_id: event.target.value }))}
              options={sessions.map((session) => ({ value: String(session.id), label: session.name }))}
            />
          ) : null}
          {'class_id' in filters ? (
            <Select
              label="Class"
              value={filters.class_id}
              onChange={(event) => setFilters((current) => ({ ...current, class_id: event.target.value }))}
              options={classes.map((classItem) => ({ value: String(classItem.id), label: classItem.name }))}
            />
          ) : null}
          {'days' in filters ? (
            <Select
              label="Days Overdue"
              value={filters.days}
              onChange={(event) => setFilters((current) => ({ ...current, days: event.target.value }))}
              options={[
                { value: '30', label: '30+' },
                { value: '60', label: '60+' },
                { value: '90', label: '90+' },
              ]}
            />
          ) : null}
          {'status' in filters ? <Input label="Status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} placeholder="pending, paid..." /> : null}
          {'from' in filters ? <Input label="From" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /> : null}
          {'to' in filters ? <Input label="To" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /> : null}
        </div>
        {'include' in filters ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              ['student_details', 'Student details'],
              ['class_and_section', 'Class and section'],
              ['fee_breakdown', 'Fee breakdown'],
              ['payment_history', 'Payment history'],
              ['balance', 'Balance'],
              ['contact_details', 'Contact details'],
            ].map(([value, label]) => {
              const active = filters.include.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilters((current) => ({
                    ...current,
                    include: active ? current.include.filter((item) => item !== value) : [...current.include, value],
                  }))}
                  className="rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{
                    borderColor     : active ? 'rgba(221,141,31,0.3)' : 'var(--color-border)',
                    backgroundColor : active ? 'rgba(245,158,11,0.10)' : 'var(--color-surface-raised)',
                    color           : active ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        ) : null}
      </AccountantSection>

      {report ? (
        <>
          <div className={`grid gap-4 ${report.metrics.length > 3 ? 'xl:grid-cols-4' : `md:grid-cols-${Math.max(1, report.metrics.length)}`}`}>
            {report.metrics.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} accent={metric.accent} />
            ))}
          </div>
          <AccountantSection title="Report Output" subtitle="Export to CSV or print this view for PDF generation.">
            {loading ? <TableSkeleton cols={report.columns.length} rows={8} /> : <SummaryTable columns={report.columns} rows={report.rows} emptyTitle="No report rows found" emptyDescription="Adjust the report filters and try again." />}
          </AccountantSection>
        </>
      ) : (
        <AccountantSection title="Report Output">
          <TableSkeleton cols={6} rows={6} />
        </AccountantSection>
      )}
    </div>
  )
}
