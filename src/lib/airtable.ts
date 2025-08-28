import axios from 'axios';
import { z } from 'zod';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  throw new Error(
    'Faltan variables de entorno de Airtable. Define VITE_AIRTABLE_API_KEY y VITE_AIRTABLE_BASE_ID en tu .env'
  );
}

// Tipos para Bocanas (penalidades de comida)
export interface Bocana {
  id: string
  fields: {
    Jugador_ID: string
    Jugador_Nombre?: string
    Jornada: number
    Tipo: 'Promedio' | 'Canal' | 'Strike' | 'Menor a 140' | 'Menor a 100'
    Status: 'Pagada' | 'Pendiente'
    Torneo: 'X Empresarial' | 'XI Empresarial' | 'XII Empresarial'
    Comida?: 'Boneless' | 'Pizza' | 'Churrasco Bocas' | 'Paninni Churrasco' | 'Quesadilla'
    Ide?: number
    creacion?: string
    Modificado?: string
  }
}

// Zod para Bocanas
const BocanaCreateSchema = z.object({
  Jugador_ID: z.string().min(1),
  Jornada: z.number().int().nonnegative(),
  Tipo: z.enum(['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100']),
  Status: z.enum(['Pagada', 'Pendiente']).default('Pendiente'),
  Torneo: z.enum(['X Empresarial', 'XI Empresarial', 'XII Empresarial']),
  Comida: z.enum(['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla']).optional(),
})

const BocanaUpdateSchema = z.object({
  Jugador_ID: z.string().optional(),
  Jugador_Nombre: z.string().optional(),
  Jornada: z.number().int().nonnegative().optional(),
  Tipo: z.enum(['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100']).optional(),
  Status: z.enum(['Pagada', 'Pendiente']).optional(),
  Torneo: z.enum(['X Empresarial', 'XI Empresarial', 'XII Empresarial']).optional(),
  Comida: z.enum(['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla']).optional(),
}).partial()

// Helper: recalcular totales del apostador a partir de sus apuestas
async function recalculateApostadorTotals(apostadorId: string): Promise<void> {
  // obtener todas las apuestas de ese apostador
  const bets = await apuestasApi.getAll({ apostadorId })
  const totalApostado = bets.reduce((s, b) => s + (b.fields.Monto || 0), 0)
  // total ganado: solo ganancias reales positivas o estado Ganada
  const totalGanado = bets
    .filter(b => b.fields.Estado === 'Ganada' && typeof b.fields.Ganancia_Real === 'number')
    .reduce((s, b) => s + (b.fields.Ganancia_Real || 0), 0)
  const balance = totalGanado - totalApostado
  await apostadoresApi.update(apostadorId, {
    Total_Apostado: Number(totalApostado.toFixed(2)),
    Total_Ganado: Number(totalGanado.toFixed(2)),
    Balance: Number(balance.toFixed(2)),
  })
}

// Zod Schemas
const ApostadorCreateSchema = z.object({
  Nombre: z.string().min(1, 'Nombre es requerido'),
  Email: z.string().email().optional(),
  Telefono: z.string().optional(),
  Activo: z.boolean(),
});

const ApostadorUpdateSchema = z.object({
  Nombre: z.string().min(1).optional(),
  Email: z.string().email().optional(),
  Telefono: z.string().optional(),
  Activo: z.boolean().optional(),
  Fecha_Registro: z.string().optional(),
  Total_Apostado: z.number().optional(),
  Total_Ganado: z.number().optional(),
  Balance: z.number().optional(),
}).partial();

const ApuestaCreateSchema = z.object({
  Apostador_ID: z.string().min(1, 'Apostador_ID es requerido'),
  Torneo: z.string().min(1, 'Torneo es requerido'),
  Tipo_Apuesta: z.string().min(1, 'Tipo_Apuesta es requerido'),
  Descripcion: z.string().optional(),
  Monto: z.number().finite().nonnegative(),
  Odds: z.number().finite().positive(),
  Resultado_Esperado: z.string().optional(),
  Estado: z.enum(['Pendiente', 'Ganada', 'Perdida']).default('Pendiente'),
});

const ApuestaUpdateSchema = z.object({
  Apostador_ID: z.string().optional(),
  Apostador_Nombre: z.string().optional(),
  Torneo: z.string().optional(),
  Tipo_Apuesta: z.string().optional(),
  Descripcion: z.string().optional(),
  Monto: z.number().finite().nonnegative().optional(),
  Odds: z.number().finite().positive().optional(),
  Resultado_Esperado: z.string().optional(),
  Estado: z.enum(['Pendiente', 'Ganada', 'Perdida']).optional(),
  Fecha_Creacion: z.string().optional(),
  Fecha_Resolucion: z.string().optional(),
  Ganancia_Potencial: z.number().optional(),
  Ganancia_Real: z.number().optional(),
}).partial();

const api = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Simple cache and request de-dup for endpoints prone to 429
let apostadoresCache: { data: Apostador[]; ts: number } | null = null
let apostadoresInFlight: Promise<Apostador[]> | null = null
const APOSTADORES_TTL_MS = 60_000 // 1 minute

// Helper: paginación y reintentos para Airtable
async function fetchAllWithPagination<T = any>(
  path: string,
  params: Record<string, any> = {},
  maxPages = Infinity,
  maxRetries = 3
): Promise<T[]> {
  let results: T[] = []
  let offset: string | undefined = undefined
  let pageCount = 0

  do {
    const query = { ...params, ...(offset ? { offset } : {}) }
    let attempt = 0
    // Reintentos con backoff para 429
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const { data } = await api.get(path, { params: query })
        results = results.concat(data.records || [])
        offset = data.offset
        pageCount++
        break
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 429 && attempt < maxRetries) {
          // Respetar Retry-After si existe
          const h = err?.response?.headers || {}
          const retryAfterSec = Number(h['retry-after'] || h['Retry-After'] || h['x-ratelimit-reset'] || 0)
          const headerWaitMs = isNaN(retryAfterSec) ? 0 : Math.max(0, retryAfterSec * 1000)
          // Exponential backoff con jitter
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000)
          const jitter = Math.floor(Math.random() * 250)
          const wait = Math.max(headerWaitMs, backoffMs + jitter)
          await new Promise(res => setTimeout(res, wait))
          attempt++
          continue
        }
        throw err
      }
    }
  } while (offset && pageCount < maxPages)

  return results
}

// Tipos para TypeScript
export interface Apostador {
  id: string;
  fields: {
    Nombre: string;
    Email?: string;
    Telefono?: string;
    Activo: boolean;
    Fecha_Registro: string;
    Total_Apostado: number;
    Total_Ganado: number;
    Balance: number;
  };
}

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
      let commonConds: string[] = []
      let jugadorVariants: string[] = []
      if (filters) {
        if (filters.status) commonConds.push(`{Status} = '${filters.status}'`)
        if (filters.torneo) commonConds.push(`{Torneo} = '${filters.torneo}'`)
        if (typeof filters.jornada === 'number') commonConds.push(`{Jornada} = ${filters.jornada}`)
        if (filters.jugadorId || filters.jugadorNombre) {
          // Skipping server-side jugador filter; will filter 100% on client.
          try { console.debug('bocanasApi.getAll: skipping server-side jugador filter; applying on client only') } catch {}
          jugadorVariants = []
        }
      }

      // Si no hay filtro de jugador en servidor, traer datos y filtrar en cliente si corresponde
      if (!jugadorVariants.length) {
        const conds = commonConds
        if (conds.length) params.filterByFormula = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        try { console.debug('bocanasApi.getAll filterByFormula:', params.filterByFormula) } catch {}
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
        try { console.debug('bocanasApi.getAll filterByFormula (try):', filter) } catch {}
        try {
          let records = await fetchAllWithPagination<Bocana>('/Bocanas', p)
          // Aplicar filtro local adicional si hay filtro de jugador
          if (filters?.jugadorId || filters?.jugadorNombre) {
            let name = (filters?.jugadorNombre || '').toLowerCase()
            if (!name && filters?.jugadorId) {
              try { const ap = await apostadoresApi.getById(filters.jugadorId); name = (ap?.fields?.Nombre || '').toLowerCase() } catch {}
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
        try { console.debug('bocanasApi.getAll filterByFormula (fallback sin jugador):', params.filterByFormula) } catch {}
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
      let commonConds: string[] = []
      let jugadorVariants: string[] = []
      if (filters) {
        if (filters.status) commonConds.push(`{Status} = '${filters.status}'`)
        if (filters.torneo) commonConds.push(`{Torneo} = '${filters.torneo}'`)
        if (typeof filters.jornada === 'number') commonConds.push(`{Jornada} = ${filters.jornada}`)
        if (filters.jugadorId || filters.jugadorNombre) {
          // Skipping server-side jugador filter; will filter 100% on client.
          try { console.debug('bocanasApi.getPage: skipping server-side jugador filter; applying on client only') } catch {}
          jugadorVariants = []
        }
      }

      // Sin filtro de jugador en servidor: traer y filtrar localmente si aplica
      if (!jugadorVariants.length) {
        const conds = commonConds
        if (conds.length) params.filterByFormula = conds.length === 1 ? conds[0] : `AND(${conds.join(', ')})`
        try { console.debug('bocanasApi.getPage filterByFormula:', params.filterByFormula) } catch {}
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
        try { console.debug('bocanasApi.getPage filterByFormula (try):', filter) } catch {}
        try {
          const { data } = await api.get('/Bocanas', { params: p })
          let pageRecords: Bocana[] = data.records || []
          try {
            const keys = Array.from(new Set((pageRecords || []).slice(0, 5).flatMap(r => Object.keys((r as any).fields || {}))))
            console.debug('bocanasApi.getPage sample field keys:', keys)
          } catch {}
          // Si vino filtro por jugador y no se encontró nada, reintentar sin jugador y filtrar en cliente
          if ((filters?.jugadorId || filters?.jugadorNombre) && (!pageRecords || pageRecords.length === 0)) {
            try {
              const condsNoJugador = commonConds
              const p2 = { ...params }
              if (condsNoJugador.length) (p2 as any).filterByFormula = condsNoJugador.length === 1 ? condsNoJugador[0] : `AND(${condsNoJugador.join(', ')})`
              try { console.debug('bocanasApi.getPage zero-result retry without jugador. filterByFormula:', (p2 as any).filterByFormula) } catch {}
              const { data: d2 } = await api.get('/Bocanas', { params: p2 })
              pageRecords = d2.records || []
            } catch {}
          }
          if (filters?.jugadorId || filters?.jugadorNombre) {
            let name = (filters?.jugadorNombre || '').toLowerCase()
            if (!name && filters?.jugadorId) {
              try { const ap = await apostadoresApi.getById(filters.jugadorId); name = (ap?.fields?.Nombre || '').toLowerCase() } catch {}
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
        try { console.debug('bocanasApi.getPage filterByFormula (fallback sin jugador):', params.filterByFormula) } catch {}
        const { data } = await api.get('/Bocanas', { params })
        let pageRecords: Bocana[] = data.records || []
        try {
          const keys = Array.from(new Set((pageRecords || []).slice(0, 5).flatMap(r => Object.keys((r as any).fields || {}))))
          console.debug('bocanasApi.getPage sample field keys (fallback):', keys)
        } catch {}
        if (filters?.jugadorId || filters?.jugadorNombre) {
          let name = (filters?.jugadorNombre || '').toLowerCase()
          if (!name && filters?.jugadorId) {
            try { const ap = await apostadoresApi.getById(filters.jugadorId); name = (ap?.fields?.Nombre || '').toLowerCase() } catch {}
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
            try { console.debug('bocanas.create try fields:', { linkField, variant, fields }) } catch {}
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
            try { console.debug('bocanas.update try fields:', { linkField, variant, fields }) } catch {}
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

export interface Apuesta {
  id: string;
  fields: {
    Apostador_ID: string;
    Apostador_Nombre?: string;
    Torneo: string;
    Tipo_Apuesta: string;
    Descripcion?: string;
    Monto: number;
    Odds: number;
    Resultado_Esperado?: string;
    Estado: 'Pendiente' | 'Ganada' | 'Perdida';
    Fecha_Creacion: string;
    Fecha_Resolucion?: string;
    Ganancia_Potencial: number;
    Ganancia_Real: number;
  };
}

// API para Apostadores
export const apostadoresApi = {
  // Obtener todos los apostadores
  getAll: async (): Promise<Apostador[]> => {
    try {
      const now = Date.now()
      // 1) Serve from cache if fresh
      if (apostadoresCache && now - apostadoresCache.ts < APOSTADORES_TTL_MS) {
        return apostadoresCache.data
      }
      // 2) If there is an in-flight request, await it instead of firing a new one
      if (apostadoresInFlight) {
        return apostadoresInFlight
      }
      // 3) Issue a single request and cache result
      apostadoresInFlight = (async () => {
        try {
          const records = await fetchAllWithPagination<Apostador>('/Apostadores', {
            'sort[0][field]': 'Nombre',
            'sort[0][direction]': 'asc',
            // be kind to rate limits
            pageSize: 50,
          }, 1)
          apostadoresCache = { data: records, ts: Date.now() }
          return records
        } finally {
          apostadoresInFlight = null
        }
      })()
      return await apostadoresInFlight
    } catch (error) {
      console.error('Error obteniendo apostadores:', error);
      throw error;
    }
  },

  // Obtener un apostador por ID de registro
  getById: async (id: string): Promise<Apostador> => {
    try {
      const { data } = await api.get(`/Apostadores/${id}`)
      return data
    } catch (error) {
      console.error('Error obteniendo apostador por id:', error)
      throw error
    }
  },

  // Crear nuevo apostador
  create: async (data: Omit<Apostador['fields'], 'Fecha_Registro' | 'Total_Apostado' | 'Total_Ganado' | 'Balance'>): Promise<Apostador> => {
    try {
      const parsed = ApostadorCreateSchema.parse(data)
      const response = await api.post('/Apostadores', {
        records: [{
          fields: {
            ...parsed,
            Fecha_Registro: new Date().toISOString().split('T')[0],
            Total_Apostado: 0,
            Total_Ganado: 0,
            Balance: 0,
          }
        }]
      });
      return response.data.records[0];
    } catch (error) {
      console.error('Error creando apostador:', error);
      throw error;
    }
  },

  // Actualizar apostador
  update: async (id: string, data: Partial<Apostador['fields']>): Promise<Apostador> => {
    try {
      const parsed = ApostadorUpdateSchema.parse(data)
      const response = await api.patch('/Apostadores', {
        records: [{
          id,
          fields: parsed
        }]
      });
      return response.data.records[0];
    } catch (error) {
      console.error('Error actualizando apostador:', error);
      throw error;
    }
  },

  // Eliminar apostador
  delete: async (id: string): Promise<void> => {
    try {
      // Bloquear si tiene apuestas asociadas
      const bets = await apuestasApi.getAll({ apostadorId: id })
      if (bets.length > 0) {
        const err = new Error('No se puede eliminar el apostador porque tiene apuestas asociadas. Elimina o reasigna esas apuestas primero.')
        ;(err as any).code = 'APOSTADOR_HAS_BETS'
        throw err
      }
      await api.delete(`/Apostadores/${id}`);
    } catch (error) {
      console.error('Error eliminando apostador:', error);
      throw error;
    }
  },
};

// API para Apuestas
export const apuestasApi = {
  // Obtener apuesta por id
  getById: async (id: string): Promise<Apuesta> => {
    try {
      const { data } = await api.get(`/Apuestas/${id}`)
      return data
    } catch (error) {
      console.error('Error obteniendo apuesta por id:', error)
      throw error
    }
  },
  // Obtener todas las apuestas
  getAll: async (filters?: { estado?: string; apostadorId?: string }): Promise<Apuesta[]> => {
    try {
      const params: Record<string, any> = {
        'sort[0][field]': 'Fecha_Creacion',
        'sort[0][direction]': 'desc',
      }

      if (filters) {
        const filterConditions: string[] = []
        if (filters.estado) {
          filterConditions.push(`{Estado} = '${filters.estado}'`)
        }
        if (filters.apostadorId) {
          filterConditions.push(`{Apostador_ID} = '${filters.apostadorId}'`)
        }
        if (filterConditions.length > 0) {
          const filterFormula = filterConditions.length === 1
            ? filterConditions[0]
            : `AND(${filterConditions.join(', ')})`
          params.filterByFormula = filterFormula
        }
      }

      const records = await fetchAllWithPagination<Apuesta>('/Apuestas', params)
      return records
    } catch (error) {
      console.error('Error obteniendo apuestas:', error);
      throw error;
    }
  },

  // Crear nueva apuesta
  create: async (data: Omit<Apuesta['fields'], 'Fecha_Creacion' | 'Ganancia_Potencial' | 'Ganancia_Real' | 'Apostador_Nombre'>): Promise<Apuesta> => {
    try {
      const parsed = ApuestaCreateSchema.parse(data)
      const ganancia_potencial = parsed.Monto * parsed.Odds;
      let apostadorNombre: string | undefined = undefined
      if (parsed.Apostador_ID) {
        try {
          const ap = await apostadoresApi.getById(parsed.Apostador_ID)
          apostadorNombre = ap?.fields?.Nombre
        } catch (e) {
          // si falla, seguimos sin el nombre
        }
      }
      
      const response = await api.post('/Apuestas', {
        records: [{
          fields: {
            ...parsed,
            Fecha_Creacion: new Date().toISOString(),
            Ganancia_Potencial: ganancia_potencial,
            Ganancia_Real: 0,
            ...(apostadorNombre ? { Apostador_Nombre: apostadorNombre } : {}),
          }
        }]
      });
      const created = response.data.records[0] as Apuesta
      // recalcular totales del apostador
      await recalculateApostadorTotals(parsed.Apostador_ID)
      return created;
    } catch (error) {
      console.error('Error creando apuesta:', error);
      throw error;
    }
  },

  // Actualizar apuesta
  update: async (id: string, data: Partial<Apuesta['fields']>): Promise<Apuesta> => {
    try {
      const existing = await apuestasApi.getById(id)
      // Calcular ganancia real automáticamente
      const parsed = ApuestaUpdateSchema.parse(data)
      const updateData: Partial<Apuesta['fields']> = { ...parsed };
      // si cambia el Apostador_ID, rellenar nombre
      if (parsed.Apostador_ID) {
        try {
          const ap = await apostadoresApi.getById(parsed.Apostador_ID)
          updateData.Apostador_Nombre = ap?.fields?.Nombre
        } catch (e) {
          // ignorar
        }
      }
      
      if (parsed.Estado === 'Ganada' && parsed.Monto && parsed.Odds) {
        updateData.Ganancia_Real = parsed.Monto * parsed.Odds;
        updateData.Fecha_Resolucion = new Date().toISOString();
      } else if (parsed.Estado === 'Perdida' && parsed.Monto) {
        updateData.Ganancia_Real = -parsed.Monto;
        updateData.Fecha_Resolucion = new Date().toISOString();
      }
      
      const response = await api.patch('/Apuestas', {
        records: [{
          id,
          fields: updateData
        }]
      });
      const updated = response.data.records[0] as Apuesta
      // Recalcular totales: viejo y, si cambió, nuevo apostador
      const oldApostadorId = existing.fields.Apostador_ID
      const newApostadorId = parsed.Apostador_ID || oldApostadorId
      await recalculateApostadorTotals(oldApostadorId)
      if (newApostadorId !== oldApostadorId) {
        await recalculateApostadorTotals(newApostadorId)
      }
      return updated;
    } catch (error) {
      console.error('Error actualizando apuesta:', error);
      throw error;
    }
  },

  // Eliminar apuesta
  delete: async (id: string): Promise<void> => {
    try {
      const existing = await apuestasApi.getById(id)
      await api.delete(`/Apuestas/${id}`);
      await recalculateApostadorTotals(existing.fields.Apostador_ID)
    } catch (error) {
      console.error('Error eliminando apuesta:', error);
      throw error;
    }
  },
};

// Función para obtener estadísticas
export const getEstadisticas = async () => {
  try {
    const [apostadores, apuestas] = await Promise.all([
      apostadoresApi.getAll(),
      apuestasApi.getAll()
    ]);
    
    const stats = {
      total_apostadores: apostadores.length,
      apostadores_activos: apostadores.filter(a => a.fields.Activo).length,
      total_apuestas: apuestas.length,
      apuestas_pendientes: apuestas.filter(a => a.fields.Estado === 'Pendiente').length,
      apuestas_ganadas: apuestas.filter(a => a.fields.Estado === 'Ganada').length,
      apuestas_perdidas: apuestas.filter(a => a.fields.Estado === 'Perdida').length,
      monto_total_apostado: apuestas.reduce((sum, bet) => sum + (bet.fields.Monto || 0), 0),
      monto_pendiente: apuestas
        .filter(a => a.fields.Estado === 'Pendiente')
        .reduce((sum, bet) => sum + (bet.fields.Monto || 0), 0),
      ganancia_potencial_pendiente: apuestas
        .filter(a => a.fields.Estado === 'Pendiente')
        .reduce((sum, bet) => sum + (bet.fields.Ganancia_Potencial || 0), 0),
      ganancia_real_total: apuestas.reduce((sum, bet) => sum + (bet.fields.Ganancia_Real || 0), 0),
    };
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};

export default api;