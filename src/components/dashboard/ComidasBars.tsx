import React from 'react'
import { Utensils } from 'lucide-react'

interface ComidasBarsProps {
  data: Array<{ name: string; count: number }>
  onSelect?: (comida: string) => void
  active?: string
}

const ComidasBars: React.FC<ComidasBarsProps> = ({ data, onSelect, active }) => {
  const max = data.reduce((m, d) => (d.count > m ? d.count : m), 0)

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
      <header className="mb-4 flex items-center gap-2">
        <Utensils size={18} className="text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900">Comidas más pedidas</h3>
      </header>

      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Sin datos</p>
      ) : (
        <ul className="space-y-2.5">
          {data.map((d, idx) => {
            const w = max > 0 ? Math.max(6, Math.round((d.count / max) * 100)) : 0
            const isActive = active === d.name
            return (
              <li key={d.name}>
                <button
                  onClick={() => onSelect?.(d.name)}
                  className={`block w-full rounded-xl p-2 text-left transition-colors ${
                    isActive ? 'bg-orange-50 ring-1 ring-orange-200' : 'active:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 truncate font-medium text-gray-900">
                      <span className="text-[11px] font-semibold text-gray-400 tabular-nums">#{idx + 1}</span>
                      {d.name}
                    </span>
                    <span className="font-semibold tabular-nums text-gray-700">{d.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-500"
                      style={{ width: `${w}%` }}
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

export default ComidasBars
