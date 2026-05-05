import { useEffect, useState, useMemo } from 'react'
import { Plus, ClipboardList, PenLine, Trash2, ShieldCheck, Send, BookOpen, AlertCircle, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useExamStore from '@/store/examStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CreateExamModal from './CreateExamModal'
import ReviewExamSubjectsModal from './ReviewExamSubjectsModal'
import { formatDate, getExamTypeLabel } from '@/utils/helpers'

/* ─── Config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  draft:      { label: 'Draft',     variant: 'grey'  },
  published:  { label: 'Published', variant: 'green' },
  upcoming:   { label: 'Upcoming',  variant: 'blue'  },
  ongoing:    { label: 'Ongoing',   variant: 'green' },
  completed:  { label: 'Completed', variant: 'grey'  },
}

const TYPE_CFG = {
  term:        { bg: '#eff6ff', color: '#1d4ed8' },
  midterm:     { bg: '#fefce8', color: '#a16207' },
  final:       { bg: '#f0fdf4', color: '#15803d' },
  compartment: { bg: '#fef2f2', color: '#b91c1c' },
}

/* ─── Tiny helpers ───────────────────────────────────────── */
const TypePill = ({ examType, examName }) => {
  const cfg = TYPE_CFG[examType] || { bg: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {getExamTypeLabel(examType, examName)}
    </span>
  )
}

const ActionBtn = ({ icon: Icon, onClick, children, danger = false, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
    style={{ color: danger ? '#b91c1c' : 'var(--color-text-secondary)', background: 'transparent' }}
    onMouseEnter={e => {
      e.currentTarget.style.background = danger ? '#fef2f2' : 'var(--color-surface-raised)'
      e.currentTarget.style.color      = danger ? '#991b1b' : 'var(--color-text-primary)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'transparent'
      e.currentTarget.style.color      = danger ? '#b91c1c' : 'var(--color-text-secondary)'
    }}
  >
    <Icon size={12} strokeWidth={2} />
    {children}
  </button>
)

/* ─── Single exam row inside a class card ────────────────── */
const ExamRow = ({ exam, isLast, onReview, onMarks, onToggleStatus, onDelete }) => {
  const navigate = useNavigate()
  const statusCfg = STATUS_CFG[exam.status] || { label: exam.status, variant: 'grey' }
  const pending   = Number(exam.pending_review_count || 0)

  return (
    <div
      className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* left: name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {exam.name}
          </p>
          <TypePill examType={exam.exam_type} examName={exam.name} />
          <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatDate(exam.start_date)} → {formatDate(exam.end_date)}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {exam.subject_count || 0} subjects
            <span style={{ color: '#15803d' }}> · {exam.approved_subject_count || 0} approved</span>
            {pending > 0 && <span style={{ color: '#d97706' }}> · {pending} pending</span>}
          </span>
        </div>
      </div>

      {/* right: actions */}
      <div className="flex items-center gap-1 shrink-0">
        <ActionBtn icon={BarChart3} onClick={() => navigate(`/exams/${exam.id}/analytics`)} title="View Analytics">Stats</ActionBtn>
        <ActionBtn icon={ShieldCheck} onClick={() => onReview(exam)} title="Review subjects">Review</ActionBtn>
        {exam.status !== 'draft' && (
          <ActionBtn icon={PenLine} onClick={onMarks} title="Enter marks">Marks</ActionBtn>
        )}
        <ActionBtn
          icon={Send}
          onClick={() => onToggleStatus(exam)}
          title={exam.status === 'published' ? 'Move to draft' : 'Publish'}
        >
          {exam.status === 'published' ? 'Unpublish' : 'Publish'}
        </ActionBtn>
        <ActionBtn icon={Trash2} onClick={() => onDelete(exam)} danger title="Delete">Delete</ActionBtn>
      </div>
    </div>
  )
}

/* ─── Class card ─────────────────────────────────────────── */
const ClassCard = ({ className, exams, onReview, onMarks, onToggleStatus, onDelete, onCreateForClass }) => {
  const total     = exams.length
  const published = exams.filter(e => ['published', 'ongoing'].includes(e.status)).length
  const draft     = exams.filter(e => e.status === 'draft').length
  const pending   = exams.reduce((acc, e) => acc + Number(e.pending_review_count || 0), 0)

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* card header */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ background: '#e0e7ff', color: '#4338ca' }}
          >
            <BookOpen size={14} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {className || 'Unassigned'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {total} exam{total !== 1 ? 's' : ''}
              {published > 0 && <span style={{ color: '#15803d' }}> · {published} published</span>}
              {draft > 0     && <span style={{ color: 'var(--color-text-muted)' }}> · {draft} draft</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pending > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{ background: '#fef9c3', color: '#a16207' }}
            >
              <AlertCircle size={11} strokeWidth={2} />
              {pending} pending
            </span>
          )}
          <button
            onClick={() => onCreateForClass(className)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: 'var(--color-surface)',
              border:     '1px solid var(--color-border)',
              color:      'var(--color-text-secondary)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#e0e7ff'
              e.currentTarget.style.color      = '#4338ca'
              e.currentTarget.style.borderColor= '#c7d2fe'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'var(--color-surface)'
              e.currentTarget.style.color       = 'var(--color-text-secondary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Add Exam
          </button>
        </div>
      </div>

      {/* exam rows */}
      <div>
        {exams.map((exam, idx) => (
          <ExamRow
            key={exam.id}
            exam={exam}
            isLast={idx === exams.length - 1}
            onReview={onReview}
            onMarks={onMarks}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Summary strip ──────────────────────────────────────── */
const SummaryStrip = ({ exams, classCount }) => {
  const total     = exams.length
  const published = exams.filter(e => ['published', 'ongoing'].includes(e.status)).length
  const pending   = exams.reduce((acc, e) => acc + Number(e.pending_review_count || 0), 0)

  const items = [
    { label: 'Classes',   value: classCount },
    { label: 'Exams',     value: total },
    { label: 'Published', value: published, color: '#15803d' },
    { label: 'Pending',   value: pending,   color: pending > 0 ? '#d97706' : undefined },
  ]

  return (
    <div
      className="flex items-center gap-0 rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex-1 px-5 py-3.5"
          style={{ borderRight: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {item.label}
          </p>
          <p className="text-xl font-bold" style={{ color: item.color || 'var(--color-text-primary)' }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════ */
const ExamsListPage = ({ onNavigate }) => {
  const { toastError, toastSuccess } = useToast()
  const { exams, isLoading, isSaving, fetchExams, deleteExam, changeExamStatus } = useExamStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [sessionId,       setSessionId]       = useState('')
  const [createOpen,      setCreateOpen]       = useState(false)
  const [prefillClass,    setPrefillClass]     = useState(null)
  const [deleteTarget,    setDeleteTarget]     = useState(null)
  const [reviewTarget,    setReviewTarget]     = useState(null)

  useEffect(() => { fetchSessions().catch(() => {}) }, [fetchSessions])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!sessionId) return
    fetchExams({ session_id: sessionId }).catch(() => toastError('Failed to load exams'))
  }, [sessionId, fetchExams, toastError])

  /* ── group by class_name, sort naturally ── */
  const { classNames, examsByClass } = useMemo(() => {
    const groups = {}
    for (const exam of exams) {
      const key = exam.class_name || 'Unassigned'
      if (!groups[key]) groups[key] = []
      groups[key].push(exam)
    }
    const sorted = Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1
      if (b === 'Unassigned') return -1
      const na = parseInt(a.replace(/\D/g, ''), 10)
      const nb = parseInt(b.replace(/\D/g, ''), 10)
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b)
    })
    return { classNames: sorted, examsByClass: groups }
  }, [exams])

  /* ── actions ── */
  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteExam(deleteTarget.id)
    if (result.success) {
      toastSuccess('Exam deleted successfully')
      setDeleteTarget(null)
    } else {
      toastError(result.message || 'Failed to delete exam')
    }
  }

  const handleToggleStatus = async (exam) => {
    const next = exam.status === 'published' ? 'draft' : 'published'
    const result = await changeExamStatus(exam.id, { status: next })
    if (result.success) {
      toastSuccess(next === 'published' ? 'Exam published' : 'Exam moved to draft')
    } else {
      toastError(result.message || 'Failed to update status')
    }
  }

  const handleCreateForClass = (cn) => {
    setPrefillClass(cn === 'Unassigned' ? null : cn)
    setCreateOpen(true)
  }

  /* ────────────────────────── render ─────────────────────── */
  return (
    <div className="space-y-4">

      {/* toolbar */}
      <div
        className="flex flex-col gap-3 rounded-2xl px-4 py-3.5 sm:flex-row sm:items-end"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Academic session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ value: String(s.id), label: s.name }))}
          containerClassName="flex-1"
        />
        <Button icon={Plus} onClick={() => { setPrefillClass(null); setCreateOpen(true) }}>
          Create Exam
        </Button>
      </div>

      {/* content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface-raised)' }} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <EmptyState
            icon={ClipboardList}
            title="No exams yet"
            description="Create your first subject-linked exam for this session."
            action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Exam</Button>}
            className="border-0 rounded-none"
          />
        </div>
      ) : (
        <div className="space-y-4">

          {/* summary */}
          <SummaryStrip exams={exams} classCount={classNames.length} />

          {/* one card per class */}
          {classNames.map(cn => (
            <ClassCard
              key={cn}
              className={cn}
              exams={examsByClass[cn]}
              onReview={setReviewTarget}
              onMarks={() => onNavigate('marks')}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeleteTarget}
              onCreateForClass={handleCreateForClass}
            />
          ))}
        </div>
      )}

      {/* modals */}
      <CreateExamModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setPrefillClass(null) }}
        sessionId={sessionId}
        prefillClassName={prefillClass}
      />
      <ReviewExamSubjectsModal exam={reviewTarget} open={!!reviewTarget} onClose={() => setReviewTarget(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Exam"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone. Exams with entered marks cannot be deleted.`
            : ''
        }
        confirmLabel={isSaving ? 'Deleting…' : 'Delete'}
        loading={isSaving}
        variant="danger"
      />
    </div>
  )
}

export default ExamsListPage