import React from 'react'
import { Layers } from 'lucide-react'

interface TorneoDistributionProps {
  data: Array<{ name: string; value: number }>
  onSelect?: (torneo: string) => void
  active?: string
}

const COLORS: Record<string, string> = {
  'X Empresarial': 'bg-purple-500',
  'XI Empresarial': 'bg-indigo-500',
  'XII Empresarial': 'bg-pink-500',
}

const TorneoDistribution: React.FC<TorneoDistributionProps> = ({ data, onSelect, active }) => {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
      <header className="mb-4 flex items-center gap-2">
        <Layers size={18} className="text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-900">Distribución por torneo</h3>
      </header>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Sin datos</p>
      ) : (
        <ul className="space-y-3">
          {data.map(d => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
            const color = COLORS[d.name] || 'bg-gray-400'
            const isActive = active === d.name
            return (
              <li key={d.name}>
                <button
                  onClick={() => onSelect?.(d.name)}
                  className={`block w-full rounded-xl p-2.5 text-left transition-colors ${
                    isActive ? 'bg-gray-100' : 'active:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{d.name}</span>
                    <span className="font-semibold tabular-nums text-gray-700">
                      {d.value} <span className="text-[11px] text-gray-400">· {pct}%</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default TorneoDistribution
