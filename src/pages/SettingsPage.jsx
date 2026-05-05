import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  User,
  Shield,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  CalendarRange,
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Bell,
  MonitorCog,
} from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import useSessionStore from '@/store/sessionStore'
import { APP_NAME, APP_VERSION, ROUTES } from '@/constants/app'

const SETTINGS_STORAGE_KEY = 'educore_settings'

const DEFAULT_SETTINGS = {
  schoolName: 'EduCore Academy',
  schoolEmail: 'admin@school.edu.in',
  schoolPhone: '+91 98765 43210',
  schoolAddress: '12 Knowledge Avenue, Bengaluru',
  timezone: 'Asia/Kolkata',
  attendanceReminder: true,
  feeReminder: true,
}

const SettingsPage = () => {
  usePageTitle('Settings')

  const navigate = useNavigate()
  const { toastSuccess, toastInfo } = useToast()
  const { user } = useAuthStore()
  const { theme, setTheme, sidebarCollapsed, setSidebarCollapsed } = useUiStore()
  const { currentSession, fetchCurrentSession } = useSessionStore()

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    fetchCurrentSession()

    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (saved) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }))
      }
    } catch {
      // Ignore malformed saved settings and fall back to defaults.
    }
  }, [fetchCurrentSession])

  const completion = useMemo(() => {
    const requiredFields = [
      settings.schoolName,
      settings.schoolEmail,
      settings.schoolPhone,
      settings.schoolAddress,
      settings.timezone,
    ]

    const filled = requiredFields.filter((value) => String(value || '').trim()).length
    return Math.round((filled / requiredFields.length) * 100)
  }, [settings])

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    toastSuccess('Settings saved successfully')
  }

  const handleThemeChange = (nextTheme) => {
    if (nextTheme !== theme) {
      setTheme(nextTheme)
      toastInfo(`Theme switched to ${nextTheme}`)
    }
  }

  const handleSidebarChange = (collapsed) => {
    setSidebarCollapsed(collapsed)
    toastInfo(collapsed ? 'Sidebar collapsed by default' : 'Sidebar expanded by default')
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[28px] p-6 sm:p-7"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #14532d 100%)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8 justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/12 text-white/90 mb-4">
              <MonitorCog size={14} />
              Admin Workspace Settings
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Keep your school workspace organized and ready for the team.
            </h1>
            <p className="text-sm sm:text-base text-emerald-50/90 mt-3 max-w-xl leading-relaxed">
              Update school details, tune your workspace preferences, and check the current session setup from one place.
            </p>
          </div>

          <div
            className="min-w-[240px] rounded-3xl p-4 sm:p-5"
            style={{ backgroundColor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)' }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80 mb-2">
              Setup Progress
            </p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-white">{completion}%</span>
              <span className="text-sm text-emerald-50/80 mb-1">profile completed</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-xs text-emerald-50/80 mt-3">
              Last saved locally on this device when you press Save changes.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="space-y-6">
          <SettingsCard
            icon={Building2}
            title="School Profile"
            description="Basic identity and contact information for this workspace."
            action={
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Save size={15} />
                Save changes
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="School name"
                value={settings.schoolName}
                onChange={(value) => handleChange('schoolName', value)}
                placeholder="Enter school name"
              />
              <Field
                label="Official email"
                value={settings.schoolEmail}
                onChange={(value) => handleChange('schoolEmail', value)}
                placeholder="admin@school.edu.in"
                icon={Mail}
              />
              <Field
                label="Phone number"
                value={settings.schoolPhone}
                onChange={(value) => handleChange('schoolPhone', value)}
                placeholder="+91 98765 43210"
                icon={Phone}
              />
              <Field
                label="Timezone"
                value={settings.timezone}
                onChange={(value) => handleChange('timezone', value)}
                placeholder="Asia/Kolkata"
              />
            </div>
            <div className="mt-4">
              <Field
                label="Campus address"
                value={settings.schoolAddress}
                onChange={(value) => handleChange('schoolAddress', value)}
                placeholder="Full school address"
                icon={MapPin}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            icon={MonitorCog}
            title="Workspace Preferences"
            description="Personalize how the admin panel feels when you open it each day."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PreferenceBox
                label="Theme"
                hint="Choose the appearance you want across the dashboard."
              >
                <div className="grid grid-cols-3 gap-3">
                  <ChoiceButton
                    active={theme === 'light'}
                    label="Light"
                    icon={Sun}
                    onClick={() => handleThemeChange('light')}
                  />
                  <ChoiceButton
                    active={theme === 'dark'}
                    label="Dark"
                    icon={Moon}
                    onClick={() => handleThemeChange('dark')}
                  />
                  <ChoiceButton
                    active={theme === 'system'}
                    label="System"
                    icon={MonitorCog}
                    onClick={() => handleThemeChange('system')}
                  />
                </div>
              </PreferenceBox>

              <PreferenceBox
                label="Sidebar"
                hint="Set how navigation should appear when the app loads."
              >
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceButton
                    active={!sidebarCollapsed}
                    label="Expanded"
                    icon={PanelLeftOpen}
                    onClick={() => handleSidebarChange(false)}
                  />
                  <ChoiceButton
                    active={sidebarCollapsed}
                    label="Collapsed"
                    icon={PanelLeftClose}
                    onClick={() => handleSidebarChange(true)}
                  />
                </div>
              </PreferenceBox>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Bell}
            title="Admin Reminders"
            description="Keep a couple of useful nudges visible for the admin team."
          >
            <div className="space-y-3">
              <ToggleRow
                title="Attendance follow-up reminder"
                description="Show a reminder preference for attendance review workflows."
                checked={settings.attendanceReminder}
                onToggle={() => handleChange('attendanceReminder', !settings.attendanceReminder)}
              />
              <ToggleRow
                title="Fee reminder summary"
                description="Keep a reminder preference for pending dues and billing review."
                checked={settings.feeReminder}
                onToggle={() => handleChange('feeReminder', !settings.feeReminder)}
              />
            </div>
          </SettingsCard>
        </div>

        <div className="space-y-6">
          <SettingsCard
            icon={User}
            title="Administrator"
            description="Signed-in account details for the current session."
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {(user?.name || 'A').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {user?.email || 'No email available'}
                </p>
                <span
                  className="inline-flex mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}
                >
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={CalendarRange}
            title="Academic Session"
            description="Quick visibility into the active session configuration."
            action={
              <button
                onClick={() => navigate(ROUTES.SESSIONS)}
                className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-brand)' }}
              >
                Manage sessions
                <ArrowUpRight size={14} />
              </button>
            }
          >
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Active session
              </p>
              <p className="text-lg font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                {currentSession?.name || 'No active session found'}
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {currentSession
                  ? 'This session is currently driving attendance, fees, and reports across the app.'
                  : 'Create or activate a session so school operations stay aligned.'}
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Shield}
            title="System Overview"
            description="A quick read on environment details for this frontend."
          >
            <div className="space-y-3 text-sm">
              <OverviewRow label="App name" value={APP_NAME} />
              <OverviewRow label="Version" value={APP_VERSION} />
              <OverviewRow label="Toast alignment" value="Top center" />
              <OverviewRow label="Theme mode" value={theme} />
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  )
}

