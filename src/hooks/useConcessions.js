import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const useConcessions = (params = {}) => {
  const [concessions, setConcessions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    accountantApi.getConcessions(params)
      .then((response) => active && setConcessions(response.data?.concessions || []))
      .catch(() => {})
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [JSON.stringify(params)])

  return { concessions, isLoading }
}

export default useConcessions
