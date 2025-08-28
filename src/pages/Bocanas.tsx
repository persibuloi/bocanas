import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBocanas } from '../hooks/useBocanas'
import { useApostadores } from '../hooks/useApostadores'
import { CheckCircle, Filter, Loader2, Search, Utensils, XCircle, Clock } from 'lucide-react'

const statuses = ['Pendiente', 'Pagada'] as const
const torneos = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const
const comidas = ['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla'] as const

const Bocanas: React.FC = () => {
  const [status, setStatus] = useState<(typeof statuses)[number] | ''>('')
  const [torneo, setTorneo] = useState<(typeof torneos)[number] | ''>('')
  const [jugadorId, setJugadorId] = useState<string>('')
  const [jugadorNombre, setJugadorNombre] = useState<string>('')
  const [jornada, setJornada] = useState<string>('')
  const [search, setSearch] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payingComida, setPayingComida] = useState<(typeof comidas)[number] | ''>('')
  const [sort, setSort] = useState<{ key: 'Jugador' | 'Torneo' | 'Jornada' | 'Tipo' | 'Comida' | 'Estado'; dir: 'asc' | 'desc' }>({ key: 'Jornada', dir: 'asc' })
  const [comidaFilter, setComidaFilter] = useState<(typeof comidas)[number] | ''>('')

  const { apostadores, fetchApostadores } = useApostadores()
  const location = useLocation()
  const navigate = useNavigate()
  const { bocanas, loading, fetchBocanas, actualizarBocana, hasMore, loadingMore, loadMore } = useBocanas({
    status: status || undefined,
    torneo: torneo || undefined,
    jugadorId: jugadorId || undefined,
    jugadorNombre: jugadorNombre || undefined,
    jornada: jornada ? Number(jornada) : undefined,
  })

  useEffect(() => {
    fetchApostadores()
  }, [fetchApostadores])

  // Leer filtros desde query params al montar
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qStatus = params.get('status') as any
    const qTorneo = params.get('torneo') as any
    const qJornada = params.get('jornada')
    const qJugadorId = params.get('jugadorId') || ''
    const qComida = params.get('comida') as any
    if (qStatus) setStatus(qStatus)
    if (qTorneo) setTorneo(qTorneo)
    if (qJornada && !Number.isNaN(Number(qJornada))) setJornada(String(Math.max(1, Number(qJornada))))
    if (qJugadorId) setJugadorId(qJugadorId)
    if (qComida) setComidaFilter(qComida)
    // jugadorNombre se derivará al render del select si coincide el id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia: cargar filtros/orden al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bocanas_list_state')
      if (!raw) return
      const s = JSON.parse(raw)
      if (s && typeof s === 'object') {
        if (s.status !== undefined) setStatus(s.status)
        if (s.torneo !== undefined) setTorneo(s.torneo)
        if (s.jugadorId !== undefined) setJugadorId(s.jugadorId)
        if (s.jugadorNombre !== undefined) setJugadorNombre(s.jugadorNombre)
        if (s.jornada !== undefined) setJornada(s.jornada)
        if (s.search !== undefined) setSearch(s.search)
        if (s.comidaFilter !== undefined) setComidaFilter(s.comidaFilter)
        if (s.sort && s.sort.key && s.sort.dir) setSort(s.sort)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia: guardar cuando cambien
  useEffect(() => {
    const payload = {
      status,
      torneo,
      jugadorId,
      jugadorNombre,
      jornada,
      search,
      sort,
      comidaFilter,
    }
    try {
      localStorage.setItem('bocanas_list_state', JSON.stringify(payload))
    } catch {}
  }, [status, torneo, jugadorId, jugadorNombre, jornada, search, sort, comidaFilter])

  const clearFilters = () => {
    setStatus('')
    setTorneo('')
    setJugadorId('')
    setJugadorNombre('')
    setJornada('')
    setComidaFilter('')
    setSearch('')
  }

  const filtered = useMemo(() => {
    let base = bocanas
    if (comidaFilter) {
      base = base.filter(b => (b.fields.Comida || '') === comidaFilter)
    }
    const term = search.trim().toLowerCase()
    if (!term) return base
    return base.filter(b => {
      const n = b.fields.Jugador_Nombre?.toLowerCase() || ''
      const t = b.fields.Torneo?.toLowerCase() || ''
      const tipo = b.fields.Tipo?.toLowerCase() || ''
      const comida = b.fields.Comida?.toLowerCase() || ''
      return [n, t, tipo, comida, String(b.fields.Jornada)].some(v => v.includes(term))
    })
  }, [bocanas, comidaFilter, search])

  const sorted = useMemo(() => {
    const arr = filtered.slice()
    const dirMul = sort.dir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const getVal = (x: typeof a) => {
        switch (sort.key) {
          case 'Jugador': return x.fields.Jugador_Nombre || ''
          case 'Torneo': return x.fields.Torneo || ''
          case 'Jornada': return Number(x.fields.Jornada) || 0
          case 'Tipo': return x.fields.Tipo || ''
          case 'Comida': return x.fields.Comida || ''
          case 'Estado': return x.fields.Status || ''
        }
      }
      const va: any = getVal(a)
      const vb: any = getVal(b)
      if (typeof va === 'number' || typeof vb === 'number') {
        return (Number(va) - Number(vb)) * dirMul
      }
      return String(va).localeCompare(String(vb)) * dirMul
    })
    return arr
  }, [filtered, sort])

  const toggleSort = (key: typeof sort.key) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  const torneoColor = (t?: string) => {
    switch (t) {
      case 'X Empresarial': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'XI Empresarial': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'XII Empresarial': return 'bg-pink-50 text-pink-700 border-pink-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const comidaColor = (c?: string) => {
    switch (c) {
      case 'Boneless': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Pizza': return 'bg-red-50 text-red-700 border-red-200'
      case 'Churrasco Bocas': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Paninni Churrasco': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'Quesadilla': return 'bg-lime-50 text-lime-700 border-lime-200'
      default: return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  const startPay = (id: string, currentComida?: string) => {
    setPayingId(id)
    setPayingComida((currentComida as any) || comidas[0])
  }

  const cancelPay = () => {
    setPayingId(null)
    setPayingComida('')
  }

  const confirmPay = async (id: string) => {
    await actualizarBocana(id, { Status: 'Pagada', Comida: payingComida as any })
    await fetchBocanas()
    cancelPay()
  }

  // Eliminación deshabilitada por requerimiento. Si se requiere en el futuro, restaurar acción aquí.

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Utensils size={28} className="mr-3 text-blue-600" /> Bocanas
        </h1>
        <div>
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (status) params.set('status', String(status))
              if (torneo) params.set('torneo', String(torneo))
              if (jornada) params.set('jornada', String(jornada))
              if (jugadorId) params.set('jugadorId', String(jugadorId))
              if (comidaFilter) params.set('comida', String(comidaFilter))
              navigate(`/bocanas-dashboard?${params.toString()}`)
            }}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Ver en dashboard"
          >Ir al dashboard</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="flex items-center border rounded-lg px-3">
            <Search size={16} className="text-gray-400 mr-2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full py-2 outline-none" />
          </div>
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full py-2 outline-none bg-transparent">
              <option value="">Todos los estados</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select value={torneo} onChange={e => setTorneo(e.target.value as any)} className="w-full py-2 outline-none bg-transparent">
              <option value="">Todos los torneos</option>
              {torneos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select
              value={jugadorId}
              onChange={e => {
                const id = e.target.value
                const name = e.target.selectedOptions?.[0]?.textContent || ''
                if (!id) {
                  setJugadorId('')
                  setJugadorNombre('')
                } else {
                  setJugadorId(id)
                  setJugadorNombre(name)
                }
              }}
              className="w-full py-2 outline-none bg-transparent"
            >
              <option value="">Todos los jugadores</option>
              {apostadores.map(a => <option key={a.id} value={a.id}>{a.fields.Nombre}</option>)}
            </select>
          </div>
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <input
              type="number"
              min="1"
              value={jornada}
              onChange={e => {
                const raw = e.target.value
                if (!raw) { setJornada(''); return }
                const n = Number(raw)
                setJornada(String(Number.isFinite(n) ? Math.max(1, Math.trunc(n)) : ''))
              }}
              placeholder="Jornada (>=1)"
              className="w-full py-2 outline-none"
            />
          </div>
          <div className="flex items-center border rounded-lg px-3">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select value={comidaFilter} onChange={e => setComidaFilter(e.target.value as any)} className="w-full py-2 outline-none bg-transparent">
              <option value="">Todas las comidas</option>
              {comidas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={clearFilters} className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-gray-800" onClick={() => toggleSort('Jugador')}>
                    Jugador {sort.key === 'Jugador' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-gray-800" onClick={() => toggleSort('Torneo')}>
                    Torneo {sort.key === 'Torneo' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-gray-800" onClick={() => toggleSort('Jornada')}>
                    Jornada {sort.key === 'Jornada' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-gray-800" onClick={() => toggleSort('Tipo')}>
                    Tipo {sort.key === 'Tipo' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-gray-800" onClick={() => toggleSort('Comida')}>
                    Comida {sort.key === 'Comida' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-gray-800" onClick={() => toggleSort('Estado')}>
                    Estado {sort.key === 'Estado' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="animate-spin inline mr-2" /> Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Sin resultados</td>
                </tr>
              ) : (
                sorted.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 even:bg-gray-50/40">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.fields.Jugador_Nombre || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${torneoColor(b.fields.Torneo)}`}>
                        {b.fields.Torneo || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.fields.Jornada}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.fields.Tipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {b.fields.Status === 'Pendiente' ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${comidaColor(b.fields.Comida)}`}>{String(b.fields.Comida)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {b.fields.Status === 'Pendiente' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-50 text-yellow-800 border border-yellow-200">
                          <Clock size={14} className="mr-1" /> Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle size={14} className="mr-1" /> Pagada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {b.fields.Status === 'Pendiente' && payingId !== b.id && (
                        <button onClick={() => startPay(b.id, b.fields.Comida)} className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          <CheckCircle size={16} className="mr-1" /> Marcar pagada
                        </button>
                      )}
                      {payingId === b.id && (
                        <div className="inline-flex items-center space-x-2">
                          <select value={payingComida} onChange={e => setPayingComida(e.target.value as any)} className="px-2 py-1 border rounded-md">
                            {comidas.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button onClick={() => confirmPay(b.id)} className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            Confirmar
                          </button>
                          <button onClick={cancelPay} className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            <XCircle size={16} className="mr-1" /> Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loadingMore ? (<><Loader2 className="animate-spin mr-2" size={16} /> Cargando...</>) : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Bocanas
