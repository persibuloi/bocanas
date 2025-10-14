import React, { useEffect, useMemo, useRef, useState } from 'react'
import { 
  Loader2, Filter, BarChart2, Users, CheckCircle2, Clock, X, MessageCircle, Share2,
  TrendingUp, Award, Target, Utensils, Calendar, Activity, Zap
} from 'lucide-react'
import { bocanasApi, Bocana, apostadoresApi, Apostador } from '../lib/airtable'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardKPI from '../components/DashboardKPI'
import DashboardHeader from '../components/DashboardHeader'
import InteractiveCharts from '../components/InteractiveCharts'
import ProFilters from '../components/ProFilters'
import AdvancedMetrics from '../components/AdvancedMetrics'
import TopDeudores from '../components/TopDeudores'
import { useExport } from '../hooks/useExport'
import { useIsMobile } from '../hooks/use-mobile'

const statuses = ['Pendiente', 'Pagada'] as const
const torneos = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const

interface Filters {
  status?: (typeof statuses)[number]
  torneo?: (typeof torneos)[number]
  jornada?: number
  jugadorId?: string
  comida?: string
}

const BocanasDashboard: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({})
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Bocana[]>([])
  const [jugadores, setJugadores] = useState<Apostador[]>([])
  const [loadingJugadores, setLoadingJugadores] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const location = useLocation()
  const navigate = useNavigate()
  const { exportToCSV, shareWhatsApp } = useExport()
  const isMobile = useIsMobile()
  
  // Helper: obtener el ID de registro del jugador (soporta 'Jugador' o 'Jugador_ID' en array o string)
  const getJugadorRecordId = (b: Bocana): string | undefined => {
    const rawIdA: any = (b.fields as any).Jugador_ID
    const rawIdB: any = (b.fields as any).Jugador
    const pick = (val: any): string | undefined => {
      if (Array.isArray(val)) return val[0]
      if (typeof val === 'string') return val
      return undefined
    }
    const candA = pick(rawIdA)
    const candB = pick(rawIdB)
    return (candA && candA.startsWith('rec')) ? candA : (candB || candA)
  }

  const loadAll = async (override?: Partial<Filters>) => {
    setLoading(true)
    try {
      const eff = { ...filters, ...override }
      let offset: string | undefined = undefined
      const all: Bocana[] = []
      while (true) {
        const { records, offset: next } = await bocanasApi.getPage(
          {
            status: eff.status,
            torneo: eff.torneo,
            jornada: eff.jornada,
            jugadorId: eff.jugadorId,
          },
          offset
        )
        all.push(...records)
        offset = next
        if (!offset) break
      }
      setData(all)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.torneo, filters.jornada, filters.jugadorId, filters.comida])

  // Cargar filtros desde query params o localStorage al montar
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qp: Filters = {}
    const qStatus = params.get('status') as any
    const qTorneo = params.get('torneo') as any
    const qJornada = params.get('jornada')
    const qJugadorId = params.get('jugadorId') || undefined
    const qComida = params.get('comida') || undefined
    if (qStatus) qp.status = qStatus
    if (qTorneo) qp.torneo = qTorneo
    if (qJornada && !Number.isNaN(Number(qJornada))) qp.jornada = Math.max(1, Number(qJornada))
    if (qJugadorId) qp.jugadorId = qJugadorId
    if (qComida) qp.comida = qComida

    if (Object.keys(qp).length > 0) {
      setFilters(qp)
      return
    }
    try {
      const raw = localStorage.getItem('bocanas_dashboard_filters')
      if (raw) {
        const lf = JSON.parse(raw)
        if (lf && typeof lf === 'object') setFilters(lf)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guardar filtros en localStorage y reflejar en query string
  useEffect(() => {
    try {
      localStorage.setItem('bocanas_dashboard_filters', JSON.stringify(filters))
    } catch {}
    const params = new URLSearchParams()
    if (filters.status) params.set('status', String(filters.status))
    if (filters.torneo) params.set('torneo', String(filters.torneo))
    if (typeof filters.jornada === 'number') params.set('jornada', String(filters.jornada))
    if (filters.jugadorId) params.set('jugadorId', String(filters.jugadorId))
    if (filters.comida) params.set('comida', String(filters.comida))
    const qs = params.toString()
    const nextUrl = qs ? (`/bocanas-dashboard?${qs}`) : '/bocanas-dashboard'
    if (location.pathname === '/bocanas-dashboard' && (location.search || '') !== (qs ? `?${qs}` : '')) {
      navigate(nextUrl, { replace: true })
    }
  }, [filters, location.pathname, location.search, navigate])

  // Cargar lista de jugadores (reutilizable)
  const fetchJugadores = async () => {
    setLoadingJugadores(true)
    try {
      const list = await apostadoresApi.getAll()
      setJugadores(list)
    } finally {
      setLoadingJugadores(false)
    }
  }
  useEffect(() => { fetchJugadores() }, [])

  // Cuando se quita el filtro de comida, recargar jugadores
  const prevComidaRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const prev = prevComidaRef.current
    // Si antes había filtro de comida y ahora ya no, recargamos jugadores
    if (prev && !filters.comida) {
      ;(async () => {
        setLoadingJugadores(true)
        try {
          const list = await apostadoresApi.getAll()
          setJugadores(list)
        } finally {
          setLoadingJugadores(false)
        }
      })()
    }
    prevComidaRef.current = filters.comida
  }, [filters.comida])

  const kpis = useMemo(() => {
    // Aplicar filtros localmente para asegurar que el dashboard reaccione aunque el backend no filtre perfecto
    const base = data.filter(b => {
      if (filters.status && b.fields.Status !== filters.status) return false
      if (filters.torneo && b.fields.Torneo !== filters.torneo) return false
      if (typeof filters.jornada === 'number' && b.fields.Jornada !== filters.jornada) return false
      if (filters.jugadorId && getJugadorRecordId(b) !== filters.jugadorId) return false
      if (filters.comida && String(b.fields.Comida || '') !== filters.comida) return false
      return true
    })

    const total = base.length
    const pagadas = base.filter(b => b.fields.Status === 'Pagada').length
    const pendientes = base.filter(b => b.fields.Status === 'Pendiente').length
    const porTorneo = new Map<string, number>()
    const porJornada = new Map<number, number>()
    // Agrupar pendientes por Jugador_ID (clave estable) y mostrar nombre si existe
    const porJugadorPend = new Map<string, { count: number; name: string }>()
    const comidas = new Map<string, number>()
    const comidasDet = new Map<string, Map<string, number>>() // comida -> jugadorNombre -> count

    for (const b of base) {
      const t = b.fields.Torneo || '—'
      porTorneo.set(t, (porTorneo.get(t) || 0) + 1)
      const j = Number(b.fields.Jornada || 0)
      if (!Number.isNaN(j)) porJornada.set(j, (porJornada.get(j) || 0) + 1)
      const playerId = getJugadorRecordId(b)
      const playerNameFallback = jugadores.find(x => x.id === playerId)?.fields.Nombre
      if (b.fields.Status === 'Pendiente') {
        const rawIdA: any = (b.fields as any).Jugador_ID
        const rawIdB: any = (b.fields as any).Jugador
        // Elegir un ID válido de Airtable (que comience con 'rec') cuando sea posible
        const pick = (val: any): string | undefined => {
          if (Array.isArray(val)) return val[0]
          if (typeof val === 'string') return val
          return undefined
        }
        const candA = pick(rawIdA)
        const candB = pick(rawIdB)
        const chosen = (candA && candA.startsWith('rec')) ? candA : (candB || candA)
        const id = String(chosen || 'unknown')
        const name = String(b.fields.Jugador_Nombre || playerNameFallback || id)
        const prev = porJugadorPend.get(id)
        porJugadorPend.set(id, { count: (prev?.count || 0) + 1, name })
      }
      if (b.fields.Status === 'Pagada' && b.fields.Comida) {
        const c = String(b.fields.Comida)
        comidas.set(c, (comidas.get(c) || 0) + 1)
        const name = String(b.fields.Jugador_Nombre || playerNameFallback || '—')
        const by = comidasDet.get(c) || new Map<string, number>()
        by.set(name, (by.get(name) || 0) + 1)
        comidasDet.set(c, by)
      }
    }

    const topPendDet = Array.from(porJugadorPend.entries())
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)))
    const topPend = topPendDet.map(v => [v.name, v.count] as [string, number])

    const topComidas = Array.from(comidas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const topComidasDet = topComidas.map(([c, cnt]) => ({
      name: c,
      count: cnt,
      players: Array.from((comidasDet.get(c) || new Map()).entries())
        .map(([name, n]) => ({ name, count: n }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    }))

    const jornadasRecientes = Array.from(porJornada.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, 6)

    // Datos para gráficos interactivos
    const chartData = {
      porTorneo: Array.from(porTorneo.entries()).map(([name, value]) => ({ name, value })),
      porJornada: Array.from(porJornada.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([jornada, value]) => ({ name: `J${jornada}`, value })),
      porComida: topComidas.map(([name, value]) => ({ name, value })),
      tendenciaSemanal: jornadasRecientes.map(([jornada, value]) => ({ 
        name: `J${jornada}`, 
        value 
      }))
    }
    
    return { 
      total, pagadas, pendientes, porTorneo, porJornada, topPend, topComidas, 
      recientes: jornadasRecientes, topPendDet, topComidasDet, chartData 
    }
  }, [data, filters.status, filters.torneo, filters.jornada, filters.jugadorId, filters.comida, jugadores])

  // Pendientes agrupados por Torneo para el jugador seleccionado
  const pendientesPorTorneo = useMemo(() => {
    if (!filters.jugadorId) return [] as Array<{ torneo: string; items: Bocana[] }>
    const pendientes = data
      .filter(b => b.fields.Status === 'Pendiente' && getJugadorRecordId(b) === filters.jugadorId)
    const map = new Map<string, Bocana[]>()
    for (const b of pendientes) {
      const t = b.fields.Torneo || '—'
      const arr = map.get(t) || []
      arr.push(b)
      map.set(t, arr)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([torneo, items]) => ({
        torneo,
        items: items.slice().sort((x, y) => (Number(x.fields.Jornada) || 0) - (Number(y.fields.Jornada) || 0))
      }))
  }, [data, filters.jugadorId])

  // Nombre del jugador seleccionado para mensajes
  const jugadorSeleccionadoNombre = useMemo(() => {
    if (!filters.jugadorId) return ''
    const j = jugadores.find(x => x.id === filters.jugadorId)
    return j?.fields.Nombre || ''
  }, [filters.jugadorId, jugadores])

  // Texto para compartir TODOS los pendientes del jugador
  const shareTextAll = useMemo(() => {
    if (!filters.jugadorId || pendientesPorTorneo.length === 0) return ''
    const header = jugadorSeleccionadoNombre ? `🟡 Pendientes de *${jugadorSeleccionadoNombre}*:` : '🟡 Pendientes:'
    const lines: string[] = [header]
    pendientesPorTorneo.forEach(group => {
      lines.push(`\n• Torneo *${group.torneo}*`)
      group.items.forEach(b => {
        const jor = `J${b.fields.Jornada}`
        const tipo = b.fields.Tipo
        lines.push(`  - 🎳 ${jor} · *${tipo}*`)
      })
    })
    return lines.join('\n')
  }, [pendientesPorTorneo, filters.jugadorId, jugadorSeleccionadoNombre])

  const shareAllToWhatsApp = () => {
    if (!shareTextAll) return
    const url = `https://wa.me/?text=${encodeURIComponent(shareTextAll)}`
    window.open(url, '_blank')
  }

  const shareGroupToWhatsApp = (torneo: string) => {
    const group = pendientesPorTorneo.find(g => g.torneo === torneo)
    if (!group) return
    const header = jugadorSeleccionadoNombre ? `🟡 Pendientes de *${jugadorSeleccionadoNombre}* – Torneo *${torneo}*:` : `🟡 Pendientes – Torneo *${torneo}*:`
    const lines: string[] = [header]
    group.items.forEach(b => {
      const jor = `J${b.fields.Jornada}`
      const tipo = b.fields.Tipo
      lines.push(`  - 🎳 ${jor} · *${tipo}*`)
    })
    const text = lines.join('\n')
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const Bar: React.FC<{ label: string; value: number; max: number; onClick?: () => void }> = ({ label, value, max, onClick }) => (
    <div className={`mb-2 ${onClick ? 'cursor-pointer group' : ''}`} onClick={onClick}>
      <div className="flex justify-between text-sm text-gray-600"><span>{label}</span><span>{value}</span></div>
      <div className={`w-full h-2 rounded ${onClick ? 'bg-gray-100 group-hover:bg-gray-200 transition-colors' : 'bg-gray-100'}`}>
        <div className={`h-2 rounded ${onClick ? 'bg-blue-600 group-hover:bg-blue-700 transition-colors' : 'bg-blue-600'}`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
  )

  const maxPend = kpis.topPend.length ? kpis.topPend[0][1] : 0
  const maxComida = kpis.topComidas.length ? kpis.topComidas[0][1] : 0
  const maxTorneo = kpis.porTorneo.size ? Math.max(...Array.from(kpis.porTorneo.values())) : 0

  // Compartir Top deudores (pendientes)
  const shareTopPendText = useMemo(() => {
    if (!kpis.topPendDet.length) return ''
    const title = '🏆 *Top deudores (pendientes)*'
    const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹')
    const lines = [title]
    kpis.topPendDet.forEach((item, idx) => {
      lines.push(`${medal(idx)} *${item.name}* — *${item.count}*`)
    })
    return lines.join('\n')
  }, [kpis.topPendDet])

  const shareTopPendToWhatsApp = () => {
    if (!shareTopPendText) return
    const url = `https://wa.me/?text=${encodeURIComponent(shareTopPendText)}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header moderno */}
      <DashboardHeader
        title="Dashboard de Bocanas"
        subtitle="Analytics y métricas en tiempo real"
        onRefresh={() => loadAll()}
        onClearFilters={() => setFilters({})}
        onExport={() => exportToCSV(data, 'dashboard-bocanas')}
        onShare={() => shareWhatsApp(data, 'Dashboard de Bocanas')}
        loading={loading}
        lastUpdated={lastUpdated}
      />
      {(filters.jugadorId || filters.comida) && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {filters.jugadorId && (
              <span className="inline-flex items-center text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                Jugador: {jugadores.find(j => j.id === filters.jugadorId)?.fields.Nombre || filters.jugadorId}
                <button
                  className="ml-2 hover:text-blue-900"
                  onClick={() => setFilters(f => ({ ...f, jugadorId: undefined, status: undefined }))}
                  title="Limpiar filtro"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.comida && (
              <span className="inline-flex items-center text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                Comida: {filters.comida}
                <button
                  className="ml-2 hover:text-green-900"
                  onClick={async () => {
                    const next = { ...filters, comida: undefined, status: undefined as any }
                    setFilters(next)
                    await Promise.all([loadAll(next), fetchJugadores()])
                  }}
                  title="Limpiar filtro comida"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Métricas Súper Avanzadas */}
      <AdvancedMetrics data={data} loading={loading} />

      {/* Gráficos interactivos */}
      <div className="mb-8">
        <InteractiveCharts
          data={kpis.chartData}
          loading={loading}
        />
      </div>
      
      {/* Sección de analytics avanzados */}
      <div className={`grid gap-6 mb-8 ${
        isMobile 
          ? 'grid-cols-1' 
          : 'grid-cols-1 lg:grid-cols-3'
      }`}>
        {/* Top Deudores Súper Elegante */}
        <TopDeudores
          deudores={kpis.topPendDet}
          onSelectJugador={(jugadorId) => 
            setFilters(f => ({ ...f, jugadorId, status: 'Pendiente', torneo: undefined, jornada: undefined }))
          }
          onShare={shareTopPendToWhatsApp}
          loading={loading}
        />
        {/* Comidas Más Populares */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Utensils size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Comidas Populares</h3>
                <p className="text-sm text-gray-500">Más pedidas</p>
              </div>
            </div>
            {filters.comida && (
              <button
                type="button"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={async () => {
                  const next = { ...filters, comida: undefined, status: undefined as any }
                  setFilters(next)
                  await Promise.all([loadAll(next), fetchJugadores()])
                }}
              >Quitar filtro</button>
            )}
          </div>
          
          {kpis.topComidasDet.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay datos de comidas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {kpis.topComidasDet.map((item, index) => {
                const percentage = maxComida > 0 ? (item.count / maxComida) * 100 : 0;
                const isExpanded = filters.comida === item.name;
                
                return (
                  <div key={item.name}>
                    <div
                      onClick={() => setFilters(f => ({ ...f, comida: item.name, status: 'Pagada' }))}
                      className="group p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            #{index + 1}
                          </div>
                          <span className="font-semibold text-gray-900 group-hover:text-orange-700">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-orange-600">{item.count}</span>
                          <span className="text-sm text-gray-500">pedidos</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 ml-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-orange-900">Quiénes la pidieron</h4>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            onClick={() => {
                              const lines = [
                                `🍽️ *${item.name}* — *${item.count}* pedido(s)`,
                                ...item.players.map(p => `• ${p.name} — ${p.count}`)
                              ]
                              const url = `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
                              window.open(url, '_blank')
                            }}
                          >
                            <Share2 size={14} className="mr-1" /> Compartir
                          </button>
                        </div>
                        {item.players.length === 0 ? (
                          <div className="text-sm text-orange-600">Sin detalle disponible</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.players.map(p => (
                              <div key={p.name} className="flex items-center justify-between p-2 bg-white rounded-lg border border-orange-200">
                                <span className="text-sm font-medium text-gray-900">{p.name}</span>
                                <span className="text-sm font-bold text-orange-600">×{p.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Actividad por Jornadas */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Actividad por Jornadas</h3>
              <p className="text-sm text-gray-500">Distribución reciente</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-auto">
            {Array.from(kpis.porJornada.entries())
              .sort((a,b) => b[0] - a[0])
              .slice(0, 8)
              .map(([jornada, valor], index) => {
                const maxJornada = Math.max(...Array.from(kpis.porJornada.values()), 1);
                const percentage = (valor / maxJornada) * 100;
                
                return (
                  <div key={jornada} className="group p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {jornada}
                        </div>
                        <span className="font-medium text-gray-900 group-hover:text-indigo-700">Jornada {jornada}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-indigo-600">{valor}</span>
                        <span className="text-sm text-gray-500">bocanas</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>

      {/* Sistema de filtros súper profesional */}
      <ProFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(prev => ({ ...prev, ...newFilters }));
        }}
        jugadores={jugadores}
        loading={loadingJugadores}
      />

      {/* Sección de pendientes del jugador seleccionado */}
      {filters.jugadorId && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pendientes del Jugador</h3>
                <p className="text-sm text-gray-600">{jugadorSeleccionadoNombre}</p>
              </div>
            </div>
            {pendientesPorTorneo.length > 0 && (
              <button
                type="button"
                onClick={shareAllToWhatsApp}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
                title="Compartir todo por WhatsApp"
              >
                <MessageCircle size={16} className="mr-2" /> 
                Compartir Todo
              </button>
            )}
          </div>
          
          {pendientesPorTorneo.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-400" />
              <p className="text-lg font-semibold text-gray-900 mb-2">¡Excelente!</p>
              <p className="text-gray-600">Este jugador no tiene bocanas pendientes</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendientesPorTorneo.map(group => (
                <div key={group.torneo} className="bg-white rounded-xl p-5 border border-yellow-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Target size={16} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{group.torneo}</h4>
                        <p className="text-sm text-gray-500">{group.items.length} bocana{group.items.length !== 1 ? 's' : ''} pendiente{group.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => shareGroupToWhatsApp(group.torneo)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      title="Compartir este torneo por WhatsApp"
                    >
                      <Share2 size={14} className="mr-1" /> Compartir
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map(b => {
                      const creationDate = (() => {
                        const f: any = b.fields as any
                        const c = f['Creación'] || f['Creacion'] || f['creacion']
                        return c ? new Date(c).toLocaleDateString() : '—'
                      })();
                      
                      return (
                        <div key={b.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="inline-flex items-center px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                              <Clock size={10} className="mr-1" />
                              Pendiente
                            </div>
                            <span className="text-xs text-gray-500">{creationDate}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-900">Jornada {b.fields.Jornada}</span>
                              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-700 font-bold text-xs">{b.fields.Jornada}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Target size={12} className="text-gray-500" />
                              <span className="text-sm text-gray-700">{b.fields.Tipo}</span>
                            </div>
                            {b.fields.Comida && (
                              <div className="flex items-center space-x-2">
                                <Utensils size={12} className="text-gray-500" />
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{String(b.fields.Comida)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botón para ir al listado */}
      <div className="text-center py-8">
        <button
          onClick={() => {
            const params = new URLSearchParams()
            if (filters.status) params.set('status', String(filters.status))
            if (filters.torneo) params.set('torneo', String(filters.torneo))
            if (typeof filters.jornada === 'number') params.set('jornada', String(filters.jornada))
            if (filters.jugadorId) params.set('jugadorId', String(filters.jugadorId))
            if (filters.comida) params.set('comida', String(filters.comida))
            navigate(`/bocanas?${params.toString()}`)
          }}
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg group"
        >
          <BarChart2 size={20} className="mr-3 group-hover:scale-110 transition-transform" />
          Ver Listado Completo
        </button>
      </div>
      
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 flex items-center space-x-3">
          <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
          <span className="text-gray-700 font-medium">Actualizando métricas...</span>
        </div>
      )}
    </div>
  )
}

export default BocanasDashboard
