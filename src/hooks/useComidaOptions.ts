import { useEffect, useState } from 'react'
import { bocanasApi } from '../lib/airtable'
import { logger } from '../lib/logger'

const FALLBACK = ['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla']

const toComidaString = (value: unknown): string | null => {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed === '' ? null : trimmed
}

const buildList = (records: Array<{ fields: { Comida?: unknown } }>): string[] => {
  const unique = new Set<string>()
  for (const r of records) {
    const c = toComidaString(r.fields?.Comida)
    if (c) unique.add(c)
  }
  for (const c of FALLBACK) unique.add(c)
  return Array.from(unique).sort()
}

export const useComidaOptions = () => {
  const [comidas, setComidas] = useState<string[]>(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const records = await bocanasApi.getAll()
      setComidas(buildList(records))
    } catch (err) {
      logger.error('Error cargando opciones de comida:', err)
      setError('Error cargando opciones de comida')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  return { comidas, loading, error, refetch: fetchOptions }
}
