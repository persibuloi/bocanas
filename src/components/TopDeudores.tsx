import React from 'react';
import { 
  Award, 
  TrendingDown, 
  User, 
  Clock,
  MessageCircle,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface TopDeudoresProps {
  deudores: Array<{ id: string; name: string; count: number }>;
  onSelectJugador: (jugadorId: string) => void;
  onShare: () => void;
  loading?: boolean;
}

const TopDeudores: React.FC<TopDeudoresProps> = ({ 
  deudores, 
  onSelectJugador, 
  onShare, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (deudores.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">¡Excelente!</h3>
          <p className="text-green-600">No hay jugadores con bocanas pendientes</p>
        </div>
      </div>
    );
  }

  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🔸';
    }
  };

  const getCardStyle = (index: number, count: number) => {
    if (index === 0) {
      return {
        border: 'border-red-300',
        bg: 'bg-gradient-to-br from-red-50 to-pink-50',
        accent: 'bg-gradient-to-br from-red-500 to-pink-500',
        text: 'text-red-700',
        hover: 'hover:border-red-400 hover:shadow-red-100'
      };
    } else if (index === 1) {
      return {
        border: 'border-orange-300',
        bg: 'bg-gradient-to-br from-orange-50 to-yellow-50',
        accent: 'bg-gradient-to-br from-orange-500 to-yellow-500',
        text: 'text-orange-700',
        hover: 'hover:border-orange-400 hover:shadow-orange-100'
      };
    } else if (index === 2) {
      return {
        border: 'border-amber-300',
        bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
        accent: 'bg-gradient-to-br from-amber-500 to-orange-500',
        text: 'text-amber-700',
        hover: 'hover:border-amber-400 hover:shadow-amber-100'
      };
    } else {
      return {
        border: 'border-gray-300',
        bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
        accent: 'bg-gradient-to-br from-gray-500 to-slate-500',
        text: 'text-gray-700',
        hover: 'hover:border-gray-400 hover:shadow-gray-100'
      };
    }
  };

  const maxCount = Math.max(...deudores.map(d => d.count));

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden max-h-[600px] flex flex-col">
      {/* Header compacto y elegante */}
      <div className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Top Deudores</h3>
              <p className="text-red-100 text-sm">{deudores.length} jugador{deudores.length !== 1 ? 'es' : ''} con bocanas pendientes</p>
            </div>
          </div>
          
          <button
            onClick={onShare}
            className="inline-flex items-center px-3 py-1.5 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all backdrop-blur-sm text-sm font-medium"
          >
            <MessageCircle size={14} className="mr-1" />
            Compartir
          </button>
        </div>
      </div>

      {/* Lista de deudores */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="space-y-2">
          {deudores.map((deudor, index) => {
            const style = getCardStyle(index, deudor.count);
            const percentage = (deudor.count / maxCount) * 100;
            
            return (
              <div
                key={deudor.id}
                onClick={() => onSelectJugador(deudor.id)}
                className={`
                  group relative overflow-hidden rounded-xl border ${style.border} ${style.bg} 
                  p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${style.hover}
                  transform hover:scale-101
                `}
              >
                {/* Barra de progreso de fondo */}
                <div className="absolute inset-0 opacity-20">
                  <div 
                    className={`h-full ${style.accent} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Medalla compacta */}
                    <div className="flex items-center space-x-2">
                      <div className="text-lg">{getMedalEmoji(index)}</div>
                      <div className={`w-6 h-6 ${style.accent} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Avatar compacto */}
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {deudor.name[0].toUpperCase()}
                    </div>
                    
                    {/* Información compacta */}
                    <div>
                      <h4 className={`font-semibold text-sm ${style.text} group-hover:text-gray-900 transition-colors`}>
                        {deudor.name}
                      </h4>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock size={10} className="mr-1" />
                        {deudor.count} pendiente{deudor.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Contador compacto */}
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${style.text}`}>
                        {deudor.count}
                      </div>
                    </div>
                    
                    <ChevronRight 
                      size={16} 
                      className={`${style.text} group-hover:translate-x-1 transition-transform`} 
                    />
                  </div>
                </div>
                
                {/* Indicador de urgencia para el top 3 */}
                {index < 3 && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-3 h-3 ${style.accent} rounded-full animate-pulse`}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Footer compacto */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <TrendingDown size={14} className="text-red-500" />
              <span>Total pendientes: <strong className="text-red-600">{deudores.reduce((sum, d) => sum + d.count, 0)}</strong></span>
            </div>
            <div className="text-xs text-gray-400">
              Click para filtrar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopDeudores;
