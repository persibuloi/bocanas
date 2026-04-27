import React from 'react'
import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import { TORNEOS, Torneo } from '../../lib/torneos'

export interface DashboardFilters {
  status?: 'Pendiente' | 'Pagada'
  torneo?: Torneo
  jornada?: number
  jugadorId?: string
  comida?: string
}

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DashboardFilters
  onChange: (next: DashboardFilters) => void
  onClear: () => void
  jugadores: Array<{ id: string; name: string }>
  comidas: string[]
}

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'border-primary bg-primary text-white'
        : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
    }`}
  >
    {children}
  </button>
)

const FilterSheet: React.FC<FilterSheetProps> = ({
  open,
  onOpenChange,
  filters,
  onChange,
  onClear,
  jugadores,
  comidas,
}) => {
  const setField = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const activeCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[88vh] flex-col rounded-t-3xl bg-white outline-none">
          <Drawer.Title className="sr-only">Filtros</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-gray-200" />

          <header className="flex items-center justify-between px-5 pb-3 pt-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
              <p className="text-xs text-gray-500">
                {activeCount === 0 ? 'Sin filtros activos' : `${activeCount} filtro${activeCount === 1 ? '' : 's'} activo${activeCount === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {activeCount > 0 && (
                <button
                  onClick={onClear}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 active:bg-gray-100"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={!filters.status} onClick={() => setField('status', undefined)}>
                  Todas
                </Chip>
                <Chip
                  active={filters.status === 'Pendiente'}
                  onClick={() => setField('status', 'Pendiente')}
                >
                  Pendientes
                </Chip>
                <Chip
                  active={filters.status === 'Pagada'}
                  onClick={() => setField('status', 'Pagada')}
                >
                  Pagadas
                </Chip>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Torneo</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={!filters.torneo} onClick={() => setField('torneo', undefined)}>
                  Todos
                </Chip>
                {TORNEOS.map(t => (
                  <Chip
                    key={t}
                    active={filters.torneo === t}
                    onClick={() => setField('torneo', t)}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Jornada
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={filters.jornada ?? ''}
                onChange={e => {
                  const v = e.target.value
                  setField('jornada', v === '' ? undefined : Math.max(1, Number(v)))
                }}
                placeholder="Ej. 5"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Jugador
              </label>
              <select
                value={filters.jugadorId ?? ''}
                onChange={e => setField('jugadorId', e.target.value || undefined)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-primary"
              >
                <option value="">Todos los jugadores</option>
                {jugadores.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>

            {comidas.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Comida</p>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!filters.comida} onClick={() => setField('comida', undefined)}>
                    Todas
                  </Chip>
                  {comidas.map(c => (
                    <Chip
                      key={c}
                      active={filters.comida === c}
                      onClick={() => setField('comida', c)}
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={() => onOpenChange(false)}
              className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-white shadow-md shadow-primary/30 active:bg-emerald-700"
            >
              Aplicar filtros
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default FilterSheet
