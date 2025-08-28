import React, { useEffect, useState } from 'react'
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

  const onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'jornada') {
      localStorage.setItem('ultima_jornada_bocana', value)
    }
  }

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault()
    if (!form.jugador_id || !form.torneo || !form.jornada || !form.tipo) return
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

      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <PlusCircle size={20} className="mr-2 text-blue-600" />
            Información de la Bocana
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User size={16} className="mr-1 text-gray-500" /> Jugador *
              </label>
              <select name="jugador_id" value={form.jugador_id} onChange={onChange} required disabled={loading} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 disabled:bg-gray-100">
                {loading ? (
                  <option value="">Cargando jugadores...</option>
                ) : apostadores.length === 0 ? (
                  <option value="">No hay jugadores</option>
                ) : (
                  <>
                    <option value="">Selecciona un jugador</option>
                    {apostadores.map(a => (
                      <option key={a.id} value={a.id}>{a.fields.Nombre}</option>
                    ))}
                  </>
                )}
              </select>
              {!loading && apostadores.length === 0 && (
                <button type="button" onClick={fetchApostadores} className="mt-2 text-sm text-blue-600 hover:underline">Reintentar cargar jugadores</button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Trophy size={16} className="mr-1 text-gray-500" /> Torneo *
              </label>
              <select name="torneo" value={form.torneo} onChange={onChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200">
                <option value="">Selecciona un torneo</option>
                {torneos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar size={16} className="mr-1 text-gray-500" /> Jornada *
              </label>
              <input type="number" name="jornada" min="0" value={form.jornada} onChange={onChange} required placeholder="Ej: 3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select name="tipo" value={form.tipo} onChange={onChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200">
                <option value="">Selecciona un tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
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
