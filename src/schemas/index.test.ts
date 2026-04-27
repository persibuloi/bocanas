import { describe, it, expect } from 'vitest'
import {
  ApostadorCreateSchema,
  ApuestaCreateSchema,
  BocanaCreateSchema,
} from './index'

describe('BocanaCreateSchema', () => {
  it('acepta una bocana válida', () => {
    const result = BocanaCreateSchema.safeParse({
      Jugador_ID: 'rec123',
      Jornada: 1,
      Tipo: 'Strike',
      Status: 'Pendiente',
      Torneo: 'X Empresarial',
    })
    expect(result.success).toBe(true)
  })

  it('aplica el default de Status=Pendiente', () => {
    const result = BocanaCreateSchema.parse({
      Jugador_ID: 'rec123',
      Jornada: 1,
      Tipo: 'Canal',
      Torneo: 'XII Empresarial',
    })
    expect(result.Status).toBe('Pendiente')
  })

  it('rechaza Tipo desconocido', () => {
    const result = BocanaCreateSchema.safeParse({
      Jugador_ID: 'rec123',
      Jornada: 1,
      Tipo: 'Inexistente',
      Torneo: 'X Empresarial',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza Torneo fuera del enum', () => {
    const result = BocanaCreateSchema.safeParse({
      Jugador_ID: 'rec123',
      Jornada: 1,
      Tipo: 'Strike',
      Torneo: 'XV Empresarial',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza Jornada negativa', () => {
    const result = BocanaCreateSchema.safeParse({
      Jugador_ID: 'rec123',
      Jornada: -1,
      Tipo: 'Strike',
      Torneo: 'X Empresarial',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza Jugador_ID vacío', () => {
    const result = BocanaCreateSchema.safeParse({
      Jugador_ID: '',
      Jornada: 1,
      Tipo: 'Strike',
      Torneo: 'X Empresarial',
    })
    expect(result.success).toBe(false)
  })
})

describe('ApostadorCreateSchema', () => {
  it('acepta apostador con email válido', () => {
    const result = ApostadorCreateSchema.safeParse({
      Nombre: 'Juan',
      Email: 'juan@example.com',
      Activo: true,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const result = ApostadorCreateSchema.safeParse({
      Nombre: 'Juan',
      Email: 'no-es-email',
      Activo: true,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza Nombre vacío', () => {
    const result = ApostadorCreateSchema.safeParse({
      Nombre: '',
      Activo: true,
    })
    expect(result.success).toBe(false)
  })
})

describe('ApuestaCreateSchema', () => {
  it('rechaza Odds negativo', () => {
    const result = ApuestaCreateSchema.safeParse({
      Apostador_ID: 'rec1',
      Torneo: 'X',
      Tipo_Apuesta: 'Ganador',
      Monto: 100,
      Odds: -1.5,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza Monto negativo', () => {
    const result = ApuestaCreateSchema.safeParse({
      Apostador_ID: 'rec1',
      Torneo: 'X',
      Tipo_Apuesta: 'Ganador',
      Monto: -10,
      Odds: 1.5,
    })
    expect(result.success).toBe(false)
  })

  it('aplica el default de Estado=Pendiente', () => {
    const parsed = ApuestaCreateSchema.parse({
      Apostador_ID: 'rec1',
      Torneo: 'X',
      Tipo_Apuesta: 'Ganador',
      Monto: 100,
      Odds: 2,
    })
    expect(parsed.Estado).toBe('Pendiente')
  })
})
