import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Download,
  Mail,
  Phone,
  Printer,
  Search,
  Square,
  Wallet,
  X,
} from 'lucide-react'
import useAccountant from '@/hooks/useAccountant'
import useToast from '@/hooks/useToast'
import * as accountantApi from '@/api/accountantApi'
import { ROUTES } from '@/constants/app'
import { debounce, formatCurrency, formatDate } from '@/utils/helpers'
import ReceiptPrint from '@/pages/accountant/ReceiptPrint'

const STEPS = [
  'Student Search',
  'Invoice Selection',
  'Payment Details',
  'Review & Confirm',
  'Receipt Generated',
]

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'online', label: 'Online', emoji: '🏦' },
  { value: 'cheque', label: 'Cheque', emoji: '📄' },
  { value: 'dd', label: 'DD', emoji: '📋' },
  { value: 'upi', label: 'UPI', emoji: '📱' },
]

function emptyFormState() {
  return {
    amount              : '',
    payment_mode        : 'cash',
    payment_date        : new Date().toISOString().split('T')[0],
    remarks             : '',
    transaction_id      : '',
    bank_name           : '',
    transfer_date       : '',
    cheque_number       : '',
    cheque_date         : '',
    micr_code           : '',
    upi_reference_number: '',
    upi_id              : '',
    dd_number           : '',
    dd_date             : '',
    branch              : '',
  }
}

function getInvoiceBalance(invoice) {
  const balance = Number(
    invoice.balance ??
    (Number(invoice.amount_due || 0) + Number(invoice.late_fee_amount || 0) - Number(invoice.concession_amount || 0) - Number(invoice.amount_paid || 0))
  )
  return Math.max(0, balance)
}

function normalizeStudent(result) {
  return {
    id              : result.id,
    name            : result.student_name || result.name || 'Unknown Student',
    admission_no    : result.admission_no,
    class_name      : result.class_name,
    section_name    : result.section_name,
    photo_path      : result.photo_path || null,
    pending_amount  : Number(result.pending_amount ?? result.balance ?? 0),
  }
}

