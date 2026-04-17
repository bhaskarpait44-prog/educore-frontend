// src/pages/students/AdmitStudentPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import useStudentStore from '@/store/studentStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import usePageTitle from '@/hooks/usePageTitle'
import { ROUTES } from '@/constants/app'
import { cn } from '@/utils/helpers'
import StepIdentity    from './admit/StepIdentity'
import StepProfile     from './admit/StepProfile'
import StepEnrollment  from './admit/StepEnrollment'
import StepSuccess     from './admit/StepSuccess'

const STEPS = [
  { id: 1, label: 'Identity',   desc: 'Basic details'     },
  { id: 2, label: 'Profile',    desc: 'Contact & family'  },
  { id: 3, label: 'Enrollment', desc: 'Class assignment'  },
  { id: 4, label: 'Done',       desc: 'Admission complete' },
]

const AdmitStudentPage = () => {
  usePageTitle('Admit New Student')
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { createStudent, isSaving } = useStudentStore()
  const { currentSession } = useSessionStore()

  const [step,        setStep]        = useState(1)
  const [formData,    setFormData]    = useState({})
  const [admittedStudent, setAdmitted]= useState(null)

  const goNext = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }))
    setStep(s => s + 1)
  }

  const goBack = () => setStep(s => s - 1)

  const handleSubmit = async (enrollmentData) => {
    const allData = { ...formData, ...enrollmentData }

    // Step 1: Create student
    const studentResult = await createStudent({
      admission_no  : allData.admission_no,
      first_name    : allData.first_name,
      last_name     : allData.last_name,
      date_of_birth : allData.date_of_birth,
      gender        : allData.gender,
      profile       : {
        address          : allData.address,
        city             : allData.city,
        state            : allData.state,
        pincode          : allData.pincode,
        phone            : allData.phone,
        email            : allData.email,
        father_name      : allData.father_name,
        father_phone     : allData.father_phone,
        mother_name      : allData.mother_name,
        mother_phone     : allData.mother_phone,
        emergency_contact: allData.emergency_contact,
        blood_group      : allData.blood_group,
        medical_notes    : allData.medical_notes,
      },
    })

    if (!studentResult.success) {
      toastError(studentResult.message || 'Failed to admit student')
      return
    }

    setAdmitted(studentResult.data)
    setStep(4)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Back + title ────────────────────────────────────────────────── */}
      {step < 4 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => step > 1 ? goBack() : navigate(ROUTES.STUDENTS)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Admit New Student
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Step {step} of 3 — {STEPS[step - 1]?.desc}
            </p>
          </div>
        </div>
      )}

      {/* ── Progress stepper ────────────────────────────────────────────── */}
      {step < 4 && (
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center">
            {STEPS.slice(0, 3).map((s, i) => {
              const isDone    = step > s.id
              const isCurrent = step === s.id
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  {/* Circle */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={{
                        backgroundColor: isDone    ? '#22c55e'
                                        : isCurrent ? 'var(--color-brand)'
                                        : 'var(--color-surface-raised)',
                        color          : isDone || isCurrent ? '#fff' : 'var(--color-text-muted)',
                        border         : isCurrent ? '2px solid var(--color-brand)' : '2px solid transparent',
                      }}
                    >
                      {isDone ? <Check size={14} /> : s.id}
                    </div>
                    <span
                      className="text-xs font-medium hidden sm:block"
                      style={{ color: isCurrent ? 'var(--color-brand)' : 'var(--color-text-muted)' }}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* Connector */}
                  {i < 2 && (
                    <div
                      className="flex-1 h-0.5 mx-2 transition-all duration-500"
                      style={{ backgroundColor: isDone ? '#22c55e' : 'var(--color-border)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step content ────────────────────────────────────────────────── */}
      {step === 1 && (
        <StepIdentity defaultValues={formData} onNext={goNext} />
      )}
      {step === 2 && (
        <StepProfile defaultValues={formData} onNext={goNext} onBack={goBack} />
      )}
      {step === 3 && (
        <StepEnrollment
          defaultValues={formData}
          currentSession={currentSession}
          onSubmit={handleSubmit}
          onBack={goBack}
          isSaving={isSaving}
        />
      )}
      {step === 4 && (
        <StepSuccess
          student={admittedStudent}
          onViewStudent={() => navigate(`${ROUTES.STUDENTS}/${admittedStudent?.id}`)}
          onAdmitAnother={() => { setStep(1); setFormData({}); setAdmitted(null) }}
        />
      )}
    </div>
  )
}

export default AdmitStudentPage