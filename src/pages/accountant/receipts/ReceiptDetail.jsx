import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import ReceiptPrint from '@/components/accountant/ReceiptPrint'

const ReceiptDetail = () => {
  usePageTitle('Receipt Detail')
  const { id } = useParams()
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    accountantApi.getReceiptById(id).then((response) => setReceipt(response.data)).catch(() => {})
  }, [id])

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Receipt Detail</h1>
      </div>
      <ReceiptPrint receipt={receipt} />
    </div>
  )
}

export default ReceiptDetail
