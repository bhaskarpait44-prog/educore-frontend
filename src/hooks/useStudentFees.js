import { useCallback, useEffect, useMemo, useState } from 'react'
import * as studentApi from '@/api/studentApi'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const useStudentFees = () => {
  const [fees, setFees] = useState(null)
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [receiptLoadingId, setReceiptLoadingId] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const [feesRes, summaryRes, paymentsRes] = await Promise.all([
        studentApi.getStudentFees(),
        studentApi.getStudentFeeSummary(),
        studentApi.getStudentFeePayments(),
      ])

      setFees(feesRes?.data || null)
      setSummary(summaryRes?.data || null)
      setPayments(paymentsRes?.data?.payments || [])
      setLoading(false)
      setRefreshing(false)
      return feesRes?.data || null
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setFees({ invoices: [] })
        setSummary({
          total_due: 0,
          total_paid: 0,
          total_pending: 0,
          next_due_date: null,
          status: 'clear',
        })
        setPayments([])
        setLoading(false)
        setRefreshing(false)
        return null
      }

      setError(err?.message || 'Unable to load fee details.')
      setLoading(false)
      setRefreshing(false)
      throw err
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const openInvoice = useCallback(async (invoiceId) => {
    setDetailLoading(true)
    try {
      const res = await studentApi.getStudentFeeInvoiceDetail(invoiceId)
      setSelectedInvoice(res?.data || null)
      setDetailLoading(false)
      return res?.data || null
    } catch (err) {
      setDetailLoading(false)
      throw err
    }
  }, [])

  const fetchReceipt = useCallback(async (paymentId) => {
    setReceiptLoadingId(paymentId)
    try {
      const res = await studentApi.getStudentFeeReceipt(paymentId)
      setReceiptLoadingId(null)
      return res?.data || null
    } catch (err) {
      setReceiptLoadingId(null)
      throw err
    }
  }, [])

  return {
    fees,
    summary,
    payments,
    loading,
    refreshing,
    detailLoading,
    receiptLoadingId,
    selectedInvoice,
    error,
    invoices: fees?.invoices || [],
    carriedForwardInvoices: useMemo(
      () => (fees?.invoices || []).filter((invoice) => Boolean(invoice.carry_from_invoice_id)),
      [fees]
    ),
    refresh: () => load({ silent: true }),
    openInvoice,
    closeInvoice: () => setSelectedInvoice(null),
    fetchReceipt,
  }
}

export default useStudentFees
