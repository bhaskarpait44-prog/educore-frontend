import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap, AlertCircle, Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAuthStore from '@/store/authStore'
import useToast from '@/hooks/useToast'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES, APP_NAME, ROLES } from '@/constants/app'
import { cn } from '@/utils/helpers'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter email or admission number'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isAccountantRoute = (path) => typeof path === 'string' && path.startsWith('/accountant')

function getFallbackRouteForRole(role) {
  if (role === ROLES.STUDENT) return ROUTES.STUDENT_DASHBOARD
  if (role === ROLES.ACCOUNTANT) return ROUTES.ACCOUNTANT_DASHBOARD
  return ROUTES.DASHBOARD
}

function getPostLoginTarget(role, from) {
  const fallbackRoute = getFallbackRouteForRole(role)

  if (!from || from === ROUTES.LOGIN) {
    return fallbackRoute
  }

  // Admins can access accountant routes, but should not land there by default after login.
  if ((role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) && isAccountantRoute(from)) {
    return ROUTES.DASHBOARD
  }

  return from
}

const LoginPage = () => {
  usePageTitle('Login')

  const [showPassword, setShowPassword] = useState(false)
  const auth = useAuthStore(useShallow((state) => ({
    login       : state.login,
    loginStudent: state.loginStudent,
    isLoading   : state.isLoading,
    error       : state.error,
    clearError  : state.clearError,
    token       : state.token,
    user        : state.user,
    isHydrated  : state.isHydrated,
  })))
  const {
    login,
    loginStudent,
    isLoading,
    error,
    clearError,
    token,
    user,
    isHydrated,
  } = auth
  const { toastSuccess, toastError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectedRef = useRef(false)

  const from = location.state?.from

  useEffect(() => {
    if (!isHydrated || !token || !user || redirectedRef.current) return

    const target = getPostLoginTarget(user.role, from)
    redirectedRef.current = true
    navigate(target, { replace: true })
  }, [from, isHydrated, navigate, token, user?.role])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember: false },
  })

  const onSubmit = async (data) => {
    clearError()

    const identifier = data.identifier.trim()
    const password = data.password
    const looksLikeEmail = emailPattern.test(identifier)

    let result

    if (looksLikeEmail) {
      result = await login({ email: identifier, password })
      if (!result.success) {
        result = await loginStudent({ identifier, password })
      }
    } else {
      result = await loginStudent({ identifier, password })
    }

    if (result.success) {
      toastSuccess(`Welcome back, ${result.user?.name?.split(' ')[0] || 'there'}`)
      return
    }

    toastError(result.message || 'Login failed')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-brand)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                              radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div
          className="absolute top-20 right-16 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: 'white', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-32 left-8 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: 'white', filter: 'blur(30px)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} color="white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">{APP_NAME}</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your school
            <br />
            smarter, not harder.
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-xs">
            Everything from admissions to results - in one clean, powerful platform.
          </p>
        </div>

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

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              <GraduationCap size={18} color="white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {APP_NAME}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Sign in with your email or admission number
            </p>
          </div>

          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl mb-6 text-sm"
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
              }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Email or Admission No
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="admin@school.edu.in or ADM-2026-1001"
                {...register('identifier')}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all',
                  'placeholder:opacity-40',
                )}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: `1.5px solid ${errors.identifier ? '#dc2626' : 'var(--color-border)'}`,
                  color: 'var(--color-text-primary)',
                  boxShadow: errors.identifier ? '0 0 0 3px #fecaca40' : 'none',
                }}
              />
              {errors.identifier && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#dc2626' }}>
                  <AlertCircle size={11} /> {errors.identifier.message}
                </p>
              )}
            </div>

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
                    border: `1.5px solid ${errors.password ? '#dc2626' : 'var(--color-border)'}`,
                    color: 'var(--color-text-primary)',
                    boxShadow: errors.password ? '0 0 0 3px #fecaca40' : 'none',
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
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Students can use registered email or admission number. Staff can use email.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
