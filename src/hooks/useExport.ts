import { useCallback } from 'react';
import { Bocana } from '../lib/airtable';

export const useExport = () => {
  const exportToCSV = useCallback((bocanas: Bocana[], filename = 'bocanas') => {
    const headers = ['Jugador', 'Torneo', 'Jornada', 'Tipo', 'Estado', 'Comida', 'Fecha'];
    const rows = bocanas.map(b => [
      b.fields.Jugador_Nombre || '',
      b.fields.Torneo || '',
      b.fields.Jornada?.toString() || '',
      b.fields.Tipo || '',
      b.fields.Status || '',
      b.fields.Comida || '',
      (() => {
        const f: any = b.fields as any;
        const c = f['Creación'] || f['Creacion'] || f['creacion'];
        return c ? new Date(c).toLocaleDateString() : '';
      })()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const shareWhatsApp = useCallback((bocanas: Bocana[], title = 'Lista de Bocanas') => {
    const lines = [
      `📋 *${title}*`,
      `Total: ${bocanas.length} bocana(s)`,
      '',
    ];

    bocanas.forEach((b, index) => {
      const status = b.fields.Status === 'Pendiente' ? '🟡' : '✅';
      const comida = b.fields.Comida ? ` - ${b.fields.Comida}` : '';
      lines.push(
        `${index + 1}. ${status} *${b.fields.Jugador_Nombre || 'Sin nombre'}*`,
        `   🏆 ${b.fields.Torneo} - J${b.fields.Jornada}`,
        `   🎯 ${b.fields.Tipo}${comida}`,
        ''
      );
    });

    const text = lines.join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, []);

  return {
    exportToCSV,
    shareWhatsApp,
  };
};
