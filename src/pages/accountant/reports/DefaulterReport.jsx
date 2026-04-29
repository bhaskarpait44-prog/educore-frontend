import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const DefaulterReport = () => {
  usePageTitle('Defaulter Report')
  const { data } = useReports(accountantApi.getDefaulterReport, {})
  return <ReportScaffold title="Defaulter Report" data={data} rowsKey="defaulters" columns={[{ key: 'student_name', label: 'Student' }, { key: 'class_name', label: 'Class' }, { key: 'balance', label: 'Total Due', format: 'currency' }, { key: 'first_due_date', label: 'Overdue Since', format: 'date' }, { key: 'open_invoices', label: 'Open Invoices' }]} />
}

export default DefaulterReport
