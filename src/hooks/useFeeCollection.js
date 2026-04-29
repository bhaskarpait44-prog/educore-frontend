import { useState } from 'react'
import * as accountantApi from '@/api/accountantApi'

const useFeeCollection = () => {
  const [isSaving, setIsSaving] = useState(false)

  const collect = async (payload) => {
    setIsSaving(true)
    try {
      const response = await accountantApi.collectFees(payload)
      return response.data
    } finally {
      setIsSaving(false)
    }
  }

  return { collect, isSaving }
}

export default useFeeCollection