function StepDots({ step }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {STEPS.map((label, index) => {
        const state = index < step ? 'done' : index === step ? 'active' : 'todo'
        return (
          <div key={label} className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor:
                    state === 'done' ? '#16a34a'
                      : state === 'active' ? '#dd8d1f'
                        : 'var(--color-surface-raised)',
                  color: state === 'todo' ? 'var(--color-text-muted)' : '#fff',
                }}
              >
                {state === 'done' ? <Check size={14} /> : index + 1}
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className="h-1 flex-1 rounded-full"
                  style={{ backgroundColor: index < step ? '#16a34a' : 'var(--color-border)' }}
                />
              ) : null}
            </div>
            <div className="text-xs font-medium" style={{ color: state === 'active' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PaymentField({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      {children}
      {hint ? <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</div> : null}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', max, autoFocus = false }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      max={max}
      autoFocus={autoFocus}
      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:ring-4"
      style={{
        backgroundColor : 'var(--color-surface)',
        borderColor     : 'var(--color-border)',
        color           : 'var(--color-text-primary)',
        boxShadow       : 'none',
      }}
    />
  )
}

export default function FeeCollectionForm() {
  const searchInputRef = useRef(null)
  const navigateRef = useRef(null)
  const { toastError, toastSuccess, toastInfo } = useToast()
  const {
    collectFee,
    isSaving,
    searchStudents,
    fetchPendingInvoices,
  } = useAccountant()

  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [pendingInvoices, setPendingInvoices] = useState([])
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [form, setForm] = useState(emptyFormState())
  const [showPartialConfirm, setShowPartialConfirm] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)

  const doSearch = useMemo(() => debounce(async (value) => {
    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const items = await searchStudents(trimmed)
    setSearchResults(items.map(normalizeStudent))
    setIsSearching(false)
  }, 220), [searchStudents])

  useEffect(() => {
    doSearch(query)
  }, [doSearch, query])

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const selectedInvoices = useMemo(
    () => pendingInvoices.filter((invoice) => selectedInvoiceIds.includes(invoice.id)),
    [pendingInvoices, selectedInvoiceIds],
  )

  const totals = useMemo(() => {
    const total = selectedInvoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice), 0)
    return {
      selectedCount: selectedInvoices.length,
      total,
    }
  }, [selectedInvoices])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      amount: totals.total > 0 ? String(totals.total.toFixed(2)) : '',
    }))
  }, [totals.total])

  const carriedForwardInvoices = useMemo(
    () => pendingInvoices.filter((invoice) => invoice.carry_from_invoice_id),
    [pendingInvoices],
  )

  const normalInvoices = useMemo(
    () => pendingInvoices.filter((invoice) => !invoice.carry_from_invoice_id),
    [pendingInvoices],
  )

  const loadStudent = async (student) => {
    setSelectedStudent(student)
    setQuery(`${student.name}`)
    setSearchResults([])
    setIsLoadingInvoices(true)

    try {
      const response = await fetchPendingInvoices(student.id)
      const invoices = response.invoices || []
      const studentMeta = response.student
        ? {
            ...student,
            name           : response.student.student_name || student.name,
            admission_no   : response.student.admission_no || student.admission_no,
            class_name     : response.student.class_name || student.class_name,
            section_name   : response.student.section_name || student.section_name,
            roll_number    : response.student.roll_number || null,
            photo_path     : response.student.photo_path || student.photo_path,
            email          : response.student.email || null,
            phone          : response.student.phone || null,
            pending_amount : Number(response.total_pending || student.pending_amount || 0),
          }
        : student

      setSelectedStudent(studentMeta)
      setPendingInvoices(invoices)
      setSelectedInvoiceIds(invoices.map((invoice) => invoice.id))
      setStep(1)
    } catch (error) {
      toastError(error.message || 'Failed to load student invoices')
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  const resetAll = () => {
    setStep(0)
    setQuery('')
    setSearchResults([])
    setSelectedStudent(null)
    setPendingInvoices([])
    setSelectedInvoiceIds([])
    setForm(emptyFormState())
    setReceiptPreview(null)
    setShowReceiptPreview(false)
    setShowPartialConfirm(false)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  const toggleInvoice = (invoiceId) => {
    setSelectedInvoiceIds((current) => (
      current.includes(invoiceId)
        ? current.filter((id) => id !== invoiceId)
        : [...current, invoiceId]
    ))
  }

  const setAllInvoices = (filterFn = null) => {
    const source = filterFn ? pendingInvoices.filter(filterFn) : pendingInvoices
    setSelectedInvoiceIds(source.map((invoice) => invoice.id))
  }

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const validatePaymentStep = () => {
    if (!selectedStudent) {
      toastError('Select a student first')
      setStep(0)
      return false
    }
    if (!selectedInvoiceIds.length) {
      toastError('Select at least one invoice')
      return false
    }

    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      toastError('Enter a valid payment amount')
      return false
    }

    if (!form.payment_date) {
      toastError('Payment date is required')
      return false
    }

    const today = new Date().toISOString().split('T')[0]
    if (form.payment_date > today) {
      toastError('Future payment date is not allowed')
      return false
    }

    if (form.payment_mode === 'online' && !form.transaction_id.trim()) {
      toastError('Transaction ID is required for online transfer')
      return false
    }
    if (form.payment_mode === 'upi' && !form.upi_reference_number.trim()) {
      toastError('UPI reference number is required')
      return false
    }
    if (form.payment_mode === 'cheque' && (!form.cheque_number.trim() || !form.bank_name.trim() || !form.cheque_date)) {
      toastError('Cheque number, bank name, and cheque date are required')
      return false
    }
    if (form.payment_mode === 'dd' && (!form.dd_number.trim() || !form.bank_name.trim() || !form.dd_date)) {
      toastError('DD number, bank name, and DD date are required')
      return false
    }

    return true
  }

  const proceedToReview = () => {
    if (!validatePaymentStep()) return

    if (Number(form.amount) < totals.total) {
      setShowPartialConfirm(true)
      return
    }

    setStep(3)
  }

  const receiptContact = receiptPreview?.receipt || receiptPreview?.student || {}

  const handleCollect = async () => {
    const payload = {
      student_id            : selectedStudent.id,
      invoice_ids           : selectedInvoiceIds,
      amount                : Number(form.amount),
      payment_mode          : form.payment_mode,
      payment_date          : form.payment_date,
      remarks               : form.remarks,
      transaction_id        : form.transaction_id || undefined,
      bank_name             : form.bank_name || undefined,
      transfer_date         : form.transfer_date || undefined,
      cheque_number         : form.cheque_number || undefined,
      cheque_date           : form.cheque_date || undefined,
      micr_code             : form.micr_code || undefined,
      upi_reference_number  : form.upi_reference_number || undefined,
      upi_id                : form.upi_id || undefined,
      dd_number             : form.dd_number || undefined,
      dd_date               : form.dd_date || undefined,
      branch                : form.branch || undefined,
    }

    const result = await collectFee(payload)
    if (!result.success) return

    const receiptData = result.data?.receipt || {}
    const paymentData = result.data?.payment || {}
    const preview = {
      ...result.data,
      receipt: {
        ...receiptData,
        amount        : receiptData.amount ?? paymentData.amountApplied ?? Number(form.amount),
        amount_paid   : receiptData.amount ?? paymentData.amountApplied ?? Number(form.amount),
        payment_mode  : receiptData.payment_mode_display || form.payment_mode,
        payment_date  : receiptData.payment_date || form.payment_date,
        transaction_ref: receiptData.transaction_ref || form.transaction_id || form.upi_reference_number || form.cheque_number || form.dd_number || null,
      },
      student: selectedStudent,
      invoices: selectedInvoices,
      form,
    }

    setReceiptPreview(preview)
    setStep(4)
    setShowPartialConfirm(false)
  }

  const printReceipt = () => {
    setShowReceiptPreview(true)
  }

  const downloadReceipt = async () => {
    const receiptId = receiptPreview?.receipt?.payment_id || receiptPreview?.payment?.paymentId
    if (!receiptId) {
      toastError('Receipt is not ready for download')
      return
    }

    try {
      const response = await accountantApi.getReceiptPdf(receiptId)
      const blob = new Blob([response.data?.html || ''], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = response.data?.filename || `${receiptPreview.receipt?.receipt_no || 'receipt'}.html`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toastSuccess('Receipt download prepared')
    } catch (error) {
      toastError(error.message || 'Unable to download receipt')
    }
  }

  const sendEmailReceipt = async () => {
    const receiptId = receiptPreview?.receipt?.payment_id || receiptPreview?.payment?.paymentId
    if (!receiptId) return
    try {
      await accountantApi.emailReceipt(receiptId)
      toastSuccess('Receipt email queued')
    } catch (error) {
      toastError(error.message || 'Failed to queue email receipt')
    }
  }

  const sendWhatsappReceipt = async () => {
    const receiptId = receiptPreview?.receipt?.payment_id || receiptPreview?.payment?.paymentId
    if (!receiptId) return
    try {
      await accountantApi.whatsappReceipt(receiptId)
      toastSuccess('WhatsApp receipt queued')
    } catch (error) {
      toastError(error.message || 'Failed to queue WhatsApp receipt')
    }
  }

  useEffect(() => {
    const handler = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        if (showReceiptPreview) {
          setShowReceiptPreview(false)
          return
        }
        if (step > 0 && step < 4) {
          setStep((current) => Math.max(0, current - 1))
        }
      }

      if (event.key === 'Enter' && step === 0 && searchResults.length > 0 && document.activeElement === searchInputRef.current) {
        event.preventDefault()
        loadStudent(searchResults[0])
      }

      if (event.ctrlKey && event.key === 'Enter' && step === 3 && !isSaving) {
        event.preventDefault()
        handleCollect()
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'p' && step === 4) {
        event.preventDefault()
        printReceipt()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCollect, isSaving, loadStudent, searchResults, showReceiptPreview, step])

  const renderStudentSearch = (
    <div className="space-y-5">
      <div className="relative">
        <div className="rounded-[1.6rem] border p-3 shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(221,141,31,0.12)', color: '#dd8d1f' }}>
              <Search size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                Search by name or admission number
              </div>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type at least 2 characters…"
                className="mt-1 w-full bg-transparent text-lg outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSearchResults([])
                  setSelectedStudent(null)
                }}
                className="rounded-xl p-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {(searchResults.length > 0 || isSearching) && (
          <div
            className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[1.3rem] border shadow-2xl"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            {isSearching ? (
              <div className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>Searching…</div>
            ) : searchResults.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => loadStudent(student)}
                className="flex w-full items-center gap-3 border-b px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-amber-50/40 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                >
                  {(student.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.name}</div>
                  <div className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {student.admission_no} · {student.class_name} {student.section_name || ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pending</div>
                  <div className="text-sm font-semibold" style={{ color: student.pending_amount > 0 ? '#dc2626' : '#15803d' }}>
                    {formatCurrency(student.pending_amount || 0)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStudent ? (
        <div className="rounded-[1.7rem] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              {(selectedStudent.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{selectedStudent.name}</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedStudent.admission_no} · {selectedStudent.class_name} {selectedStudent.section_name || ''}
                {selectedStudent.roll_number ? ` · Roll ${selectedStudent.roll_number}` : ''}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null)
                  setPendingInvoices([])
                  setSelectedInvoiceIds([])
                  searchInputRef.current?.focus()
                }}
                className="mt-3 text-sm font-semibold"
                style={{ color: '#dd8d1f' }}
              >
                Wrong student? Search again
              </button>
            </div>
            <div className="rounded-[1.4rem] px-5 py-4 text-right" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>Total Pending</div>
              <div className="mt-2 text-2xl font-bold" style={{ color: selectedStudent.pending_amount > 0 ? '#dc2626' : '#15803d' }}>
                {formatCurrency(selectedStudent.pending_amount || 0)}
              </div>
              <div className="mt-1 text-xs" style={{ color: selectedStudent.pending_amount > 0 ? '#dc2626' : '#15803d' }}>
                {selectedStudent.pending_amount > 0 ? 'Payment required' : 'Fully paid'}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isLoadingInvoices}
              onClick={() => setStep(1)}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', opacity: isLoadingInvoices ? 0.65 : 1 }}
            >
              {isLoadingInvoices ? 'Loading invoices…' : 'Continue to invoices'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderInvoiceRow = (invoice) => {
    const isSelected = selectedInvoiceIds.includes(invoice.id)
    const balance = getInvoiceBalance(invoice)
    const overdue = invoice.due_date && invoice.due_date < new Date().toISOString().split('T')[0]
    return (
      <button
        key={invoice.id}
        type="button"
        onClick={() => toggleInvoice(invoice.id)}
        className="flex w-full items-start gap-4 rounded-[1.4rem] border p-4 text-left transition-colors hover:bg-amber-50/40 dark:hover:bg-white/5"
        style={{
          borderColor     : isSelected ? '#dd8d1f' : 'var(--color-border)',
          backgroundColor : isSelected ? 'rgba(221,141,31,0.08)' : 'var(--color-surface)',
        }}
      >
        <div className="pt-1" style={{ color: isSelected ? '#dd8d1f' : 'var(--color-text-muted)' }}>
          {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</div>
            {invoice.carry_from_invoice_id ? (
              <span className="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold" style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>
                CF
              </span>
            ) : null}
            {overdue ? (
              <span className="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold" style={{ backgroundColor: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>
                OVERDUE
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Due: {formatDate(invoice.due_date)} · {invoice.frequency || 'fee'} · Paid so far {formatCurrency(invoice.amount_paid || 0)}
          </div>
          {overdue ? (
            <div className="mt-2 text-xs font-medium" style={{ color: '#dc2626' }}>
              Late fee: {formatCurrency(invoice.late_fee_amount || 0)}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold" style={{ color: '#dc2626' }}>{formatCurrency(balance)}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {invoice.status}
          </div>
        </div>
      </button>
    )
  }

  const renderInvoiceSelection = (
    <div className="space-y-5">
      <div className="rounded-[1.6rem] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Invoice Selection</div>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {selectedStudent?.name} · {pendingInvoices.length} pending invoices
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setAllInvoices((invoice) => invoice.due_date <= new Date().toISOString().split('T')[0])} className="rounded-2xl border px-4 py-2 text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              Select All Due Today
            </button>
            <button type="button" onClick={() => setAllInvoices()} className="rounded-2xl border px-4 py-2 text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              Select All Pending
            </button>
            <button type="button" onClick={() => setSelectedInvoiceIds([])} className="rounded-2xl border px-4 py-2 text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              Clear Selection
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {normalInvoices.length > 0 ? (
            <div className="space-y-3">
              {normalInvoices.map(renderInvoiceRow)}
            </div>
          ) : null}

          {carriedForwardInvoices.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#2563eb' }}>Carried Forward Invoices</div>
              {carriedForwardInvoices.map(renderInvoiceRow)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={() => setStep(0)}
          className="rounded-2xl border px-5 py-3 text-sm font-medium"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={15} className="mr-2 inline" />
          Back
        </button>
        <div className="rounded-[1.5rem] border px-5 py-4 text-right" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
            Selected: {totals.selectedCount} invoices
          </div>
          <div className="mt-1 text-2xl font-bold" style={{ color: '#dd8d1f' }}>{formatCurrency(totals.total)}</div>
          <button
            type="button"
            disabled={!selectedInvoiceIds.length}
            onClick={() => setStep(2)}
            className="mt-3 rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            Continue to payment
          </button>
        </div>
      </div>
    </div>
  )

  const renderPaymentModeFields = () => {
    switch (form.payment_mode) {
      case 'online':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <PaymentField label="Transaction ID" hint="Required">
              <TextInput value={form.transaction_id} onChange={(event) => updateField('transaction_id', event.target.value)} placeholder="Bank or transfer reference" />
            </PaymentField>
            <PaymentField label="Bank Name" hint="Optional">
              <TextInput value={form.bank_name} onChange={(event) => updateField('bank_name', event.target.value)} placeholder="SBI, HDFC, ICICI…" />
            </PaymentField>
            <PaymentField label="Transfer Date">
              <TextInput type="date" value={form.transfer_date} onChange={(event) => updateField('transfer_date', event.target.value)} />
            </PaymentField>
          </div>
        )
      case 'cheque':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <PaymentField label="Cheque Number" hint="Required">
              <TextInput value={form.cheque_number} onChange={(event) => updateField('cheque_number', event.target.value)} placeholder="Cheque number" />
            </PaymentField>
            <PaymentField label="Bank Name" hint="Required">
              <TextInput value={form.bank_name} onChange={(event) => updateField('bank_name', event.target.value)} placeholder="Issuing bank" />
            </PaymentField>
            <PaymentField label="Cheque Date" hint="Required">
              <TextInput type="date" value={form.cheque_date} onChange={(event) => updateField('cheque_date', event.target.value)} />
            </PaymentField>
            <PaymentField label="MICR Code" hint="Optional">
              <TextInput value={form.micr_code} onChange={(event) => updateField('micr_code', event.target.value)} placeholder="MICR code" />
            </PaymentField>
            <div className="md:col-span-2 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(37,99,235,0.18)', backgroundColor: 'rgba(37,99,235,0.06)', color: '#2563eb' }}>
              Cheque will remain pending until clearance.
            </div>
          </div>
        )
      case 'upi':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <PaymentField label="UPI Reference Number" hint="Required">
              <TextInput value={form.upi_reference_number} onChange={(event) => updateField('upi_reference_number', event.target.value)} placeholder="UPI reference number" />
            </PaymentField>
            <PaymentField label="UPI ID" hint="Optional">
              <TextInput value={form.upi_id} onChange={(event) => updateField('upi_id', event.target.value)} placeholder="payer@upi" />
            </PaymentField>
          </div>
        )
      case 'dd':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <PaymentField label="DD Number" hint="Required">
              <TextInput value={form.dd_number} onChange={(event) => updateField('dd_number', event.target.value)} placeholder="Demand draft number" />
            </PaymentField>
            <PaymentField label="Bank Name" hint="Required">
              <TextInput value={form.bank_name} onChange={(event) => updateField('bank_name', event.target.value)} placeholder="Bank name" />
            </PaymentField>
            <PaymentField label="DD Date" hint="Required">
              <TextInput type="date" value={form.dd_date} onChange={(event) => updateField('dd_date', event.target.value)} />
            </PaymentField>
            <PaymentField label="Branch" hint="Optional">
              <TextInput value={form.branch} onChange={(event) => updateField('branch', event.target.value)} placeholder="Branch name" />
            </PaymentField>
          </div>
        )
      default:
        return (
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
            Cash selected. No extra payment reference is needed.
          </div>
        )
    }
  }

  const renderPaymentStep = (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[1.6rem] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Payment Details</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Fast counter entry with keyboard-friendly fields
          </div>

          <div className="mt-5 grid gap-5">
            <PaymentField label="Payment Amount">
              <TextInput type="number" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} placeholder={String(totals.total.toFixed(2))} />
            </PaymentField>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PAYMENT_MODES.map((mode) => {
                const active = form.payment_mode === mode.value
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => updateField('payment_mode', mode.value)}
                    className="rounded-[1.3rem] border p-4 text-left transition-all hover:-translate-y-0.5"
                    style={{
                      borderColor     : active ? '#dd8d1f' : 'var(--color-border)',
                      backgroundColor : active ? 'rgba(221,141,31,0.08)' : 'var(--color-surface)',
                    }}
                  >
                    <div className="text-xl">{mode.emoji}</div>
                    <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{mode.label}</div>
                  </button>
                )
              })}
            </div>

            {renderPaymentModeFields()}

            <div className="grid gap-4 md:grid-cols-2">
              <PaymentField label="Payment Date">
                <TextInput type="date" max={new Date().toISOString().split('T')[0]} value={form.payment_date} onChange={(event) => updateField('payment_date', event.target.value)} />
              </PaymentField>
              <PaymentField label="Remarks" hint="Optional">
                <TextInput value={form.remarks} onChange={(event) => updateField('remarks', event.target.value)} placeholder="Advance payment, correction, note…" />
              </PaymentField>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Running Summary</div>
          <div className="mt-4 space-y-3">
            {selectedInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-2xl p-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{invoice.fee_name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(invoice.due_date)}</div>
                </div>
                <div className="text-sm font-semibold">{formatCurrency(getInvoiceBalance(invoice))}</div>
              </div>
            ))}
          </div>

          {Number(form.amount) < totals.total ? (
            <div className="mt-4 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.08)', color: '#b45309' }}>
              Warning: amount is less than selected invoices. This will be recorded as partial payment.
            </div>
          ) : null}

          <div className="mt-5 rounded-[1.5rem] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Selected invoices</span>
              <strong>{totals.selectedCount}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Expected total</span>
              <strong>{formatCurrency(totals.total)}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-bold">
              <span style={{ color: 'var(--color-text-primary)' }}>Amount to collect</span>
              <span style={{ color: '#dd8d1f' }}>{formatCurrency(Number(form.amount || 0))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setStep(1)} className="rounded-2xl border px-5 py-3 text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={15} className="mr-2 inline" />
          Back
        </button>
        <button type="button" onClick={proceedToReview} className="rounded-2xl px-5 py-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
          Review & Confirm
        </button>
      </div>
    </div>
  )

  const renderReviewStep = (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="rounded-[1.6rem] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Review & Confirm</div>
        <div className="mt-4 space-y-4">
          <div className="rounded-[1.5rem] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <div className="text-sm font-semibold">{selectedStudent?.name}</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {selectedStudent?.class_name} {selectedStudent?.section_name || ''} · {selectedStudent?.admission_no}
            </div>
          </div>

          <div className="rounded-[1.5rem] border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Fee Details</div>
            <div className="mt-3 space-y-3">
              {selectedInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between text-sm">
                  <span>{invoice.fee_name}</span>
                  <strong>{formatCurrency(getInvoiceBalance(invoice))}</strong>
                </div>
              ))}
              <div className="border-t pt-3 text-base font-bold" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span style={{ color: '#dd8d1f' }}>{formatCurrency(Number(form.amount || 0))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border p-4 text-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Payment Mode</div>
                <div className="mt-1 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{form.payment_mode.toUpperCase()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)' }}>Date</div>
                <div className="mt-1 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatDate(form.payment_date)}</div>
              </div>
              <div className="md:col-span-2">
                <div style={{ color: 'var(--color-text-muted)' }}>Remarks</div>
                <div className="mt-1 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{form.remarks || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {Number(form.amount) < totals.total ? (
          <div className="rounded-[1.4rem] border px-4 py-3 text-sm" style={{ borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.08)', color: '#b45309' }}>
            <AlertTriangle size={16} className="mr-2 inline" />
            Partial payment will be applied to the selected invoices in order.
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <button type="button" onClick={() => setStep(2)} className="w-full rounded-2xl border px-5 py-3 text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <ArrowLeft size={15} className="mr-2 inline" />
            Back
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleCollect}
            className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            {isSaving ? 'Generating receipt…' : 'Confirm & Generate Receipt'}
          </button>
          <div className="rounded-2xl border px-4 py-3 text-xs" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
            Keyboard shortcuts: `Ctrl+F` search, `Ctrl+Enter` confirm, `Ctrl+P` print receipt, `Esc` go back.
          </div>
        </div>
      </div>
    </div>
  )

  const renderReceiptStep = receiptPreview ? (
    <div className="space-y-5">
      <div className="rounded-[1.7rem] border p-6 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(22,163,74,0.12)' }}>
          <CheckCircle2 size={36} style={{ color: '#16a34a' }} />
        </div>
        <div className="mt-5 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Receipt generated successfully</div>
        <div className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Receipt number: <strong>{receiptPreview.receipt?.receipt_no || 'Generated'}</strong>
        </div>
        <div className="mt-3 text-4xl font-bold" style={{ color: '#16a34a' }}>
          {formatCurrency(receiptPreview.receipt?.amount_paid || receiptPreview.receipt?.amount || form.amount)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button type="button" onClick={printReceipt} className="rounded-2xl border px-5 py-4 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
          <Printer size={16} className="mr-2 inline" />
          Print Receipt
        </button>
        <button type="button" onClick={downloadReceipt} className="rounded-2xl border px-5 py-4 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
          <Download size={16} className="mr-2 inline" />
          Download PDF
        </button>
        <button
          type="button"
          disabled={!receiptContact.phone}
          onClick={sendWhatsappReceipt}
          className="rounded-2xl border px-5 py-4 text-sm font-semibold disabled:opacity-50"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <Phone size={16} className="mr-2 inline" />
          WhatsApp Receipt
        </button>
        <button
          type="button"
          disabled={!receiptContact.email}
          onClick={sendEmailReceipt}
          className="rounded-2xl border px-5 py-4 text-sm font-semibold disabled:opacity-50"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <Mail size={16} className="mr-2 inline" />
          Email Receipt
        </button>
        <button type="button" onClick={resetAll} className="rounded-2xl px-5 py-4 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
          <Wallet size={16} className="mr-2 inline" />
          Collect Another
        </button>
        <button
          type="button"
          onClick={() => window.location.assign(ROUTES.ACCOUNTANT_STUDENTS)}
          className="rounded-2xl border px-5 py-4 text-sm font-semibold"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          View Student Fees
        </button>
      </div>
    </div>
  ) : null

  return (
    <div className="space-y-6">
      <StepDots step={step} />

      {step === 0 ? renderStudentSearch : null}
      {step === 1 ? renderInvoiceSelection : null}
      {step === 2 ? renderPaymentStep : null}
      {step === 3 ? renderReviewStep : null}
      {step === 4 ? renderReceiptStep : null}

      {showPartialConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.7rem] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Apply as partial payment?</div>
            <div className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Amount entered is less than the selected invoices total. The system will record partial payment and generate a receipt now.
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowPartialConfirm(false)} className="flex-1 rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                No, go back
              </button>
              <button type="button" onClick={() => { setShowPartialConfirm(false); setStep(3) }} className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showReceiptPreview && receiptPreview ? (
        <ReceiptPrint
          receipt={{
            ...receiptPreview.receipt,
            student : receiptPreview.student,
            invoices: receiptPreview.invoices,
          }}
          onClose={() => setShowReceiptPreview(false)}
        />
      ) : null}
    </div>
  )
}
