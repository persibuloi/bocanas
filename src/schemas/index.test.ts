import { describe, it, expect } from 'vitest'
import { BocanaCreateSchema } from './index'

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
