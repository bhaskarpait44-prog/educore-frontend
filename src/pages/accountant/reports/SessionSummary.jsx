import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const SessionSummary = () => {
  usePageTitle('Session Summary')
  const { data } = useReports(accountantApi.getSessionReport, {})
  return <ReportScaffold title="Session Summary Report" data={data} rowsKey="recent_payments" columns={[{ key: 'student_name', label: 'Student' }, { key: 'receipt_no', label: 'Receipt' }, { key: 'amount', label: 'Amount', format: 'currency' }, { key: 'payment_date', label: 'Date', format: 'date' }]} />
}

export default SessionSummary