const SettingsCard = ({ icon: Icon, title, description, action, children }) => (
  <section
    className="rounded-[24px] p-5 sm:p-6"
    style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
    }}
  >
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}
        >
          {Icon && <Icon size={18} />}
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
    {children}
  </section>
)

const Field = ({ label, value, onChange, placeholder, icon: Icon }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
      {label}
    </span>
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          paddingLeft: Icon ? '2.5rem' : '1rem',
        }}
      />
    </div>
  </label>
)

const PreferenceBox = ({ label, hint, children }) => (
  <div
    className="rounded-2xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {label}
    </p>
    <p className="text-xs mt-1 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
      {hint}
    </p>
    {children}
  </div>
)

const ChoiceButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
    style={{
      backgroundColor: active ? 'var(--color-brand)' : 'var(--color-surface)',
      color: active ? '#ffffff' : 'var(--color-text-secondary)',
      border: active ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
      boxShadow: active ? '0 10px 24px rgba(37, 99, 235, 0.18)' : 'none',
    }}
  >
    {Icon && <Icon size={16} />}
    {label}
  </button>
)

const ToggleRow = ({ title, description, checked, onToggle }) => (
  <div
    className="flex items-center justify-between gap-4 rounded-2xl p-4"
    style={{ backgroundColor: 'var(--color-surface-raised)' }}
  >
    <div>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </p>
      <p className="text-xs mt-1 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    </div>
    <button
      type="button"
      onClick={onToggle}
      className="relative w-14 h-8 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: checked ? 'var(--color-success)' : '#cbd5e1' }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
        style={{ left: checked ? '1.7rem' : '0.25rem' }}
      />
    </button>
  </div>
)

const OverviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
    <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
)

export default SettingsPage
