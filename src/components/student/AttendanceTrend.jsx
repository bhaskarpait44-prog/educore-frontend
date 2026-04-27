import AttendanceBarChart from '@/components/ui/AttendanceBarChart'

const AttendanceTrend = ({ data = [] }) => (
  <div className="rounded-[24px] border p-4 sm:p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <div className="mb-4">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Attendance Trend</h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Last 6 months attendance percentage
      </p>
    </div>
    <AttendanceBarChart data={data.map((item) => ({ ...item, value: Number(item.percentage || 0) }))} height={180} />
  </div>
)

export default AttendanceTrend
