// src/pages/classes/components/SubjectForm.jsx
import { useEffect, useMemo } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BookOpen, FlaskConical, Layers,
  ToggleLeft, ToggleRight, AlertCircle,
  Info,
} from 'lucide-react'

const optionalPositiveNumber = (label) => z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) return undefined
    return Number(value)
  },
  z.number().positive(`${label} must be greater than 0`).optional().nullable()
)

// ── Zod schema ────────────────────────────────────────────────────────────
const schema = z
  .object({
    name         : z.string().min(1, 'Subject name is required').max(150),
    code         : z.string().min(1, 'Subject code is required').max(30)
                    .regex(/^[A-Z0-9\-]+$/i, 'Only letters, numbers and hyphens'),
    subject_type : z.enum(['theory', 'practical', 'both']),
    is_core      : z.boolean(),
    order_number : z.coerce.number().int().min(1, 'Order number required'),
    description  : z.string().max(1000).optional().nullable(),

    theory_total_marks      : optionalPositiveNumber('Theory total marks'),
    theory_passing_marks    : optionalPositiveNumber('Theory passing marks'),
    practical_total_marks   : optionalPositiveNumber('Practical total marks'),
    practical_passing_marks : optionalPositiveNumber('Practical passing marks'),
    reason                  : z.string().optional(),
  })
  .superRefine((d, ctx) => {
    // Theory marks required when type is theory or both
    if (['theory', 'both'].includes(d.subject_type)) {
      if (!d.theory_total_marks) {
        ctx.addIssue({ code: 'custom', path: ['theory_total_marks'], message: 'Theory total marks required' })
      }
      if (!d.theory_passing_marks) {
        ctx.addIssue({ code: 'custom', path: ['theory_passing_marks'], message: 'Theory passing marks required' })
      }
      if (d.theory_passing_marks && d.theory_total_marks && d.theory_passing_marks >= d.theory_total_marks) {
        ctx.addIssue({ code: 'custom', path: ['theory_passing_marks'], message: 'Must be less than total marks' })
      }
    }
    // Practical marks required when type is practical or both
    if (['practical', 'both'].includes(d.subject_type)) {
      if (!d.practical_total_marks) {
        ctx.addIssue({ code: 'custom', path: ['practical_total_marks'], message: 'Practical total marks required' })
      }
      if (!d.practical_passing_marks) {
        ctx.addIssue({ code: 'custom', path: ['practical_passing_marks'], message: 'Practical passing marks required' })
      }
      if (d.practical_passing_marks && d.practical_total_marks && d.practical_passing_marks >= d.practical_total_marks) {
        ctx.addIssue({ code: 'custom', path: ['practical_passing_marks'], message: 'Must be less than total marks' })
      }
    }
  })

