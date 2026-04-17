// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle, GraduationCap } from 'lucide-react'
import { forgotPassword } from '@/api/auth'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES, APP_NAME } from '@/constants/app'
import { cn } from '@/utils/helpers'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

const ForgotPasswordPage = () => {
  usePageTitle('Forgot Password')

  const [isLoading, setIsLoading]   = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [apiError,  setApiError]    = useState(null)
  const [sentEmail, setSentEmail]   = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }) => {
    setIsLoading(true)
    setApiError(null)
    try {
      await forgotPassword({ email })
      setSentEmail(email)
      setSubmitted(true)
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.')
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
          <span
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
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
          {!submitted ? (
            <>
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                <Mail size={22} style={{ color: 'var(--color-brand)' }} />
              </div>

              <h1
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Forgot your password?
              </h1>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Enter your registered email address and we'll send you a link to reset your password.
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

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-5">
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
                    autoFocus
                    autoComplete="email"
                    placeholder="your@email.com"
                    {...register('email')}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:opacity-40"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border         : `1.5px solid ${errors.email ? '#dc2626' : 'var(--color-border)'}`,
                      color          : 'var(--color-text-primary)',
                    }}
                    onFocus={e => {
                      if (!errors.email) e.target.style.borderColor = 'var(--color-brand)'
                    }}
                    onBlur={e => {
                      if (!errors.email) e.target.style.borderColor = 'var(--color-border)'
                    }}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#dc2626' }}>
                      <AlertCircle size={11} /> {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2',
                    'py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90',
                  )}
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending…</>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Success state ──────────────────────────────────────── */
            <div className="text-center py-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: '#f0fdf4' }}
              >
                <CheckCircle2 size={28} style={{ color: '#16a34a' }} />
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Check your inbox
              </h2>
              <p
                className="text-sm mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                We've sent a password reset link to
              </p>
              <p
                className="text-sm font-semibold mb-6"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {sentEmail}
              </p>
              <p
                className="text-xs mb-6"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="underline"
                  style={{ color: 'var(--color-brand)' }}
                >
                  try again
                </button>
                .
              </p>
            </div>
          )}

          {/* Back to login */}
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
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage