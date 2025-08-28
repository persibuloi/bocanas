import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Filter, BarChart2, Users, CheckCircle2, Clock, X, MessageCircle, Share2 } from 'lucide-react'
import { bocanasApi, Bocana, apostadoresApi, Apostador } from '../lib/airtable'
import { useLocation, useNavigate } from 'react-router-dom'

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
  const location = useLocation()
  const navigate = useNavigate()
  
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

    return { total, pagadas, pendientes, porTorneo, porJornada, topPend, topComidas, recientes: jornadasRecientes, topPendDet, topComidasDet }
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center"><BarChart2 className="mr-3 text-blue-600" /> Dashboard de Bocanas</h1>
        <div className="flex items-center space-x-2">
          <button onClick={() => setFilters({})} className="px-3 py-2 bg-white text-gray-700 border rounded-lg hover:bg-gray-50">Limpiar filtros</button>
          <button onClick={() => loadAll()} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Actualizar
          </button>
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
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Ver en listado"
          >Ir al listado</button>
        </div>
      </div>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Total bocanas</div>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500 flex items-center"><Clock size={14} className="mr-1" /> Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600">{kpis.pendientes}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500 flex items-center"><CheckCircle2 size={14} className="mr-1" /> Pagadas</div>
            <div className="text-2xl font-bold text-green-600">{kpis.pagadas}</div>
          </div>
          
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center"><Users size={18} className="mr-2 text-gray-700" /> Top deudores (pendientes)</h3>
              {kpis.topPendDet.length > 0 && (
                <button
                  type="button"
                  onClick={shareTopPendToWhatsApp}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
                  title="Compartir Top por WhatsApp"
                >
                  <MessageCircle size={14} className="mr-1" /> Compartir
                </button>
              )}
            </div>
            {kpis.topPend.length === 0 ? <div className="text-gray-500 text-sm">Sin datos</div> : (
              <div className="max-h-64 overflow-auto pr-1">
                {kpis.topPendDet.map(({ id, name, count }) => (
                  <Bar
                    key={id}
                    label={name}
                    value={count}
                    max={maxPend}
                    onClick={() => setFilters(f => ({ ...f, jugadorId: id, status: 'Pendiente', torneo: undefined, jornada: undefined }))}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Comidas más pedidas</h3>
              {filters.comida && (
                <button
                  type="button"
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  onClick={async () => {
                    const next = { ...filters, comida: undefined, status: undefined as any }
                    setFilters(next)
                    await Promise.all([loadAll(next), fetchJugadores()])
                  }}
                >Quitar filtro</button>
              )}
            </div>
            {kpis.topComidasDet.length === 0 ? <div className="text-gray-500 text-sm">Sin datos</div> : (
              <div>
                {kpis.topComidasDet.map(item => (
                  <div key={item.name} className="mb-2">
                    <Bar
                      label={`${item.name}`}
                      value={item.count}
                      max={maxComida}
                      onClick={() => setFilters(f => ({ ...f, comida: item.name, status: 'Pagada' }))}
                    />
                    {filters.comida === item.name && (
                      <div className="mt-2 ml-1 p-2 border rounded bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium">Quiénes la pidieron</div>
                          <button
                            type="button"
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 flex items-center"
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
                          <div className="text-xs text-gray-600">Sin detalle</div>
                        ) : (
                          <ul className="text-sm text-gray-700 list-disc ml-5">
                            {item.players.map(p => (
                              <li key={p.name}>{p.name} <span className="text-gray-500">×{p.count}</span></li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Últimas jornadas</h3>
            {Array.from(kpis.porJornada.entries()).sort((a,b)=>b[0]-a[0]).slice(0,6).map(([jor, val]) => (
              <Bar key={jor} label={`J${jor}`} value={val} max={Math.max(...Array.from(kpis.porJornada.values()), 1)} />
            ))}
          </div>
          <div>
            <h3 className="font-semibold mb-2">{filters.jugadorId ? 'Por torneo (jugador)' : 'Por torneo'}</h3>
            {kpis.porTorneo.size === 0 ? <div className="text-gray-500 text-sm">Sin datos</div> : (
              Array.from(kpis.porTorneo.entries())
                .sort((a,b)=>b[1]-a[1])
                .map(([torneo, val]) => (
                  <Bar key={torneo} label={torneo} value={val} max={maxTorneo} />
                ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select value={filters.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value ? (e.target.value as any) : undefined }))} className="w-full py-2 outline-none bg-transparent">
              <option value="">Todos los estados</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select value={filters.torneo || ''} onChange={e => setFilters(f => ({ ...f, torneo: e.target.value ? (e.target.value as any) : undefined }))} className="w-full py-2 outline-none bg-transparent">
              <option value="">Todos los torneos</option>
              {torneos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <input
              type="number"
              min="1"
              value={filters.jornada ?? ''}
              onChange={e => {
                const val = e.target.value ? Number(e.target.value) : undefined
                const normalized = typeof val === 'number' ? (val >= 1 ? val : 1) : undefined
                setFilters(f => ({ ...f, jornada: normalized }))
              }}
              placeholder="Jornada (>=1)"
              className="w-full py-2 outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center border rounded-lg px-3 col-span-1 md:col-span-2">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select
              value={filters.jugadorId || ''}
              onChange={e => setFilters(f => ({ ...f, jugadorId: e.target.value || undefined }))}
              className="w-full py-2 outline-none bg-transparent"
            >
              <option value="">Todos los jugadores</option>
              {jugadores
                .slice()
                .sort((a, b) => a.fields.Nombre.localeCompare(b.fields.Nombre))
                .map(j => (
                  <option key={j.id} value={j.id}>{j.fields.Nombre}</option>
                ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            {loadingJugadores ? (<span className="flex items-center"><Loader2 className="animate-spin mr-2" size={14} /> Cargando jugadores...</span>) : null}
          </div>
        </div>
      </div>

      {/* Lista de pendientes del jugador seleccionado (agrupados por Torneo) */}
      {filters.jugadorId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pendientes de este jugador</h3>
            {pendientesPorTorneo.length > 0 && (
              <button
                type="button"
                onClick={shareAllToWhatsApp}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
                title="Compartir todo por WhatsApp"
              >
                <MessageCircle size={16} className="mr-2" /> Compartir todo
              </button>
            )}
          </div>
          {pendientesPorTorneo.length === 0 ? (
            <div className="text-gray-500 text-sm">Sin pendientes</div>
          ) : (
            <div className="space-y-6">
              {pendientesPorTorneo.map(group => (
                <div key={group.torneo}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-700">{group.torneo}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{group.items.length} pendiente(s)</span>
                      <button
                        type="button"
                        onClick={() => shareGroupToWhatsApp(group.torneo)}
                        className="inline-flex items-center px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
                        title="Compartir este torneo por WhatsApp"
                      >
                        <Share2 size={14} className="mr-1" /> Compartir
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map(b => (
                      <div key={b.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs inline-flex items-center bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded">Pendiente</span>
                          <span className="text-xs text-gray-500">{
                            (() => {
                              const f: any = b.fields as any
                              const c = f['Creación'] || f['Creacion'] || f['creacion']
                              return c ? new Date(c).toLocaleString() : '—'
                            })()
                          }</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-800">Jornada {b.fields.Jornada}</div>
                            <div className="text-xs text-gray-500">Tipo: {b.fields.Tipo}</div>
                          </div>
                          {b.fields.Comida ? (
                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">{String(b.fields.Comida)}</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center text-gray-600"><Loader2 className="animate-spin mr-2" size={16} /> Cargando métricas...</div>
      )}
    </div>
  )
}

export default BocanasDashboard
