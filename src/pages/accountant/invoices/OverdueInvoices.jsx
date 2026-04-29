import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { InvoiceTable } from './AllInvoices'

const OverdueInvoices = () => {
  usePageTitle('Overdue Invoices')
  const [rows, setRows] = useState([])

  useEffect(() => {
    accountantApi.getOverdueInvoices().then((response) => setRows(response.data?.invoices || [])).catch(() => {})
  }, [])

  return <InvoiceTable title="Overdue Invoices" rows={rows.filter((row) => new Date(row.due_date) < new Date())} />
}

export default OverdueInvoices
