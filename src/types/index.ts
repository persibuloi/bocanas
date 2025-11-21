export interface Bocana {
  id: string
  fields: {
    Jugador_ID: string
    Jugador_Nombre?: string
    Jornada: number
    Tipo: 'Promedio' | 'Canal' | 'Strike' | 'Menor a 140' | 'Menor a 100'
    Status: 'Pagada' | 'Pendiente'
    Torneo: 'X Empresarial' | 'XI Empresarial' | 'XII Empresarial'
    Comida?: string
    Ide?: number
    creacion?: string
    Modificado?: string
  }
}

export interface Apostador {
  id: string;
  fields: {
    Nombre: string;
    Email?: string;
    Telefono?: string;
    Activo: boolean;
    Fecha_Registro: string;
    Total_Apostado: number;
    Total_Ganado: number;
    Balance: number;
  };
}

export interface Apuesta {
  id: string;
  fields: {
    Apostador_ID: string;
    Apostador_Nombre?: string;
    Torneo: string;
    Tipo_Apuesta: string;
    Descripcion?: string;
    Monto: number;
    Odds: number;
    Resultado_Esperado?: string;
    Estado: 'Pendiente' | 'Ganada' | 'Perdida';
    Fecha_Creacion: string;
    Fecha_Resolucion?: string;
    Ganancia_Potencial: number;
    Ganancia_Real: number;
  };
}
