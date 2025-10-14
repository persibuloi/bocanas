import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApostadores } from '../hooks/useApostadores'
import { useBocanas } from '../hooks/useBocanas'
import { ArrowLeft, PlusCircle, User, Trophy, Calendar } from 'lucide-react'

const tipos = ['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100'] as const
const torneos = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const
// La comida se define SOLO al momento de marcar como pagada en el listado

const NuevaBocana: React.FC = () => {
  const navigate = useNavigate()
  const { apostadores, loading, fetchApostadores } = useApostadores()
  const { crearBocana } = useBocanas()

  const [form, setForm] = useState({
    jugador_id: '',
    torneo: '',
    jornada: '',
    tipo: '',
    status: 'Pendiente' as 'Pendiente' | 'Pagada',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [jugadorQuery, setJugadorQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Lista filtrada para el autocomplete (evita usar hooks dentro del JSX)
  const filteredApostadores = useMemo(() => {
    const q = jugadorQuery.trim().toLowerCase()
    if (!q) return apostadores.slice(0, 8)
    return apostadores.filter(a => a.fields.Nombre.toLowerCase().includes(q)).slice(0, 8)
  }, [apostadores, jugadorQuery])

  // Forzar una carga al montar, para asegurar que el select tenga datos
  useEffect(() => {
    fetchApostadores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia de la última jornada capturada
  useEffect(() => {
    const j = localStorage.getItem('ultima_jornada_bocana')
    if (j) {
      setForm(prev => ({ ...prev, jornada: j }))
    }
  }, [])

  // Persistencia del último torneo seleccionado
  useEffect(() => {
    const t = localStorage.getItem('ultimo_torneo_bocana')
    if (t) {
      setForm(prev => ({ ...prev, torneo: t }))
    }
  }, [])

  // Persistencia del último tipo seleccionado
  useEffect(() => {
    const tp = localStorage.getItem('ultimo_tipo_bocana')
    if (tp) {
      setForm(prev => ({ ...prev, tipo: tp }))
    }
  }, [])

  // Persistencia del último jugador seleccionado
  useEffect(() => {
    const jg = localStorage.getItem('ultimo_jugador_bocana')
    if (jg) {
      setForm(prev => ({ ...prev, jugador_id: jg }))
      // Establecer query con el nombre si existe
      const name = apostadores.find(a => a.id === jg)?.fields.Nombre
      if (name) setJugadorQuery(name)
    }
  }, [apostadores])

  const validate = () => {
    const e: { [k: string]: string } = {}
    if (!form.jugador_id) e.jugador_id = 'Selecciona un jugador'
    if (!form.torneo) e.torneo = 'Selecciona un torneo'
    const jNum = Number(form.jornada)
    if (!form.jornada) e.jornada = 'Ingresa la jornada'
    else if (!Number.isFinite(jNum) || jNum < 1) e.jornada = 'La jornada debe ser un número ≥ 1'
    if (!form.tipo) e.tipo = 'Selecciona un tipo'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'jornada') {
      localStorage.setItem('ultima_jornada_bocana', value)
    }
    if (name === 'torneo') {
      localStorage.setItem('ultimo_torneo_bocana', value)
    }
    if (name === 'tipo') {
      localStorage.setItem('ultimo_tipo_bocana', value)
    }
    // Validación instantánea
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setSubmitting(true)
      await crearBocana({
        Jugador_ID: form.jugador_id,
        Torneo: form.torneo as typeof torneos[number],
        Jornada: Number(form.jornada),
        Tipo: form.tipo as typeof tipos[number],
        Status: form.status,
      })
      navigate('/bocanas')
    } finally {
      setSubmitting(false)
    }
  }

  const clearForm = () => {
    setForm({ jugador_id: '', torneo: '', jornada: '', tipo: '', status: 'Pendiente' })
    setJugadorQuery('')
    setErrors({})
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200">
          <ArrowLeft size={20} className="mr-2" /> Volver
        </button>
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center">
            <PlusCircle size={32} className="mr-4" />
            <div>
              <h1 className="text-2xl font-bold mb-1">Nueva Bocana</h1>
              <p className="text-green-100">Registra una penalidad de comida</p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            clearForm()
          }
        }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <PlusCircle size={20} className="mr-2 text-blue-600" />
            Información de la Bocana
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User size={16} className="mr-1 text-gray-500" /> Jugador *
              </label>
              <input
                type="text"
                value={jugadorQuery}
                onChange={(e) => {
                  setJugadorQuery(e.target.value)
                  setShowSuggestions(true)
                  // Al escribir, limpiar selección hasta confirmar
                  setForm(prev => ({ ...prev, jugador_id: '' }))
                  setErrors(prev => ({ ...prev, jugador_id: '' }))
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={loading ? 'Cargando jugadores...' : 'Escribe para buscar...'}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 disabled:bg-gray-100"
              />
              {errors.jugador_id && <p className="mt-1 text-xs text-red-600">{errors.jugador_id}</p>}
              {showSuggestions && jugadorQuery.trim() && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                  {filteredApostadores.map(a => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => {
                          setForm(prev => ({ ...prev, jugador_id: a.id }))
                          setJugadorQuery(a.fields.Nombre)
                          setShowSuggestions(false)
                          localStorage.setItem('ultimo_jugador_bocana', a.id)
                          setErrors(prev => ({ ...prev, jugador_id: '' }))
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      >{a.fields.Nombre}</button>
                    ))}
                  {filteredApostadores.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">Sin coincidencias</div>
                  )}
                </div>
              )}
              {!loading && apostadores.length === 0 && (
                <button type="button" onClick={fetchApostadores} className="mt-2 text-sm text-blue-600 hover:underline">Reintentar cargar jugadores</button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Trophy size={16} className="mr-1 text-gray-500" /> Torneo *
              </label>
              <select name="torneo" value={form.torneo} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200">
                <option value="">Selecciona un torneo</option>
                {torneos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.torneo && <p className="mt-1 text-xs text-red-600">{errors.torneo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar size={16} className="mr-1 text-gray-500" /> Jornada *
              </label>
              <input
                type="number"
                name="jornada"
                min="1"
                value={form.jornada}
                onChange={(e) => {
                  const v = e.target.value
                  const n = Number(v)
                  const norm = v === '' ? '' : String(Number.isFinite(n) ? Math.max(1, Math.trunc(n)) : '')
                  setForm(prev => ({ ...prev, jornada: norm as any }))
                  setErrors(prev => ({ ...prev, jornada: '' }))
                  localStorage.setItem('ultima_jornada_bocana', String(norm))
                }}
                placeholder="Ej: 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              />
              {errors.jornada && <p className="mt-1 text-xs text-red-600">{errors.jornada}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select name="tipo" value={form.tipo} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200">
                <option value="">Selecciona un tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select name="status" value={form.status} onChange={onChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200">
                <option value="Pendiente">Pendiente</option>
                <option value="Pagada">Pagada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center">
              {submitting ? 'Guardando...' : (<><PlusCircle size={16} className="mr-2" /> Registrar Bocana</>)}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default NuevaBocana
