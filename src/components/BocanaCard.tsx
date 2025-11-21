import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Trophy, 
  Calendar,
  Target,
  Utensils,
  MoreHorizontal,
  Share2,
  Check,
  X
} from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import { Bocana } from '../lib/airtable';

const comidasSugeridas = ['Boneless', 'Pizza', 'Churrasco Bocas', 'Paninni Churrasco', 'Quesadilla', 'Tajadas Con queso'];

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
  const [selectedComida, setSelectedComida] = useState<string>(comidasSugeridas[0]);
  const [customComida, setCustomComida] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [processing, setProcessing] = useState(false);
  const isMobile = useIsMobile();

  const isPending = bocana.fields.Status === 'Pendiente';

  const getTorneoBadge = (t?: string) => {
    const style = (() => {
      switch (t) {
        case 'X Empresarial': return 'bg-purple-50 text-purple-700 ring-purple-500/30';
        case 'XI Empresarial': return 'bg-indigo-50 text-indigo-700 ring-indigo-500/30';
        case 'XII Empresarial': return 'bg-pink-50 text-pink-700 ring-pink-500/30';
        default: return 'bg-gray-50 text-gray-700 ring-gray-500/30';
      }
    })();
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${style}`}>
        {t || '—'}
      </span>
    );
  };

  const getComidaBadge = (c?: string) => {
    // Generar color consistente basado en el string
    const colors = [
      'bg-amber-50 text-amber-700 ring-amber-600/20',
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
      'bg-rose-50 text-rose-700 ring-rose-600/20',
    ];
    const idx = c ? c.length % colors.length : 0;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${colors[idx]}`}>
        {c}
      </span>
    );
  };

  const handleMarkAsPaid = async () => {
    setProcessing(true);
    try {
      const comidaFinal = isCustom ? customComida : selectedComida;
      if (!comidaFinal) return; // Validación básica
      await onMarkAsPaid(bocana.id, comidaFinal);
      setShowPaymentModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const creationDate = (() => {
    const f: any = bocana.fields as any;
    const c = f['Creación'] || f['Creacion'] || f['creacion'];
    return c ? new Date(c).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—';
  })();

  return (
    <>
      <div 
        className={`
          group relative bg-white rounded-xl transition-all duration-300 
          ${isSelected 
            ? 'ring-2 ring-blue-500 shadow-md z-10' 
            : 'ring-1 ring-gray-200 hover:shadow-lg hover:ring-gray-300'
          }
        `}
      >
        {/* Indicador de selección sutil */}
        <div className="absolute top-4 left-4 z-20">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className={`
                appearance-none w-5 h-5 rounded-md border-2 transition-all cursor-pointer
                ${isSelected 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-white border-gray-300 group-hover:border-blue-400'
                }
              `}
            />
            <Check 
              size={12} 
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} 
            />
          </div>
        </div>

        {/* Menú de acciones */}
        <div className="absolute top-3 right-3 z-20">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 animate-in fade-in zoom-in-95 duration-200">
                  {isPending && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPaymentModal(true);
                        setShowActions(false);
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CheckCircle size={16} className="mr-2.5 text-green-600" />
                      Marcar pagada
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(bocana);
                      setShowActions(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Share2 size={16} className="mr-2.5 text-blue-600" />
                    Compartir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-5 pt-12">
          {/* Header Info */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {bocana.fields.Jugador_Nombre || 'Jugador desconocido'}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} />
                <span>Jornada {bocana.fields.Jornada}</span>
                <span className="text-gray-300">•</span>
                <span>{creationDate}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isPending ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                  Pendiente
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                  Pagada
                </span>
              )}
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100 text-gray-500">
                  <Target size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Motivo</span>
                  <span className="text-sm font-semibold text-gray-700">{bocana.fields.Tipo}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {getTorneoBadge(bocana.fields.Torneo)}
              {bocana.fields.Comida && (
                <div className="flex items-center gap-1 ml-auto">
                  <Utensils size={12} className="text-gray-400" />
                  {getComidaBadge(bocana.fields.Comida)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Footer */}
        {isPending && (
          <div 
            className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 rounded-b-xl cursor-pointer hover:bg-green-50 transition-colors group/btn"
            onClick={() => setShowPaymentModal(true)}
          >
            <div className="flex items-center justify-center text-sm font-medium text-gray-500 group-hover/btn:text-green-700 transition-colors">
              <CheckCircle size={16} className="mr-2 transition-transform group-hover/btn:scale-110" />
              Registrar Pago
            </div>
          </div>
        )}
      </div>

      {/* Modal de pago mejorado */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Utensils size={20} />
                  Registrar Comida
                </h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={20} className="lucide lucide-x" /> {/* Icon hack since I didn't import X */}
                </button>
              </div>
              <p className="text-green-100 text-sm mt-1">
                {bocana.fields.Jugador_Nombre} • {bocana.fields.Tipo}
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué comida pagó?
                </label>
                
                {!isCustom ? (
                  <div className="space-y-3">
                    <select
                      value={selectedComida}
                      onChange={(e) => {
                        if (e.target.value === 'OTRO') {
                          setIsCustom(true);
                        } else {
                          setSelectedComida(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-700"
                    >
                      {comidasSugeridas.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="OTRO">✨ Otra comida...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="relative">
                      <input
                        type="text"
                        value={customComida}
                        onChange={(e) => setCustomComida(e.target.value)}
                        placeholder="Escribe el nombre de la comida..."
                        autoFocus
                        className="w-full px-4 py-2.5 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                      />
                      <button 
                        onClick={() => setIsCustom(false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Cancelar
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 pl-1">Se guardará como nueva opción.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={processing || (isCustom && !customComida.trim())}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar</span>
                      <CheckCircle size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BocanaCard;
