import { useState, useEffect } from 'react';
import { Apuesta, apuestasApi } from '../lib/airtable';
import toast from 'react-hot-toast';

interface UseApuestasFilters {
  estado?: string;
  apostadorId?: string;
}

export const useApuestas = (filters?: UseApuestasFilters) => {
  const [apuestas, setApuestas] = useState<Apuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApuestas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apuestasApi.getAll(filters);
      setApuestas(data);
    } catch (err) {
      const errorMessage = 'Error cargando apuestas';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const crearApuesta = async (data: Omit<Apuesta['fields'], 'Fecha_Creacion' | 'Ganancia_Potencial' | 'Ganancia_Real' | 'Apostador_Nombre'>) => {
    try {
      const nuevaApuesta = await apuestasApi.create(data);
      setApuestas(prev => [nuevaApuesta, ...prev]);
      toast.success('Apuesta registrada exitosamente');
      return nuevaApuesta;
    } catch (err) {
      toast.error('Error registrando apuesta');
      throw err;
    }
  };

  const actualizarApuesta = async (id: string, data: Partial<Apuesta['fields']>) => {
    try {
      const apuestaActualizada = await apuestasApi.update(id, data);
      setApuestas(prev => prev.map(a => a.id === id ? apuestaActualizada : a));
      
      if (data.Estado === 'Ganada') {
        toast.success('¡Apuesta ganada! Felicitaciones');
      } else if (data.Estado === 'Perdida') {
        toast.success('Apuesta marcada como perdida');
      } else {
        toast.success('Apuesta actualizada exitosamente');
      }
      
      return apuestaActualizada;
    } catch (err) {
      toast.error('Error actualizando apuesta');
      throw err;
    }
  };

  const eliminarApuesta = async (id: string) => {
    try {
      await apuestasApi.delete(id);
      setApuestas(prev => prev.filter(a => a.id !== id));
      toast.success('Apuesta eliminada exitosamente');
    } catch (err) {
      toast.error('Error eliminando apuesta');
      throw err;
    }
  };

  useEffect(() => {
    fetchApuestas();
  }, [filters?.estado, filters?.apostadorId]);

  return {
    apuestas,
    loading,
    error,
    fetchApuestas,
    crearApuesta,
    actualizarApuesta,
    eliminarApuesta,
  };
};