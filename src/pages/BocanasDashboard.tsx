import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RefreshCw, SlidersHorizontal, Loader2, Activity, Calendar, Target, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Apostador, Bocana, apostadoresApi, bocanasApi } from '../lib/airtable'
import { Torneo } from '../lib/torneos'
import StatCard from '../components/dashboard/StatCard'
import PendingHero from '../components/dashboard/PendingHero'
import TopDeudoresList from '../components/dashboard/TopDeudoresList'
import JornadaTrend from '../components/dashboard/JornadaTrend'
import TorneoDistribution from '../components/dashboard/TorneoDistribution'
import ComidasBars from '../components/dashboard/ComidasBars'
import FilterSheet, { DashboardFilters } from '../components/dashboard/FilterSheet'
import ActiveFilterChips from '../components/dashboard/ActiveFilterChips'

const STORAGE_KEY = 'bocanas_dashboard_filters'

const getJugadorRecordId = (b: Bocana): string | undefined => {
  const fields = b.fields as Record<string, unknown>
  const pick = (val: unknown): string | undefined => {
    if (Array.isArray(val)) return typeof val[0] === 'string' ? val[0] : undefined
    if (typeof val === 'string') return val
    return undefined
  }
  const a = pick(fields.Jugador_ID)
  const b2 = pick(fields.Jugador)
  return a && a.startsWith('rec') ? a : b2 || a
}

