import { z } from 'zod';

// Zod para Bocanas
export const BocanaCreateSchema = z.object({
  Jugador_ID: z.string().min(1),
  Jornada: z.number().int().nonnegative(),
  Tipo: z.enum(['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100']),
  Status: z.enum(['Pagada', 'Pendiente']).default('Pendiente'),
  Torneo: z.enum(['X Empresarial', 'XI Empresarial', 'XII Empresarial']),
  Comida: z.string().optional(),
})

export const BocanaUpdateSchema = z.object({
  Jugador_ID: z.string().optional(),
  Jugador_Nombre: z.string().optional(),
  Jornada: z.number().int().nonnegative().optional(),
  Tipo: z.enum(['Promedio', 'Canal', 'Strike', 'Menor a 140', 'Menor a 100']).optional(),
  Status: z.enum(['Pagada', 'Pendiente']).optional(),
  Torneo: z.enum(['X Empresarial', 'XI Empresarial', 'XII Empresarial']).optional(),
  Comida: z.string().optional(),
}).partial()

// Zod Schemas Apostadores
export const ApostadorCreateSchema = z.object({
  Nombre: z.string().min(1, 'Nombre es requerido'),
  Email: z.string().email().optional(),
  Telefono: z.string().optional(),
  Activo: z.boolean(),
});

export const ApostadorUpdateSchema = z.object({
  Nombre: z.string().min(1).optional(),
  Email: z.string().email().optional(),
  Telefono: z.string().optional(),
  Activo: z.boolean().optional(),
  Fecha_Registro: z.string().optional(),
  Total_Apostado: z.number().optional(),
  Total_Ganado: z.number().optional(),
  Balance: z.number().optional(),
}).partial();

export const ApuestaCreateSchema = z.object({
  Apostador_ID: z.string().min(1, 'Apostador_ID es requerido'),
  Torneo: z.string().min(1, 'Torneo es requerido'),
  Tipo_Apuesta: z.string().min(1, 'Tipo_Apuesta es requerido'),
  Descripcion: z.string().optional(),
  Monto: z.number().finite().nonnegative(),
  Odds: z.number().finite().positive(),
  Resultado_Esperado: z.string().optional(),
  Estado: z.enum(['Pendiente', 'Ganada', 'Perdida']).default('Pendiente'),
});

export const ApuestaUpdateSchema = z.object({
  Apostador_ID: z.string().optional(),
  Apostador_Nombre: z.string().optional(),
  Torneo: z.string().optional(),
  Tipo_Apuesta: z.string().optional(),
  Descripcion: z.string().optional(),
  Monto: z.number().finite().nonnegative().optional(),
  Odds: z.number().finite().positive().optional(),
  Resultado_Esperado: z.string().optional(),
  Estado: z.enum(['Pendiente', 'Ganada', 'Perdida']).optional(),
  Fecha_Creacion: z.string().optional(),
  Fecha_Resolucion: z.string().optional(),
  Ganancia_Potencial: z.number().optional(),
  Ganancia_Real: z.number().optional(),
}).partial();
