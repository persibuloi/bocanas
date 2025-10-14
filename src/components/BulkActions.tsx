import React, { useState } from 'react';
import { 
  CheckCircle, 
  Download, 
  MessageCircle, 
  X, 
  Utensils,
  Trash2,
  Edit3
} from 'lucide-react';
import { Bocana } from '../lib/airtable';
import { useComidaOptions } from '../hooks/useComidaOptions';

// Las comidas ahora se obtienen dinámicamente

interface BulkActionsProps {
  selectedItems: Bocana[];
  selectedCount: number;
  onMarkAsPaid: (items: Bocana[], comida: string) => Promise<void>;
  onExport: (items: Bocana[]) => void;
  onShare: (items: Bocana[]) => void;
  onClearSelection: () => void;
  loading?: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedItems,
  selectedCount,
  onMarkAsPaid,
  onExport,
  onShare,
  onClearSelection,
  loading = false
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { comidas } = useComidaOptions();
  const [selectedComida, setSelectedComida] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const pendingItems = selectedItems.filter(item => item.fields.Status === 'Pendiente');
  
  // Inicializar selectedComida cuando las comidas estén disponibles
  React.useEffect(() => {
    if (comidas.length > 0 && !selectedComida) {
      setSelectedComida(comidas[0]);
    }
  }, [comidas, selectedComida]);

  const handleMarkAsPaid = async () => {
    if (pendingItems.length === 0) return;
    
    setProcessing(true);
    try {
      await onMarkAsPaid(pendingItems, selectedComida);
      setShowPaymentModal(false);
      onClearSelection();
    } finally {
      setProcessing(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {selectedCount}
              </div>
              <span className="text-blue-800 font-medium">
                {selectedCount} bocana{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {pendingItems.length > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  <CheckCircle size={16} className="mr-1" />
                  Marcar como pagadas ({pendingItems.length})
                </button>
              )}
              
              <button
                onClick={() => onExport(selectedItems)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <Download size={16} className="mr-1" />
                Exportar
              </button>
              
              <button
                onClick={() => onShare(selectedItems)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <MessageCircle size={16} className="mr-1" />
                Compartir
              </button>
            </div>
          </div>
          
          <button
            onClick={onClearSelection}
            className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-100 transition-colors"
            title="Limpiar selección"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Utensils size={20} className="mr-2 text-green-600" />
                Marcar como pagadas
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Se marcarán como pagadas {pendingItems.length} bocana{pendingItems.length !== 1 ? 's' : ''} pendiente{pendingItems.length !== 1 ? 's' : ''}.
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

export default BulkActions;
