import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface p-3 border border-border-base rounded-xl shadow-xl">
        <p className="text-xs font-bold text-text-muted mb-1">{label}</p>
        <p className="text-sm font-bold text-brand">
          {payload[0].value}% Attendance
        </p>
      </div>
    )
  }
  return null
}

export const AttendanceTrendChart = ({ data = [] }) => {
  // If no data, show a placeholder/empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm italic">
        No attendance data available for this period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.1} />
            <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="percentage"
          stroke="var(--color-brand)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAttendance)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export const FeeStatusChart = ({ collected = 0, pending = 0 }) => {
  const data = [
    { name: 'Collected', value: collected, color: 'var(--color-success)' },
    { name: 'Pending', value: pending, color: 'var(--color-warning)' },
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
        <XAxis type="number" hide />
        <YAxis 
          type="category" 
          dataKey="name" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-text-secondary)' }}
        />
        <Tooltip 
          cursor={{ fill: 'transparent' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-surface p-2 border border-border-base rounded-lg shadow-lg text-xs font-bold text-text-primary">
                   ₹{payload[0].value.toLocaleString('en-IN')}
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
