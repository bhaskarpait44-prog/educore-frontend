import { useEffect, useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, CalendarCheck, IndianRupee, ClipboardList,
  Plus, ArrowUpRight, RefreshCw, ClipboardCheck,
  ScrollText, TrendingUp, TrendingDown, Minus,
  ChevronRight, ArrowRight, Wallet, UserPlus,
  ArrowDownLeft, Clock, Search, Filter, MoreHorizontal
} from 'lucide-react'

import useDashboardStore from '@/store/dashboardStore'
import useSessionStore   from '@/store/sessionStore'
import useAuthStore      from '@/store/authStore'
import usePageTitle      from '@/hooks/usePageTitle'
import useToast          from '@/hooks/useToast'
import { AttendanceTrendChart, FeeStatusChart } from '@/components/admin/DashboardCharts'
import { ROUTES }        from '@/constants/app'
import { formatCurrency, formatDate, formatPercent, getInitials } from '@/utils/helpers'
import { cn } from '@/utils/cn'

const AUTO_REFRESH_MS = 10 * 60 * 1000 // 10 minutes

const DashboardPage = () => {
  usePageTitle('Admin Dashboard')
  const navigate = useNavigate()
  const { toastInfo } = useToast()
  
  const { user } = useAuthStore()
  const { currentSession } = useSessionStore()
  const {
    stats, attendanceChart, recentAdmissions,
    feeDefaulters, recentAudit,
    isLoading, lastRefreshed, fetchAll, clearDashboard,
  } = useDashboardStore()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchAll(currentSession?.id)
      toastInfo('Dashboard data updated')
    } finally {
      setIsRefreshing(false)
    }
  }, [currentSession?.id, fetchAll, toastInfo])

  useEffect(() => {
    handleRefresh()
    const timer = setInterval(handleRefresh, AUTO_REFRESH_MS)
    return () => {
      clearInterval(timer)
      clearDashboard()
    }
  }, [handleRefresh, clearDashboard])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // --- Animation Variants ---
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="max-w-[1600px] mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8"
    >
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Live Overview · {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">
            {greeting()}, <span className="text-brand">{user?.name?.split(' ')[0]}!</span>
          </h1>
          <p className="text-text-secondary font-medium mt-1">
            Manage <span className="text-text-primary">{currentSession?.name || 'Academic Session'}</span> operations from your command center.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group flex items-center gap-2 px-4 py-2.5 bg-surface border border-border-base rounded-2xl shadow-sm text-sm font-bold text-text-secondary hover:bg-surface-raised hover:border-text-muted/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn("text-text-muted transition-transform group-hover:rotate-180", isRefreshing && "animate-spin")} />
            Refresh
          </button>
          
          <div className="h-10 w-[1px] bg-border-base mx-1 hidden md:block" />
          
          <button className="hidden md:flex h-11 w-11 items-center justify-center bg-brand text-white rounded-2xl shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all hover:-translate-y-0.5 active:translate-y-0">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard 
          icon={Users}
          label="Total Students"
          value={stats?.totalStudents || 0}
          trend="+4.2%"
          trendUp={true}
          description="Enrolled this session"
          color="blue"
          variants={item}
          onClick={() => navigate(ROUTES.STUDENTS)}
        />
        <KpiCard 
          icon={CalendarCheck}
          label="Today's Attendance"
          value={formatPercent(stats?.attendanceToday?.percentage || 0)}
          trend="-0.5%"
          trendUp={false}
          description={`${stats?.attendanceToday?.present || 0} students present`}
          color="emerald"
          variants={item}
          onClick={() => navigate(ROUTES.ATTENDANCE)}
        />
        <KpiCard 
          icon={IndianRupee}
          label="Revenue (Month)"
          value={formatCurrency(stats?.feeCollection?.collected || 0)}
          trend="+12%"
          trendUp={true}
          description={`${formatPercent(stats?.feeCollection?.percentage || 0)} collection target met`}
          color="amber"
          variants={item}
        />
        <KpiCard 
          icon={ClipboardList}
          label="Upcoming Exams"
          value={stats?.upcomingExams?.count || 0}
          description={stats?.upcomingExams?.next ? `Next: ${stats.upcomingExams.next}` : 'No exams scheduled'}
          color="violet"
          variants={item}
          onClick={() => navigate(ROUTES.EXAMS)}
        />
      </div>

      {/* --- MIDDLE SECTION: CHARTS & ACTIONS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Chart */}
        <motion.div variants={item} className="lg:col-span-8 bg-surface border border-border-base rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-text-primary">Attendance Analytics</h3>
              <p className="text-sm text-text-secondary font-medium">Monthly trend for student presence</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-raised border border-border-base rounded-full text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Last 30 Days
              </span>
            </div>
          </div>
          <div className="h-[280px]">
             <AttendanceTrendChart data={attendanceChart} />
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div variants={item} className="lg:col-span-4 bg-surface-raised/50 border border-border-base rounded-[32px] p-8 shadow-sm">
           <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-text-primary">
             <Clock size={18} className="text-brand" />
             Quick Shortcuts
           </h3>
           <div className="space-y-4">
             <ActionButton 
                icon={UserPlus} 
                label="Register Student" 
                onClick={() => navigate(ROUTES.STUDENT_NEW)}
                description="Admission workflow"
             />
             <ActionButton 
                icon={ClipboardCheck} 
                label="Submit Attendance" 
                onClick={() => navigate(ROUTES.ATTENDANCE)}
                description="Bulk daily record"
             />
             <ActionButton 
                icon={Wallet} 
                label="Collect Fees" 
                onClick={() => navigate(ROUTES.FEES)}
                description="Payment processing"
                color="amber"
             />
             
             <div className="pt-6 mt-6 border-t border-border-base">
               <div className="flex items-center justify-between mb-4 px-2">
                 <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Active session</span>
                 <span className="text-xs font-bold text-brand underline cursor-pointer">Switch</span>
               </div>
               <div className="bg-surface p-4 rounded-2xl border border-border-base flex items-center justify-between">
                 <div>
                   <p className="text-sm font-bold text-text-primary">{currentSession?.name || '—'}</p>
                   <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight mt-0.5">Primary Session</p>
                 </div>
                 <div className="h-8 w-8 bg-surface-raised rounded-xl flex items-center justify-center text-text-muted">
                   <ChevronRight size={16} />
                 </div>
               </div>
             </div>
           </div>
        </motion.div>
      </div>

      {/* --- BOTTOM SECTION: DATA PANELS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Admissions */}
        <motion.div variants={item} className="bg-surface border border-border-base rounded-[32px] overflow-hidden shadow-sm flex flex-col">
          <div className="px-8 py-6 border-b border-border-base/50 flex items-center justify-between bg-surface-raised/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <Search size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-primary">Recent Admissions</h3>
                <p className="text-xs text-text-muted font-bold uppercase tracking-tight">Newly joined scholars</p>
              </div>
            </div>
            <button className="h-8 w-8 text-text-muted hover:text-text-primary transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
          
          <div className="p-4 flex-1">
            <AnimatePresence mode="wait">
              {recentAdmissions.length > 0 ? (
                <div className="space-y-1">
                  {recentAdmissions.slice(0, 5).map((student, idx) => (
                    <motion.div 
                      key={student.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}`)}
                      className="group flex items-center justify-between p-4 rounded-2xl hover:bg-surface-raised transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-surface-raised border-2 border-surface shadow-sm flex items-center justify-center text-text-muted font-black text-xs overflow-hidden">
                           {student.photo_path ? (
                             <img src={student.photo_path} alt="" className="h-full w-full object-cover" />
                           ) : getInitials(`${student.first_name} ${student.last_name}`)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary group-hover:text-brand transition-colors">{student.first_name} {student.last_name}</p>
                          <p className="text-[11px] text-text-muted font-bold uppercase tracking-tight">{student.class_name || 'Unassigned'} · {student.admission_no || 'ADM'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                         <div className="hidden sm:block">
                           <p className="text-xs font-black text-text-primary">{formatDate(student.created_at || student.joined_date)}</p>
                           <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Joined Date</p>
                         </div>
                         <ArrowRight size={16} className="text-text-muted/50 group-hover:text-brand transition-all group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Search} label="No recent admissions found" />
              )}
            </AnimatePresence>
          </div>
          <div className="p-4 border-t border-border-base/50">
             <button 
                onClick={() => navigate(ROUTES.STUDENTS)}
                className="w-full py-3 bg-surface border border-border-base rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-surface-raised transition-all active:scale-[0.98]"
             >
               View Enrollment Registry
             </button>
          </div>
        </motion.div>

        {/* Audit Log / System Activity */}
        <motion.div variants={item} className="bg-surface border border-border-base rounded-[32px] overflow-hidden shadow-sm flex flex-col">
          <div className="px-8 py-6 border-b border-border-base/50 flex items-center justify-between bg-surface-raised/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-text-primary text-surface rounded-2xl flex items-center justify-center">
                <ScrollText size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-primary">System Activity</h3>
                <p className="text-xs text-text-muted font-bold uppercase tracking-tight">Security & Operation audit</p>
              </div>
            </div>
            <button className="h-8 w-8 text-text-muted hover:text-text-primary transition-colors">
              <Filter size={18} />
            </button>
          </div>

          <div className="p-4 flex-1">
            <AnimatePresence mode="wait">
              {recentAudit.length > 0 ? (
                <div className="space-y-1">
                  {recentAudit.slice(0, 5).map((log, idx) => (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-raised transition-all"
                    >
                      <div className="mt-1 h-9 w-9 rounded-xl bg-surface-raised flex items-center justify-center text-text-muted flex-shrink-0">
                         <Clock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                           <p className="text-sm font-bold text-text-primary truncate">
                             {log.changed_by_name || 'System Admin'}
                           </p>
                           <span className="text-[10px] font-black text-text-muted uppercase flex-shrink-0">
                             {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1 leading-relaxed">
                          Updated <span className="font-black text-brand">{log.field_name}</span> in {log.table_name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] px-2 py-0.5 bg-surface-raised text-text-secondary rounded font-mono truncate max-w-[100px]">{String(log.old_value || 'None')}</span>
                           <ArrowRight size={10} className="text-text-muted/50" />
                           <span className="text-[10px] px-2 py-0.5 bg-brand/10 text-brand rounded font-mono truncate max-w-[100px]">{String(log.new_value || 'None')}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={ScrollText} label="No recent audit logs available" />
              )}
            </AnimatePresence>
          </div>
          <div className="p-4 border-t border-border-base/50">
             <button 
                onClick={() => navigate(ROUTES.AUDIT)}
                className="w-full py-3 bg-surface border border-border-base rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-surface-raised transition-all active:scale-[0.98]"
             >
               Full System Audit
             </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// --- SUBCOMPONENTS ---

const KpiCard = ({ icon: Icon, label, value, trend, trendUp, description, color, onClick, variants }) => {
  const colorMap = {
    blue: "bg-brand text-brand shadow-brand/10",
    emerald: "bg-emerald-600 text-emerald-600 shadow-emerald-100",
    amber: "bg-amber-600 text-amber-600 shadow-amber-100",
    violet: "bg-violet-600 text-violet-600 shadow-violet-100"
  }

  return (
    <motion.button 
      variants={variants}
      onClick={onClick}
      disabled={!onClick}
      className="group w-full bg-surface border border-border-base rounded-[32px] p-6 text-left transition-all hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 active:translate-y-0 disabled:cursor-default"
    >
      <div className="flex items-center justify-between mb-5">
        <div className={cn("h-12 w-12 rounded-2xl bg-opacity-10 flex items-center justify-center", colorMap[color].split(' ')[0])}>
           <Icon size={22} className={colorMap[color].split(' ')[1]} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight uppercase",
            trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trendUp ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownLeft size={10} strokeWidth={3} />}
            {trend}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h4 className="text-[11px] font-black text-text-muted uppercase tracking-widest leading-none">{label}</h4>
        <p className="text-3xl font-black text-text-primary tracking-tight">{value}</p>
        <p className="text-xs text-text-secondary font-medium truncate">{description}</p>
      </div>
    </motion.button>
  )
}

const ActionButton = ({ icon: Icon, label, description, onClick, color = "blue" }) => {
  const accentColor = color === 'blue' ? 'bg-brand' : 'bg-amber-600'
  
  return (
    <button 
      onClick={onClick}
      className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border-base hover:bg-surface-raised hover:border-brand/30 transition-all shadow-sm"
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", accentColor)}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-text-primary group-hover:text-brand transition-colors">{label}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight">{description}</p>
      </div>
      <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary transition-all group-hover:translate-x-1" />
    </button>
  )
}

const EmptyState = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
      <Icon size={24} className="text-slate-300" />
    </div>
    <p className="text-sm text-slate-400 font-medium italic">{label}</p>
  </div>
)

export default DashboardPage
