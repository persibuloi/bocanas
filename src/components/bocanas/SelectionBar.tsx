import React from 'react'
import { CheckCircle2, Download, Share2, X } from 'lucide-react'

interface SelectionBarProps {
  count: number
  pendingCount: number
  onClear: () => void
  onMarkPaid: () => void
  onExport: () => void
  onShare: () => void
}

const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  pendingCount,
  onClear,
  onMarkPaid,
  onExport,
  onShare,
}) => {
  if (count === 0) return null

  return (
    <div className="fixed inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 lg:left-[calc(18rem+1rem)] lg:right-4 lg:bottom-4">
      <div className="rounded-2xl bg-gray-900 p-3 text-white shadow-2xl shadow-gray-900/40">
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 active:bg-white/20"
            aria-label="Limpiar selección"
          >
            <X size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tabular-nums">{count} seleccionada{count === 1 ? '' : 's'}</p>
            {pendingCount > 0 && (
              <p className="text-[11px] text-white/60">{pendingCount} pendiente{pendingCount === 1 ? '' : 's'}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onShare}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 active:bg-white/20"
              aria-label="Compartir"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={onExport}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 active:bg-white/20"
              aria-label="Exportar"
            >
              <Download size={16} />
            </button>
            {pendingCount > 0 && (
              <button
                onClick={onMarkPaid}
                className="ml-1 flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold active:bg-emerald-600"
              >
                <CheckCircle2 size={16} />
                Pagar {pendingCount}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SelectionBar
