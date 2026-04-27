import { Torneo } from '../lib/torneos'

export interface Bocana {
  id: string
  fields: {
    Jugador_ID: string
    Jugador_Nombre?: string
    Jornada: number
    Tipo: 'Promedio' | 'Canal' | 'Strike' | 'Menor a 140' | 'Menor a 100'
    Status: 'Pagada' | 'Pendiente'
    Torneo: Torneo
    Comida?: string
    Ide?: number
    creacion?: string
    Modificado?: string
  }
}

export interface Apostador {
  id: string
  fields: {
    Nombre: string
    Email?: string
    Telefono?: string
    Activo: boolean
    Fecha_Registro: string
    Total_Apostado: number
    Total_Ganado: number
    Balance: number
  }
}
