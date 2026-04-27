import React from 'react'
import { Trophy, Share2, ChevronRight } from 'lucide-react'

interface Deudor {
  id: string
  name: string
  count: number
}

interface TopDeudoresListProps {
  deudores: Deudor[]
  max?: number
  onSelect?: (id: string) => void
  onShare?: () => void
}

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?'
}

const TopDeudoresList: React.FC<TopDeudoresListProps> = ({ deudores, max = 5, onSelect, onShare }) => {
  const list = deudores.slice(0, max)
  const top = list[0]?.count || 1

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Top deudores</h3>
        </div>
        {onShare && list.length > 0 && (
          <button
            onClick={onShare}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 active:bg-emerald-100"
            aria-label="Compartir top deudores"
          >
            <Share2 size={14} />
          </button>
        )}
      </header>

      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Sin pendientes 🎉</p>
      ) : (
        <ul className="space-y-2.5">
          {list.map((d, idx) => {
            const w = Math.max(8, Math.round((d.count / top) * 100))
            const isPodium = idx < 3
            const medal = ['🥇', '🥈', '🥉'][idx]
            return (
              <li key={d.id}>
                <button
                  onClick={() => onSelect?.(d.id)}
                  className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors active:bg-gray-50"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-bold text-gray-600">
                    {initials(d.name)}
                    {isPodium && (
                      <span className="absolute -right-1 -top-1 text-base">{medal}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{d.name}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-semibold tabular-nums text-gray-900">{d.count}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-gray-300 group-active:text-gray-500" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default TopDeudoresList
