import { useState, useEffect } from 'react';
import { bocanasApi } from '../lib/airtable';

export const useComidaOptions = () => {
  const [comidas, setComidas] = useState<string[]>([
    // Fallback por defecto
    'Boneless', 
    'Pizza', 
    'Churrasco Bocas', 
    'Paninni Churrasco', 
    'Quesadilla'
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComidaOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener todas las bocanas para extraer las opciones de comida
        const bocanas = await bocanasApi.getAll();
        
        // Extraer todas las comidas únicas que no sean null/undefined
        const comidasUnicas = Array.from(
          new Set(
            bocanas
              .map(b => b.fields.Comida)
              .filter((comida): comida is string => {
                return comida !== null && comida !== undefined && comida.trim() !== '';
              })
          )
        ).sort();
        
        // Si encontramos comidas en la base de datos, las usamos
        if (comidasUnicas.length > 0) {
          // Combinar con las opciones por defecto para asegurar que estén todas
          const todasLasComidas = Array.from(
            new Set([
              ...comidasUnicas,
              'Boneless', 
              'Pizza', 
              'Churrasco Bocas', 
              'Paninni Churrasco', 
              'Quesadilla'
            ])
          ).sort();
          
          setComidas(todasLasComidas);
        }
        // Si no hay comidas, mantiene el fallback por defecto
      } catch (err) {
        console.error('Error cargando opciones de comida:', err);
        setError('Error cargando opciones de comida');
        // Mantiene el fallback por defecto
      } finally {
        setLoading(false);
      }
    };

    fetchComidaOptions();
  }, []);

  return {
    comidas,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-ejecutar la carga
      const fetchComidaOptions = async () => {
        try {
          const bocanas = await bocanasApi.getAll();
          const comidasUnicas = Array.from(
            new Set(
              bocanas
                .map(b => b.fields.Comida)
                .filter((comida): comida is string => {
                  return comida !== null && comida !== undefined && comida.trim() !== '';
                })
            )
          ).sort();
          
          if (comidasUnicas.length > 0) {
            const todasLasComidas = Array.from(
              new Set([
                ...comidasUnicas,
                'Boneless', 
                'Pizza', 
                'Churrasco Bocas', 
                'Paninni Churrasco', 
                'Quesadilla'
              ])
            ).sort();
            
            setComidas(todasLasComidas);
          }
        } catch (err) {
          console.error('Error cargando opciones de comida:', err);
          setError('Error cargando opciones de comida');
        } finally {
          setLoading(false);
        }
      };
      fetchComidaOptions();
    }
  };
};
