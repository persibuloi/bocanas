import React, { useState } from 'react';
import { 
  Filter, 
  Search, 
  X, 
  Save, 
  Bookmark,
  RotateCcw,
  Calendar,
  Users,
  Trophy
} from 'lucide-react';

interface FilterChip {
  id: string;
  label: string;
  value: string;
  color: string;
}

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
}

interface AdvancedFiltersProps {
  filters: {
    status: string;
    torneo: string;
    jugadorId: string;
    jornada: string;
    search: string;
    comidaFilter: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  apostadores: Array<{ id: string; fields: { Nombre: string } }>;
}

const statuses = ['Pendiente', 'Pagada'] as const;
const torneos = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const;
const comidas = ['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla'] as const;

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  apostadores
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewName, setViewName] = useState('');
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    try {
      const saved = localStorage.getItem('bocanas_saved_views');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Crear chips de filtros activos
  const activeFilters: FilterChip[] = [];
  
  if (filters.status) {
    activeFilters.push({
      id: 'status',
      label: `Estado: ${filters.status}`,
      value: filters.status,
      color: filters.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
    });
  }
  
  if (filters.torneo) {
    activeFilters.push({
      id: 'torneo',
      label: `Torneo: ${filters.torneo}`,
      value: filters.torneo,
      color: 'bg-blue-100 text-blue-800'
    });
  }
  
  if (filters.jugadorId) {
    const jugador = apostadores.find(a => a.id === filters.jugadorId);
    activeFilters.push({
      id: 'jugadorId',
      label: `Jugador: ${jugador?.fields.Nombre || 'Desconocido'}`,
      value: filters.jugadorId,
      color: 'bg-purple-100 text-purple-800'
    });
  }
  
  if (filters.jornada) {
    activeFilters.push({
      id: 'jornada',
      label: `Jornada: ${filters.jornada}`,
      value: filters.jornada,
      color: 'bg-indigo-100 text-indigo-800'
    });
  }
  
  if (filters.comidaFilter) {
    activeFilters.push({
      id: 'comidaFilter',
      label: `Comida: ${filters.comidaFilter}`,
      value: filters.comidaFilter,
      color: 'bg-pink-100 text-pink-800'
    });
  }

  const removeFilter = (filterId: string) => {
    const update: Record<string, any> = {};
    update[filterId] = '';
    onFiltersChange(update);
  };

  const saveCurrentView = () => {
    if (!viewName.trim()) return;
    
    const newView: SavedView = {
      id: Date.now().toString(),
      name: viewName.trim(),
      filters: { ...filters }
    };
    
    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem('bocanas_saved_views', JSON.stringify(updatedViews));
    setViewName('');
    setShowSaveModal(false);
  };

  const loadView = (view: SavedView) => {
    onFiltersChange(view.filters);
  };

  const deleteView = (viewId: string) => {
    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem('bocanas_saved_views', JSON.stringify(updatedViews));
  };

  const quickFilters = [
    {
      label: 'Pendientes',
      action: () => onFiltersChange({ status: 'Pendiente' }),
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
    },
    {
      label: 'Pagadas',
      action: () => onFiltersChange({ status: 'Pagada' }),
      color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
    },
    {
      label: 'XII Empresarial',
      action: () => onFiltersChange({ torneo: 'XII Empresarial' }),
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
      {/* Barra de búsqueda principal */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            placeholder="Buscar por jugador, torneo, tipo o comida..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={activeFilters.length === 0}
          className="inline-flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Guardar vista actual"
        >
          <Save size={16} className="mr-2" />
          Guardar vista
        </button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-600 flex items-center mr-2">
          Filtros rápidos:
        </span>
        {quickFilters.map((filter, index) => (
          <button
            key={index}
            onClick={filter.action}
            className={`px-3 py-1 text-xs border rounded-full transition-colors ${filter.color}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Chips de filtros activos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-600 flex items-center mr-2">
            Filtros activos:
          </span>
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${filter.color}`}
            >
              {filter.label}
              <button
                onClick={() => removeFilter(filter.id)}
                className="ml-2 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
          >
            <RotateCcw size={12} className="mr-1" />
            Limpiar todo
          </button>
        </div>
      )}

      {/* Filtros detallados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center border rounded-lg px-3">
          <Filter size={16} className="text-gray-400 mr-2" />
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value })}
            className="w-full py-2 outline-none bg-transparent"
          >
            <option value="">Todos los estados</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center border rounded-lg px-3">
          <Trophy size={16} className="text-gray-400 mr-2" />
          <select
            value={filters.torneo}
            onChange={(e) => onFiltersChange({ torneo: e.target.value })}
            className="w-full py-2 outline-none bg-transparent"
          >
            <option value="">Todos los torneos</option>
            {torneos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-center border rounded-lg px-3">
          <Users size={16} className="text-gray-400 mr-2" />
          <select
            value={filters.jugadorId}
            onChange={(e) => onFiltersChange({ jugadorId: e.target.value })}
            className="w-full py-2 outline-none bg-transparent"
          >
            <option value="">Todos los jugadores</option>
            {apostadores.map(a => (
              <option key={a.id} value={a.id}>{a.fields.Nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center border rounded-lg px-3">
          <Calendar size={16} className="text-gray-400 mr-2" />
            <input
              type="number"
              min="1"
              value={filters.jornada}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value ? Math.max(1, parseInt(value) || 1) : '';
                onFiltersChange({ jornada: numValue.toString() });
              }}
              placeholder="Jornada (≥1)"
              className="w-full py-2 outline-none"
            />
        </div>
      </div>

      {/* Vistas guardadas */}
      {savedViews.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Bookmark size={16} className="mr-2" />
            Vistas guardadas:
          </h4>
          <div className="flex flex-wrap gap-2">
            {savedViews.map((view) => (
              <div
                key={view.id}
                className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm"
              >
                <button
                  onClick={() => loadView(view)}
                  className="text-gray-700 hover:text-gray-900 mr-2"
                >
                  {view.name}
                </button>
                <button
                  onClick={() => deleteView(view.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para guardar vista */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Guardar vista actual</h3>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Nombre de la vista..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && saveCurrentView()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveCurrentView}
                disabled={!viewName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
