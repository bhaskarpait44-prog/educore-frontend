// src/pages/classes/components/SectionForm.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle } from 'lucide-react'

const schema = z.object({
  name    : z.string().min(1, 'Section name is required').max(10),
  capacity: z.coerce.number().int().min(1, 'Minimum capacity is 1').max(200, 'Maximum capacity is 200'),
})

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

const SectionForm = ({
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
    defaultValues: { name: '', capacity: 40, ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Section Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          placeholder="A or B or C"
          className={inputCls(!!errors.name)}
        />
        {errors.name && (
          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={11}/>{errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Capacity <span className="text-red-500">*</span>
        </label>
        <input
          {...register('capacity')}
          type="number"
          min="1"
          max="200"
          placeholder="40"
          className={inputCls(!!errors.capacity)}
        />
        {errors.capacity ? (
          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={11}/>{errors.capacity.message}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maximum number of students allowed in this section
          </p>
        )}
      </div>

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
          {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Section'}
        </button>
      </div>
    </form>
  )
}

export default SectionForm