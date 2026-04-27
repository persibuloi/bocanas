import React from 'react'
import { Bocana } from '../../lib/airtable'
import { Calendar, Check, CircleDashed, Trophy, Utensils } from 'lucide-react'

interface BocanaListItemProps {
  bocana: Bocana
  selected?: boolean
  onToggleSelect?: () => void
  onPay?: () => void
}

const initials = (name: unknown): string => {
  const raw = Array.isArray(name) ? name[0] : name
  const str = typeof raw === 'string' ? raw : String(raw ?? '')
  const parts = str.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?'
}

const TORNEO_DOT: Record<string, string> = {
  'X Empresarial': 'bg-purple-500',
  'XI Empresarial': 'bg-indigo-500',
  'XII Empresarial': 'bg-pink-500',
}

const BocanaListItem: React.FC<BocanaListItemProps> = ({
  bocana,
  selected = false,
  onToggleSelect,
  onPay,
}) => {
  const f = bocana.fields
  const isPending = f.Status === 'Pendiente'
  const torneoDot = TORNEO_DOT[f.Torneo] || 'bg-gray-400'

  return (
    <article
      className={`relative flex items-stretch gap-3 rounded-2xl bg-white p-3 ring-1 transition-shadow ${
        selected ? 'ring-2 ring-primary' : 'ring-gray-100 hover:shadow-md'
      }`}
    >
      {onToggleSelect && (
        <button
          onClick={onToggleSelect}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
            selected
              ? 'bg-primary text-white'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 active:bg-gray-200'
          }`}
          aria-label={selected ? 'Deseleccionar' : 'Seleccionar'}
        >
          {selected ? <Check size={18} strokeWidth={3} /> : initials(f.Jugador_Nombre || '')}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {f.Jugador_Nombre || 'Sin nombre'}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className={`h-1.5 w-1.5 rounded-full ${torneoDot}`} />
              <span>{f.Torneo}</span>
              <span className="text-gray-300">·</span>
              <Calendar size={11} />
              <span>J{f.Jornada}</span>
            </div>
          </div>
          {isPending ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              <CircleDashed size={10} />
              Pendiente
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              <Check size={10} strokeWidth={3} />
              Pagada
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
              <Trophy size={10} />
              {f.Tipo}
            </span>
            {f.Comida && (
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
                <Utensils size={10} />
                {f.Comida}
              </span>
            )}
          </div>
          {isPending && onPay && (
            <button
              onClick={onPay}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm shadow-primary/25 active:bg-emerald-700"
            >
              <Utensils size={12} />
              Pagar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default BocanaListItem
