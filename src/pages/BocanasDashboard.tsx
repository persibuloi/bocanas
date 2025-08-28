import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Filter, BarChart2, Users, CheckCircle2, Clock, X } from 'lucide-react'
import { bocanasApi, Bocana, apostadoresApi, Apostador } from '../lib/airtable'

const statuses = ['Pendiente', 'Pagada'] as const
const torneos = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const

interface Filters {
  status?: (typeof statuses)[number]
  torneo?: (typeof torneos)[number]
  jornada?: number
  jugadorId?: string
}

const BocanasDashboard: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({})
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Bocana[]>([])
  const [jugadores, setJugadores] = useState<Apostador[]>([])
  const [loadingJugadores, setLoadingJugadores] = useState(false)
  
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

  const loadAll = async () => {
    setLoading(true)
    try {
      let offset: string | undefined = undefined
      const all: Bocana[] = []
      while (true) {
        const { records, offset: next } = await bocanasApi.getPage(
          {
            status: filters.status,
            torneo: filters.torneo,
            jornada: filters.jornada,
            jugadorId: filters.jugadorId,
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
  }, [filters.status, filters.torneo, filters.jornada, filters.jugadorId])

  // Cargar lista de jugadores para selector
  useEffect(() => {
    const run = async () => {
      setLoadingJugadores(true)
      try {
        const list = await apostadoresApi.getAll()
        setJugadores(list)
      } finally {
        setLoadingJugadores(false)
      }
    }
    run()
  }, [])

  const kpis = useMemo(() => {
    // Aplicar filtros localmente para asegurar que el dashboard reaccione aunque el backend no filtre perfecto
    const base = data.filter(b => {
      if (filters.status && b.fields.Status !== filters.status) return false
      if (filters.torneo && b.fields.Torneo !== filters.torneo) return false
      if (typeof filters.jornada === 'number' && b.fields.Jornada !== filters.jornada) return false
      if (filters.jugadorId && getJugadorRecordId(b) !== filters.jugadorId) return false
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

    for (const b of base) {
      const t = b.fields.Torneo || '—'
      porTorneo.set(t, (porTorneo.get(t) || 0) + 1)
      const j = Number(b.fields.Jornada || 0)
      if (!Number.isNaN(j)) porJornada.set(j, (porJornada.get(j) || 0) + 1)
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
        const name = String(b.fields.Jugador_Nombre || id)
        const prev = porJugadorPend.get(id)
        porJugadorPend.set(id, { count: (prev?.count || 0) + 1, name })
      }
      if (b.fields.Status === 'Pagada' && b.fields.Comida) {
        comidas.set(String(b.fields.Comida), (comidas.get(String(b.fields.Comida)) || 0) + 1)
      }
    }

    const topPendDet = Array.from(porJugadorPend.entries())
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)))
    const topPend = topPendDet.map(v => [v.name, v.count] as [string, number])

    const topComidas = Array.from(comidas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const jornadasRecientes = Array.from(porJornada.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, 6)

    return { total, pagadas, pendientes, porTorneo, porJornada, topPend, topComidas, recientes: jornadasRecientes, topPendDet }
  }, [data, filters.status, filters.torneo, filters.jornada, filters.jugadorId])

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center"><BarChart2 className="mr-3 text-blue-600" /> Dashboard de Bocanas</h1>
        <div className="flex items-center space-x-2">
          <button onClick={() => setFilters({})} className="px-3 py-2 bg-white text-gray-700 border rounded-lg hover:bg-gray-50">Limpiar filtros</button>
          <button onClick={loadAll} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Actualizar
          </button>
        </div>
      </div>
      {filters.jugadorId && (
        <div className="mb-4">
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
            <h3 className="font-semibold mb-2 flex items-center"><Users size={18} className="mr-2 text-gray-700" /> Top deudores (pendientes)</h3>
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
            <h3 className="font-semibold mb-2">Comidas más pedidas</h3>
            {kpis.topComidas.length === 0 ? <div className="text-gray-500 text-sm">Sin datos</div> : (
              kpis.topComidas.map(([name, val]) => (
                <Bar key={name} label={name} value={val} max={maxComida} />
              ))
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Últimas jornadas</h3>
            {Array.from(kpis.porJornada.entries()).sort((a,b)=>b[0]-a[0]).slice(0,6).map(([jor, val]) => (
              <Bar key={jor} label={`J${jor}`} value={val} max={Math.max(...Array.from(kpis.porJornada.values()), 1)} />
            ))}
          </div>
          {!filters.jugadorId && (
            <div>
              <h3 className="font-semibold mb-2">Por torneo</h3>
              {kpis.porTorneo.size === 0 ? <div className="text-gray-500 text-sm">Sin datos</div> : (
                Array.from(kpis.porTorneo.entries())
                  .sort((a,b)=>b[1]-a[1])
                  .map(([torneo, val]) => (
                    <Bar key={torneo} label={torneo} value={val} max={maxTorneo} />
                  ))
              )}
            </div>
          )}
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

      {/* Lista de pendientes del jugador seleccionado */}
      {filters.jugadorId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <h3 className="font-semibold mb-3">Pendientes de este jugador</h3>
          {data
            .filter(b => b.fields.Status === 'Pendiente' && getJugadorRecordId(b) === filters.jugadorId)
            .sort((a, b) => (a.fields.Torneo || '').localeCompare(b.fields.Torneo || '') || (b.fields.Jornada - a.fields.Jornada))
            .length === 0 ? (
            <div className="text-gray-500 text-sm">Sin pendientes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Jornada</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Torneo</th>
                    <th className="py-2 pr-4">Creación</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter(b => b.fields.Status === 'Pendiente' && getJugadorRecordId(b) === filters.jugadorId)
                    .sort((a, b) => (a.fields.Torneo || '').localeCompare(b.fields.Torneo || '') || (b.fields.Jornada - a.fields.Jornada))
                    .map(b => (
                    <tr key={b.id} className="border-t">
                      <td className="py-2 pr-4">{b.fields.Jornada}</td>
                      <td className="py-2 pr-4">{b.fields.Tipo}</td>
                      <td className="py-2 pr-4">{b.fields.Torneo}</td>
                      <td className="py-2 pr-4">{
                        (() => {
                          const f: any = b.fields as any
                          const c = f['Creación'] || f['Creacion'] || f['creacion']
                          return c ? new Date(c).toLocaleString() : '—'
                        })()
                      }</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
