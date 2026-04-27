import React from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'info'
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
}

const StatCard: React.FC<StatCardProps> = ({ label, value, hint, icon: Icon, tone = 'default' }) => {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {Icon && (
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
            <Icon size={14} strokeWidth={2.5} />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

export default StatCard
