import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const useCheques = (params = {}) => {
  const [cheques, setCheques] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    accountantApi.getCheques(params)
      .then((response) => active && setCheques(response.data?.cheques || []))
      .catch(() => {})
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [JSON.stringify(params)])

  return { cheques, isLoading }
}

export default useCheques
