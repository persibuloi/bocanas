import React from 'react';
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
} from 'lucide-react';
import { useState } from 'react';

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Header móvil */}
      <div className="lg:hidden bg-white shadow-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BB</span>
          </div>
          <h1 className="text-lg font-bold text-gray-800">
            Bowling Bets
          </h1>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          aria-label={isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="sidebar-navigation"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div id="sidebar-navigation" className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Desktop */}
        <div className="hidden lg:flex items-center justify-center h-16 px-6 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">BB</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              Bowling Bets
            </h1>
          </div>
        </div>

        {/* Navegación */}
        <nav className="mt-6 lg:mt-0 px-4 pb-4 flex-1">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }
                  `}
                >
                  <Icon size={20} className="mr-3" />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className={`text-xs ${
                      isActive ? 'text-white opacity-80' : 'text-gray-400'
                    }`}>
                      {item.description}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer del sidebar */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">v1</span>
            </div>
            <div>
              <p className="font-medium text-gray-700">Bowling Betting</p>
              <p className="text-xs">Sistema de Apuestas</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;