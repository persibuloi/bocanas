import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Trophy, 
  Calendar,
  Target,
  Utensils
} from 'lucide-react';
import { Bocana } from '../lib/airtable';

interface MobileBocanaCardProps {
  bocana: Bocana;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPayment: () => void;
}

const MobileBocanaCard: React.FC<MobileBocanaCardProps> = ({
  bocana,
  isSelected,
  onToggleSelect,
  onPayment
}) => {
  const isPending = bocana.fields.Status === 'Pendiente';

  const torneoColor = (t?: string) => {
    switch (t) {
      case 'X Empresarial': return 'bg-purple-100 text-purple-700';
      case 'XI Empresarial': return 'bg-indigo-100 text-indigo-700';
      case 'XII Empresarial': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const comidaColor = (c?: string) => {
    switch (c) {
      case 'Boneless': return 'bg-amber-100 text-amber-700';
      case 'Pizza': return 'bg-red-100 text-red-700';
      case 'Churrasco Bocas': return 'bg-emerald-100 text-emerald-700';
      case 'Paninni Churrasco': return 'bg-cyan-100 text-cyan-700';
      case 'Quesadilla': return 'bg-lime-100 text-lime-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border-2 transition-all duration-200 p-3 mb-3
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
        ${isPending ? 'hover:border-yellow-300' : 'hover:border-green-300'}
      `}
    >
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {(bocana.fields.Jugador_Nombre || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{bocana.fields.Jugador_Nombre || 'Sin nombre'}</p>
          </div>
        </div>
        
        {isPending ? (
          <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            <Clock size={10} className="mr-1" />
            Pendiente
          </div>
        ) : (
          <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle size={10} className="mr-1" />
            Pagada
          </div>
        )}
      </div>

      {/* Detalles en una sola columna para móvil */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Trophy size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600">Torneo:</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${torneoColor(bocana.fields.Torneo)}`}>
            {bocana.fields.Torneo || '—'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Calendar size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600">Jornada:</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-700 font-bold text-xs">{bocana.fields.Jornada}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Target size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600">Tipo:</span>
          </div>
          <span className="text-xs text-gray-700 font-medium">{bocana.fields.Tipo}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Utensils size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600">Comida:</span>
          </div>
          {bocana.fields.Comida ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${comidaColor(bocana.fields.Comida)}`}>
              {bocana.fields.Comida}
            </span>
          ) : (
            <span className="text-xs text-gray-400">Sin asignar</span>
          )}
        </div>
      </div>

      {/* Botón de pago para pendientes */}
      {isPending && (
        <button
          onClick={onPayment}
          className="w-full inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
        >
          <Utensils size={14} className="mr-2" />
          Pagar Bocana
        </button>
      )}
    </div>
  );
};

export default MobileBocanaCard;
