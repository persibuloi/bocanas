import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApuestas } from '../hooks/useApuestas';
import { useApostadores } from '../hooks/useApostadores';
import {
  PlusCircle,
  ArrowLeft,
  Calculator,
  TrendingUp,
  User,
  Trophy,
  DollarSign
} from 'lucide-react';

const NuevaApuesta: React.FC = () => {
  const navigate = useNavigate();
  const { crearApuesta } = useApuestas();
  const { apostadores, fetchApostadores } = useApostadores();
  
  const [formData, setFormData] = useState({
    apostador_id: '',
    torneo: '',
    tipo_apuesta: '',
    descripcion: '',
    monto: '',
    odds: '',
    resultado_esperado: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ganancia, setGanancia] = useState(0);

  // Opciones alineadas con Airtable (Single select)
  const tiposApuesta = [
    'Match',
    'Over/Under',
    'H2H',
    'Serie',
    'Frame',
    'Prop'
  ];

  // Opciones alineadas con Airtable (Single select)
  const torneos = [
    'X Empresarial',
    'XI Empresarial',
    'XII Empresarial'
  ];

  useEffect(() => {
    fetchApostadores();
  }, [fetchApostadores]);

  useEffect(() => {
    const monto = parseFloat(formData.monto) || 0;
    const odds = parseFloat(formData.odds) || 0;
    setGanancia(monto * odds);
  }, [formData.monto, formData.odds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.apostador_id || !formData.torneo || !formData.tipo_apuesta || !formData.monto || !formData.odds) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await crearApuesta({
        Apostador_ID: formData.apostador_id,
        Torneo: formData.torneo,
        Tipo_Apuesta: formData.tipo_apuesta,
        Descripcion: formData.descripcion,
        Monto: parseFloat(formData.monto),
        Odds: parseFloat(formData.odds),
        Resultado_Esperado: formData.resultado_esperado,
        Estado: 'Pendiente'
      });
      
      // Resetear formulario
      setFormData({
        apostador_id: '',
        torneo: '',
        tipo_apuesta: '',
        descripcion: '',
        monto: '',
        odds: '',
        resultado_esperado: ''
      });
      
      // Navegar al dashboard
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Error creando apuesta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver
        </button>
        
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center">
            <PlusCircle size={32} className="mr-4" />
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Nueva Apuesta
              </h1>
              <p className="text-green-100">
                Registra una nueva apuesta deportiva
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculadora de ganancia */}
      {(formData.monto || formData.odds) && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="flex items-center mb-2">
            <Calculator size={20} className="text-emerald-600 mr-2" />
            <h3 className="text-sm font-semibold text-emerald-800">Cálculo de Ganancia</h3>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            Ganancia potencial: {formatMoney(ganancia)}
          </div>
          <div className="text-sm text-emerald-600 mt-1">
            {formData.monto ? formatMoney(parseFloat(formData.monto)) : '€0'} × {formData.odds || '0'}x = {formatMoney(ganancia)}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trophy size={20} className="mr-2 text-blue-600" />
            Información de la Apuesta
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Apostador y Torneo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User size={16} className="mr-1 text-gray-500" />
                Apostador *
              </label>
              <select
                name="apostador_id"
                value={formData.apostador_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="">Selecciona un apostador</option>
                {apostadores
                  .filter(apostador => apostador.fields.Activo)
                  .map(apostador => (
                    <option key={apostador.id} value={apostador.id}>
                      {apostador.fields.Nombre}
                    </option>
                  ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Trophy size={16} className="mr-1 text-gray-500" />
                Torneo *
              </label>
              <select
                name="torneo"
                value={formData.torneo}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="">Selecciona un torneo</option>
                {torneos.map(torneo => (
                  <option key={torneo} value={torneo}>
                    {torneo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de Apuesta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Apuesta *
            </label>
            <select
              name="tipo_apuesta"
              value={formData.tipo_apuesta}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
            >
              <option value="">Selecciona el tipo de apuesta</option>
              {tiposApuesta.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Monto y Odds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign size={16} className="mr-1 text-gray-500" />
                Monto Apostado (€) *
              </label>
              <input
                type="number"
                name="monto"
                value={formData.monto}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <TrendingUp size={16} className="mr-1 text-gray-500" />
                Cuota (Odds) *
              </label>
              <input
                type="number"
                name="odds"
                value={formData.odds}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                required
                placeholder="1.50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Resultado Esperado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resultado Esperado
            </label>
            <input
              type="text"
              name="resultado_esperado"
              value={formData.resultado_esperado}
              onChange={handleInputChange}
              placeholder="Ej: Juan ganará con más de 180 puntos"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción Adicional
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              placeholder="Notas adicionales sobre la apuesta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 resize-none"
            />
          </div>
        </div>

        {/* Botón de enviar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <PlusCircle size={16} className="mr-2" />
                  Registrar Apuesta
                </>
              )}
            </button>
          </div>
          
          {/* Resumen de ganancia */}
          {ganancia > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Si esta apuesta es ganada, la ganancia será: 
                <span className="font-bold text-green-600 ml-1">
                  {formatMoney(ganancia)}
                </span>
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default NuevaApuesta;