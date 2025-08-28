import React, { useEffect, useMemo, useState } from 'react'
import { useBocanas } from '../hooks/useBocanas'
import { useApostadores } from '../hooks/useApostadores'
import { CheckCircle, Filter, Loader2, Search, Trash2, Utensils, XCircle } from 'lucide-react'

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

  const { apostadores, fetchApostadores } = useApostadores()
  const { bocanas, loading, fetchBocanas, eliminarBocana, actualizarBocana, hasMore, loadingMore, loadMore } = useBocanas({
    status: status || undefined,
    torneo: torneo || undefined,
    jugadorId: jugadorId || undefined,
    jugadorNombre: jugadorNombre || undefined,
    jornada: jornada ? Number(jornada) : undefined,
  })

  useEffect(() => {
    fetchApostadores()
  }, [fetchApostadores])

  const clearFilters = () => {
    setStatus('')
    setTorneo('')
    setJugadorId('')
    setJugadorNombre('')
    setJornada('')
    setSearch('')
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return bocanas
    return bocanas.filter(b => {
      const n = b.fields.Jugador_Nombre?.toLowerCase() || ''
      const t = b.fields.Torneo?.toLowerCase() || ''
      const tipo = b.fields.Tipo?.toLowerCase() || ''
      const comida = b.fields.Comida?.toLowerCase() || ''
      return [n, t, tipo, comida, String(b.fields.Jornada)].some(v => v.includes(term))
    })
  }, [bocanas, search])

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

  const remove = async (id: string) => {
    await eliminarBocana(id)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Utensils size={28} className="mr-3 text-blue-600" /> Bocanas
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={clearFilters} className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Torneo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jornada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
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
                filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.fields.Jugador_Nombre || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.fields.Torneo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.fields.Jornada}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.fields.Tipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{b.fields.Status === 'Pendiente' ? '-' : b.fields.Comida}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.fields.Status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {b.fields.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {b.fields.Status === 'Pendiente' && payingId !== b.id && (
                        <button onClick={() => startPay(b.id, b.fields.Comida)} className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
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
                      <button onClick={() => remove(b.id)} className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        <Trash2 size={16} className="mr-1" /> Eliminar
                      </button>
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
