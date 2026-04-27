import { api, fetchAllWithPagination } from './api'
import { Bocana } from '../types'
import { BocanaCreateSchema, BocanaUpdateSchema } from '../schemas'
import { Torneo } from '../lib/torneos'
import { and, eqNumber, eqString } from '../lib/airtable-formula'
import { logger } from '../lib/logger'

export interface BocanaFilters {
  status?: 'Pagada' | 'Pendiente'
  torneo?: Torneo
  jugadorId?: string
  jugadorNombre?: string
  jornada?: number
}

const buildServerConds = (filters?: BocanaFilters): string[] => {
  const conds: string[] = []
  if (!filters) return conds
  if (filters.status) conds.push(eqString('Status', filters.status))
  if (filters.torneo) conds.push(eqString('Torneo', filters.torneo))
  if (typeof filters.jornada === 'number') conds.push(eqNumber('Jornada', filters.jornada))
  return conds
}

const matchesJugador = (record: Bocana, filters?: BocanaFilters): boolean => {
  if (!filters?.jugadorId && !filters?.jugadorNombre) return true
  const fields = (record.fields ?? {}) as Record<string, unknown>
  const targetName = (filters.jugadorNombre || '').toLowerCase()
  const targetId = filters.jugadorId || ''
  const values = Object.values(fields)
  const nameHit = targetName
    ? values.some(v => typeof v === 'string' && v.toLowerCase().includes(targetName))
    : false
  const idHit = targetId
    ? values.some(v =>
        Array.isArray(v) ? v.includes(targetId) : typeof v === 'string' && v.includes(targetId)
      )
    : false
  return (targetName ? nameHit : false) || (targetId ? idHit : false)
}

// Candidatos de campo Jugador para create/update. Airtable puede haber sido
// creado con distintos nombres; probamos en orden y cacheamos el ganador.
const JUGADOR_LINK_FIELDS = ['Jugador_ID', 'Jugador', 'Apostador', 'Apostador_ID'] as const
let resolvedJugadorField: string | null = null

export const bocanasApi = {
  getAll: async (filters?: BocanaFilters): Promise<Bocana[]> => {
    try {
      const params: Record<string, unknown> = { pageSize: 50 }
      const formula = and(buildServerConds(filters))
      if (formula) params.filterByFormula = formula
      logger.debug('bocanasApi.getAll filterByFormula:', formula)

      const records = await fetchAllWithPagination<Bocana>('/Bocanas', params, 1)
      return records.filter(r => matchesJugador(r, filters))
    } catch (error) {
      logger.error('Error obteniendo bocanas:', error)
      throw error
    }
  },

  getPage: async (
    filters?: BocanaFilters,
    offset?: string
  ): Promise<{ records: Bocana[]; offset?: string }> => {
    try {
      const params: Record<string, unknown> = {
        pageSize: 50,
        ...(offset ? { offset } : {}),
      }
      const formula = and(buildServerConds(filters))
      if (formula) params.filterByFormula = formula
      logger.debug('bocanasApi.getPage filterByFormula:', formula)

      const { data } = await api.get('/Bocanas', { params })
      const records: Bocana[] = (data.records || []).filter((r: Bocana) =>
        matchesJugador(r, filters)
      )
      return { records, offset: data.offset }
    } catch (error) {
      logger.error('Error obteniendo página de bocanas:', error)
      throw error
    }
  },

  create: async (
    data: Omit<Bocana['fields'], 'Ide' | 'creacion' | 'Modificado' | 'Jugador_Nombre'>
  ): Promise<Bocana> => {
    try {
      const parsed = BocanaCreateSchema.parse(data)
      const baseFields: Record<string, unknown> = {
        Jornada: parsed.Jornada,
        Tipo: parsed.Tipo,
        Status: parsed.Status,
        Torneo: parsed.Torneo,
        ...(parsed.Comida ? { Comida: parsed.Comida } : {}),
      }

      const fieldsToTry = resolvedJugadorField
        ? [resolvedJugadorField]
        : [...JUGADOR_LINK_FIELDS]

      let lastErr: unknown = null
      for (const linkField of fieldsToTry) {
        for (const variant of ['array', 'string'] as const) {
          const value = variant === 'array' ? [parsed.Jugador_ID] : parsed.Jugador_ID
          const fields = { ...baseFields, [linkField]: value }
          try {
            const { data: resp } = await api.post('/Bocanas', { records: [{ fields }] })
            resolvedJugadorField = linkField
            return resp.records[0]
          } catch (e) {
            const status = (e as { response?: { status?: number } })?.response?.status
            // Si falla con 422 y enviamos Comida, reintentar sin ella
            if (status === 422 && fields.Comida) {
              const { Comida: _omit, ...fieldsNoFood } = fields
              try {
                const { data: resp } = await api.post('/Bocanas', {
                  records: [{ fields: fieldsNoFood }],
                })
                resolvedJugadorField = linkField
                return resp.records[0]
              } catch (innerE) {
                lastErr = innerE
              }
            } else {
              lastErr = e
            }
            if (status !== 422) break
          }
        }
      }
      throw lastErr || new Error('No se pudo crear la bocana')
    } catch (error) {
      const detail = (error as { response?: { data?: unknown } })?.response?.data
      if (detail) logger.error('Error creando bocana (detalle Airtable):', detail)
      logger.error('Error creando bocana:', error)
      throw error
    }
  },

  update: async (id: string, data: Partial<Bocana['fields']>): Promise<Bocana> => {
    try {
      const parsed = BocanaUpdateSchema.parse(data)
      const fieldsCommon = { ...parsed }
      if (!parsed.Jugador_ID) {
        const { data: resp } = await api.patch('/Bocanas', {
          records: [{ id, fields: fieldsCommon }],
        })
        return resp.records[0]
      }

      const fieldsToTry = resolvedJugadorField
        ? [resolvedJugadorField]
        : [...JUGADOR_LINK_FIELDS]

      let lastErr: unknown = null
      for (const linkField of fieldsToTry) {
        for (const variant of ['array', 'string'] as const) {
          const value = variant === 'array' ? [parsed.Jugador_ID] : parsed.Jugador_ID
          const fields = { ...fieldsCommon, [linkField]: value }
          try {
            const { data: resp } = await api.patch('/Bocanas', {
              records: [{ id, fields }],
            })
            resolvedJugadorField = linkField
            return resp.records[0]
          } catch (e) {
            const status = (e as { response?: { status?: number } })?.response?.status
            lastErr = e
            if (status !== 422) break
          }
        }
      }
      throw lastErr || new Error('No se pudo actualizar la bocana')
    } catch (error) {
      logger.error('Error actualizando bocana:', error)
      throw error
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/Bocanas/${id}`)
    } catch (error) {
      logger.error('Error eliminando bocana:', error)
      throw error
    }
  },
}
