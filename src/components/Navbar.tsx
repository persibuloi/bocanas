import React from 'react'
import { NavLink } from 'react-router-dom'
import { PlusCircle, Utensils, BarChart2, ChevronRight } from 'lucide-react'

const navItems = [
  { path: '/bocanas-dashboard', icon: BarChart2, label: 'Resumen', description: 'KPIs y métricas' },
  { path: '/bocanas', icon: Utensils, label: 'Bocanas', description: 'Lista y pagos' },
  { path: '/nueva-bocana', icon: PlusCircle, label: 'Nueva Bocana', description: 'Registrar penalidad' },
]

const Navbar: React.FC = () => {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col lg:bg-white lg:border-r lg:border-gray-100">
      <div className="flex h-20 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30">
          <span className="text-base font-bold">BB</span>
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">Bowling Bets</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Bocanas Manager</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold leading-tight">{item.label}</p>
                      <p className="text-[11px] text-gray-400">{item.description}</p>
                    </div>
                    {isActive && <ChevronRight size={16} className="text-primary/60" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-white text-sm font-bold">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">Administrador</p>
            <p className="truncate text-[11px] text-gray-500">admin@bowling.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Navbar
