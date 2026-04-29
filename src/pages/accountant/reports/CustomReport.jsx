import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const CustomReport = () => {
  usePageTitle('Custom Report')
  const [data, setData] = useState(null)

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Custom Report Builder</h1>
        <button type="button" onClick={() => accountantApi.buildCustomReport({ filters: {}, include: { student: true, balance: true } }).then((response) => setData(response.data)).catch(() => {})} className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
          Build Report
        </button>
      </div>
      {data && <ReportScaffold title="Custom Report Preview" data={{ rows: data.rows }} rowsKey="rows" columns={[{ key: 'student_name', label: 'Student' }, { key: 'class_name', label: 'Class' }, { key: 'total_due', label: 'Due', format: 'currency' }, { key: 'total_paid', label: 'Paid', format: 'currency' }, { key: 'balance', label: 'Balance', format: 'currency' }]} />}
    </div>
  )
}

export default CustomReport
