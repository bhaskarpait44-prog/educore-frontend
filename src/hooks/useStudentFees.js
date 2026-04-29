import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const useStudentFees = (params = {}) => {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    accountantApi.getStudentFeesList(params)
      .then((response) => {
        if (active) setStudents(response.data?.students || [])
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [JSON.stringify(params)])

  return { students, isLoading }
}

export default useStudentFees
