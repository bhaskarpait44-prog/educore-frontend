import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, CheckCircle2, FileCheck2, GraduationCap, RefreshCw, Users } from 'lucide-react'
import { getClasses, getClassList } from '@/api/classApi'
import { getPromotionCandidates, processPromotions } from '@/api/enrollments'
import { getSessions } from '@/api/sessions'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

const RESULT_SOURCE_OPTIONS = [
  { value: 'final_result', label: 'Final Result' },
  { value: 'board_result', label: 'Board Result' },
]

const BOARD_RESULT_OPTIONS = [
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'compartment', label: 'Compartment' },
  { value: 'detained', label: 'Detained' },
]

const normalizeOutcome = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  return ['pass', 'fail', 'compartment', 'detained'].includes(normalized) ? normalized : ''
}

const outcomeBadgeVariant = (value) => {
  if (value === 'pass') return 'green'
  if (value === 'fail' || value === 'detained') return 'red'
  if (value === 'compartment') return 'yellow'
  return 'grey'
}

const buildPreview = (student, resultSource, boardResults, meta) => {
  const currentClass = meta?.class || null
  const nextClass = meta?.next_class || null
  const outcome = resultSource === 'board_result'
    ? normalizeOutcome(boardResults[student.enrollment_id])
    : normalizeOutcome(student.final_result)

  if (!outcome) {
    return {
      outcomeLabel: 'Pending',
      targetClassName: currentClass?.name || '--',
      actionLabel: 'Result needed',
      badgeVariant: 'grey',
    }
  }

  if (outcome === 'pass') {
    if (nextClass) {
      return {
        outcomeLabel: 'Pass',
        targetClassName: nextClass.name,
        actionLabel: 'Promote',
        badgeVariant: 'green',
      }
    }

    return {
      outcomeLabel: 'Pass',
      targetClassName: 'Completed',
      actionLabel: 'Graduate',
      badgeVariant: 'blue',
    }
  }

  return {
    outcomeLabel: outcome[0].toUpperCase() + outcome.slice(1),
    targetClassName: currentClass?.name || '--',
    actionLabel: 'Repeat Same Class',
    badgeVariant: outcomeBadgeVariant(outcome),
  }
}

