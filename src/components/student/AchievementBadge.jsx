import { Award, TrendingUp, Trophy, Zap } from 'lucide-react'

const badgeMeta = {
  perfect_attendance: { label: 'Perfect Attendance', icon: Trophy, tone: '#16a34a', soft: 'rgba(22,163,74,0.12)' },
  top_performer: { label: 'Top Performer', icon: Award, tone: '#2563eb', soft: 'rgba(37,99,235,0.12)' },
  improvement: { label: 'Improvement', icon: TrendingUp, tone: '#d97706', soft: 'rgba(217,119,6,0.12)' },
  attendance_streak: { label: 'Attendance Streak', icon: Zap, tone: '#7c3aed', soft: 'rgba(124,58,237,0.12)' },
  homework_streak: { label: 'Homework Streak', icon: Zap, tone: '#dc2626', soft: 'rgba(220,38,38,0.12)' },
}

const AchievementBadge = ({ achievement }) => {
  const meta = badgeMeta[achievement?.achievement_type] || badgeMeta.improvement
  const Icon = meta.icon

  return (
    <div
      className="rounded-[22px] border px-4 py-4"
      style={{ borderColor: `${meta.tone}22`, backgroundColor: meta.soft }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#fff', color: meta.tone }}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{meta.label}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{achievement?.earned_for || 'Student milestone'}</p>
        </div>
      </div>
    </div>
  )
}

export default AchievementBadge
