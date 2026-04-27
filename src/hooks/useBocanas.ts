import { useState, useEffect } from 'react';
import { Bocana, bocanasApi } from '../lib/airtable';
import { Torneo } from '../lib/torneos';
import { logger } from '../lib/logger';
import toast from 'react-hot-toast';

export interface UseBocanasFilters {
  status?: 'Pagada' | 'Pendiente'
  torneo?: Torneo
  jugadorId?: string
  jugadorNombre?: string
  jornada?: number
}

const matchesJugador = (record: Bocana, filters?: UseBocanasFilters): boolean => {
  if (!filters?.jugadorNombre && !filters?.jugadorId) return true
  const fields = (record.fields ?? {}) as Record<string, unknown>
  const targetName = (filters.jugadorNombre || '').toLowerCase()
  const targetId = filters.jugadorId || ''
  const values = Object.values(fields)
  const nameHit = targetName
    ? values.some(v => typeof v === 'string' && v.toLowerCase().includes(targetName))
    : false
  const idHit = targetId
    ? values.some(v => Array.isArray(v) ? v.includes(targetId) : (typeof v === 'string' && v.includes(targetId)))
    : false
  return (targetName ? nameHit : false) || (targetId ? idHit : false)
}

export const useBocanas = (filters?: UseBocanasFilters) => {
  const [bocanas, setBocanas] = useState<Bocana[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextOffset, setNextOffset] = useState<string | undefined>(undefined)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchBocanas = async () => {
    try {
      setLoading(true)
      setError(null)
      const page = await bocanasApi.getPage(filters)
      const records = page.records.filter(r => matchesJugador(r, filters))
      setBocanas(records)
      setNextOffset(page.offset)
    } catch (err) {
      const msg = 'Error cargando bocanas'
      setError(msg)
      toast.error(msg)
      logger.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!nextOffset) return
    try {
      setLoadingMore(true)
      const page = await bocanasApi.getPage(filters, nextOffset)
      const newRecords = (page.records || []).filter(r => matchesJugador(r, filters))
      setBocanas(prev => [...prev, ...newRecords])
      setNextOffset(page.offset)
    } catch (err) {
      toast.error('Error cargando más bocanas')
      logger.error(err)
    } finally {
      setLoadingMore(false)
    }
  }

  const crearBocana = async (
    data: Omit<Bocana['fields'], 'Ide' | 'creacion' | 'Modificado' | 'Jugador_Nombre'>
  ) => {
    try {
      const created = await bocanasApi.create(data)
      setBocanas(prev => [created, ...prev])
      toast.success('Bocana creada exitosamente')
      return created
    } catch (err) {
      toast.error('Error creando bocana')
      throw err
    }
  }

  const actualizarBocana = async (id: string, data: Partial<Bocana['fields']>) => {
    try {
      const updated = await bocanasApi.update(id, data)
      setBocanas(prev => prev.map(b => (b.id === id ? updated : b)))
      toast.success('Bocana actualizada')
      return updated
    } catch (err) {
      toast.error('Error actualizando bocana')
      throw err
    }
  }

  const eliminarBocana = async (id: string) => {
    try {
      await bocanasApi.delete(id)
      setBocanas(prev => prev.filter(b => b.id !== id))
      toast.success('Bocana eliminada')
    } catch (err) {
      toast.error('Error eliminando bocana')
      throw err
    }
  }

  useEffect(() => {
    fetchBocanas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.torneo, filters?.jugadorId, filters?.jugadorNombre, filters?.jornada])

  return {
    bocanas,
    loading,
    error,
    fetchBocanas,
    hasMore: Boolean(nextOffset),
    loadingMore,
    loadMore,
    crearBocana,
    actualizarBocana,
    eliminarBocana,
  }
}
