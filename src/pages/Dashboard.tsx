import React, { useEffect } from 'react';
import { useEstadisticas } from '../hooks/useEstadisticas';
import { useApuestas } from '../hooks/useApuestas';
import { useApostadores } from '../hooks/useApostadores';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Award,
  BarChart3,
  PlusCircle,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { estadisticas, loading: statsLoading, refetch: refetchStats } = useEstadisticas();
  const { apuestas: apuestasPendientes, loading: apuestasLoading } = useApuestas({ estado: 'Pendiente' });
  const { apostadores } = useApostadores();

  useEffect(() => {
    // Refrescar estadísticas cada 30 segundos
    const interval = setInterval(refetchStats, 30000);
    return () => clearInterval(interval);
  }, [refetchStats]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Ganada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Perdida':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statsCards = [
    {
      title: 'Total Apuestas',
      value: estadisticas?.total_apuestas || 0,
      icon: BarChart3,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: null
    },
    {
      title: 'Apostadores Activos',
      value: estadisticas?.apostadores_activos || 0,
      icon: Users,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: null
    },
    {
      title: 'Monto Total Apostado',
      value: formatMoney(estadisticas?.monto_total_apostado || 0),
      icon: DollarSign,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: null
    },
    {
      title: 'Ganancia Total',
      value: formatMoney(estadisticas?.ganancia_real_total || 0),
      icon: estadisticas && estadisticas.ganancia_real_total >= 0 ? TrendingUp : TrendingDown,
      color: estadisticas && estadisticas.ganancia_real_total >= 0 
        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
        : 'bg-gradient-to-r from-red-500 to-red-600',
      change: estadisticas && estadisticas.ganancia_real_total >= 0 ? 'positivo' : 'negativo'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Dashboard de Apuestas
            </h1>
            <p className="text-green-100 text-sm sm:text-base">
              Sistema de gestión para torneos de boliche
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link
              to="/nueva-apuesta"
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition-colors duration-200"
            >
              <PlusCircle size={16} className="mr-2" />
              Nueva Apuesta
            </Link>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${card.color} mr-4`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apuestas pendientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock size={20} className="text-yellow-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Apuestas Pendientes
                </h2>
              </div>
              <span className="text-sm text-gray-500">
                {apuestasPendientes.length} total
              </span>
            </div>
          </div>
          <div className="p-6">
            {apuestasLoading ? (
              <div className="animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg mb-3"></div>
                ))}
              </div>
            ) : apuestasPendientes.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No hay apuestas pendientes</p>
                <Link
                  to="/nueva-apuesta"
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Crear nueva apuesta
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {apuestasPendientes.slice(0, 5).map((apuesta) => {
                  const apostador = apostadores.find(a => a.id === apuesta.fields.Apostador_ID);
                  return (
                    <div key={apuesta.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Award size={16} className="text-green-600" />
                          <span className="font-medium text-gray-900">
                            {apostador?.fields.Nombre || 'Apostador desconocido'}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          getEstadoColor(apuesta.fields.Estado)
                        }`}>
                          {apuesta.fields.Estado}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>{apuesta.fields.Torneo}</strong> - {apuesta.fields.Tipo_Apuesta}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {formatMoney(apuesta.fields.Monto)} @ {apuesta.fields.Odds}x
                        </span>
                        <span className="font-medium text-green-600">
                          Ganancia: {formatMoney(apuesta.fields.Ganancia_Potencial)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(apuesta.fields.Fecha_Creacion)}
                      </p>
                    </div>
                  );
                })}
                {apuestasPendientes.length > 5 && (
                  <div className="text-center pt-4">
                    <Link
                      to="/historial?filter=pendiente"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 hover:text-green-800 border border-green-200 hover:border-green-300 rounded-lg transition-colors duration-200"
                    >
                      <Eye size={16} className="mr-2" />
                      Ver todas ({apuestasPendientes.length - 5} más)
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <BarChart3 size={20} className="text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Resumen Rápido
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Gráfico de estado de apuestas */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Estado de Apuestas</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Pendientes</span>
                    </div>
                    <span className="text-sm font-medium">
                      {estadisticas?.apuestas_pendientes || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Ganadas</span>
                    </div>
                    <span className="text-sm font-medium">
                      {estadisticas?.apuestas_ganadas || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Perdidas</span>
                    </div>
                    <span className="text-sm font-medium">
                      {estadisticas?.apuestas_perdidas || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos financieros */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Datos Financieros</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">En juego</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {formatMoney(estadisticas?.monto_pendiente || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Potencial ganancia</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatMoney(estadisticas?.ganancia_potencial_pendiente || 0)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Balance total</span>
                      <span className={`text-sm font-bold ${
                        (estadisticas?.ganancia_real_total || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatMoney(estadisticas?.ganancia_real_total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex space-x-3">
                  <Link
                    to="/historial"
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors duration-200"
                  >
                    Ver Historial
                  </Link>
                  <Link
                    to="/estadisticas"
                    className="flex-1 text-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 border border-green-200 hover:border-green-300 rounded-lg transition-colors duration-200"
                  >
                    Estadísticas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;