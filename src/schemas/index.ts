import { z } from 'zod'
import { TORNEOS } from '../lib/torneos'

export const BocanaCreateSchema = z.object({
  Jugador_ID: z.string().min(1),
  Jornada: z.number().int().nonnegative(),
  Tipo: z.enum(['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100']),
  Status: z.enum(['Pagada', 'Pendiente']).default('Pendiente'),
  Torneo: z.enum(TORNEOS),
  Comida: z.string().optional(),
})

export const BocanaUpdateSchema = z
  .object({
    Jugador_ID: z.string().optional(),
    Jugador_Nombre: z.string().optional(),
    Jornada: z.number().int().nonnegative().optional(),
    Tipo: z.enum(['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100']).optional(),
    Status: z.enum(['Pagada', 'Pendiente']).optional(),
    Torneo: z.enum(TORNEOS).optional(),
    Comida: z.string().optional(),
  })
  .partial()
