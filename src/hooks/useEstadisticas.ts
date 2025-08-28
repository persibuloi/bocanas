import { useState, useEffect } from 'react';
import { getEstadisticas } from '../lib/airtable';

interface Estadisticas {
  total_apostadores: number;
  apostadores_activos: number;
  total_apuestas: number;
  apuestas_pendientes: number;
  apuestas_ganadas: number;
  apuestas_perdidas: number;
  monto_total_apostado: number;
  monto_pendiente: number;
  ganancia_potencial_pendiente: number;
  ganancia_real_total: number;
}

export const useEstadisticas = () => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEstadisticas();
      setEstadisticas(data);
    } catch (err) {
      setError('Error cargando estadísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas,
  };
};