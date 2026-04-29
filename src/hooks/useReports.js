import { useEffect, useState } from 'react'

const useReports = (loader, params = {}) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    loader(params)
      .then((response) => active && setData(response.data))
      .catch(() => {})
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [loader, JSON.stringify(params)])

  return { data, isLoading }
}

export default useReports
