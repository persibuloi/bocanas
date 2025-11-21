import { apostadoresApi, apuestasApi } from './betting';

// Función para obtener estadísticas
export const getEstadisticas = async () => {
  try {
    const [apostadores, apuestas] = await Promise.all([
      apostadoresApi.getAll(),
      apuestasApi.getAll()
    ]);
    
    const stats = {
      total_apostadores: apostadores.length,
      apostadores_activos: apostadores.filter(a => a.fields.Activo).length,
      total_apuestas: apuestas.length,
      apuestas_pendientes: apuestas.filter(a => a.fields.Estado === 'Pendiente').length,
      apuestas_ganadas: apuestas.filter(a => a.fields.Estado === 'Ganada').length,
      apuestas_perdidas: apuestas.filter(a => a.fields.Estado === 'Perdida').length,
      monto_total_apostado: apuestas.reduce((sum, bet) => sum + (bet.fields.Monto || 0), 0),
      monto_pendiente: apuestas
        .filter(a => a.fields.Estado === 'Pendiente')
        .reduce((sum, bet) => sum + (bet.fields.Monto || 0), 0),
      ganancia_potencial_pendiente: apuestas
        .filter(a => a.fields.Estado === 'Pendiente')
        .reduce((sum, bet) => sum + (bet.fields.Ganancia_Potencial || 0), 0),
      ganancia_real_total: apuestas.reduce((sum, bet) => sum + (bet.fields.Ganancia_Real || 0), 0),
    };
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};
