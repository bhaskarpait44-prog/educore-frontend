import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const DailyReport = () => {
  usePageTitle('Daily Collection Report')
  const { data } = useReports(accountantApi.getDailyReport, {})
  return <ReportScaffold title="Daily Collection Report" data={data} rowsKey="transactions" columns={[{ key: 'payment_date', label: 'Date', format: 'date' }, { key: 'student_name', label: 'Student' }, { key: 'class_name', label: 'Class' }, { key: 'fee_name', label: 'Fee Type' }, { key: 'amount', label: 'Amount', format: 'currency' }, { key: 'payment_mode', label: 'Mode' }]} />
}

export default DailyReport
