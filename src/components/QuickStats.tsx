import React, { useMemo } from 'react';
import { 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Calendar,
  Utensils
} from 'lucide-react';
import { Bocana } from '../lib/airtable';

interface QuickStatsProps {
  bocanas: Bocana[];
  loading?: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ bocanas, loading = false }) => {
  const stats = useMemo(() => {
    const total = bocanas.length;
    const pendientes = bocanas.filter(b => b.fields.Status === 'Pendiente').length;
    const pagadas = bocanas.filter(b => b.fields.Status === 'Pagada').length;
    
    // Jugadores únicos
    const jugadoresUnicos = new Set(
      bocanas.map(b => b.fields.Jugador_Nombre).filter(Boolean)
    ).size;
    
    // Jornadas únicas
    const jornadasUnicas = new Set(
      bocanas.map(b => b.fields.Jornada).filter(Boolean)
    ).size;
    
    // Comida más popular
    const comidasCount = bocanas
      .filter(b => b.fields.Status === 'Pagada' && b.fields.Comida)
      .reduce((acc, b) => {
        const comida = b.fields.Comida!;
        acc[comida] = (acc[comida] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const comidaPopular = Object.entries(comidasCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    
    // Porcentaje de completitud
    const completitud = total > 0 ? Math.round((pagadas / total) * 100) : 0;
    
    return {
      total,
      pendientes,
      pagadas,
      jugadoresUnicos,
      jornadasUnicas,
      comidaPopular,
      completitud
    };
  }, [bocanas]);

  const StatCard: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    trend?: string;
  }> = ({ icon: Icon, label, value, color, trend }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatCard
        icon={Utensils}
        label="Total"
        value={stats.total}
        color="bg-blue-500"
      />
      
      <StatCard
        icon={Clock}
        label="Pendientes"
        value={stats.pendientes}
        color="bg-yellow-500"
        trend={stats.pendientes > 0 ? `${stats.pendientes} por pagar` : 'Todas pagadas'}
      />
      
      <StatCard
        icon={CheckCircle}
        label="Pagadas"
        value={stats.pagadas}
        color="bg-green-500"
        trend={`${stats.completitud}% completado`}
      />
      
      <StatCard
        icon={Users}
        label="Jugadores"
        value={stats.jugadoresUnicos}
        color="bg-purple-500"
      />
      
      <StatCard
        icon={Calendar}
        label="Jornadas"
        value={stats.jornadasUnicas}
        color="bg-indigo-500"
      />
      
      <StatCard
        icon={TrendingUp}
        label="Top Comida"
        value={stats.comidaPopular}
        color="bg-pink-500"
        trend="Más pedida"
      />
    </div>
  );
};

export default QuickStats;
