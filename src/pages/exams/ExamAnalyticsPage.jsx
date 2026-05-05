// src/pages/exams/ExamAnalyticsPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { ArrowLeft, TrendingUp, Users, Award, BookOpen, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import useToast from '@/hooks/useToast'
import api from '@/api/axios' // Directly use axios for simplicity if store doesn't have it

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']

const ExamAnalyticsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/analytics/exams/${id}`)
        setData(res.data.data)
      } catch (err) {
        toastError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [id])

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>

  const { exam, subject_stats, grade_distribution, top_performers } = data

  const passFailData = subject_stats.map(s => ({
    name: s.subject_name,
    Pass: s.pass_count,
    Fail: s.fail_count,
    Absent: s.absent_count
  }))

  const marksData = subject_stats.map(s => ({
    name: s.subject_name,
    Average: parseFloat(s.average_marks || 0),
    Highest: parseFloat(s.highest_marks || 0),
    Lowest: parseFloat(s.lowest_marks || 0)
  }))

  const pieData = grade_distribution.map(g => ({
    name: `Grade ${g.grade}`,
    value: parseInt(g.count)
  }))

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{exam.name} Analytics</h1>
          <p className="text-sm text-gray-500">{exam.class_name} • Academic Insights</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={subject_stats[0]?.total_entries || 0} color="blue" />
        <StatCard icon={TrendingUp} label="Class Average" value={`${(marksData.reduce((acc, curr) => acc + curr.Average, 0) / marksData.length).toFixed(1)}%`} color="green" />
        <StatCard icon={Award} label="Top Performer" value={top_performers[0]?.student_name || 'N/A'} color="purple" subValue={`${top_performers[0]?.percentage}%`} />
        <StatCard icon={AlertCircle} label="Pass Percentage" value={`${((passFailData.reduce((acc, curr) => acc + curr.Pass, 0) / (passFailData.reduce((acc, curr) => acc + curr.Pass + curr.Fail, 0) || 1)) * 100).toFixed(1)}%`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pass/Fail Distribution */}
        <Card title="Subject-wise Result Distribution">
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passFailData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Pass" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Fail" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Grade Distribution */}
        <Card title="Grade Distribution Overview">
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subject Performance Analysis */}
        <Card title="Subject Marks Analysis (Average vs High/Low)" className="lg:col-span-2">
          <div className="h-96 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marksData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Highest" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Average" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="Lowest" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Performers Table */}
        <Card title="Top 5 Performers" className="lg:col-span-2">
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-500 uppercase border-b">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Marks Obtained</th>
                  <th className="px-4 py-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {top_performers.map((p, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-brand-600">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{p.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{p.roll_number}</td>
                    <td className="px-4 py-3 text-sm">{p.total_obtained} / {p.total_max}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-bold text-xs">
                        {p.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color, subValue }) => {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
  }
  const styles = colorMap[color] || colorMap.blue

  return (
    <div className={`p-4 rounded-2xl border ${styles.border} bg-white shadow-sm flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${styles.bg} ${styles.text} flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subValue && <p className="text-xs text-brand-600 font-semibold">{subValue}</p>}
      </div>
    </div>
  )
}

export default ExamAnalyticsPage
