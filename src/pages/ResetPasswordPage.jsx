// src/pages/ResetPasswordPage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye, EyeOff, KeyRound, Loader2, CheckCircle2,
  AlertCircle, GraduationCap, ArrowLeft, Check, X
} from 'lucide-react'
import { resetPassword } from '@/api/auth'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES, APP_NAME } from '@/constants/app'
import { cn } from '@/utils/helpers'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[0-9]/, 'At least one number')
      .regex(/[^A-Za-z0-9]/, 'At least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path   : ['confirmPassword'],
  })

// ── Password strength calculation ─────────────────────────────────────────
const getStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  if (password.length >= 8)               score++
  if (password.length >= 12)              score++
  if (/[A-Z]/.test(password))            score++
  if (/[0-9]/.test(password))            score++
  if (/[^A-Za-z0-9]/.test(password))    score++

  const levels = [
    { label: '',          color: '' },
    { label: 'Very weak', color: '#dc2626' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Strong',    color: '#22c55e' },
    { label: 'Very strong', color: '#16a34a' },
  ]
  return { score, ...levels[score] }
}

// ── Individual rule checker ───────────────────────────────────────────────
const rules = [
  { label: 'At least 8 characters',    test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',      test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',                test: (p) => /[0-9]/.test(p) },
  { label: 'One special character',     test: (p) => /[^A-Za-z0-9]/.test(p) },
]

const ResetPasswordPage = () => {
  usePageTitle('Reset Password')

  const [showPassword, setShowPassword]        = useState(false)
  const [showConfirm,  setShowConfirm]         = useState(false)
  const [isLoading,    setIsLoading]           = useState(false)
  const [isSuccess,    setIsSuccess]           = useState(false)
  const [apiError,     setApiError]            = useState(null)
  const [watchedPwd,   setWatchedPwd]          = useState('')

  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')
  const email          = searchParams.get('email')

  const strength = getStrength(watchedPwd)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  // Watch password field for strength indicator
  useEffect(() => {
    const sub = watch((value) => setWatchedPwd(value.password || ''))
    return () => sub.unsubscribe()
  }, [watch])

  // Auto-redirect to login after success
  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => navigate(ROUTES.LOGIN), 3000)
      return () => clearTimeout(t)
    }
  }, [isSuccess])

  const onSubmit = async ({ password }) => {
    if (!token || !email) {
      setApiError('Reset link is invalid or incomplete. Please request a new one.')
      return
    }
    setIsLoading(true)
    setApiError(null)
    try {
      await resetPassword({ token, email, password })
      setIsSuccess(true)
    } catch (err) {
      setApiError(err.message || 'Something went wrong. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
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

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--color-surface)',
            border         : '1px solid var(--color-border)',
          }}
        >
          {!isSuccess ? (
            <>
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                <KeyRound size={22} style={{ color: 'var(--color-brand)' }} />
              </div>

              <h1
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Set new password
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Choose a strong password for your account.
              </p>

              {/* API error */}
              {apiError && (
                <div
                  className="flex items-start gap-3 p-3 rounded-xl mb-5 text-sm"
                  style={{
                    backgroundColor: '#fef2f2',
                    border         : '1px solid #fecaca',
                    color          : '#dc2626',
                  }}
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Missing token warning */}
              {(!token || !email) && (
                <div
                  className="flex items-start gap-3 p-3 rounded-xl mb-5 text-sm"
                  style={{
                    backgroundColor: '#fffbeb',
                    border         : '1px solid #fde68a',
                    color          : '#d97706',
                  }}
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>Invalid reset link. Please request a new one.</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

                {/* New password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all placeholder:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        border         : `1.5px solid ${errors.password ? '#dc2626' : 'var(--color-border)'}`,
                        color          : 'var(--color-text-primary)',
                      }}
                      onFocus={e => {
                        if (!errors.password) e.target.style.borderColor = 'var(--color-brand)'
                      }}
                      onBlur={e => {
                        if (!errors.password) e.target.style.borderColor = 'var(--color-border)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-text-muted)' }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {watchedPwd && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: i <= strength.score
                                ? strength.color
                                : 'var(--color-border)',
                            }}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <p className="text-xs font-medium" style={{ color: strength.color }}>
                          {strength.label}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rule checklist */}
                  {watchedPwd && (
                    <ul className="mt-2 space-y-1">
                      {rules.map((rule) => {
                        const passed = rule.test(watchedPwd)
                        return (
                          <li
                            key={rule.label}
                            className="flex items-center gap-2 text-xs"
                            style={{ color: passed ? '#16a34a' : 'var(--color-text-muted)' }}
                          >
                            {passed
                              ? <Check size={11} style={{ color: '#16a34a' }} />
                              : <X size={11} style={{ color: 'var(--color-text-muted)' }} />
                            }
                            {rule.label}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all placeholder:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        border         : `1.5px solid ${errors.confirmPassword ? '#dc2626' : 'var(--color-border)'}`,
                        color          : 'var(--color-text-primary)',
                      }}
                      onFocus={e => {
                        if (!errors.confirmPassword) e.target.style.borderColor = 'var(--color-brand)'
                      }}
                      onBlur={e => {
                        if (!errors.confirmPassword) e.target.style.borderColor = 'var(--color-border)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-text-muted)' }}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#dc2626' }}>
                      <AlertCircle size={11} /> {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !token}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 mt-2',
                    'py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
                    (isLoading || !token) ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90',
                  )}
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Updating password…</>
                  ) : (
                    'Set new password'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Success state ──────────────────────────────────────── */
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: '#f0fdf4' }}
              >
                <CheckCircle2 size={30} style={{ color: '#16a34a' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Password updated!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Your password has been changed successfully. Redirecting you to login…
              </p>
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--color-brand)' }}
              >
                Go to login now →
              </Link>
            </div>
          )}

          {/* Back to login */}
          {!isSuccess && (
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
              <Link
                to={ROUTES.LOGIN}
                className="flex items-center justify-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeft size={15} />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage