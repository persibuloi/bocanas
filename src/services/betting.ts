import { api, fetchAllWithPagination } from './api';
import { Apostador, Apuesta } from '../types';
import { ApostadorCreateSchema, ApostadorUpdateSchema, ApuestaCreateSchema, ApuestaUpdateSchema } from '../schemas';

// Cache configuration
let apostadoresCache: { data: Apostador[]; ts: number } | null = null
let apostadoresInFlight: Promise<Apostador[]> | null = null
const APOSTADORES_TTL_MS = 60_000 // 1 minute

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
