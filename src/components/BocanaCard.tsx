import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Trophy, 
  Calendar,
  Target,
  Utensils,
  MoreVertical,
  Edit3,
  Share2
} from 'lucide-react';
import { Bocana } from '../lib/airtable';

const comidas = ['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla'] as const;

interface BocanaCardProps {
  bocana: Bocana;
  isSelected: boolean;
  onToggleSelect: () => void;
  onMarkAsPaid: (id: string, comida: string) => Promise<void>;
  onShare: (bocana: Bocana) => void;
}

const BocanaCard: React.FC<BocanaCardProps> = ({
  bocana,
  isSelected,
  onToggleSelect,
  onMarkAsPaid,
  onShare
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedComida, setSelectedComida] = useState<string>(comidas[0]);
  const [processing, setProcessing] = useState(false);

  const isPending = bocana.fields.Status === 'Pendiente';

  const torneoColor = (t?: string) => {
    switch (t) {
      case 'X Empresarial': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'XI Empresarial': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'XII Empresarial': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const comidaColor = (c?: string) => {
    switch (c) {
      case 'Boneless': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Pizza': return 'bg-red-100 text-red-700 border-red-200';
      case 'Churrasco Bocas': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Paninni Churrasco': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Quesadilla': return 'bg-lime-100 text-lime-700 border-lime-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const handleMarkAsPaid = async () => {
    setProcessing(true);
    try {
      await onMarkAsPaid(bocana.id, selectedComida);
      setShowPaymentModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const creationDate = (() => {
    const f: any = bocana.fields as any;
    const c = f['Creación'] || f['Creacion'] || f['creacion'];
    return c ? new Date(c).toLocaleDateString() : '—';
  })();

  return (
    <>
      <div 
        className={`
          bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          ${isPending ? 'hover:border-yellow-300' : 'hover:border-green-300'}
        `}
      >
        {/* Header con checkbox y estado */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                {isPending ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Clock size={12} className="mr-1" />
                    Pendiente
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle size={12} className="mr-1" />
                    Pagada
                  </span>
                )}
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <MoreVertical size={16} className="text-gray-500" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {isPending && (
                      <button
                        onClick={() => {
                          setShowPaymentModal(true);
                          setShowActions(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <CheckCircle size={16} className="mr-2 text-green-600" />
                        Marcar como pagada
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onShare(bocana);
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Share2 size={16} className="mr-2 text-blue-600" />
                      Compartir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-4">
          {/* Jugador */}
          <div className="flex items-center mb-3">
            <User size={16} className="text-gray-500 mr-2" />
            <span className="font-semibold text-gray-900">
              {bocana.fields.Jugador_Nombre || 'Sin nombre'}
            </span>
          </div>

          {/* Detalles en grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center">
              <Trophy size={14} className="text-gray-400 mr-2" />
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${torneoColor(bocana.fields.Torneo)}`}>
                {bocana.fields.Torneo || '—'}
              </span>
            </div>
            
            <div className="flex items-center">
              <Calendar size={14} className="text-gray-400 mr-2" />
              <span className="text-sm text-gray-700">
                Jornada {bocana.fields.Jornada}
              </span>
            </div>
            
            <div className="flex items-center">
              <Target size={14} className="text-gray-400 mr-2" />
              <span className="text-sm text-gray-700">
                {bocana.fields.Tipo}
              </span>
            </div>
            
            <div className="flex items-center">
              <Utensils size={14} className="text-gray-400 mr-2" />
              {bocana.fields.Comida ? (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${comidaColor(bocana.fields.Comida)}`}>
                  {bocana.fields.Comida}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Sin asignar</span>
              )}
            </div>
          </div>

          {/* Footer con fecha */}
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
            Creado: {creationDate}
          </div>
        </div>

        {/* Acción rápida para pendientes */}
        {isPending && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
            >
              <CheckCircle size={16} className="mr-2" />
              Marcar como pagada
            </button>
          </div>
        )}
      </div>

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Marcar como pagada
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Bocana de <strong>{bocana.fields.Jugador_Nombre}</strong> - {bocana.fields.Tipo}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona la comida:
              </label>
              <select
                value={selectedComida}
                onChange={(e) => setSelectedComida(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {comidas.map(comida => (
                  <option key={comida} value={comida}>{comida}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BocanaCard;
