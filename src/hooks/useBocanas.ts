import { useState, useEffect } from 'react';
import { Bocana, bocanasApi } from '../lib/airtable';
import toast from 'react-hot-toast';

export interface UseBocanasFilters {
  status?: 'Pagada' | 'Pendiente'
  torneo?: 'X Empresarial' | 'XI Empresarial' | 'XII Empresarial'
  jugadorId?: string
  jugadorNombre?: string
  jornada?: number
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
      try { console.debug('useBocanas.fetchBocanas page size:', page.records?.length, 'nextOffset:', page.offset, 'filters:', filters) } catch {}
      let records = page.records
      // Filtro local robusto por jugador
      if (filters?.jugadorNombre || filters?.jugadorId) {
        const targetName = (filters?.jugadorNombre || '').toLowerCase()
        const targetRec = filters?.jugadorId || ''
        try { console.debug('useBocanas.fetchBocanas applying local filters:', { targetName, targetRec }) } catch {}
        records = records.filter(r => {
          const f: Record<string, any> = r.fields as any
          const values = Object.values(f)
          const nameHit = targetName
            ? values.some(v => typeof v === 'string' && v.toLowerCase().includes(targetName))
            : false
          const idHit = targetRec
            ? values.some(v => Array.isArray(v) ? v.includes(targetRec) : (typeof v === 'string' && v.includes(targetRec)))
            : false
          return (targetName ? nameHit : false) || (targetRec ? idHit : false)
        })
        try { console.debug('useBocanas.fetchBocanas after local filter size:', records.length) } catch {}
      }
      setBocanas(records)
      setNextOffset(page.offset)
    } catch (err) {
      const msg = 'Error cargando bocanas'
      setError(msg)
      toast.error(msg)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!nextOffset) return
    try {
      setLoadingMore(true)
      const page = await bocanasApi.getPage(filters, nextOffset)
      try { console.debug('useBocanas.loadMore fetched size:', page.records?.length, 'newOffset:', page.offset) } catch {}
      let newRecords = page.records || []
      if (filters?.jugadorNombre || filters?.jugadorId) {
        const targetName = (filters?.jugadorNombre || '').toLowerCase()
        const targetRec = filters?.jugadorId || ''
        try { console.debug('useBocanas.loadMore applying local filters:', { targetName, targetRec }) } catch {}
        newRecords = newRecords.filter(r => {
          const f: Record<string, any> = r.fields as any
          const values = Object.values(f)
          const nameHit = targetName
            ? values.some(v => typeof v === 'string' && v.toLowerCase().includes(targetName))
            : false
          const idHit = targetRec
            ? values.some(v => Array.isArray(v) ? v.includes(targetRec) : (typeof v === 'string' && v.includes(targetRec)))
            : false
          return (targetName ? nameHit : false) || (targetRec ? idHit : false)
        })
        try { console.debug('useBocanas.loadMore after local filter size:', newRecords.length) } catch {}
      }
      setBocanas(prev => [...prev, ...newRecords])
      setNextOffset(page.offset)
    } catch (err) {
      toast.error('Error cargando más bocanas')
      console.error(err)
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
