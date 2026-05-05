import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  FileBarChart2,
  RefreshCw,
  Trophy,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ResultTable from '@/components/student/ResultTable'
import WhatIfAnalysis from '@/components/student/WhatIfAnalysis'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentResults from '@/hooks/useStudentResults'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { formatDate, formatPercent } from '@/utils/helpers'

const MyResults = () => {
  usePageTitle('My Results')

  const navigate = useNavigate()
  const { toastError, toastInfo } = useToast()
  const {
    exams,
    selectedExamId,
    selectedExam,
    result,
    loading,
    detailLoading,
    refreshing,
    error,
    selectExam,
    refresh,
  } = useStudentResults()

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const summary = result?.summary || null
  const subjects = result?.subjects || []
  const analysis = result?.analysis || null
  const compartment = result?.compartment || null

  const handleRefresh = async () => {
    toastInfo('Refreshing results')
    try {
      await refresh()
    } catch {}
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(79,70,229,0.08) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Exam Results
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Results</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              See published exams, open full subject-wise marks, and review your strengths and areas that need attention.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
            <Button
              onClick={() => navigate(selectedExamId ? `${ROUTES.STUDENT_REPORT_CARD}?examId=${selectedExamId}` : ROUTES.STUDENT_REPORT_CARD)}
              icon={FileBarChart2}
              disabled={!selectedExamId}
            >
              Report Card
            </Button>
          </div>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-4 sm:p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Exam Tabs</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Published results open instantly. Awaiting and upcoming exams stay visible too.
            </p>
          </div>
          <span className="rounded-full bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            {exams.length} total
          </span>
        </div>

        {loading ? (
          <ExamTabsSkeleton />
        ) : exams.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {exams.map((exam) => {
              const active = Number(selectedExamId) === Number(exam.id)
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => selectExam(exam.id)}
                  className="min-w-[170px] rounded-[24px] border px-4 py-4 text-left transition hover:-translate-y-0.5"
                  style={{
                    borderColor: active ? 'var(--student-accent)' : 'var(--color-border)',
                    backgroundColor: active ? 'rgba(124,58,237,0.10)' : 'var(--color-surface)',
                    boxShadow: active ? '0 16px 34px rgba(109,40,217,0.10)' : 'none',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{exam.name}</p>
                    <span className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={examStatusStyle(exam.student_status)}>
                      {exam.student_status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{formatDate(exam.start_date, 'short')}</p>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No exams available yet"
            description="Your school has not published or scheduled any exams for the current session."
          />
        )}
      </section>

      {loading ? (
        <ResultsPageSkeleton />
      ) : !selectedExam ? (
        <EmptyState
          icon={ClipboardList}
          title="No exam selected"
          description="Choose an exam tab to open the result view."
        />
      ) : selectedExam.student_status !== 'published' ? (
        <AwaitingExamPanel exam={selectedExam} />
      ) : detailLoading && !result ? (
        <ResultsPageSkeleton compact />
      ) : (
        <>
          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{result?.exam?.name || selectedExam.name}</h2>
                  <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]" style={resultBadgeStyle(summary?.result_status)}>
                    {summary?.result_status || 'awaiting'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Exam date: {formatDate(result?.exam?.start_date || selectedExam.start_date, 'long')}
                </p>
                {result?.summary?.class_rank && (
                  <p className="mt-2 text-sm font-medium text-[var(--student-accent)]">
                    Rank {result.summary.class_rank} out of {result.summary.class_strength}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[310px]">
                <HeaderMetric label="Overall" value={formatPercent(summary?.percentage || 0, 0)} tone="var(--student-accent)" />
                <HeaderMetric label="Grade" value={summary?.grade || '--'} tone={gradeTone(summary?.grade)} />
                <HeaderMetric label="Status" value={String(summary?.result_status || '--').toUpperCase()} tone={resultTone(summary?.result_status)} />
                <HeaderMetric label="Subjects" value={subjects.length} tone="#2563eb" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Subject Wise Marks</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Theory, practical, and combined subjects are all shown in one result view.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`${ROUTES.STUDENT_REPORT_CARD}?examId=${selectedExamId}`)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ backgroundColor: 'rgba(124,58,237,0.10)', color: 'var(--student-accent)' }}
              >
                Open Report Card
                <ArrowRight size={14} />
              </button>
            </div>

            <ResultTable subjects={subjects} />
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section
              className="rounded-[28px] border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
                  <Trophy size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Result Analysis</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Quick reading of what went well and where you need support.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4">
                <AnalysisBlock
                  title="Strengths"
                  items={analysis?.strengths || []}
                  emptyText="No A or A+ subjects in this exam."
                  tone="#16a34a"
                />
                <AnalysisBlock
                  title="Needs Improvement"
                  items={analysis?.needs_improvement || []}
                  emptyText="No D or F subjects in this exam."
                  tone="#ef4444"
                />
                {result?.analysis?.class_comparison && (
                  <div className="rounded-[24px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      Performance Compared To Class
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                      {result.analysis.class_comparison}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <div className="space-y-5">
              {compartment ? (
                <section
                  className="rounded-[28px] border p-5"
                  style={{ borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.10)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
                      <CircleAlert size={18} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Compartment Notice</h2>
                      <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/80">
                        You have compartment in the following subject(s). You must pass these papers to move ahead smoothly.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(compartment.subjects || []).map((subject) => (
                          <span key={subject} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-amber-800">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section
                  className="rounded-[28px] border p-5"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Promotion Outlook</h2>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {summary?.result_status === 'pass'
                      ? 'This exam is in a passing state. Keep that rhythm through the rest of the session.'
                      : 'This result needs recovery work. Review the red subjects first and speak with your class teacher.'}
                  </p>
                  <div className="mt-5 rounded-[24px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Current Exam Result</p>
                    <p className="mt-2 text-xl font-bold" style={{ color: resultTone(summary?.result_status) }}>
                      {String(summary?.result_status || 'awaiting').toUpperCase()}
                    </p>
                  </div>
                </section>
              )}

              {subjects.length > 0 && (
                <WhatIfAnalysis 
                  subjects={subjects} 
                  initialPercentage={summary?.percentage || 0} 
                  initialGrade={summary?.grade || 'F'} 
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const HeaderMetric = ({ label, value, tone }) => (
  <div className="rounded-[24px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>{value}</p>
  </div>
)

const AnalysisBlock = ({ title, items, emptyText, tone }) => (
  <div className="rounded-[24px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{title}</p>
    {items.length ? (
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: `${tone}18`, color: tone }}
          >
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{emptyText}</p>
    )}
  </div>
)

const AwaitingExamPanel = ({ exam }) => (
  <section
    className="rounded-[28px] border p-5 sm:p-6"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-600">
        <ClipboardList size={18} />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{exam.name}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {exam.student_status === 'upcoming'
            ? `This exam is scheduled for ${formatDate(exam.start_date, 'long')}. Your marks will appear here after the school publishes them.`
            : 'This exam exists in your session, but your marks have not been published yet.'}
        </p>
        <div className="mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]" style={examStatusStyle(exam.student_status)}>
          {exam.student_status}
        </div>
      </div>
    </div>
  </section>
)

const ExamTabsSkeleton = () => (
  <div className="flex gap-3 overflow-hidden animate-pulse">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="min-w-[160px] rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="h-4 w-20 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="mt-3 h-3 w-16 rounded-full bg-[var(--color-surface-raised)]" />
      </div>
    ))}
  </div>
)

const ResultsPageSkeleton = ({ compact = false }) => (
  <div className="space-y-5 animate-pulse">
    <div className="rounded-[28px] border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="h-6 w-36 rounded-full bg-[var(--color-surface-raised)]" />
      <div className="mt-3 h-4 w-48 rounded-full bg-[var(--color-surface-raised)]" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[24px] bg-[var(--color-surface-raised)] p-6" />
        ))}
      </div>
    </div>
    <div className="rounded-[28px] border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="h-5 w-40 rounded-full bg-[var(--color-surface-raised)]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: compact ? 2 : 4 }).map((_, index) => (
          <div key={index} className="rounded-[24px] bg-[var(--color-surface-raised)] p-8" />
        ))}
      </div>
    </div>
  </div>
)

function examStatusStyle(status) {
  if (status === 'published') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'awaiting') return { backgroundColor: '#e5e7eb', color: '#4b5563' }
  return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
}

function resultBadgeStyle(status) {
  if (status === 'pass') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'compartment') return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (status === 'fail') return { backgroundColor: '#fee2e2', color: '#dc2626' }
  return { backgroundColor: '#e5e7eb', color: '#4b5563' }
}

function resultTone(status) {
  if (status === 'pass') return '#16a34a'
  if (status === 'compartment') return '#d97706'
  if (status === 'fail') return '#ef4444'
  return '#64748b'
}

function gradeTone(grade) {
  if (grade === 'A+') return '#14532d'
  if (grade === 'A') return '#15803d'
  if (grade === 'B') return '#0f766e'
  if (grade === 'C') return '#1d4ed8'
  if (grade === 'D') return '#b45309'
  return '#dc2626'
}

export default MyResults
