import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Search, SlidersHorizontal, Utensils, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBocanas } from '../hooks/useBocanas'
import { useApostadores } from '../hooks/useApostadores'
import { useExport } from '../hooks/useExport'
import { useComidaOptions } from '../hooks/useComidaOptions'
import { Bocana } from '../lib/airtable'
import { Torneo } from '../lib/torneos'
import FilterSheet, { DashboardFilters } from '../components/dashboard/FilterSheet'
import ActiveFilterChips from '../components/dashboard/ActiveFilterChips'
import BocanaListItem from '../components/bocanas/BocanaListItem'
import PaymentSheet from '../components/bocanas/PaymentSheet'
import SelectionBar from '../components/bocanas/SelectionBar'

const STORAGE_KEY = 'bocanas_list_state'

const Bocanas: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>({})
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [individualPay, setIndividualPay] = useState<Bocana | null>(null)
  const [bulkPayOpen, setBulkPayOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const { apostadores } = useApostadores()
  const { comidas, loading: loadingComidas } = useComidaOptions()
  const { exportToCSV, shareWhatsApp } = useExport()

  const { bocanas, loading, fetchBocanas, actualizarBocana, hasMore, loadingMore, loadMore } =
    useBocanas({
      status: filters.status,
      torneo: filters.torneo,
      jugadorId: filters.jugadorId,
      jornada: filters.jornada,
    })

  // Carga inicial: query params > localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const next: DashboardFilters = {}
    const status = params.get('status')
    const torneo = params.get('torneo')
    const jornada = params.get('jornada')
    const jugadorId = params.get('jugadorId')
    const comida = params.get('comida')
    if (status === 'Pendiente' || status === 'Pagada') next.status = status
    if (torneo) next.torneo = torneo as Torneo
    if (jornada && !Number.isNaN(Number(jornada))) next.jornada = Math.max(1, Number(jornada))
    if (jugadorId) next.jugadorId = jugadorId
    if (comida) next.comida = comida
    if (Object.keys(next).length > 0) {
      setFilters(next)
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setFilters(parsed.filters || {})
          setSearch(parsed.search || '')
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, search }))
    } catch { /* ignore */ }
  }, [filters, search])

  // Limpiar selección cuando cambian los filtros
  useEffect(() => {
    setSelection(new Set())
  }, [filters.status, filters.torneo, filters.jornada, filters.jugadorId, filters.comida])

  const filtered = useMemo(() => {
    let base = bocanas
    if (filters.comida) {
      base = base.filter(b => String(b.fields.Comida || '') === filters.comida)
    }
    const term = search.trim().toLowerCase()
    if (!term) return base
    return base.filter(b => {
      const f = b.fields
      return [
        f.Jugador_Nombre,
        f.Torneo,
        f.Tipo,
        f.Comida,
        String(f.Jornada),
      ]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term))
    })
  }, [bocanas, filters.comida, search])

  const stats = useMemo(() => {
    const pendientes = filtered.filter(b => b.fields.Status === 'Pendiente').length
    const pagadas = filtered.filter(b => b.fields.Status === 'Pagada').length
    return { total: filtered.length, pendientes, pagadas }
  }, [filtered])

  const selectedBocanas = useMemo(
    () => filtered.filter(b => selection.has(b.id)),
    [filtered, selection]
  )
  const pendingSelected = selectedBocanas.filter(b => b.fields.Status === 'Pendiente')

  const toggleSelect = (id: string) => {
    setSelection(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelection(new Set())

  const confirmIndividualPay = async (comida: string) => {
    if (!individualPay || !comida) return
    setProcessing(true)
    try {
      await actualizarBocana(individualPay.id, { Status: 'Pagada', Comida: comida })
      await fetchBocanas()
      setIndividualPay(null)
    } catch {
      toast.error('No se pudo procesar el pago')
    } finally {
      setProcessing(false)
    }
  }

  const confirmBulkPay = async (comida: string) => {
    if (!comida || pendingSelected.length === 0) return
    setProcessing(true)
    try {
      for (const b of pendingSelected) {
        await actualizarBocana(b.id, { Status: 'Pagada', Comida: comida })
      }
      await fetchBocanas()
      setBulkPayOpen(false)
      clearSelection()
    } catch {
      toast.error('Error procesando pagos en lote')
    } finally {
      setProcessing(false)
    }
  }

  const clearOne = (key: keyof DashboardFilters) => {
    setFilters(prev => ({ ...prev, [key]: undefined }))
  }

  const clearAll = () => {
    setFilters({})
    setSearch('')
  }

  const activeFilterCount =
    Object.values(filters).filter(v => v !== undefined && v !== '').length + (search ? 1 : 0)

  const jugadorSeleccionado = filters.jugadorId
    ? apostadores.find(j => j.id === filters.jugadorId)?.fields.Nombre
    : undefined

  const goToDashboard = () => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.torneo) params.set('torneo', filters.torneo)
    if (typeof filters.jornada === 'number') params.set('jornada', String(filters.jornada))
    if (filters.jugadorId) params.set('jugadorId', filters.jugadorId)
    if (filters.comida) params.set('comida', filters.comida)
    const qs = params.toString()
    navigate(qs ? `/bocanas-dashboard?${qs}` : '/bocanas-dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-gray-50/85 backdrop-blur-md">
        <div className="px-4 pb-3 pt-4 sm:px-6 lg:px-10 lg:pt-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Listado
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Bocanas
              </h1>
              <p className="mt-0.5 text-xs text-gray-500">
                {stats.total} resultado{stats.total === 1 ? '' : 's'} · {stats.pendientes} pendiente{stats.pendientes === 1 ? '' : 's'}
                {' · '}
                {stats.pagadas} pagada{stats.pagadas === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={goToDashboard}
                className="hidden h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 sm:inline-flex"
              >
                Resumen
              </button>
              <button
                onClick={() => setFilterOpen(true)}
                className="relative flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 active:bg-gray-100"
              >
                <SlidersHorizontal size={16} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por jugador, comida, tipo…"
                className="h-10 w-full rounded-xl bg-white pl-10 pr-9 text-sm outline-none ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 active:bg-gray-100"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {(activeFilterCount > 0 && Object.keys(filters).some(k => filters[k as keyof DashboardFilters])) && (
            <div className="mt-3">
              <ActiveFilterChips
                filters={filters}
                jugadorName={jugadorSeleccionado}
                onClear={clearOne}
              />
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pb-32 pt-2 sm:px-6 lg:px-10">
        {loading && bocanas.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="ml-2 text-sm">Cargando bocanas…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-gray-100">
            <Utensils size={32} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-700">No hay bocanas</p>
            <p className="mt-1 text-xs text-gray-400">
              {activeFilterCount > 0 ? 'Probá ajustar o limpiar los filtros' : 'Aún no se registró ninguna'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 active:bg-gray-200"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map(b => (
              <li key={b.id}>
                <BocanaListItem
                  bocana={b}
                  selected={selection.has(b.id)}
                  onToggleSelect={() => toggleSelect(b.id)}
                  onPay={() => setIndividualPay(b)}
                />
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <div className="mt-5 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 active:bg-gray-100 disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Cargando…
                </>
              ) : (
                'Cargar más'
              )}
            </button>
          </div>
        )}
      </div>

      <SelectionBar
        count={selection.size}
        pendingCount={pendingSelected.length}
        onClear={clearSelection}
        onMarkPaid={() => setBulkPayOpen(true)}
        onExport={() => exportToCSV(selectedBocanas, 'bocanas-seleccionadas')}
        onShare={() => shareWhatsApp(selectedBocanas, 'Bocanas seleccionadas')}
      />

      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
        onClear={clearAll}
        jugadores={apostadores.map(a => ({ id: a.id, name: a.fields.Nombre }))}
        comidas={comidas}
      />

      <PaymentSheet
        open={!!individualPay}
        title="Marcar como pagada"
        subtitle={individualPay?.fields.Jugador_Nombre || ''}
        comidas={comidas}
        loadingComidas={loadingComidas}
        processing={processing}
        onConfirm={confirmIndividualPay}
        onClose={() => setIndividualPay(null)}
      />

      <PaymentSheet
        open={bulkPayOpen}
        title={`Marcar ${pendingSelected.length} como pagadas`}
        subtitle="Misma comida para todas"
        comidas={comidas}
        loadingComidas={loadingComidas}
        processing={processing}
        onConfirm={confirmBulkPay}
        onClose={() => setBulkPayOpen(false)}
      />
    </div>
  )
}

export default Bocanas
