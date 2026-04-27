import React from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart2, Utensils, PlusCircle } from 'lucide-react'

const items = [
  { to: '/bocanas-dashboard', icon: BarChart2, label: 'Resumen' },
  { to: '/bocanas', icon: Utensils, label: 'Bocanas' },
  { to: '/nueva-bocana', icon: PlusCircle, label: 'Nueva' },
] as const

const BottomNav: React.FC = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-gray-500 active:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