const formatRelative = (date: Date): string => {
  const diff = Math.round((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'hace instantes'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return date.toLocaleDateString()
}

const BocanasDashboard: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>({})
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Bocana[]>([])
  const [jugadores, setJugadores] = useState<Apostador[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [filterOpen, setFilterOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Carga inicial: query params > localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qp: DashboardFilters = {}
    const status = params.get('status')
    const torneo = params.get('torneo')
    const jornada = params.get('jornada')
    const jugadorId = params.get('jugadorId')
    const comida = params.get('comida')
    if (status === 'Pendiente' || status === 'Pagada') qp.status = status
    if (torneo) qp.torneo = torneo as Torneo
    if (jornada && !Number.isNaN(Number(jornada))) qp.jornada = Math.max(1, Number(jornada))
    if (jugadorId) qp.jugadorId = jugadorId
    if (comida) qp.comida = comida
    if (Object.keys(qp).length > 0) {
      setFilters(qp)
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setFilters(parsed)
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia + sync con URL
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch { /* ignore */ }
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.torneo) params.set('torneo', filters.torneo)
    if (typeof filters.jornada === 'number') params.set('jornada', String(filters.jornada))
    if (filters.jugadorId) params.set('jugadorId', filters.jugadorId)
    if (filters.comida) params.set('comida', filters.comida)
    const qs = params.toString()
    const target = qs ? `/bocanas-dashboard?${qs}` : '/bocanas-dashboard'
    if (location.pathname === '/bocanas-dashboard' && location.search !== (qs ? `?${qs}` : '')) {
      navigate(target, { replace: true })
    }
  }, [filters, location.pathname, location.search, navigate])

  const loadAll = async (override?: Partial<DashboardFilters>) => {
    setLoading(true)
    try {
      const eff = { ...filters, ...override }
      const all: Bocana[] = []
      let offset: string | undefined
      do {
        const page = await bocanasApi.getPage(
          { status: eff.status, torneo: eff.torneo, jornada: eff.jornada, jugadorId: eff.jugadorId },
          offset
        )
        all.push(...page.records)
        offset = page.offset
      } while (offset)
      setData(all)
      setLastUpdated(new Date())
    } catch {
      toast.error('Error cargando bocanas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.torneo, filters.jornada, filters.jugadorId, filters.comida])

  useEffect(() => {
    apostadoresApi.getAll().then(setJugadores).catch(() => undefined)
  }, [])

  const kpis = useMemo(() => {
    const base = data.filter(b => {
      if (filters.comida && String(b.fields.Comida || '') !== filters.comida) return false
      return true
    })

    const total = base.length
    const pagadas = base.filter(b => b.fields.Status === 'Pagada').length
    const pendientes = base.filter(b => b.fields.Status === 'Pendiente').length
    const tasaPago = total > 0 ? Math.round((pagadas / total) * 100) : 0

    const porTipo = new Map<string, number>()
    const porTorneo = new Map<string, number>()
    const porJornada = new Map<number, number>()
    const porJugadorPend = new Map<string, { count: number; name: string }>()
    const comidasMap = new Map<string, number>()

    for (const b of base) {
      const tipo = b.fields.Tipo || '—'
      porTipo.set(tipo, (porTipo.get(tipo) || 0) + 1)
      const torneo = b.fields.Torneo || '—'
      porTorneo.set(torneo, (porTorneo.get(torneo) || 0) + 1)
      const j = Number(b.fields.Jornada || 0)
      if (!Number.isNaN(j) && j > 0) porJornada.set(j, (porJornada.get(j) || 0) + 1)
      if (b.fields.Status === 'Pendiente') {
        const id = getJugadorRecordId(b) || 'unknown'
        const fallbackName = jugadores.find(x => x.id === id)?.fields.Nombre
        const name = String(b.fields.Jugador_Nombre || fallbackName || id)
        const prev = porJugadorPend.get(id)
        porJugadorPend.set(id, { count: (prev?.count || 0) + 1, name })
      }
      if (b.fields.Comida) {
        const c = String(b.fields.Comida)
        comidasMap.set(c, (comidasMap.get(c) || 0) + 1)
      }
    }

    const tipoMasComun = Array.from(porTipo.entries()).sort((a, b) => b[1] - a[1])[0]
    const jornadasOrdenadas = Array.from(porJornada.keys()).sort((a, b) => a - b)
    const jornadaActiva = jornadasOrdenadas[jornadasOrdenadas.length - 1]
    const promedioPorJornada = jornadasOrdenadas.length > 0 ? Math.round(total / jornadasOrdenadas.length) : 0

    const trendData = jornadasOrdenadas
      .slice(-8)
      .map(j => ({ name: `J${j}`, value: porJornada.get(j) || 0 }))

    const torneoData = Array.from(porTorneo.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const topDeudores = Array.from(porJugadorPend.entries())
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5)

    const topComidas = Array.from(comidasMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    return {
      total, pagadas, pendientes, tasaPago,
      tipoMasComun: tipoMasComun ? tipoMasComun[0] : '—',
      tipoMasComunCount: tipoMasComun ? tipoMasComun[1] : 0,
      jornadaActiva: jornadaActiva || 0,
      promedioPorJornada,
      trendData, torneoData, topDeudores, topComidas,
    }
  }, [data, filters.comida, jugadores])

  const comidasOpciones = useMemo(
    () => Array.from(new Set(data.map(b => b.fields.Comida).filter(Boolean) as string[])).sort(),
    [data]
  )

  const jugadoresOpciones = useMemo(
    () => jugadores.map(j => ({ id: j.id, name: j.fields.Nombre })),
    [jugadores]
  )

  const jugadorSeleccionado = filters.jugadorId
    ? jugadores.find(j => j.id === filters.jugadorId)?.fields.Nombre
    : undefined

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  const shareTopDeudores = () => {
    if (kpis.topDeudores.length === 0) return
    const medal = (i: number) => (['🥇', '🥈', '🥉'][i] || '🔹')
    const lines = ['🏆 *Top deudores (pendientes)*']
    kpis.topDeudores.forEach((d, i) => lines.push(`${medal(i)} *${d.name}* — ${d.count}`))
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
  }

  const clearOne = (key: keyof DashboardFilters) => {
    setFilters(prev => ({ ...prev, [key]: undefined }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <header className="sticky top-0 z-20 bg-gray-50/85 backdrop-blur-md">
        <div className="px-4 py-4 sm:px-6 lg:px-10 lg:pt-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Dashboard
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Resumen de bocanas
              </h1>
              <p className="mt-0.5 text-xs text-gray-500">
                Actualizado {formatRelative(lastUpdated)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => loadAll()}
                disabled={loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600 ring-1 ring-gray-200 transition-colors active:bg-gray-100 disabled:opacity-60"
                aria-label="Actualizar"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
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

          {activeFilterCount > 0 && (
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

      {/* Contenido */}
      <div className="space-y-4 px-4 pb-6 pt-2 sm:px-6 lg:px-10">
        <PendingHero
          pendientes={kpis.pendientes}
          pagadas={kpis.pagadas}
          total={kpis.total}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total bocanas"
            value={kpis.total}
            icon={BarChart3}
            tone="info"
            hint={`${kpis.promedioPorJornada}/jornada`}
          />
          <StatCard
            label="Tasa de pago"
            value={`${kpis.tasaPago}%`}
            icon={Target}
            tone="success"
            hint={`${kpis.pagadas} pagadas`}
          />
          <StatCard
            label="Tipo más común"
            value={kpis.tipoMasComun}
            icon={Activity}
            tone="warning"
            hint={kpis.tipoMasComunCount > 0 ? `${kpis.tipoMasComunCount} casos` : undefined}
          />
          <StatCard
            label="Última jornada"
            value={kpis.jornadaActiva > 0 ? `J${kpis.jornadaActiva}` : '—'}
            icon={Calendar}
            tone="default"
            hint="con bocanas"
          />
        </div>

        <JornadaTrend data={kpis.trendData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <TorneoDistribution
            data={kpis.torneoData}
            active={filters.torneo}
            onSelect={t =>
              setFilters(prev => ({ ...prev, torneo: prev.torneo === t ? undefined : (t as Torneo) }))
            }
          />
          <ComidasBars
            data={kpis.topComidas}
            active={filters.comida}
            onSelect={c =>
              setFilters(prev => ({ ...prev, comida: prev.comida === c ? undefined : c }))
            }
          />
        </div>

        <TopDeudoresList
          deudores={kpis.topDeudores}
          onSelect={id =>
            setFilters(prev => ({ ...prev, jugadorId: id, status: 'Pendiente' }))
          }
          onShare={shareTopDeudores}
        />
      </div>

      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
        jugadores={jugadoresOpciones}
        comidas={comidasOpciones}
      />
    </div>
  )
}

export default BocanasDashboard
