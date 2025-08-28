import React, { useState } from 'react';
import { useApostadores } from '../hooks/useApostadores';
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  TrendingUp
} from 'lucide-react';

const Apostadores: React.FC = () => {
  const { apostadores, loading, crearApostador, actualizarApostador, eliminarApostador } = useApostadores();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingApostador, setEditingApostador] = useState<any>(null);
  const [formData, setFormData] = useState({
    Nombre: '',
    Email: '',
    Telefono: '',
    Activo: true
  });

  const filteredApostadores = (apostadores || []).filter((apostador) => {
    const nombre = apostador?.fields?.Nombre ?? '';
    const email = apostador?.fields?.Email ?? '';
    const term = (searchTerm || '').toLowerCase();
    return nombre.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingApostador) {
        await actualizarApostador(editingApostador.id, formData);
      } else {
        await crearApostador(formData);
      }
      
      // Resetear formulario y cerrar modal
      setFormData({
        Nombre: '',
        Email: '',
        Telefono: '',
        Activo: true
      });
      setEditingApostador(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error guardando apostador:', error);
    }
  };

  const handleEdit = (apostador: any) => {
    setEditingApostador(apostador);
    setFormData({
      Nombre: apostador.fields.Nombre,
      Email: apostador.fields.Email || '',
      Telefono: apostador.fields.Telefono || '',
      Activo: apostador.fields.Activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${nombre}?`)) {
      try {
        await eliminarApostador(id);
      } catch (error) {
        console.error('Error eliminando apostador:', error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingApostador(null);
    setFormData({
      Nombre: '',
      Email: '',
      Telefono: '',
      Activo: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingApostador(null);
    setFormData({
      Nombre: '',
      Email: '',
      Telefono: '',
      Activo: true
    });
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
              <Users size={32} className="mr-3" />
              Gestión de Apostadores
            </h1>
            <p className="text-green-100">
              Administra la lista de apostadores del sistema
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition-colors duration-200"
            >
              <PlusCircle size={16} className="mr-2" />
              Nuevo Apostador
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y estadísticas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar apostadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <UserCheck size={16} className="text-green-600 mr-1" />
              <span className="text-gray-600">Activos: </span>
              <span className="font-semibold ml-1">
                {apostadores.filter(a => a.fields.Activo).length}
              </span>
            </div>
            <div className="flex items-center">
              <UserX size={16} className="text-red-600 mr-1" />
              <span className="text-gray-600">Inactivos: </span>
              <span className="font-semibold ml-1">
                {apostadores.filter(a => !a.fields.Activo).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de apostadores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredApostadores.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron apostadores' : 'No hay apostadores registrados'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? `No hay apostadores que coincidan con "${searchTerm}"`
                : 'Comienza agregando tu primer apostador'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <PlusCircle size={16} className="mr-2" />
                Crear primer apostador
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apostador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estadísticas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApostadores.map((apostador) => (
                  <tr key={apostador.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                          apostador.fields.Activo ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {(apostador.fields.Nombre?.charAt(0) ?? '?').toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {apostador.fields.Nombre ?? 'Sin nombre'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {apostador.fields.Email && (
                          <div className="flex items-center mb-1">
                            <Mail size={14} className="text-gray-400 mr-2" />
                            {apostador.fields.Email}
                          </div>
                        )}
                        {apostador.fields.Telefono && (
                          <div className="flex items-center">
                            <Phone size={14} className="text-gray-400 mr-2" />
                            {apostador.fields.Telefono}
                          </div>
                        )}
                        {!apostador.fields.Email && !apostador.fields.Telefono && (
                          <span className="text-gray-400 text-xs">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                        apostador.fields.Activo
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {apostador.fields.Activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <TrendingUp size={14} className="text-blue-500 mr-1" />
                          <span className="text-xs text-gray-600">Apostado:</span>
                          <span className="font-medium ml-1">
                            {formatMoney(apostador.fields.Total_Apostado || 0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Balance: 
                          <span className={`font-medium ml-1 ${
                            (apostador.fields.Balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatMoney(apostador.fields.Balance || 0)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(apostador.fields.Fecha_Registro)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(apostador)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors duration-200"
                          title="Editar apostador"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(apostador.id, apostador.fields.Nombre)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors duration-200"
                          title="Eliminar apostador"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para crear/editar apostador */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingApostador ? 'Editar Apostador' : 'Nuevo Apostador'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Nombre completo del apostador"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="Telefono"
                  value={formData.Telefono}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                  placeholder="123 456 789"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="Activo"
                  checked={formData.Activo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Apostador activo
                </label>
              </div>
            </form>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {editingApostador ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Apostadores;