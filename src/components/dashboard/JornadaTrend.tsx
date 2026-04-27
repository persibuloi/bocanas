import React from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface JornadaTrendProps {
  data: Array<{ name: string; value: number }>
}

const JornadaTrend: React.FC<JornadaTrendProps> = ({ data }) => {
  const peak = data.reduce((m, d) => (d.value > m ? d.value : m), 0)
  const peakItem = data.find(d => d.value === peak)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
      <header className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-sky-500" />
            <h3 className="text-sm font-semibold text-gray-900">Tendencia por jornada</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {data.length} jornada{data.length === 1 ? '' : 's'} · {total} bocanas
          </p>
        </div>
        {peakItem && (
          <div className="rounded-lg bg-sky-50 px-2.5 py-1 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-sky-600">Pico</p>
            <p className="text-xs font-semibold tabular-nums text-sky-700">
              {peakItem.name} · {peakItem.value}
            </p>
          </div>
        )}
      </header>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Sin datos</p>
      ) : (
        <div className="h-32 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600, color: '#0f172a' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export default JornadaTrend
