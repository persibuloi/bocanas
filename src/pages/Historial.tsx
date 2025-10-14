import React, { useState, useEffect } from 'react';
import { useApuestas } from '../hooks/useApuestas';
import { useApostadores } from '../hooks/useApostadores';
import { useSearchParams } from 'react-router-dom';
import {
  History,
  Filter,
  Search,
  Edit,
  Trash2,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';

const Historial: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { apostadores } = useApostadores();
  const [filters, setFilters] = useState({
    estado: searchParams.get('filter') === 'pendiente' ? 'Pendiente' : '',
    apostador_id: '',
    torneo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingApuesta, setEditingApuesta] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    Estado: '',
    Resultado_Esperado: '',
    Descripcion: ''
  });
  
  const { apuestas, loading, actualizarApuesta, eliminarApuesta } = useApuestas({
    estado: filters.estado || undefined,
    apostadorId: filters.apostador_id || undefined
  });

  // Filtrar apuestas por término de búsqueda y torneo
  const filteredApuestas = apuestas.filter(apuesta => {
    const apostador = apostadores.find(a => a.id === apuesta.fields.Apostador_ID);
    const nombreApostador = apostador?.fields.Nombre || '';
    
    const matchesSearch = 
      nombreApostador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apuesta.fields.Torneo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apuesta.fields.Tipo_Apuesta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apuesta.fields.Descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTorneo = !filters.torneo || apuesta.fields.Torneo === filters.torneo;
    
    return matchesSearch && matchesTorneo;
  });

  // Obtener lista única de torneos
  const torneos = Array.from(new Set(apuestas.map(a => a.fields.Torneo))).sort();

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

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return <Clock size={16} className="text-yellow-600" />;
      case 'Ganada':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'Perdida':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Actualizar URL params
    const params = new URLSearchParams(searchParams);
    if (key === 'estado' && value === 'Pendiente') {
      params.set('filter', 'pendiente');
    } else {
      params.delete('filter');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ estado: '', apostador_id: '', torneo: '' });
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  const handleEdit = (apuesta: any) => {
    setEditingApuesta(apuesta);
    setEditFormData({
      Estado: apuesta.fields.Estado,
      Resultado_Esperado: apuesta.fields.Resultado_Esperado || '',
      Descripcion: apuesta.fields.Descripcion || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingApuesta) return;
    
    try {
      await actualizarApuesta(editingApuesta.id, {
        Estado: editFormData.Estado as 'Pendiente' | 'Ganada' | 'Perdida',
        Resultado_Esperado: editFormData.Resultado_Esperado,
        Descripcion: editFormData.Descripcion,
        Monto: editingApuesta.fields.Monto,
        Odds: editingApuesta.fields.Odds
      });
      
      setShowEditModal(false);
      setEditingApuesta(null);
    } catch (error) {
      console.error('Error actualizando apuesta:', error);
    }
  };

  const handleDelete = async (id: string, apostadorNombre: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la apuesta de ${apostadorNombre}?`)) {
      try {
        await eliminarApuesta(id);
      } catch (error) {
        console.error('Error eliminando apuesta:', error);
      }
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingApuesta(null);
    setEditFormData({ Estado: '', Resultado_Esperado: '', Descripcion: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center">
          <History size={32} className="mr-3" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              Historial de Apuestas
            </h1>
            <p className="text-green-100">
              Consulta y gestiona todas las apuestas registradas
            </p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <Filter size={20} className="text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          
          {/* Filtro por estado */}
          <select
            value={filters.estado}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Ganada">Ganada</option>
            <option value="Perdida">Perdida</option>
          </select>
          
          {/* Filtro por apostador */}
          <select
            value={filters.apostador_id}
            onChange={(e) => handleFilterChange('apostador_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
          >
            <option value="">Todos los apostadores</option>
            {apostadores.map(apostador => (
              <option key={apostador.id} value={apostador.id}>
                {apostador.fields.Nombre}
              </option>
            ))}
          </select>
          
          {/* Filtro por torneo */}
          <select
            value={filters.torneo}
            onChange={(e) => handleFilterChange('torneo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
          >
            <option value="">Todos los torneos</option>
            {torneos.map(torneo => (
              <option key={torneo} value={torneo}>
                {torneo}
              </option>
            ))}
          </select>
        </div>
        
        {/* Resumen y limpiar filtros */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredApuestas.length}</span> de <span className="font-semibold">{apuestas.length}</span> apuestas
          </div>
          {(filters.estado || filters.apostador_id || filters.torneo || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de apuestas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredApuestas.length === 0 ? (
          <div className="text-center py-12">
            <History size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron apuestas
            </h3>
            <p className="text-gray-500">
              {searchTerm || filters.estado || filters.apostador_id || filters.torneo
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay apuestas registradas'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApuestas.map((apuesta) => {
              const apostador = apostadores.find(a => a.id === apuesta.fields.Apostador_ID);
              const nombreApostador = apostador?.fields.Nombre || 'Apostador desconocido';
              
              return (
                <div key={apuesta.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center font-semibold text-white mr-3">
                          {nombreApostador.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {nombreApostador}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600">
                            <Award size={14} className="mr-1" />
                            <span className="font-medium">{apuesta.fields.Torneo}</span>
                            <span className="mx-2">•</span>
                            <span>{apuesta.fields.Tipo_Apuesta}</span>
                          </div>
                        </div>
                      </div>
                      
                      {apuesta.fields.Descripcion && (
                        <p className="text-gray-600 mb-2 ml-13">
                          {apuesta.fields.Descripcion}
                        </p>
                      )}
                      
                      {apuesta.fields.Resultado_Esperado && (
                        <p className="text-sm text-blue-600 mb-2 ml-13">
                          <strong>Resultado esperado:</strong> {apuesta.fields.Resultado_Esperado}
                        </p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500 ml-13">
                        <Calendar size={14} className="mr-1" />
                        <span>{formatDate(apuesta.fields.Fecha_Creacion)}</span>
                        {apuesta.fields.Fecha_Resolucion && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Resuelto: {formatDate(apuesta.fields.Fecha_Resolucion)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Datos financieros y estado */}
                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <div className="flex flex-col items-start lg:items-end space-y-2">
                        {/* Estado */}
                        <div className="flex items-center">
                          {getEstadoIcon(apuesta.fields.Estado)}
                          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${
                            getEstadoColor(apuesta.fields.Estado)
                          }`}>
                            {apuesta.fields.Estado}
                          </span>
                        </div>
                        
                        {/* Datos financieros */}
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <DollarSign size={14} className="mr-1" />
                            <span>{formatMoney(apuesta.fields.Monto)} @ {apuesta.fields.Odds}x</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Ganancia: </span>
                            <span className={`font-semibold ${
                              apuesta.fields.Estado === 'Ganada' ? 'text-green-600' :
                              apuesta.fields.Estado === 'Perdida' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {apuesta.fields.Estado === 'Pendiente' 
                                ? formatMoney(apuesta.fields.Ganancia_Potencial)
                                : formatMoney(apuesta.fields.Ganancia_Real)
                              }
                            </span>
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(apuesta)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                            title="Editar apuesta"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(apuesta.id, nombreApostador)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                            title="Eliminar apuesta"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {showEditModal && editingApuesta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Apuesta
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {apostadores.find(a => a.id === editingApuesta.fields.Apostador_ID)?.fields.Nombre} - {editingApuesta.fields.Torneo}
              </p>
            </div>
            
            <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  value={editFormData.Estado}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, Estado: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Ganada">Ganada</option>
                  <option value="Perdida">Perdida</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resultado Esperado
                </label>
                <input
                  type="text"
                  value={editFormData.Resultado_Esperado}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, Resultado_Esperado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Descripción del resultado esperado"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editFormData.Descripcion}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, Descripcion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>
            </form>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historial;