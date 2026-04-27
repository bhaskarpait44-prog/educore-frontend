import { AlertTriangle, ArrowRight, BookCheck, ClipboardCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/app'

const taskMeta = {
  attendance_pending: {
    icon: ClipboardCheck,
    color: '#f59e0b',
    cta: 'Mark Now',
    route: ROUTES.TEACHER_ATTENDANCE_MARK,
  },
  marks_pending: {
    icon: BookCheck,
    color: '#ef4444',
    cta: 'Enter Marks',
    route: ROUTES.TEACHER_MARKS_ENTER,
  },
  attendance_threshold: {
    icon: Users,
    color: '#f97316',
    cta: 'Review',
    route: ROUTES.TEACHER_STUDENTS,
  },
}

const PendingTasksList = ({ tasks = [], loading = false }) => {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-3xl p-4"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <div className="h-4 w-2/3 rounded mb-3" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="h-10 w-full rounded-2xl" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>
        ))}
      </div>
    )
  }

  if (!tasks.length) {
    return (
      <div
        className="rounded-3xl border p-5 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div
          className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}
        >
          <ClipboardCheck size={20} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          No pending tasks right now
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Today is under control. Your upcoming classes will appear here if action is needed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => {
        const meta = taskMeta[task.type] || {
          icon: AlertTriangle,
          color: '#ef4444',
          cta: 'Open',
          route: ROUTES.DASHBOARD,
        }
        const Icon = meta.icon

        return (
          <div
            key={`${task.type}-${index}`}
            className="rounded-3xl border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
              >
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5" style={{ color: 'var(--color-text-primary)' }}>
                  {task.message}
                </p>
                {task.pending_exams != null && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {task.pending_exams} exam(s) still need final marks completion.
                  </p>
                )}
                {task.count != null && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Attendance support list is ready for quick review.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(meta.route)}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
            >
              {meta.cta}
              <ArrowRight size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default PendingTasksList
