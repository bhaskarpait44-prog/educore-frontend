import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const useStudentFees = (params = {}) => {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    accountantApi.getStudentFeesList(params)
      .then((response) => {
        if (active) setStudents(response.data?.students || [])
      })
      .catch((err) => {
        if (active) {
          setStudents([])
          setError(err?.message || 'Failed to load students')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [JSON.stringify(params)])

  return { students, isLoading, error }
}

export default useStudentFees
