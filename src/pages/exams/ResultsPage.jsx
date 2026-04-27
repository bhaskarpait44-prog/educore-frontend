// src/pages/exams/ResultsPage.jsx
import { useState, useEffect } from 'react'
import { Calculator, ArrowUpCircle, BarChart3 } from 'lucide-react'
import useExamStore from '@/store/examStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import OverrideResultModal from './OverrideResultModal'
import ReportCardModal from './ReportCardModal'
import PromoteStudentsModal from './PromoteStudentsModal'
import { getClasses, getClassOptions } from '@/api/classApi'
import { formatPercent } from '@/utils/helpers'

const RESULT_CFG = {
  pass        : { label: 'Pass',        variant: 'green'                                   },
  fail        : { label: 'Fail',        variant: 'red'                                     },
  compartment : { label: 'Compartment', variant: 'yellow'                                  },
  detained    : { label: 'Detained',    variant: 'dark', style: { color: '#7f1d1d' }       },
}

const GRADE_COLOR = { 'A+':'#15803d','A':'#16a34a','B+':'#2563eb','B':'#1d4ed8','C':'#d97706','D':'#ea580c','F':'#dc2626' }

const ResultsPage = () => {
  const { toastSuccess, toastError } = useToast()
  const { classResults, classResultsMeta, isLoading, isSaving, fetchClassResults, calculateResults, promoteStudents } = useExamStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [sessionId,    setSessionId]    = useState('')
  const [classId,      setClassId]      = useState('')
  const [classes,      setClasses]      = useState([])
  const [overrideTarget, setOverrideTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [calcConfirm,  setCalcConfirm]  = useState(false)
  const [promoteOpen, setPromoteOpen] = useState(false)

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession])

  useEffect(() => {
    if (!sessionId || !classId) return
    fetchClassResults({ session_id: sessionId, class_id: classId })
      .catch(() => toastError('Failed to load results'))
  }, [sessionId, classId])

  const handleCalculate = async () => {
    setCalcConfirm(false)
    let count = 0
    for (const row of classResults) {
      const res = await calculateResults({ enrollment_id: row.enrollment_id, session_id: parseInt(sessionId) })
      if (res.success) count++
    }
    toastSuccess(`Results calculated for ${count} students`)
    fetchClassResults({ session_id: sessionId, class_id: classId }).catch(() => {})
  }

  const handlePromote = async ({ new_session_id, new_class_id, new_section_id }) => {
    const passedEnrollments = classResults.filter(r => r.result === 'pass' && r.is_promoted)
    if (passedEnrollments.length === 0) {
      toastError('No students eligible for promotion')
      return
    }
    const result = await promoteStudents({
      session_id    : parseInt(sessionId),
      class_id      : parseInt(classId),
      new_session_id,
      new_class_id,
      new_section_id,
    })
    if (result.success) {
      toastSuccess(`${result.data?.promoted_count || passedEnrollments.length} students promoted`)
      setPromoteOpen(false)
    } else {
      toastError(result.message || 'Promotion failed')
    }
  }

  const passedCount   = classResults.filter(r => r.result === 'pass').length
  const failedCount   = classResults.filter(r => r.result === 'fail').length
  const compCount     = classResults.filter(r => r.result === 'compartment').length
  const hasPendingReview = Number(classResultsMeta?.submitted_count || 0) > 0 || Number(classResultsMeta?.rejected_count || 0) > 0

  return (
    <div className="space-y-5">
      {/* Filters + actions */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
          containerClassName="flex-1"
        />
        <Select
          label="Class"
          value={classId}
          onChange={e => setClassId(e.target.value)}
          options={classes}
          placeholder="Select class"
          containerClassName="flex-1"
        />
        <div className="flex items-end gap-2 flex-wrap">
          <Button
            variant="outline"
            icon={Calculator}
            onClick={() => setCalcConfirm(true)}
            disabled={!classId || classResults.length === 0 || hasPendingReview}
          >
            Calculate Results
          </Button>
          {passedCount > 0 && (
            <Button
              icon={ArrowUpCircle}
              onClick={() => setPromoteOpen(true)}
            >
              Promote ({passedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Summary badges */}
      {classResults.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: `${passedCount} Passed`,      color: '#16a34a', bg: '#f0fdf4' },
            { label: `${failedCount} Failed`,      color: '#dc2626', bg: '#fef2f2' },
            { label: `${compCount} Compartment`,   color: '#d97706', bg: '#fffbeb' },
          ].map(b => (
            <div
              key={b.label}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: b.bg, color: b.color }}
            >
              {b.label}
            </div>
          ))}
        </div>
      )}

      {!!classResultsMeta?.total_subjects && (
        <section
          className="rounded-[28px] border p-5"
          style={{ borderColor: hasPendingReview ? '#f59e0b55' : 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Marks review status
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {hasPendingReview
                  ? 'Final result calculation is blocked until submitted marks are approved in the exam review screen.'
                  : 'All reviewed subjects are clear for result calculation.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ReviewPill label="Approved" value={classResultsMeta.approved_count} tone="#15803d" bg="#f0fdf4" />
              <ReviewPill label="Submitted" value={classResultsMeta.submitted_count} tone="#b45309" bg="#fffbeb" />
              <ReviewPill label="Rejected" value={classResultsMeta.rejected_count} tone="#b91c1c" bg="#fef2f2" />
              <ReviewPill label="Draft" value={classResultsMeta.draft_count} tone="#475569" bg="#f8fafc" />
            </div>
          </div>
        </section>
      )}

      {/* Results table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {isLoading ? (
          <TableSkeleton cols={7} rows={5} />
        ) : classResults.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={!classId ? 'Select a class' : 'No results found'}
            description={!classId ? 'Choose session and class to view results.' : 'Click "Calculate Results" to compute final results.'}
            className="border-0 rounded-none py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Roll','Student','Total Marks','Percentage','Grade','Result',''].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classResults.map((row, i) => {
                  const resultCfg = RESULT_CFG[row.result] || { label: row.result, variant: 'grey' }
                  const gradeColor = GRADE_COLOR[row.grade] || 'var(--color-text-secondary)'

                  return (
                    <tr
                      key={row.enrollment_id || i}
                      style={{ borderBottom: i < classResults.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <td className="px-4 py-3.5 text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
                        {row.roll_number || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {row.student_name || row.name}
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                          {row.admission_no}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {row.marks_obtained}/{row.total_marks}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-sm font-bold"
                          style={{ color: parseFloat(row.percentage) >= 40 ? '#16a34a' : '#dc2626' }}
                        >
                          {formatPercent(row.percentage)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold" style={{ color: gradeColor }}>
                          {row.grade || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {row.result ? (
                          <Badge variant={resultCfg.variant} dot>{resultCfg.label}</Badge>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Not calculated</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => row.result && setReportTarget(row)}
                            disabled={!row.result}
                          >
                            Report
                          </Button>
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => setOverrideTarget(row)}
                          >
                            Override
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calculate confirm */}
      <ConfirmDialog
        open={calcConfirm}
        onClose={() => setCalcConfirm(false)}
        onConfirm={handleCalculate}
        title="Calculate Results?"
        description={`This will calculate final results for all ${classResults.length} students in this class based on their marks and attendance.`}
        confirmLabel="Calculate"
        variant="primary"
        loading={isSaving}
      />

      <PromoteStudentsModal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        loading={isSaving}
        currentSessionId={sessionId}
        currentClassId={classId}
        sessions={sessions}
        onConfirm={handlePromote}
      />

      {/* Override modal */}
      <OverrideResultModal
        open={!!overrideTarget}
        student={overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onSuccess={() => {
          setOverrideTarget(null)
          fetchClassResults({ session_id: sessionId, class_id: classId })
        }}
      />

      {/* Report card modal */}
      <ReportCardModal
        open={!!reportTarget}
        student={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div>
  )
}

const ReviewPill = ({ label, value, tone, bg }) => (
  <div className="rounded-2xl px-4 py-2.5" style={{ backgroundColor: bg }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>{label}</p>
    <p className="mt-1 text-base font-bold" style={{ color: tone }}>{value || 0}</p>
  </div>
)

export default ResultsPage
