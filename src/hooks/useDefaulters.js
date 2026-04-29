import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const useDefaulters = (params = {}) => {
  const [defaulters, setDefaulters] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    accountantApi.getDefaulters(params)
      .then((response) => active && setDefaulters(response.data?.defaulters || []))
      .catch(() => {})
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [JSON.stringify(params)])

  return { defaulters, isLoading }
}

export default useDefaulters
