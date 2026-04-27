import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  PlusCircle,
  Search,
  Target,
  Trophy,
  User,
  Utensils,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useApostadores } from '../hooks/useApostadores'
import { useComidaOptions } from '../hooks/useComidaOptions'
import { bocanasApi } from '../lib/airtable'
import { TORNEOS, Torneo } from '../lib/torneos'

const TIPOS = ['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100'] as const
type Tipo = (typeof TIPOS)[number]

const initials = (name: unknown): string => {
  const raw = Array.isArray(name) ? name[0] : name
  const str = typeof raw === 'string' ? raw : String(raw ?? '')
  const parts = str.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?'
}

const Section: React.FC<{
  step: number
  title: string
  hint?: string
  children: React.ReactNode
}> = ({ step, title, hint, children }) => (
  <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
    <header className="mb-4 flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
      </div>
    </header>
    {children}
  </section>
)

const Chip: React.FC<{
  active: boolean
  onClick: () => void
  children: React.ReactNode
  error?: boolean
}> = ({ active, onClick, children, error }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
      active
        ? 'border-primary bg-primary text-white shadow-sm shadow-primary/25'
        : error
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
    }`}
  >
    {children}
  </button>
)

const NuevaBocana: React.FC = () => {
  const navigate = useNavigate()
  const { apostadores, loading: loadingJugadores } = useApostadores()
  const { comidas } = useComidaOptions()

  const [jugadorId, setJugadorId] = useState('')
  const [jugadorQuery, setJugadorQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [torneo, setTorneo] = useState<Torneo | ''>('')
  const [jornada, setJornada] = useState<string>('')
  const [tipo, setTipo] = useState<Tipo | ''>('')
  const [status, setStatus] = useState<'Pendiente' | 'Pagada'>('Pendiente')
  const [comida, setComida] = useState('')
  const [customComida, setCustomComida] = useState('')
  const [usingCustom, setUsingCustom] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<'jugador' | 'torneo' | 'jornada' | 'tipo' | 'comida', string>>>({})

  // Cargar últimos valores usados
  useEffect(() => {
    const j = localStorage.getItem('ultima_jornada_bocana') || ''
    const t = localStorage.getItem('ultimo_torneo_bocana') as Torneo | null
    const tp = localStorage.getItem('ultimo_tipo_bocana') as Tipo | null
    if (j) setJornada(j)
    if (t && (TORNEOS as readonly string[]).includes(t)) setTorneo(t)
    if (tp && (TIPOS as readonly string[]).includes(tp)) setTipo(tp)
  }, [])

  const filteredJugadores = useMemo(() => {
    const q = jugadorQuery.trim().toLowerCase()
    if (!q) return apostadores.slice(0, 8)
    return apostadores.filter(a => a.fields.Nombre.toLowerCase().includes(q)).slice(0, 8)
  }, [apostadores, jugadorQuery])

  const selectedJugador = apostadores.find(a => a.id === jugadorId)

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!jugadorId) next.jugador = 'Seleccioná un jugador'
    if (!torneo) next.torneo = 'Requerido'
    const jn = Number(jornada)
    if (!jornada || Number.isNaN(jn) || jn < 1) next.jornada = 'Mínimo 1'
    if (!tipo) next.tipo = 'Requerido'
    if (status === 'Pagada') {
      const c = (usingCustom ? customComida : comida).trim()
      if (!c) next.comida = 'Si está pagada, indicá la comida'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !torneo || !tipo) return

    setSubmitting(true)
    try {
      const comidaFinal =
        status === 'Pagada' ? (usingCustom ? customComida.trim() : comida.trim()) : undefined
      const created = await bocanasApi.create({
        Jugador_ID: jugadorId,
        Torneo: torneo,
        Jornada: Number(jornada),
        Tipo: tipo,
        Status: status,
        Comida: comidaFinal,
      })

      // Persistir últimos valores
      localStorage.setItem('ultima_jornada_bocana', jornada)
      localStorage.setItem('ultimo_torneo_bocana', torneo)
      localStorage.setItem('ultimo_tipo_bocana', tipo)

      if (comidaFinal && !created.fields.Comida) {
        toast('Bocana creada, pero la comida no se guardó (verificá Airtable)', {
          icon: '⚠️',
          duration: 5000,
        })
      } else {
        toast.success('Bocana registrada')
      }
      navigate('/bocanas')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const selectJugador = (id: string, name: string) => {
    setJugadorId(id)
    setJugadorQuery(name)
    setShowSuggestions(false)
    setErrors(prev => ({ ...prev, jugador: undefined }))
  }

  const clearJugador = () => {
    setJugadorId('')
    setJugadorQuery('')
    setShowSuggestions(true)
  }

  const isValid =
    !!jugadorId &&
    !!torneo &&
    !!tipo &&
    !!jornada &&
    Number(jornada) >= 1 &&
    (status === 'Pendiente' || (usingCustom ? !!customComida.trim() : !!comida))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-gray-50/85 backdrop-blur-md">
        <div className="px-4 pb-3 pt-4 sm:px-6 lg:px-10 lg:pt-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 active:bg-gray-100"
          >
            <ArrowLeft size={14} />
            Volver
          </button>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Registro
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Nueva bocana
              </h1>
            </div>
            <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <PlusCircle size={20} />
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3 px-4 pb-32 pt-2 sm:px-6 lg:px-10">
        <Section step={1} title="Jugador" hint="Buscá por nombre o seleccioná de la lista">
          {selectedJugador ? (
            <div className="flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-sm font-bold text-white">
                {initials(selectedJugador.fields.Nombre)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {selectedJugador.fields.Nombre}
                </p>
                <p className="text-[11px] text-gray-500">Jugador seleccionado</p>
              </div>
              <button
                type="button"
                onClick={clearJugador}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200 active:bg-gray-50"
                aria-label="Cambiar"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={jugadorQuery}
                onChange={e => {
                  setJugadorQuery(e.target.value)
                  setShowSuggestions(true)
                  setJugadorId('')
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={loadingJugadores ? 'Cargando jugadores…' : 'Buscar jugador…'}
                className={`h-12 w-full rounded-xl bg-white pl-10 pr-4 text-base outline-none ring-1 transition-colors placeholder:text-gray-400 ${
                  errors.jugador ? 'ring-red-300 focus:ring-red-400' : 'ring-gray-200 focus:ring-primary'
                }`}
              />

              {showSuggestions && filteredJugadores.length > 0 && (
                <ul className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-gray-100">
                  {filteredJugadores.map(a => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => selectJugador(a.id, a.fields.Nombre)}
                        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left active:bg-gray-50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-bold text-gray-600">
                          {initials(a.fields.Nombre)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{a.fields.Nombre}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {errors.jugador && <p className="mt-2 text-xs text-red-600">{errors.jugador}</p>}
        </Section>

        <Section step={2} title="Torneo y jornada">
          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <Trophy size={12} /> Torneo
              </label>
              <div className="flex flex-wrap gap-2">
                {TORNEOS.map(t => (
                  <Chip
                    key={t}
                    active={torneo === t}
                    error={!!errors.torneo && torneo !== t}
                    onClick={() => {
                      setTorneo(t)
                      setErrors(prev => ({ ...prev, torneo: undefined }))
                    }}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
              {errors.torneo && <p className="mt-2 text-xs text-red-600">{errors.torneo}</p>}
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <Calendar size={12} /> Jornada
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={jornada}
                onChange={e => {
                  setJornada(e.target.value)
                  setErrors(prev => ({ ...prev, jornada: undefined }))
                }}
                placeholder="Ej. 5"
                className={`h-12 w-full rounded-xl bg-white px-4 text-base outline-none ring-1 transition-colors ${
                  errors.jornada ? 'ring-red-300 focus:ring-red-400' : 'ring-gray-200 focus:ring-primary'
                }`}
              />
              {errors.jornada && <p className="mt-2 text-xs text-red-600">{errors.jornada}</p>}
            </div>
          </div>
        </Section>

        <Section step={3} title="Tipo de penalidad">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map(t => (
              <Chip
                key={t}
                active={tipo === t}
                error={!!errors.tipo && tipo !== t}
                onClick={() => {
                  setTipo(t)
                  setErrors(prev => ({ ...prev, tipo: undefined }))
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Target size={12} />
                  {t}
                </span>
              </Chip>
            ))}
          </div>
          {errors.tipo && <p className="mt-2 text-xs text-red-600">{errors.tipo}</p>}
        </Section>

        <Section step={4} title="Estado" hint="Si está pagada, indicá qué comida fue">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            {(['Pendiente', 'Pagada'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  status === s
                    ? s === 'Pagada'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-600 active:text-gray-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {status === 'Pagada' && (
            <div className="mt-4 space-y-3 rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800">
                <Utensils size={14} />
                <span className="text-xs font-semibold uppercase tracking-wide">Comida pagada</span>
              </div>

              {!usingCustom ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {comidas.map(c => (
                      <Chip
                        key={c}
                        active={comida === c}
                        onClick={() => {
                          setComida(c)
                          setErrors(prev => ({ ...prev, comida: undefined }))
                        }}
                      >
                        {c}
                      </Chip>
                    ))}
                    <Chip
                      active={false}
                      onClick={() => {
                        setUsingCustom(true)
                        setComida('')
                      }}
                    >
                      ✨ Otra
                    </Chip>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customComida}
                    onChange={e => {
                      setCustomComida(e.target.value)
                      setErrors(prev => ({ ...prev, comida: undefined }))
                    }}
                    autoFocus
                    placeholder="Escribí el nombre…"
                    className="h-11 flex-1 rounded-xl bg-white px-4 text-sm outline-none ring-1 ring-emerald-200 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUsingCustom(false)
                      setCustomComida('')
                    }}
                    className="rounded-xl bg-white px-3 text-xs font-medium text-gray-600 ring-1 ring-gray-200 active:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {errors.comida && <p className="text-xs text-red-600">{errors.comida}</p>}
            </div>
          )}
        </Section>
      </form>

      <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-gray-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:bottom-0 lg:left-72">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="rounded-xl px-4 py-3 text-sm font-medium text-gray-600 active:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !isValid}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-colors active:bg-emerald-700 disabled:bg-gray-300 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Registrar bocana
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NuevaBocana
