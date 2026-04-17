// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, GraduationCap, AlertCircle, Loader2 } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import { loginSchema } from '@/utils/validations'
import { ROUTES, APP_NAME } from '@/constants/app'
import { cn } from '@/utils/helpers'

const LoginPage = () => {
  usePageTitle('Login')

  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError, token } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Where to go after login — default to dashboard
  const from = location.state?.from || ROUTES.DASHBOARD

  // Already logged in
  useEffect(() => {
    if (token) navigate(from, { replace: true })
  }, [token])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver     : zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = async (data) => {
    clearError()
    const result = await login({ email: data.email, password: data.password })
    if (result.success) {
      // Remember me — keep token across sessions (already persisted by zustand)
      // If NOT remember me, we could use sessionStorage instead — simple flag
      if (!data.remember) {
        // Mark session-only in sessionStorage so App can clear on tab close
        sessionStorage.setItem('session_only', '1')
      }
      navigate(from, { replace: true })
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Left panel — branding (hidden on mobile) ─────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-brand)' }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                              radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize : '60px 60px',
          }}
        />

        {/* Floating shapes */}
        <div
          className="absolute top-20 right-16 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: 'white', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-32 left-8 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: 'white', filter: 'blur(30px)' }}
        />

        {/* Top brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} color="white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">{APP_NAME}</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your school<br />smarter, not harder.
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-xs">
            Everything from admissions to results — in one clean, powerful platform.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '10k+', label: 'Students' },
            { value: '99.9%', label: 'Uptime' },
            { value: '50+', label: 'Schools' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-blue-200 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — login form ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              <GraduationCap size={18} color="white" />
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {APP_NAME}
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Sign in to your school account
            </p>
          </div>

          {/* Global API error */}
          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl mb-6 text-sm"
              style={{
                backgroundColor: '#fef2f2',
                border         : '1px solid #fecaca',
                color          : '#dc2626',
              }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="admin@school.edu.in"
                {...register('email')}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all',
                  'placeholder:opacity-40',
                )}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border         : `1.5px solid ${errors.email ? '#dc2626' : 'var(--color-border)'}`,
                  color          : 'var(--color-text-primary)',
                  boxShadow      : errors.email ? '0 0 0 3px #fecaca40' : 'none',
                }}
                onFocus={e => {
                  if (!errors.email)
                    e.target.style.borderColor = 'var(--color-brand)'
                    e.target.style.boxShadow   = '0 0 0 3px #2563eb20'
                }}
                onBlur={e => {
                  if (!errors.email) {
                    e.target.style.borderColor = 'var(--color-border)'
                    e.target.style.boxShadow   = 'none'
                  }
                }}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#dc2626' }}>
                  <AlertCircle size={11} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Password
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all placeholder:opacity-40"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border         : `1.5px solid ${errors.password ? '#dc2626' : 'var(--color-border)'}`,
                    color          : 'var(--color-text-primary)',
                    boxShadow      : errors.password ? '0 0 0 3px #fecaca40' : 'none',
                  }}
                  onFocus={e => {
                    if (!errors.password) {
                      e.target.style.borderColor = 'var(--color-brand)'
                      e.target.style.boxShadow   = '0 0 0 3px #2563eb20'
                    }
                  }}
                  onBlur={e => {
                    if (!errors.password) {
                      e.target.style.borderColor = 'var(--color-border)'
                      e.target.style.boxShadow   = 'none'
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#dc2626' }}>
                  <AlertCircle size={11} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                {...register('remember')}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-sm cursor-pointer select-none"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'py-2.5 px-4 rounded-xl text-sm font-semibold text-white',
                'transition-all duration-150',
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.99]',
              )}
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer note */}
          <p
            className="mt-8 text-center text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Having trouble? Contact your school administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage