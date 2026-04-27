// src/pages/students/admit/StepProfile.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input    from '@/components/ui/Input'
import Select   from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button   from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']
  .map(v => ({ value: v, label: v }))

const schema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('A valid student email is required'),
  father_name: z.string().optional(),
  father_phone: z.string().optional(),
  mother_name: z.string().optional(),
  mother_phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  blood_group: z.string().optional(),
  medical_notes: z.string().optional(),
})

const StepProfile = ({ defaultValues, onNext, onBack }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* Address */}
        <SectionHeading title="Address" subtitle="Student's current residential address" />
        <Textarea label="Address" placeholder="House/Flat No, Street, Locality" rows={2} {...register('address')} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="City"    placeholder="Guwahati" containerClassName="col-span-2" {...register('city')} />
          <Input label="State"   placeholder="Assam"                                    {...register('state')} />
          <Input label="Pincode" placeholder="781001" type="number"                     {...register('pincode')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone"  type="tel" placeholder="+91-9876543210" {...register('phone')} />
          <Input
            label="Student Email"
            type="email"
            placeholder="student@email.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Parents */}
        <SectionHeading title="Parents / Guardians" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Father's Name"  placeholder="Rajesh Sharma" {...register('father_name')} />
          <Input label="Father's Phone" type="tel" placeholder="+91-9876543211" {...register('father_phone')} />
          <Input label="Mother's Name"  placeholder="Sunita Sharma" {...register('mother_name')} />
          <Input label="Mother's Phone" type="tel" placeholder="+91-9876543212" {...register('mother_phone')} />
        </div>

        {/* Medical */}
        <SectionHeading title="Medical Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Emergency Contact" type="tel" placeholder="+91-9876543213" {...register('emergency_contact')} />
          <Select label="Blood Group" options={BLOOD_GROUPS} placeholder="Select…" {...register('blood_group')} />
        </div>
        <Textarea
          label="Medical Notes"
          placeholder="Allergies, conditions, medications…"
          hint="Optional — visible to staff only"
          rows={2}
          {...register('medical_notes')}
        />
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
        <Button type="submit">Continue to Enrollment →</Button>
      </div>
    </form>
  )
}

export default StepProfile
