import { useState, useEffect } from 'react';
import { Apostador, apostadoresApi } from '../lib/airtable';
import toast from 'react-hot-toast';

export const useApostadores = () => {
  const [apostadores, setApostadores] = useState<Apostador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApostadores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apostadoresApi.getAll();
      setApostadores(data);
    } catch (err) {
      const errorMessage = 'Error cargando apostadores';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const crearApostador = async (data: Omit<Apostador['fields'], 'Fecha_Registro' | 'Total_Apostado' | 'Total_Ganado' | 'Balance'>) => {
    try {
      const nuevoApostador = await apostadoresApi.create(data);
      setApostadores(prev => [...prev, nuevoApostador]);
      toast.success('Apostador creado exitosamente');
      return nuevoApostador;
    } catch (err) {
      toast.error('Error creando apostador');
      throw err;
    }
  };

  const actualizarApostador = async (id: string, data: Partial<Apostador['fields']>) => {
    try {
      const apostadorActualizado = await apostadoresApi.update(id, data);
      setApostadores(prev => prev.map(a => a.id === id ? apostadorActualizado : a));
      toast.success('Apostador actualizado exitosamente');
      return apostadorActualizado;
    } catch (err) {
      toast.error('Error actualizando apostador');
      throw err;
    }
  };

  const eliminarApostador = async (id: string) => {
    try {
      await apostadoresApi.delete(id);
      setApostadores(prev => prev.filter(a => a.id !== id));
      toast.success('Apostador eliminado exitosamente');
    } catch (err) {
      toast.error('Error eliminando apostador');
      throw err;
    }
  };

  useEffect(() => {
    fetchApostadores();
  }, []);

  return {
    apostadores,
    loading,
    error,
    fetchApostadores,
    crearApostador,
    actualizarApostador,
    eliminarApostador,
  };
};