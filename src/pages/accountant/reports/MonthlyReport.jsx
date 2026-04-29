import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const MonthlyReport = () => {
  usePageTitle('Monthly Collection Report')
  const { data } = useReports(accountantApi.getMonthlyReport, {})
  return <ReportScaffold title="Monthly Collection Report" data={data} rowsKey="days" columns={[{ key: 'date', label: 'Date', format: 'date' }, { key: 'collection', label: 'Collection', format: 'currency' }, { key: 'transactions', label: 'Transactions' }]} />
}

export default MonthlyReport
