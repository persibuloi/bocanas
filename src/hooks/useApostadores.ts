import { useCallback, useEffect, useState } from 'react'
import { Apostador, apostadoresApi } from '../lib/airtable'
import { logger } from '../lib/logger'
import toast from 'react-hot-toast'

export const useApostadores = () => {
  const [apostadores, setApostadores] = useState<Apostador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApostadores = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apostadoresApi.getAll()
      setApostadores(data)
    } catch (err) {
      const msg = 'Error cargando apostadores'
      setError(msg)
      toast.error(msg)
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApostadores()
  }, [fetchApostadores])

  return { apostadores, loading, error, fetchApostadores }
}
