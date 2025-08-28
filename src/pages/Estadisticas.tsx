import React from 'react';
import { useEstadisticas } from '../hooks/useEstadisticas';
import { useApostadores } from '../hooks/useApostadores';
import { useApuestas } from '../hooks/useApuestas';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  DollarSign,
  Award,
  Users,
  Target,
  Calendar,
  Activity
} from 'lucide-react';

const Estadisticas: React.FC = () => {
  const { estadisticas, loading: statsLoading } = useEstadisticas();
  const { apostadores } = useApostadores();
  const { apuestas } = useApuestas();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Cálculos adicionales
  const getTopApostadores = () => {
    return apostadores
      .map(apostador => {
        const apuestasApostador = apuestas.filter(a => a.fields.Apostador_ID === apostador.id);
        const totalApostado = apuestasApostador.reduce((sum, a) => sum + a.fields.Monto, 0);
        const apuestasGanadas = apuestasApostador.filter(a => a.fields.Estado === 'Ganada').length;
        const apuestasPerdidas = apuestasApostador.filter(a => a.fields.Estado === 'Perdida').length;
        const balance = apuestasApostador.reduce((sum, a) => sum + a.fields.Ganancia_Real, 0);
        const totalApuestas = apuestasGanadas + apuestasPerdidas;
        const tasaExito = totalApuestas > 0 ? (apuestasGanadas / totalApuestas) * 100 : 0;
        
        return {
          ...apostador,
          totalApostado,
          apuestasGanadas,
          apuestasPerdidas,
          balance,
          tasaExito,
          totalApuestas: apuestasApostador.length
        };
      })
      .filter(a => a.totalApuestas > 0)
      .sort((a, b) => b.totalApostado - a.totalApostado)
      .slice(0, 5);
  };

  const getTiposApuesta = () => {
    const tipos = apuestas.reduce((acc, apuesta) => {
      const tipo = apuesta.fields.Tipo_Apuesta;
      if (!acc[tipo]) {
        acc[tipo] = {
          cantidad: 0,
          monto: 0,
          ganadas: 0,
          perdidas: 0
        };
      }
      acc[tipo].cantidad++;
      acc[tipo].monto += apuesta.fields.Monto;
      if (apuesta.fields.Estado === 'Ganada') acc[tipo].ganadas++;
      if (apuesta.fields.Estado === 'Perdida') acc[tipo].perdidas++;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.entries(tipos)
      .map(([tipo, data]) => ({
        tipo,
        ...data,
        tasaExito: data.ganadas + data.perdidas > 0 ? (data.ganadas / (data.ganadas + data.perdidas)) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  };

  const getTorneos = () => {
    const torneos = apuestas.reduce((acc, apuesta) => {
      const torneo = apuesta.fields.Torneo;
      if (!acc[torneo]) {
        acc[torneo] = {
          cantidad: 0,
          monto: 0,
          ganadas: 0,
          perdidas: 0,
          pendientes: 0
        };
      }
      acc[torneo].cantidad++;
      acc[torneo].monto += apuesta.fields.Monto;
      
      switch (apuesta.fields.Estado) {
        case 'Ganada':
          acc[torneo].ganadas++;
          break;
        case 'Perdida':
          acc[torneo].perdidas++;
          break;
        case 'Pendiente':
          acc[torneo].pendientes++;
          break;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.entries(torneos)
      .map(([torneo, data]) => ({
        torneo,
        ...data,
        tasaExito: data.ganadas + data.perdidas > 0 ? (data.ganadas / (data.ganadas + data.perdidas)) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const topApostadores = getTopApostadores();
  const tiposApuesta = getTiposApuesta();
  const torneos = getTorneos();
  
  const tasaExitoGeneral = estadisticas && estadisticas.apuestas_ganadas + estadisticas.apuestas_perdidas > 0
    ? (estadisticas.apuestas_ganadas / (estadisticas.apuestas_ganadas + estadisticas.apuestas_perdidas)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center">
          <BarChart3 size={32} className="mr-3" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              Estadísticas y Análisis
            </h1>
            <p className="text-green-100">
              Análisis detallado del rendimiento de apuestas
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 mr-4">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(tasaExitoGeneral)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 mr-4">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Promedio por Apuesta</p>
              <p className="text-2xl font-bold text-gray-900">
                {estadisticas?.total_apuestas 
                  ? formatMoney((estadisticas.monto_total_apostado || 0) / estadisticas.total_apuestas)
                  : formatMoney(0)
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 mr-4">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">ROI Total</p>
              <p className={`text-2xl font-bold ${
                (estadisticas?.ganancia_real_total || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {estadisticas?.monto_total_apostado 
                  ? formatPercentage(((estadisticas.ganancia_real_total || 0) / estadisticas.monto_total_apostado) * 100)
                  : '0.0%'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 mr-4">
              <Award size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Mejor Racha</p>
              <p className="text-2xl font-bold text-gray-900">
                {estadisticas?.apuestas_ganadas || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top apostadores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <Users size={20} className="text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Top Apostadores
              </h2>
            </div>
          </div>
          <div className="p-6">
            {topApostadores.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay datos suficientes</p>
            ) : (
              <div className="space-y-4">
                {topApostadores.map((apostador, index) => (
                  <div key={apostador.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-sm mr-3 ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {apostador.fields.Nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {apostador.totalApuestas} apuestas • Éxito: {formatPercentage(apostador.tasaExito)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatMoney(apostador.totalApostado)}
                      </p>
                      <p className={`text-sm font-medium ${
                        apostador.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatMoney(apostador.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tipos de apuesta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <PieChart size={20} className="text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Tipos de Apuesta
              </h2>
            </div>
          </div>
          <div className="p-6">
            {tiposApuesta.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {tiposApuesta.slice(0, 6).map((tipo, index) => (
                  <div key={tipo.tipo} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-3 h-3 rounded-full mr-3`} style={{
                        backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
                      }}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {tipo.tipo}
                        </p>
                        <p className="text-xs text-gray-600">
                          {tipo.cantidad} apuestas • Éxito: {formatPercentage(tipo.tasaExito)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatMoney(tipo.monto)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Torneos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <Award size={20} className="text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Rendimiento por Torneo
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torneo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apuestas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ganadas/Perdidas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa de Éxito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pendientes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {torneos.map((torneo) => (
                <tr key={torneo.torneo} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {torneo.torneo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {torneo.cantidad}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatMoney(torneo.monto)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="text-green-600 font-medium">{torneo.ganadas}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-medium">{torneo.perdidas}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      torneo.tasaExito >= 60 ? 'text-green-600' :
                      torneo.tasaExito >= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatPercentage(torneo.tasaExito)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {torneo.pendientes}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <TrendingUp size={20} className="text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Resumen Financiero
            </h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-3">
                <DollarSign size={24} className="mx-auto text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Total Invertido
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatMoney(estadisticas?.monto_total_apostado || 0)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-yellow-50 rounded-lg mb-3">
                <Calendar size={24} className="mx-auto text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                En Juego
              </h3>
              <p className="text-2xl font-bold text-yellow-600">
                {formatMoney(estadisticas?.monto_pendiente || 0)}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`p-4 rounded-lg mb-3 ${
                (estadisticas?.ganancia_real_total || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {(estadisticas?.ganancia_real_total || 0) >= 0 ? (
                  <TrendingUp size={24} className="mx-auto text-green-600" />
                ) : (
                  <TrendingDown size={24} className="mx-auto text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Balance Total
              </h3>
              <p className={`text-2xl font-bold ${
                (estadisticas?.ganancia_real_total || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatMoney(estadisticas?.ganancia_real_total || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;