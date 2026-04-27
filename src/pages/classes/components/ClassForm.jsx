// src/pages/classes/components/ClassForm.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle } from 'lucide-react'

const schema = z
  .object({
    name         : z.string().min(1, 'Class name is required').max(100),
    order_number : z.coerce.number().int().min(1, 'Order number required'),
    min_age      : z.coerce.number().int().min(1).max(25).optional().nullable().or(z.literal('')),
    max_age      : z.coerce.number().int().min(1).max(30).optional().nullable().or(z.literal('')),
    description  : z.string().max(1000).optional().nullable(),
    reason       : z.string().optional(),
  })
  .refine(d => {
    if (d.min_age && d.max_age) return parseInt(d.max_age) > parseInt(d.min_age)
    return true
  }, { message: 'Max age must be greater than min age', path: ['max_age'] })

const Field = ({ label, error, children, required, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        <AlertCircle size={11}/>{error}
      </p>
    )}
    {hint && !error && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
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

const ClassForm = ({
  defaultValues = {},
  onSubmit,
  onCancel,
  isSaving = false,
  isEdit   = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: {
      name        : '',
      order_number: '',
      min_age     : '',
      max_age     : '',
      description : '',
      reason      : '',
      ...defaultValues,
    },
  })

  const handleFormSubmit = (data) => {
    // Normalize empty strings to null
    const clean = {
      ...data,
      min_age     : data.min_age || null,
      max_age     : data.max_age || null,
      description : data.description || null,
    }
    onSubmit(clean)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

      <Field
        label="Class Name"
        error={errors.name?.message}
        hint="Use names like LKG, UKG, Class 1, Class 2 ... Class 12"
        required
      >
        <input
          {...register('name')}
          placeholder="Class 1"
          className={inputCls(!!errors.name)}
        />
      </Field>

      {/* Order Number */}
      <Field
        label="Order Number"
        error={errors.order_number?.message}
        hint="Determines promotion sequence — Grade 1 = 1, Grade 2 = 2"
        required
      >
        <input
          {...register('order_number')}
          type="number"
          min="1"
          placeholder="6"
          className={inputCls(!!errors.order_number)}
        />
      </Field>

      {/* Age Range */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Age (years)" error={errors.min_age?.message}>
          <input
            {...register('min_age')}
            type="number"
            min="1"
            max="25"
            placeholder="10"
            className={inputCls(!!errors.min_age)}
          />
        </Field>
        <Field label="Max Age (years)" error={errors.max_age?.message}>
          <input
            {...register('max_age')}
            type="number"
            min="1"
            max="30"
            placeholder="13"
            className={inputCls(!!errors.max_age)}
          />
        </Field>
      </div>

      {/* Description */}
      <Field label="Description" error={errors.description?.message}>
        <textarea
          {...register('description')}
          placeholder="Optional notes about this class"
          rows={2}
          className={inputCls(!!errors.description) + ' resize-none'}
        />
      </Field>

      {/* Reason — only for edits */}
      {isEdit && (
        <Field label="Reason for Change" error={errors.reason?.message} required>
          <input
            {...register('reason')}
            placeholder="Brief reason for this update"
            className={inputCls(!!errors.reason)}
          />
        </Field>
      )}

      {/* Actions */}
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
          {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Class'}
        </button>
      </div>
    </form>
  )
}

export default ClassForm
