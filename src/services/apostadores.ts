import { fetchAllWithPagination } from './api'
import { Apostador } from '../types'
import { logger } from '../lib/logger'

let cache: { data: Apostador[]; ts: number } | null = null
let inFlight: Promise<Apostador[]> | null = null
const TTL_MS = 60_000

export const apostadoresApi = {
  getAll: async (): Promise<Apostador[]> => {
    try {
      const now = Date.now()
      if (cache && now - cache.ts < TTL_MS) return cache.data
      if (inFlight) return inFlight
      inFlight = (async () => {
        try {
          const records = await fetchAllWithPagination<Apostador>('/Apostadores', {
            'sort[0][field]': 'Nombre',
            'sort[0][direction]': 'asc',
            pageSize: 50,
          }, 1)
          cache = { data: records, ts: Date.now() }
          return records
        } finally {
          inFlight = null
        }
      })()
      return await inFlight
    } catch (error) {
      logger.error('Error obteniendo apostadores:', error)
      throw error
    }
  },
}