const AdminPromotionPage = () => {
  usePageTitle('Student Promotions')

  const { toastError, toastSuccess, toastInfo } = useToast()
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState([])
  const [classes, setClasses] = useState([])
  const [sourceSessionId, setSourceSessionId] = useState('')
  const [targetSessionId, setTargetSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [resultSource, setResultSource] = useState('final_result')
  const [students, setStudents] = useState([])
  const [promotionMeta, setPromotionMeta] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState({})
  const [boardResults, setBoardResults] = useState({})

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true)
      try {
        const [sessionRes, classRes] = await Promise.all([
          getSessions(),
          getClasses(),
        ])

        const sessionRows = Array.isArray(sessionRes?.data) ? sessionRes.data : (sessionRes?.data?.sessions || [])
        const classRows = getClassList(classRes)
        const currentSession = sessionRows.find((row) => row.is_current) || sessionRows[0] || null
        const fallbackTarget = sessionRows.find((row) => String(row.id) !== String(currentSession?.id)) || null

        setSessions(sessionRows)
        setClasses(classRows)
        setSourceSessionId(currentSession ? String(currentSession.id) : '')
        setTargetSessionId(fallbackTarget ? String(fallbackTarget.id) : '')
      } catch (error) {
        toastError(error?.message || 'Failed to load promotion setup.')
      } finally {
        setLoadingMeta(false)
      }
    }

    loadMeta()
  }, [])

  const classOptions = useMemo(() => (
    classes.map((row) => ({ value: String(row.id), label: row.name }))
  ), [classes])

  const sessionOptions = useMemo(() => (
    sessions.map((row) => ({
      value: String(row.id),
      label: `${row.name}${row.is_current ? ' (Current)' : ''}`,
    }))
  ), [sessions])

  const selectedCount = useMemo(() => (
    students.filter((student) => selectedStudents[student.enrollment_id]).length
  ), [students, selectedStudents])

  const previewCounts = useMemo(() => {
    return students.reduce((acc, student) => {
      if (!selectedStudents[student.enrollment_id]) return acc

      const preview = buildPreview(student, resultSource, boardResults, promotionMeta)
      if (preview.actionLabel === 'Promote') acc.promote += 1
      else if (preview.actionLabel === 'Repeat Same Class') acc.repeat += 1
      else if (preview.actionLabel === 'Graduate') acc.graduate += 1
      else acc.pending += 1

      return acc
    }, { promote: 0, repeat: 0, graduate: 0, pending: 0 })
  }, [boardResults, promotionMeta, resultSource, selectedStudents, students])

  const allSelected = students.length > 0 && selectedCount === students.length

  const loadStudents = async () => {
    if (!sourceSessionId || !classId) {
      toastError('Select source session and class first.')
      return
    }

    setLoadingStudents(true)
    try {
      const response = await getPromotionCandidates({
        session_id: sourceSessionId,
        class_id: classId,
        result_source: resultSource,
      })

      const payload = response?.data || {}
      const rows = payload.students || []
      const nextSelected = {}
      const nextBoardResults = {}

      rows.forEach((student) => {
        nextSelected[student.enrollment_id] = true
        nextBoardResults[student.enrollment_id] = normalizeOutcome(student.board_result)
      })

      setPromotionMeta(payload)
      setStudents(rows)
      setSelectedStudents(nextSelected)
      setBoardResults(nextBoardResults)

      if (resultSource === 'board_result') {
        toastInfo('Board result mode is active. No marks entry is needed, only result selection.')
      }
    } catch (error) {
      setPromotionMeta(null)
      setStudents([])
      setSelectedStudents({})
      setBoardResults({})
      toastError(error?.message || 'Failed to load promotion candidates.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleProcess = async () => {
    if (!sourceSessionId || !targetSessionId || !classId) {
      toastError('Select source session, target session, and class first.')
      return
    }

    if (String(sourceSessionId) === String(targetSessionId)) {
      toastError('Target session must be different from source session.')
      return
    }

    const selectedRows = students.filter((student) => selectedStudents[student.enrollment_id])
    if (!selectedRows.length) {
      toastError('Select at least one student to process.')
      return
    }

    if (resultSource === 'board_result') {
      const missingResult = selectedRows.find((student) => !normalizeOutcome(boardResults[student.enrollment_id]))
      if (missingResult) {
        toastError(`Board result is missing for ${missingResult.student_name}.`)
        return
      }
    }

    setSaving(true)
    try {
      const response = await processPromotions({
        source_session_id: Number(sourceSessionId),
        target_session_id: Number(targetSessionId),
        class_id: Number(classId),
        result_source: resultSource,
        students: selectedRows.map((student) => ({
          enrollment_id: student.enrollment_id,
          board_result: resultSource === 'board_result'
            ? normalizeOutcome(boardResults[student.enrollment_id])
            : undefined,
        })),
      })

      const summary = response?.data || {}
      toastSuccess(
        `Promotion completed. Promoted: ${summary.promoted_count || 0}, repeated: ${summary.repeated_count || 0}, graduated: ${summary.graduated_count || 0}.`
      )
      await loadStudents()
    } catch (error) {
      toastError(error?.message || 'Failed to process promotions.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedStudents({})
      return
    }

    const nextSelected = {}
    students.forEach((student) => {
      nextSelected[student.enrollment_id] = true
    })
    setSelectedStudents(nextSelected)
  }

  return (
    <div className="space-y-5 pb-20">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.15), rgba(14, 165, 233, 0.10) 58%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Student Promotion Center
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Promote students class wise into the next session. Failed, compartment, or detained students stay in the same class for the new session automatically.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: '#0f766e' }}>
              Board result option does not require marks entry
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:min-w-[360px]">
            <StatCard title="Selected" value={selectedCount} tone="#0f766e" />
            <StatCard title="Promote" value={previewCounts.promote} tone="#15803d" />
            <StatCard title="Repeat" value={previewCounts.repeat} tone="#dc2626" />
            <StatCard title="Graduate" value={previewCounts.graduate} tone="#2563eb" />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="mb-4 flex items-center gap-2">
          <ArrowRightLeft size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Promotion Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <Select
            label="Source Session"
            value={sourceSessionId}
            onChange={(e) => setSourceSessionId(e.target.value)}
            options={sessionOptions}
            required
            disabled={loadingMeta}
          />
          <Select
            label="Target Session"
            value={targetSessionId}
            onChange={(e) => setTargetSessionId(e.target.value)}
            options={sessionOptions.filter((option) => option.value !== String(sourceSessionId))}
            required
            disabled={loadingMeta}
          />
          <Select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classOptions}
            required
            disabled={loadingMeta}
          />
          <Select
            label="Result Source"
            value={resultSource}
            onChange={(e) => setResultSource(e.target.value)}
            options={RESULT_SOURCE_OPTIONS}
            required
            disabled={loadingStudents || saving}
            hint={resultSource === 'board_result' ? 'Only pass/fail style result is required. Marks are not needed.' : 'Uses final result already prepared for each student.'}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button icon={Users} loading={loadingStudents} onClick={loadStudents}>
              Load Students
            </Button>
            <Button variant="secondary" icon={RefreshCw} onClick={loadStudents} disabled={!students.length || loadingStudents}>
              Refresh
            </Button>
          </div>

          {promotionMeta?.class ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue">{promotionMeta.class.name}</Badge>
              <Badge variant="grey">{promotionMeta.source_session?.name || '--'}</Badge>
              {promotionMeta.next_class ? (
                <Badge variant="green">Next: {promotionMeta.next_class.name}</Badge>
              ) : (
                <Badge variant="yellow">Last class graduation flow</Badge>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Promotion Preview
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Review each student before moving them into the new session.
            </p>
          </div>

          {students.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={toggleAll}>
                {allSelected ? 'Clear Selection' : 'Select All'}
              </Button>
              <Button
                icon={CheckCircle2}
                loading={saving}
                onClick={handleProcess}
                disabled={!selectedCount || loadingStudents}
              >
                Process Promotion
              </Button>
            </div>
          ) : null}
        </div>

        {resultSource === 'board_result' ? (
          <div
            className="mt-4 rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: '#bfdbfe',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
            }}
          >
            Board result mode is enabled. Enter only the board result for each student. Marks are not required on this page.
          </div>
        ) : null}

        <div className="mt-5">
          {loadingStudents ? (
            <Skeleton rows={5} />
          ) : !students.length ? (
            <EmptyState
              icon={GraduationCap}
              title="No students loaded"
              description="Choose source session, target session, class, and result source, then load students to preview promotions."
            />
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const preview = buildPreview(student, resultSource, boardResults, promotionMeta)
                const isSelected = Boolean(selectedStudents[student.enrollment_id])

                return (
                  <article
                    key={student.enrollment_id}
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: isSelected ? '#86efac' : 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-raised)',
                    }}
                  >
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[32px_minmax(0,1.35fr)_220px_220px_190px] xl:items-center">
                      <label className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => setSelectedStudents((prev) => ({
                            ...prev,
                            [student.enrollment_id]: e.target.checked,
                          }))}
                          className="h-4 w-4 rounded"
                        />
                      </label>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {student.student_name}
                          </p>
                          <Badge variant="grey">{student.section_name || 'No section'}</Badge>
                        </div>
                        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Admission No: {student.admission_no || '--'} | Roll No: {student.roll_number || '--'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant={preview.badgeVariant}>{preview.actionLabel}</Badge>
                          <Badge variant={outcomeBadgeVariant(normalizeOutcome(resultSource === 'board_result' ? boardResults[student.enrollment_id] : student.final_result))}>
                            {preview.outcomeLabel}
                          </Badge>
                          {student.grade ? <Badge variant="blue">Grade {student.grade}</Badge> : null}
                          {student.percentage != null ? <Badge variant="grey">{student.percentage}%</Badge> : null}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                          Final Result
                        </p>
                        <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {student.final_result ? student.final_result[0].toUpperCase() + student.final_result.slice(1) : 'Not available'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                          {resultSource === 'board_result' ? 'Board Result' : 'Target Class'}
                        </p>
                        {resultSource === 'board_result' ? (
                          <Select
                            value={boardResults[student.enrollment_id] || ''}
                            onChange={(e) => setBoardResults((prev) => ({
                              ...prev,
                              [student.enrollment_id]: e.target.value,
                            }))}
                            options={BOARD_RESULT_OPTIONS}
                            placeholder="Select result"
                          />
                        ) : (
                          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {preview.targetClassName}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                          Next Action
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {preview.actionLabel}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {preview.targetClassName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {students.length > 0 ? (
        <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="mb-4 flex items-center gap-2">
            <FileCheck2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Processing Rules
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <RuleCard
              title="Promoted Students"
              description="Students with pass result move to the next class in the selected target session."
            />
            <RuleCard
              title="Failed Students"
              description="Fail, compartment, and detained students stay in the same class and get a fresh enrollment in the new session."
            />
            <RuleCard
              title="Board Result Mode"
              description="When board result is selected, you only choose the result outcome. Marks entry is not needed here."
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}

const StatCard = ({ title, value, tone }) => (
  <div className="rounded-[22px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
      {title}
    </p>
    <p className="mt-2 text-2xl font-bold" style={{ color: tone }}>
      {value}
    </p>
  </div>
)

const RuleCard = ({ title, description }) => (
  <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {title}
    </p>
    <p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
      {description}
    </p>
  </div>
)

const Skeleton = ({ rows = 4 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, index) => (
      <div key={index} className="h-24 animate-pulse rounded-[24px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

export default AdminPromotionPage
