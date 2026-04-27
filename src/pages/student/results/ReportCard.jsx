import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FileBarChart2, Printer, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ReportCardView from '@/components/student/ReportCardView'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'

const ReportCard = () => {
  usePageTitle('Report Card')

  const [searchParams, setSearchParams] = useSearchParams()
  const { toastError, toastInfo, toastSuccess } = useToast()
  const queryExamId = searchParams.get('examId') || ''
  const [publishedExams, setPublishedExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState(queryExamId || '')
  const [reportCard, setReportCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadReportCard = useCallback(async ({ silent = false, forcedExamId } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const resultsResponse = await studentApi.getStudentResults()
      const exams = (resultsResponse?.data?.exams || []).filter((exam) => exam.student_status === 'published')
      setPublishedExams(exams)

      const targetExamId = String(
        forcedExamId ||
        queryExamId ||
        selectedExamId ||
        exams[0]?.id ||
        ''
      )

      setSelectedExamId(targetExamId)

      if (targetExamId) {
        const reportResponse = await studentApi.getStudentReportCard(targetExamId)
        setReportCard(reportResponse?.data || null)
        if (String(queryExamId) !== String(targetExamId)) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('examId', targetExamId)
            return next
          }, { replace: true })
        }
      } else {
        setReportCard(null)
      }

      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      setError(err?.message || 'Unable to load report card.')
      setLoading(false)
      setRefreshing(false)
    }
  }, [queryExamId, selectedExamId, setSearchParams])

  useEffect(() => {
    loadReportCard().catch(() => {})
  }, [loadReportCard])

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const selectedExam = useMemo(
    () => publishedExams.find((exam) => String(exam.id) === String(selectedExamId)) || null,
    [publishedExams, selectedExamId]
  )

  const handleExamChange = async (event) => {
    const examId = event.target.value
    setSelectedExamId(examId)
    await loadReportCard({ forcedExamId: examId })
  }

  const handleRefresh = async () => {
    toastInfo('Refreshing report card')
    await loadReportCard({ silent: true, forcedExamId: selectedExamId })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = () => {
    if (!reportCard) return
    const printable = document.querySelector('.student-report-print-root')
    if (!printable) {
      toastError('Report card is not ready to print yet.')
      return
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) {
      toastError('Unable to open print window for PDF download.')
      return
    }

    popup.document.write(buildPrintableHtml(printable.outerHTML, selectedExam?.name))
    popup.document.close()
    popup.focus()
    window.setTimeout(() => popup.print(), 250)
    toastSuccess('PDF print dialog opened.')
  }

  return (
    <div className="space-y-5">
      <section
        className="student-report-no-print rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(79,70,229,0.08) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Official View
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Report Card</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              A4-ready official report card with school header, subject table, attendance summary, remarks, and print/PDF actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={!reportCard} icon={Download}>
              Download PDF
            </Button>
            <Button onClick={handlePrint} disabled={!reportCard} icon={Printer}>
              Print
            </Button>
          </div>
        </div>
      </section>

      <section
        className="student-report-no-print rounded-[28px] border p-4 sm:p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Select Exam
            </span>
            <select
              value={selectedExamId}
              onChange={handleExamChange}
              className="min-h-12 w-full rounded-2xl border px-4 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              {publishedExams.length === 0 && <option value="">No published exams</option>}
              {publishedExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[20px] border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Print View</p>
            <p className="mt-1 font-medium text-[var(--color-text-primary)]">Browser print opens the same layout shown below.</p>
          </div>
        </div>
      </section>

      {loading ? (
        <ReportCardSkeleton />
      ) : reportCard ? (
        <div className="px-0">
          <ReportCardView data={reportCard} examName={selectedExam?.name} />
        </div>
      ) : (
        <EmptyState
          icon={FileBarChart2}
          title="No published report card yet"
          description="Once at least one exam result is published, the official report card will appear here."
        />
      )}
    </div>
  )
}

const ReportCardSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="student-report-no-print rounded-[28px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="h-5 w-40 rounded-full bg-[var(--color-surface-raised)]" />
      <div className="mt-4 h-12 w-full rounded-2xl bg-[var(--color-surface-raised)]" />
    </div>
    <div className="mx-auto w-full max-w-[210mm] rounded-[20px] border bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.10)]" style={{ borderColor: '#cbd5e1' }}>
      <div className="h-8 w-48 rounded-full bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-16 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-2xl bg-slate-100" />
      <div className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  </div>
)

function buildPrintableHtml(content, examName) {
  return `
    <html>
      <head>
        <title>Report Card${examName ? ` - ${examName}` : ''}</title>
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; font-family: Arial, sans-serif; }
          body { padding: 16px; }
          @page { size: A4; margin: 10mm; }
          .student-report-print-root { max-width: 190mm; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; }
          @media print {
            body { padding: 0; }
            .student-report-print-root { max-width: none; }
          }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `
}

export default ReportCard
