import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Zap, 
  Clock,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Utensils,
  Calendar
} from 'lucide-react';
import { Bocana } from '../lib/airtable';

interface AdvancedMetricsProps {
  data: Bocana[];
  loading?: boolean;
}

const AdvancedMetrics: React.FC<AdvancedMetricsProps> = ({ data, loading = false }) => {
  const metrics = React.useMemo(() => {
    if (data.length === 0) return null;

    const total = data.length;
    const pagadas = data.filter(b => b.fields.Status === 'Pagada').length;
    const pendientes = data.filter(b => b.fields.Status === 'Pendiente').length;
    
    // Métricas avanzadas
    const tasaCumplimiento = total > 0 ? (pagadas / total) * 100 : 0;
    const jugadoresUnicos = new Set(data.map(b => b.fields.Jugador_Nombre).filter(Boolean)).size;
    const jornadasActivas = new Set(data.map(b => b.fields.Jornada).filter(Boolean)).size;
    
    // Análisis por torneo
    const porTorneo = data.reduce((acc, b) => {
      const torneo = b.fields.Torneo || 'Sin torneo';
      acc[torneo] = (acc[torneo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const torneoMasActivo = Object.entries(porTorneo)
      .sort(([,a], [,b]) => b - a)[0];
    
    // Análisis de comidas
    const comidasPagadas = data.filter(b => b.fields.Status === 'Pagada' && b.fields.Comida);
    const comidaPopular = comidasPagadas.reduce((acc, b) => {
      const comida = b.fields.Comida!;
      acc[comida] = (acc[comida] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const comidaTop = Object.entries(comidaPopular)
      .sort(([,a], [,b]) => b - a)[0];
    
    // Promedio por jornada
    const promedioPorJornada = jornadasActivas > 0 ? total / jornadasActivas : 0;
    
    // Jugador con más bocanas
    const porJugador = data.reduce((acc, b) => {
      const jugador = b.fields.Jugador_Nombre || 'Sin nombre';
      acc[jugador] = (acc[jugador] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const jugadorTop = Object.entries(porJugador)
      .sort(([,a], [,b]) => b - a)[0];
    
    // Eficiencia (bocanas pagadas en los últimos 7 días)
    const ahora = new Date();
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recientes = data.filter(b => {
      const f: any = b.fields as any;
      const fecha = f['Creación'] || f['Creacion'] || f['creacion'];
      return fecha && new Date(fecha) >= hace7Dias;
    });
    
    return {
      tasaCumplimiento,
      jugadoresUnicos,
      jornadasActivas,
      torneoMasActivo,
      comidaTop,
      promedioPorJornada,
      jugadorTop,
      actividadReciente: recientes.length,
      eficiencia: recientes.length > 0 ? (recientes.filter(b => b.fields.Status === 'Pagada').length / recientes.length) * 100 : 0
    };
  }, [data]);

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    gradient: string;
    trend?: { value: number; isPositive: boolean };
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon: Icon, gradient, trend, onClick }) => (
    <div 
      className={`
        relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-6 
        transition-all duration-300 hover:shadow-xl hover:scale-105 group
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Fondo decorativo */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
              {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          
          <div className={`p-3 ${gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center">
            {trend.isPositive ? (
              <TrendingUp size={16} className="text-green-500 mr-1" />
            ) : (
              <TrendingDown size={16} className="text-red-500 mr-1" />
            )}
            <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Tasa de Cumplimiento"
        value={`${metrics.tasaCumplimiento.toFixed(1)}%`}
        subtitle="Bocanas completadas"
        icon={Target}
        gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        trend={{ value: metrics.tasaCumplimiento, isPositive: metrics.tasaCumplimiento > 70 }}
      />
      
      <MetricCard
        title="Actividad Reciente"
        value={metrics.actividadReciente}
        subtitle="Últimos 7 días"
        icon={Activity}
        gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        trend={{ value: metrics.eficiencia, isPositive: metrics.eficiencia > 50 }}
      />
      
      <MetricCard
        title="Jugadores Activos"
        value={metrics.jugadoresUnicos}
        subtitle="Con bocanas registradas"
        icon={Users}
        gradient="bg-gradient-to-br from-purple-500 to-pink-500"
        trend={{ value: 15, isPositive: true }}
      />
      
      <MetricCard
        title="Promedio/Jornada"
        value={metrics.promedioPorJornada.toFixed(1)}
        subtitle="Bocanas por jornada"
        icon={BarChart3}
        gradient="bg-gradient-to-br from-orange-500 to-red-500"
        trend={{ value: 8, isPositive: true }}
      />
      
      <MetricCard
        title="Torneo Más Activo"
        value={metrics.torneoMasActivo?.[1] || 0}
        subtitle={metrics.torneoMasActivo?.[0] || 'N/A'}
        icon={Award}
        gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
        trend={{ value: 12, isPositive: true }}
      />
      
      <MetricCard
        title="Comida Popular"
        value={metrics.comidaTop?.[1] || 0}
        subtitle={metrics.comidaTop?.[0] || 'N/A'}
        icon={Utensils}
        gradient="bg-gradient-to-br from-pink-500 to-rose-500"
        trend={{ value: metrics.comidaTop?.[1] || 0, isPositive: true }}
      />
      
      <MetricCard
        title="Jornadas Activas"
        value={metrics.jornadasActivas}
        subtitle="Con actividad"
        icon={Calendar}
        gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
        trend={{ value: 5, isPositive: true }}
      />
      
      <MetricCard
        title="Top Jugador"
        value={metrics.jugadorTop?.[1] || 0}
        subtitle={metrics.jugadorTop?.[0] || 'N/A'}
        icon={Zap}
        gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
        trend={{ value: metrics.jugadorTop?.[1] || 0, isPositive: false }}
      />
    </div>
  );
};

export default AdvancedMetrics;
