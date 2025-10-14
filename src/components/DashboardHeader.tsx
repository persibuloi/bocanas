import React from 'react';
import { 
  BarChart2, 
  RefreshCw, 
  Filter, 
  Download, 
  Share2,
  Settings,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh: () => void;
  onClearFilters: () => void;
  onExport?: () => void;
  onShare?: () => void;
  loading?: boolean;
  lastUpdated?: Date;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  onClearFilters,
  onExport,
  onShare,
  loading = false,
  lastUpdated
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        <div className="w-full h-full bg-white rounded-full transform translate-x-32 -translate-y-32"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10">
        <div className="w-full h-full bg-white rounded-full transform -translate-x-16 translate-y-16"></div>
      </div>
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{title}</h1>
              {subtitle && (
                <p className="text-blue-100 text-lg">{subtitle}</p>
              )}
              {lastUpdated && (
                <div className="flex items-center mt-2 text-blue-200 text-sm">
                  <Calendar size={14} className="mr-1" />
                  Actualizado: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all backdrop-blur-sm flex items-center space-x-2"
            >
              <Filter size={16} />
              <span>Limpiar filtros</span>
            </button>
            
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all backdrop-blur-sm flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>
            
            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all backdrop-blur-sm flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Exportar</span>
              </button>
            )}
            
            {onShare && (
              <button
                onClick={onShare}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all backdrop-blur-sm flex items-center space-x-2"
              >
                <Share2 size={16} />
                <span>Compartir</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Indicadores de rendimiento */}
        <div className="mt-6 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <TrendingUp size={16} className="text-green-300" />
            <span className="text-sm text-blue-100">Dashboard en tiempo real</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-100">Conectado a Airtable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
