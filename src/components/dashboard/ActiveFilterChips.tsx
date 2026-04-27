import React from 'react'
import { X } from 'lucide-react'
import { DashboardFilters } from './FilterSheet'

interface ActiveFilterChipsProps {
  filters: DashboardFilters
  jugadorName?: string
  onClear: (key: keyof DashboardFilters) => void
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({ filters, jugadorName, onClear }) => {
  const chips: Array<{ key: keyof DashboardFilters; label: string }> = []
  if (filters.status) chips.push({ key: 'status', label: filters.status })
  if (filters.torneo) chips.push({ key: 'torneo', label: filters.torneo })
  if (typeof filters.jornada === 'number') chips.push({ key: 'jornada', label: `Jornada ${filters.jornada}` })
  if (filters.jugadorId) chips.push({ key: 'jugadorId', label: jugadorName || 'Jugador' })
  if (filters.comida) chips.push({ key: 'comida', label: filters.comida })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(c => (
        <button
          key={c.key}
          onClick={() => onClear(c.key)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary active:bg-primary/15"
        >
          {c.label}
          <X size={12} strokeWidth={2.5} />
        </button>
      ))}
    </div>
  )
}

export default ActiveFilterChips
