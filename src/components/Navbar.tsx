import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  History,
  TrendingUp,
  Menu,
  X,
  Utensils,
  BarChart2,
  ChevronRight
} from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Vista general'
    },
    {
      path: '/nueva-apuesta',
      icon: PlusCircle,
      label: 'Nueva Apuesta',
      description: 'Registrar apuesta'
    },
    {
      path: '/bocanas-dashboard',
      icon: BarChart2,
      label: 'Dash Bocanas',
      description: 'KPIs de penalidades'
    },
    {
      path: '/bocanas',
      icon: Utensils,
      label: 'Bocanas',
      description: 'Penalidades de comida'
    },
    {
      path: '/nueva-bocana',
      icon: PlusCircle,
      label: 'Nueva Bocana',
      description: 'Registrar penalidad'
    },
    {
      path: '/apostadores',
      icon: Users,
      label: 'Apostadores',
      description: 'Gestionar usuarios'
    },
    {
      path: '/historial',
      icon: History,
      label: 'Historial',
      description: 'Ver todas las apuestas'
    },
    {
      path: '/estadisticas',
      icon: TrendingUp,
      label: 'Estadísticas',
      description: 'Análisis y reportes'
    }
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Header móvil mejorado */}
      <div className="lg:hidden bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-bold text-sm">BB</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Bowling Bets</h1>
            <p className="text-[10px] font-medium text-gray-500 tracking-wide uppercase">Manager</p>
          </div>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2.5 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors duration-200"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Overlay con blur */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Rediseñado */}
      <div id="sidebar-navigation" className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-2xl lg:shadow-none transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="hidden lg:flex flex-col items-center justify-center h-24 px-6 border-b border-gray-50 bg-gradient-to-b from-white to-gray-50/50">
          <div className="flex items-center space-x-3 w-full">
            <div className="w-10 h-10 bg-primary rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-lg">BB</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Bowling Bets</h1>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">Management System</p>
            </div>
          </div>
        </div>

        {/* Navegación Scrollable */}
        <nav className="h-[calc(100%-6rem)] overflow-y-auto px-4 py-6 scrollbar-hide">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`
                    group relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ease-in-out
                    ${isActive 
                      ? 'bg-primary/5 text-primary font-semibold shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full transform -translate-x-4" />
                  )}
                  
                  <Icon 
                    size={22} 
                    className={`mr-3.5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  <div className="flex-1">
                    <span className="block text-[15px] leading-none mb-0.5">{item.label}</span>
                    <span className={`text-[11px] font-medium transition-colors duration-200 ${
                      isActive ? 'text-primary/70' : 'text-gray-400 group-hover:text-gray-500'
                    }`}>
                      {item.description}
                    </span>
                  </div>

                  {isActive && <ChevronRight size={16} className="text-primary/50 ml-2" />}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer User Profile */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 bg-white">
          <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-9 h-9 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:border-gray-200 transition-colors">
              <Users size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Administrador</p>
              <p className="text-xs text-gray-400 truncate">admin@bowling.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
