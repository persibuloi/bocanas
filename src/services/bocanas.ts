import { api, fetchAllWithPagination } from './api';
import { Bocana } from '../types';
import { BocanaCreateSchema, BocanaUpdateSchema } from '../schemas';
import { apostadoresApi } from './betting';

// API para Bocanas
export const bocanasApi = {
  // Obtener todas las bocanas con filtros
  getAll: async (filters?: { status?: 'Pagada' | 'Pendiente'; torneo?: 'X Empresarial' | 'XI Empresarial' | 'XII Empresarial'; jugadorId?: string; jugadorNombre?: string; jornada?: number }): Promise<Bocana[]> => {
    try {
      const params: Record<string, any> = {
        // evitar ordenar por un campo que podría variar de nombre en Airtable (Creación/creacion)
        // 'sort[0][field]': 'Creación',
        // 'sort[0][direction]': 'desc',
        pageSize: 50,
      }
      const commonConds: string[] = []
      let jugadorVariants: string[] = []
      if (filters) {
        if (filters.status) commonConds.push(`{Status} = '${filters.status}'`)
        if (filters.torneo) commonConds.push(`{Torneo} = '${filters.torneo}'`)
        if (typeof filters.jornada === 'number') commonConds.push(`{Jornada} = ${filters.jornada}`)
        if (filters.jugadorId || filters.jugadorNombre) {
          // Skipping server-side jugador filter; will filter 100% on client.
          try { console.debug('bocanasApi.getAll: skipping server-side jugador filter; applying on client only') } catch { /* empty */ }
          jugadorVariants = []
        }
      }

      // Si no hay filtro de jugador en servidor, traer datos y filtrar en cliente si corresponde
      if (!jugadorVariants.length) {
        const conds = commonConds
        if (conds.length) params.filterByFormula = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        try { console.debug('bocanasApi.getAll filterByFormula:', params.filterByFormula) } catch { /* empty */ }
        let records = await fetchAllWithPagination<Bocana>('/Bocanas', params, 1)
        if (filters?.jugadorId || filters?.jugadorNombre) {
          const targetName = (filters?.jugadorNombre || '').toLowerCase()
          const targetRec = filters?.jugadorId || ''
          records = records.filter(r => {
            const f: Record<string, any> = (r as any).fields || {}
            const values = Object.values(f)
            const nameHit = targetName ? values.some(v => typeof v === 'string' && v.toLowerCase().includes(targetName)) : false
            const idHit = targetRec ? values.some(v => Array.isArray(v) ? v.includes(targetRec) : (typeof v === 'string' && v.includes(targetRec))) : false
            return (targetName ? nameHit : false) || (targetRec ? idHit : false)
          })
        }
        return records
      }

      // Probar variantes de jugador secuencialmente para evitar 422 por campos inexistentes
      let lastErr: any = null
      for (const j of jugadorVariants) {
        const conds = [...commonConds, j]
        const filter = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        const p = { ...params, filterByFormula: filter }
        try { console.debug('bocanasApi.getAll filterByFormula (try):', filter) } catch { /* empty */ }
        try {
          let records = await fetchAllWithPagination<Bocana>('/Bocanas', p)
          // Aplicar filtro local adicional si hay filtro de jugador
          if (filters?.jugadorId || filters?.jugadorNombre) {
            let name = (filters?.jugadorNombre || '').toLowerCase()
            if (!name && filters?.jugadorId) {
              try { const ap = await apostadoresApi.getById(filters.jugadorId); name = (ap?.fields?.Nombre || '').toLowerCase() } catch { /* empty */ }
            }
            if (name) {
              records = records.filter(r => String((r.fields as any)?.Jugador_Nombre || '').toLowerCase().includes(name))
            }
          }
          return records
        } catch (e: any) {
          lastErr = e
          if (e?.response?.status === 422) {
            // probar siguiente variante
            continue
          }
          // otros errores: propagar
          throw e
        }
      }
      // si ninguna variante funciona (posibles campos no existen), intentar sin filtro de jugador
      try {
        const conds = commonConds
        if (conds.length) params.filterByFormula = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        try { console.debug('bocanasApi.getAll filterByFormula (fallback sin jugador):', params.filterByFormula) } catch { /* empty */ }
        let records = await fetchAllWithPagination<Bocana>('/Bocanas', params, 1)
        // Filtro local por jugador si venía solicitado
        if (filters?.jugadorId || filters?.jugadorNombre) {
          const rec = filters?.jugadorId || ''
          const name = (filters?.jugadorNombre || '').toLowerCase()
          records = records.filter(r => {
            const f = r.fields as any
            const idMatch = rec && (f?.Jugador_ID === rec || String(f?.Jugador)?.includes(rec))
            const nameMatch = name && (
              String(f?.Jugador_Nombre || '').toLowerCase().includes(name) ||
              String(f?.Apostador_Nombre || '').toLowerCase().includes(name) ||
              String(f?.Nombre || '').toLowerCase().includes(name)
            )
            return (rec ? idMatch : false) || (name ? nameMatch : false)
          })
        }
        return records
      } catch (e) {
        throw lastErr || e
      }
    } catch (error) {
      console.error('Error obteniendo bocanas:', error)
      throw error
    }
  },

  // Obtener una página con offset para "Cargar más"
  getPage: async (filters?: { status?: 'Pagada' | 'Pendiente'; torneo?: 'X Empresarial' | 'XI Empresarial' | 'XII Empresarial'; jugadorId?: string; jugadorNombre?: string; jornada?: number }, offset?: string): Promise<{ records: Bocana[]; offset?: string }> => {
    try {
      const params: Record<string, any> = {
        // 'sort[0][field]': 'Creación',
        // 'sort[0][direction]': 'desc',
        pageSize: 50,
        ...(offset ? { offset } : {}),
      }
      const commonConds: string[] = []
      let jugadorVariants: string[] = []
      if (filters) {
        if (filters.status) commonConds.push(`{Status} = '${filters.status}'`)
        if (filters.torneo) commonConds.push(`{Torneo} = '${filters.torneo}'`)
        if (typeof filters.jornada === 'number') commonConds.push(`{Jornada} = ${filters.jornada}`)
        if (filters.jugadorId || filters.jugadorNombre) {
          // Skipping server-side jugador filter; will filter 100% on client.
          try { console.debug('bocanasApi.getPage: skipping server-side jugador filter; applying on client only') } catch { /* empty */ }
          jugadorVariants = []
        }
      }

      // Sin filtro de jugador en servidor: traer y filtrar localmente si aplica
      if (!jugadorVariants.length) {
        const conds = commonConds
        if (conds.length) params.filterByFormula = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        try { console.debug('bocanasApi.getPage filterByFormula:', params.filterByFormula) } catch { /* empty */ }
        const { data } = await api.get('/Bocanas', { params })
        let recs: Bocana[] = data.records || []
        if (filters?.jugadorId || filters?.jugadorNombre) {
          const targetName = (filters?.jugadorNombre || '').toLowerCase()
          const targetRec = filters?.jugadorId || ''
          recs = recs.filter(r => {
            const f: Record<string, any> = (r as any).fields || {}
            const values = Object.values(f)
            const nameHit = targetName ? values.some(v => typeof v === 'string' && v.toLowerCase().includes(targetName)) : false
            const idHit = targetRec ? values.some(v => Array.isArray(v) ? v.includes(targetRec) : (typeof v === 'string' && v.includes(targetRec))) : false
            return (targetName ? nameHit : false) || (targetRec ? idHit : false)
          })
        }
        return { records: recs, offset: data.offset }
      }

      // Con filtro de jugador: probar variantes en secuencia
      let lastErr: any = null
      for (const j of jugadorVariants) {
        const conds = [...commonConds, j]
        const filter = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        const p = { ...params, filterByFormula: filter }
        try { console.debug('bocanasApi.getPage filterByFormula (try):', filter) } catch { /* empty */ }
        try {
          const { data } = await api.get('/Bocanas', { params: p })
          let pageRecords: Bocana[] = data.records || []
          try {
            const keys = Array.from(new Set((pageRecords || []).slice(0, 5).flatMap(r => Object.keys((r as any).fields || {}))))
            console.debug('bocanasApi.getPage sample field keys:', keys)
          } catch { /* empty */ }
          // Si vino filtro por jugador y no se encontró nada, reintentar sin jugador y filtrar en cliente
          if ((filters?.jugadorId || filters?.jugadorNombre) && (!pageRecords || pageRecords.length === 0)) {
            try {
              const condsNoJugador = commonConds
              const p2 = { ...params }
              if (condsNoJugador.length) (p2 as any).filterByFormula = condsNoJugador.length === 1 ? condsNoJugador[0] : `AND(${condsNoJugador.join(', ')})`
              try { console.debug('bocanasApi.getPage zero-result retry without jugador. filterByFormula:', (p2 as any).filterByFormula) } catch { /* empty */ }
              const { data: d2 } = await api.get('/Bocanas', { params: p2 })
              pageRecords = d2.records || []
            } catch { /* empty */ }
          }
          if (filters?.jugadorId || filters?.jugadorNombre) {
            let name = (filters?.jugadorNombre || '').toLowerCase()
            if (!name && filters?.jugadorId) {
              try { const ap = await apostadoresApi.getById(filters.jugadorId); name = (ap?.fields?.Nombre || '').toLowerCase() } catch { /* empty */ }
            }
            if (name) {
              pageRecords = pageRecords.filter(r => String((r.fields as any)?.Jugador_Nombre || '').toLowerCase().includes(name))
            }
          }
          return { records: pageRecords, offset: data.offset }
        } catch (e: any) {
          lastErr = e
          if (e?.response?.status === 422) {
            continue
          }
          throw e
        }
      }
      // Fallback: sin jugador para no romper la vista
      try {
        const conds = commonConds
        if (conds.length) params.filterByFormula = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        try { console.debug('bocanasApi.getPage filterByFormula (fallback sin jugador):', params.filterByFormula) } catch { /* empty */ }
        const { data } = await api.get('/Bocanas', { params })
        let pageRecords: Bocana[] = data.records || []
        try {
          const keys = Array.from(new Set((pageRecords || []).slice(0, 5).flatMap(r => Object.keys((r as any).fields || {}))))
          console.debug('bocanasApi.getPage sample field keys (fallback):', keys)
        } catch { /* empty */ }
        if (filters?.jugadorId || filters?.jugadorNombre) {
          let name = (filters?.jugadorNombre || '').toLowerCase()
          if (!name && filters?.jugadorId) {
            try { const ap = await apostadoresApi.getById(filters.jugadorId); name = (ap?.fields?.Nombre || '').toLowerCase() } catch { /* empty */ }
          }
          if (name) {
            pageRecords = pageRecords.filter(r => String((r.fields as any)?.Jugador_Nombre || '').toLowerCase().includes(name))
          }
        }
        return { records: pageRecords, offset: data.offset }
      } catch (e) {
        throw lastErr || e
      }
    } catch (error) {
      console.error('Error obteniendo página de bocanas:', error)
      throw error
    }
  },

  // Crear bocana
  create: async (data: Omit<Bocana['fields'], 'Ide' | 'creacion' | 'Modificado' | 'Jugador_Nombre'>): Promise<Bocana> => {
    try {
      const parsed = BocanaCreateSchema.parse(data)
      const baseFields: any = {
        // campos comunes
        Jornada: parsed.Jornada,
        Tipo: parsed.Tipo,
        Status: parsed.Status,
        Torneo: parsed.Torneo,
        // NO enviar Comida si no viene en creación
        ...(parsed.Comida ? { Comida: parsed.Comida } : {}),
      }
      const linkFieldCandidates = ['Jugador_ID', 'Jugador']
      let lastErr: any = null
      for (const linkField of linkFieldCandidates) {
        // 1) intentar como arreglo de IDs (link-to-record)
        for (const variant of ['array', 'string'] as const) {
          const value = variant === 'array' ? [parsed.Jugador_ID] : parsed.Jugador_ID
          const fields = { ...baseFields, [linkField]: value as any }
          try {
            try { console.debug('bocanas.create try fields:', { linkField, variant, fields }) } catch { /* empty */ }
            const { data: resp } = await api.post('/Bocanas', { records: [{ fields }] })
            return resp.records[0]
          } catch (e: any) {
            lastErr = e
            if (!(e?.response?.status === 422)) break
            // seguir con siguiente variante o siguiente campo
            continue
          }
        }
      }
      throw lastErr || new Error('No se pudo crear la bocana')
    } catch (error) {
      if ((error as any)?.response?.data) {
        console.error('Error creando bocana (detalle Airtable):', JSON.stringify((error as any).response.data, null, 2))
      }
      console.error('Error creando bocana:', error)
      throw error
    }
  },

  // Actualizar bocana
  update: async (id: string, data: Partial<Bocana['fields']>): Promise<Bocana> => {
    try {
      const parsed = BocanaUpdateSchema.parse(data)
      // Campos comunes para update (sin Jugador_Nombre; es computado en la base)
      const fieldsCommon: any = { ...parsed }
      // Si no se está cambiando el jugador, un solo patch
      if (!parsed.Jugador_ID) {
        const { data: resp } = await api.patch('/Bocanas', { records: [{ id, fields: fieldsCommon }] })
        return resp.records[0]
      }
      // Si cambia Jugador, intentar con ambos nombres de campo y variaciones
      const linkFieldCandidatesU = ['Jugador_ID', 'Jugador']
      let lastErrU: any = null
      for (const linkField of linkFieldCandidatesU) {
        for (const variant of ['array', 'string'] as const) {
          const value = variant === 'array' ? [parsed.Jugador_ID] : parsed.Jugador_ID
          const fields = { ...fieldsCommon, [linkField]: value as any }
          try {
            try { console.debug('bocanas.update try fields:', { linkField, variant, fields }) } catch { /* empty */ }
            const { data: resp } = await api.patch('/Bocanas', { records: [{ id, fields }] })
            return resp.records[0]
          } catch (e: any) {
            lastErrU = e
            if (!(e?.response?.status === 422)) break
            continue
          }
        }
      }
      throw lastErrU || new Error('No se pudo actualizar la bocana')
    } catch (error) {
      console.error('Error actualizando bocana:', error)
      throw error
    }
  },

  // Eliminar bocana
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/Bocanas/${id}`)
    } catch (error) {
      console.error('Error eliminando bocana:', error)
      throw error
    }
  },
}
