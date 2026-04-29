import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const ClassWiseReport = () => {
  usePageTitle('Class Wise Report')
  const { data } = useReports(accountantApi.getClasswiseReport, {})
  return <ReportScaffold title="Class Wise Fee Report" data={data} rowsKey="students" columns={[{ key: 'student_name', label: 'Student' }, { key: 'class_name', label: 'Class' }, { key: 'total_due', label: 'Due', format: 'currency' }, { key: 'total_paid', label: 'Paid', format: 'currency' }, { key: 'balance', label: 'Balance', format: 'currency' }]} />
}

export default ClassWiseReport
