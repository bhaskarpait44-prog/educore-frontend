import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const useReceipts = (params = {}) => {
  const [receipts, setReceipts] = useState([])
  const [meta, setMeta] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    accountantApi.getReceipts(params)
      .then((response) => {
        if (!active) return
        setReceipts(response.data?.receipts || [])
        setMeta(response.data?.meta || null)
      })
      .catch(() => {})
      .finally(() => active && setIsLoading(false))

    return () => { active = false }
  }, [JSON.stringify(params)])

  return { receipts, meta, isLoading }
}

export default useReceipts
