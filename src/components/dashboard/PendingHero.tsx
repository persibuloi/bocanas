import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface PendingHeroProps {
  pendientes: number
  pagadas: number
  total: number
}

const PendingHero: React.FC<PendingHeroProps> = ({ pendientes, pagadas, total }) => {
  const pct = total > 0 ? Math.round((pagadas / total) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-emerald-700 p-5 text-white shadow-lg shadow-primary/20">
      <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-emerald-100">
          <AlertCircle size={16} />
          <p className="text-xs font-medium uppercase tracking-wider">Bocanas pendientes</p>
        </div>

        <div className="mt-3 flex items-end gap-3">
          <p className="text-5xl font-bold leading-none tabular-nums">{pendientes}</p>
          <p className="pb-1 text-sm text-emerald-100">de {total} totales</p>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] font-medium text-emerald-100">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={12} />
              {pagadas} pagadas
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingHero
