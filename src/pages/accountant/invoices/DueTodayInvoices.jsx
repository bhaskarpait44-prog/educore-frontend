import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { InvoiceTable } from './AllInvoices'

const DueTodayInvoices = () => {
  usePageTitle('Due Today Invoices')
  const [rows, setRows] = useState([])

  useEffect(() => {
    accountantApi.getDueTodayInvoices().then((response) => setRows(response.data?.invoices || [])).catch(() => {})
  }, [])

  return <InvoiceTable title="Due Today Invoices" rows={rows} />
}

export default DueTodayInvoices
