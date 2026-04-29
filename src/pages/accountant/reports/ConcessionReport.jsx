import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const ConcessionReport = () => {
  usePageTitle('Concession Report')
  const { data } = useReports(accountantApi.getConcessionReport, {})
  return <ReportScaffold title="Concession Report" data={data} rowsKey="concessions" columns={[{ key: 'student_name', label: 'Student' }, { key: 'class_name', label: 'Class' }, { key: 'fee_name', label: 'Fee Type' }, { key: 'original_amount', label: 'Original', format: 'currency' }, { key: 'concession_amount', label: 'Concession', format: 'currency' }]} />
}

export default ConcessionReport
