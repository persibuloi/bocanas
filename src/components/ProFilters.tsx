import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Calendar,
  Users,
  Target,
  Clock,
  Utensils,
  Sparkles,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface ProFiltersProps {
  filters: {
    status?: string;
    torneo?: string;
    jornada?: number;
    jugadorId?: string;
    comida?: string;
  };
  onFiltersChange: (filters: any) => void;
  jugadores: Array<{ id: string; fields: { Nombre: string } }>;
  loading?: boolean;
}

const statusOptions: FilterOption[] = [
  { value: 'Pendiente', label: 'Pendientes', icon: <Clock size={14} />, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'Pagada', label: 'Pagadas', icon: <CheckCircle2 size={14} />, color: 'bg-green-100 text-green-800 border-green-300' }
];

const torneoOptions: FilterOption[] = [
  { value: 'X Empresarial', label: 'X Empresarial', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'XI Empresarial', label: 'XI Empresarial', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { value: 'XII Empresarial', label: 'XII Empresarial', color: 'bg-pink-100 text-pink-800 border-pink-300' }
];

const ProFilters: React.FC<ProFiltersProps> = ({
  filters,
  onFiltersChange,
  jugadores,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({
      status: undefined,
      torneo: undefined,
      jornada: undefined,
      jugadorId: undefined,
      comida: undefined
    });
  };

  const removeFilter = (filterKey: string) => {
    onFiltersChange({ [filterKey]: undefined });
  };

  const filteredJugadores = jugadores.filter(j => 
    j.fields.Nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden mb-8">
      {/* Header del panel de filtros */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filtros Inteligentes</h3>
              <p className="text-sm text-gray-600">
                {activeFiltersCount > 0 ? `${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} activo${activeFiltersCount !== 1 ? 's' : ''}` : 'Personaliza tu vista'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              <Filter size={16} className="mr-1" />
              {showAdvanced ? 'Ocultar' : 'Avanzado'}
              <ChevronDown size={16} className={`ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                <RotateCcw size={16} className="mr-1" />
                Limpiar Todo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filtros rápidos con chips */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Sparkles size={16} className="mr-2 text-blue-500" />
            Filtros Rápidos
          </h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ status: filters.status === option.value ? undefined : option.value })}
                className={`
                  inline-flex items-center px-4 py-2 rounded-full border-2 transition-all duration-200 font-medium text-sm
                  ${filters.status === option.value 
                    ? option.color + ' shadow-md scale-105' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {option.icon}
                <span className="ml-2">{option.label}</span>
                {filters.status === option.value && (
                  <X size={14} className="ml-2" />
                )}
              </button>
            ))}
            
            {torneoOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ torneo: filters.torneo === option.value ? undefined : option.value })}
                className={`
                  inline-flex items-center px-4 py-2 rounded-full border-2 transition-all duration-200 font-medium text-sm
                  ${filters.torneo === option.value 
                    ? option.color + ' shadow-md scale-105' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <Target size={14} className="mr-2" />
                {option.label}
                {filters.torneo === option.value && (
                  <X size={14} className="ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <Filter size={16} className="mr-2 text-indigo-500" />
              Filtros Avanzados
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Búsqueda de jugador */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Jugador</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar jugador..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {searchTerm && (
                  <div className="max-h-40 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {filteredJugadores.slice(0, 5).map(jugador => (
                      <button
                        key={jugador.id}
                        onClick={() => {
                          onFiltersChange({ jugadorId: jugador.id });
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center space-x-2 transition-colors"
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {jugador.fields.Nombre[0].toUpperCase()}
                        </div>
                        <span className="text-sm">{jugador.fields.Nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selector de jornada */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Jornada</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={filters.jornada ?? ''}
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : undefined
                      const normalized = typeof val === 'number' ? (val >= 1 ? val : 1) : undefined
                      onFiltersChange({ jornada: normalized })
                    }}
                    placeholder="Número de jornada"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Filtro de comida */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Comida</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Utensils size={16} className="text-gray-400" />
                  </div>
                  <select
                    value={filters.comida || ''}
                    onChange={e => onFiltersChange({ comida: e.target.value || undefined })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none"
                  >
                    <option value="">Todas las comidas</option>
                    {/* Opciones de comida se cargarán dinámicamente */}
                    <option value="Boneless">🍽️ Boneless</option>
                    <option value="Pizza">🍽️ Pizza</option>
                    <option value="Churrasco Bocas">🍽️ Churrasco Bocas</option>
                    <option value="Paninni Churrasco">🍽️ Paninni Churrasco</option>
                    <option value="Quesadilla">🍽️ Quesadilla</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chips de filtros activos */}
        {activeFiltersCount > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Filter size={16} className="mr-2 text-green-500" />
                Filtros Activos
              </h4>
              <span className="text-xs text-gray-500">{activeFiltersCount} aplicado{activeFiltersCount !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <div className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full text-sm font-medium">
                  <Clock size={12} className="mr-1" />
                  Estado: {filters.status}
                  <button
                    onClick={() => removeFilter('status')}
                    className="ml-2 hover:bg-yellow-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              {filters.torneo && (
                <div className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-sm font-medium">
                  <Target size={12} className="mr-1" />
                  {filters.torneo}
                  <button
                    onClick={() => removeFilter('torneo')}
                    className="ml-2 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              {filters.jugadorId && (
                <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-sm font-medium">
                  <Users size={12} className="mr-1" />
                  {jugadores.find(j => j.id === filters.jugadorId)?.fields.Nombre || 'Jugador'}
                  <button
                    onClick={() => removeFilter('jugadorId')}
                    className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              {typeof filters.jornada === 'number' && (
                <div className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-full text-sm font-medium">
                  <Calendar size={12} className="mr-1" />
                  Jornada {filters.jornada}
                  <button
                    onClick={() => removeFilter('jornada')}
                    className="ml-2 hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              {filters.comida && (
                <div className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 border border-orange-300 rounded-full text-sm font-medium">
                  <Utensils size={12} className="mr-1" />
                  {filters.comida}
                  <button
                    onClick={() => removeFilter('comida')}
                    className="ml-2 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProFilters;