// ── Type option card ──────────────────────────────────────────────────────
const TypeCard = ({ value, selected, onSelect, icon: Icon, label, helper }) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={`
      flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer
      ${selected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-400'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
      }
    `}
  >
    <Icon
      size={22}
      className={selected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
    />
    <span className={`text-sm font-semibold ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
      {label}
    </span>
    <span className="text-xs text-center text-gray-500 dark:text-gray-400">{helper}</span>
  </button>
)

// ── Field with label ──────────────────────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
)

const inputCls = (hasError) => `
  w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-all
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  ${hasError
    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/30'
    : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'
  }
`

// ── Main SubjectForm ──────────────────────────────────────────────────────
const SubjectForm = ({
  defaultValues = {},
  onSubmit,
  onCancel,
  isSaving = false,
  isEdit   = false,
  nextOrderNumber = 1,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver     : zodResolver(schema),
    shouldUnregister: true,
    defaultValues: {
      name                    : '',
      code                    : '',
      subject_type            : 'theory',
      is_core                 : true,
      order_number            : nextOrderNumber,
      description             : '',
      theory_total_marks      : '',
      theory_passing_marks    : '',
      practical_total_marks   : '',
      practical_passing_marks : '',
      reason                  : '',
      ...defaultValues,
    },
  })

  const subjectType = watch('subject_type')
  const isCore      = watch('is_core')

  // Watch marks for combined calculation
  const theoryTotal      = watch('theory_total_marks')
  const theoryPassing    = watch('theory_passing_marks')
  const practicalTotal   = watch('practical_total_marks')
  const practicalPassing = watch('practical_passing_marks')

  const combinedTotal = useMemo(() => {
    if (subjectType !== 'both') return null
    const t = parseFloat(theoryTotal)   || 0
    const p = parseFloat(practicalTotal) || 0
    return t + p > 0 ? (t + p).toFixed(0) : '—'
  }, [subjectType, theoryTotal, practicalTotal])

  const combinedPassing = useMemo(() => {
    if (subjectType !== 'both') return null
    const t = parseFloat(theoryPassing)   || 0
    const p = parseFloat(practicalPassing) || 0
    return t + p > 0 ? (t + p).toFixed(0) : '—'
  }, [subjectType, theoryPassing, practicalPassing])

  // Auto-generate code from name (only for new subjects)
  const nameValue = watch('name')
  useEffect(() => {
    if (!isEdit && nameValue && !defaultValues.code) {
      const parts = nameValue.trim().split(/\s+/)
      const auto  = parts.length === 1
        ? nameValue.substring(0, 4).toUpperCase()
        : parts.map(w => w[0]).join('').toUpperCase()
      setValue('code', auto, { shouldValidate: false })
    }
  }, [nameValue, isEdit])

  const handleFormSubmit = (data) => {
    // Clear unused mark fields based on type
    if (data.subject_type === 'theory') {
      data.practical_total_marks   = null
      data.practical_passing_marks = null
    } else if (data.subject_type === 'practical') {
      data.theory_total_marks   = null
      data.theory_passing_marks = null
    }
    onSubmit(data)
  }

  useEffect(() => {
    if (subjectType === 'theory') {
      setValue('practical_total_marks', undefined, { shouldValidate: false })
      setValue('practical_passing_marks', undefined, { shouldValidate: false })
    }

    if (subjectType === 'practical') {
      setValue('theory_total_marks', undefined, { shouldValidate: false })
      setValue('theory_passing_marks', undefined, { shouldValidate: false })
    }
  }, [setValue, subjectType])

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* ── Section 1: Basic Info ──────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Basic Information
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject Name" error={errors.name?.message} required>
            <input
              {...register('name')}
              placeholder="Mathematics"
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Subject Code" error={errors.code?.message} required>
            <input
              {...register('code')}
              placeholder="MATH-6"
              className={inputCls(!!errors.code)}
              onChange={e => setValue('code', e.target.value.toUpperCase())}
            />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            placeholder="Optional description or notes"
            rows={2}
            className={inputCls(!!errors.description) + ' resize-none'}
          />
        </Field>
      </div>

      {/* ── Section 2: Subject Type ────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Subject Type
        </h3>

        <Controller
          control={control}
          name="subject_type"
          render={({ field }) => (
            <div className="flex gap-3">
              <TypeCard
                value="theory"
                selected={field.value === 'theory'}
                onSelect={field.onChange}
                icon={BookOpen}
                label="Theory Only"
                helper="Written exam only"
              />
              <TypeCard
                value="practical"
                selected={field.value === 'practical'}
                onSelect={field.onChange}
                icon={FlaskConical}
                label="Practical Only"
                helper="Lab / practical exam only"
              />
              <TypeCard
                value="both"
                selected={field.value === 'both'}
                onSelect={field.onChange}
                icon={Layers}
                label="Theory + Practical"
                helper="Both written and practical"
              />
            </div>
          )}
        />
      </div>

      {/* ── Section 3: Marks Config (dynamic) ─────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Marks Configuration
        </h3>

        {/* Theory Only */}
        {subjectType === 'theory' && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
            <Field label="Total Marks" error={errors.theory_total_marks?.message} required>
              <input
                {...register('theory_total_marks')}
                type="number"
                min="1"
                placeholder="100"
                className={inputCls(!!errors.theory_total_marks)}
              />
            </Field>
            <Field label="Passing Marks" error={errors.theory_passing_marks?.message} required>
              <input
                {...register('theory_passing_marks')}
                type="number"
                min="1"
                placeholder="35"
                className={inputCls(!!errors.theory_passing_marks)}
              />
            </Field>
          </div>
        )}

        {/* Practical Only */}
        {subjectType === 'practical' && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
            <Field label="Practical Total Marks" error={errors.practical_total_marks?.message} required>
              <input
                {...register('practical_total_marks')}
                type="number"
                min="1"
                placeholder="50"
                className={inputCls(!!errors.practical_total_marks)}
              />
            </Field>
            <Field label="Practical Passing Marks" error={errors.practical_passing_marks?.message} required>
              <input
                {...register('practical_passing_marks')}
                type="number"
                min="1"
                placeholder="17"
                className={inputCls(!!errors.practical_passing_marks)}
              />
            </Field>
          </div>
        )}

        {/* Both */}
        {subjectType === 'both' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Theory column */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 space-y-3">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen size={12} /> Theory
                </p>
                <Field label="Total Marks" error={errors.theory_total_marks?.message} required>
                  <input
                    {...register('theory_total_marks')}
                    type="number" min="1" placeholder="80"
                    className={inputCls(!!errors.theory_total_marks)}
                  />
                </Field>
                <Field label="Passing Marks" error={errors.theory_passing_marks?.message} required>
                  <input
                    {...register('theory_passing_marks')}
                    type="number" min="1" placeholder="27"
                    className={inputCls(!!errors.theory_passing_marks)}
                  />
                </Field>
              </div>

              {/* Practical column */}
              <div className="p-4 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-100 dark:border-green-900 space-y-3">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-1.5">
                  <FlaskConical size={12} /> Practical
                </p>
                <Field label="Total Marks" error={errors.practical_total_marks?.message} required>
                  <input
                    {...register('practical_total_marks')}
                    type="number" min="1" placeholder="20"
                    className={inputCls(!!errors.practical_total_marks)}
                  />
                </Field>
                <Field label="Passing Marks" error={errors.practical_passing_marks?.message} required>
                  <input
                    {...register('practical_passing_marks')}
                    type="number" min="1" placeholder="8"
                    className={inputCls(!!errors.practical_passing_marks)}
                  />
                </Field>
              </div>
            </div>

            {/* Combined read-only */}
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Combined Total</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {combinedTotal || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Combined Passing</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {combinedPassing || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
                <Info size={13} className="text-purple-500 mt-0.5 shrink-0" />
                <p className="text-xs text-purple-700 dark:text-purple-400">
                  Student must pass theory and practical <strong>separately</strong> — not just the combined total.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 4: Core Subject Toggle ────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Core Subject
        </h3>

        <Controller
          control={control}
          name="is_core"
          render={({ field }) => (
            <div
              onClick={() => field.onChange(!field.value)}
              className={`
                flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                ${field.value
                  ? 'border-red-400 bg-red-50/60 dark:bg-red-950/20 dark:border-red-600'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
              `}
            >
              <div>
                <p className={`text-sm font-semibold ${field.value ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {field.value ? 'Core Subject' : 'Optional Subject'}
                </p>
                <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                  {field.value
                    ? 'Failing this subject affects promotion result'
                    : 'Failing this subject does not affect promotion result'
                  }
                </p>
              </div>
              {field.value
                ? <ToggleRight size={28} className="text-red-500 dark:text-red-400 shrink-0" />
                : <ToggleLeft  size={28} className="text-gray-400 dark:text-gray-500 shrink-0" />
              }
            </div>
          )}
        />
      </div>

      {/* ── Section 5: Display Order ───────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Display Order
        </h3>
        <Field label="Order Number" error={errors.order_number?.message} required>
          <input
            {...register('order_number')}
            type="number"
            min="1"
            className={inputCls(!!errors.order_number)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Determines position on mark sheets and report cards
          </p>
        </Field>
      </div>

      {/* ── Reason for edit (only in edit mode) ───────────────────── */}
      {isEdit && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Reason for Change
          </h3>
          <Field label="Reason" error={errors.reason?.message} required>
            <input
              {...register('reason')}
              placeholder="Brief reason for updating this subject"
              className={inputCls(!!errors.reason)}
            />
          </Field>
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isSaving && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
          {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Subject'}
        </button>
      </div>
    </form>
  )
}

export default SubjectForm
