import { Link } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'

const REPORTS = [
  { label: 'Daily Report', path: ROUTES.ACCOUNTANT_REPORT_DAILY },
  { label: 'Monthly Report', path: ROUTES.ACCOUNTANT_REPORT_MONTHLY },
  { label: 'Class Wise Report', path: ROUTES.ACCOUNTANT_REPORT_CLASSWISE },
  { label: 'Session Summary', path: ROUTES.ACCOUNTANT_REPORT_SESSION },
  { label: 'Defaulter Report', path: ROUTES.ACCOUNTANT_REPORT_DEFAULTERS },
  { label: 'Concession Report', path: ROUTES.ACCOUNTANT_REPORT_CONCESSIONS },
  { label: 'Custom Report', path: ROUTES.ACCOUNTANT_REPORT_CUSTOM },
]

const ReportsHome = () => {
  usePageTitle('Reports')

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Reports</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Open the report you need for the day, month, class, session, or follow-up cycle.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Link
            key={report.path}
            to={report.path}
            className="rounded-[24px] border p-5 text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {report.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ReportsHome
