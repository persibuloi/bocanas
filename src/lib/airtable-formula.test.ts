import { describe, it, expect } from 'vitest'
import { and, eqNumber, eqString, fieldRef, search, __escapeString } from './airtable-formula'

describe('airtable-formula', () => {
  describe('escapeString', () => {
    it('escapa comillas simples', () => {
      expect(__escapeString("O'Reilly")).toBe("O\\'Reilly")
    })
    it('escapa backslashes antes que comillas', () => {
      expect(__escapeString("a\\b'c")).toBe("a\\\\b\\'c")
    })
    it('deja strings limpios sin tocar', () => {
      expect(__escapeString('Pendiente')).toBe('Pendiente')
    })
  })

  describe('fieldRef', () => {
    it('envuelve el nombre en llaves', () => {
      expect(fieldRef('Status')).toBe('{Status}')
    })
    it('elimina llaves del nombre para evitar break-out', () => {
      expect(fieldRef('Status} OR {1=1')).toBe('{Status OR 1=1}')
    })
  })

  describe('eqString', () => {
    it('arma una comparación segura', () => {
      expect(eqString('Status', 'Pendiente')).toBe("{Status} = 'Pendiente'")
    })
    it('escapa el valor para evitar inyección', () => {
      const malicious = "x' ) OR 1=1 OR ('"
      const formula = eqString('Status', malicious)
      // El valor escapado debe seguir entre comillas, sin cerrarlas
      expect(formula.startsWith("{Status} = '")).toBe(true)
      expect(formula.endsWith("'")).toBe(true)
      expect(formula).toContain("\\'")
    })
  })

  describe('eqNumber', () => {
    it('arma una comparación numérica', () => {
      expect(eqNumber('Jornada', 5)).toBe('{Jornada} = 5')
    })
    it('rechaza NaN/Infinity', () => {
      expect(() => eqNumber('Jornada', NaN)).toThrow()
      expect(() => eqNumber('Jornada', Infinity)).toThrow()
    })
  })

  describe('and', () => {
    it('retorna undefined sin condiciones', () => {
      expect(and([])).toBeUndefined()
    })
    it('retorna la condición sola si hay una', () => {
      expect(and(["{A} = 'x'"])).toBe("{A} = 'x'")
    })
    it('combina dos o más con AND()', () => {
      expect(and(["{A} = 'x'", '{B} = 1'])).toBe("AND({A} = 'x', {B} = 1)")
    })
    it('ignora valores vacíos', () => {
      expect(and(['', "{A} = 'x'", ''])).toBe("{A} = 'x'")
    })
  })

  describe('search', () => {
    it('produce un FIND case-insensitive escapado', () => {
      expect(search('Nombre', "Juan O'Brien")).toBe(
        "FIND(LOWER('Juan O\\'Brien'), LOWER({Nombre} & ''))"
      )
    })
  })
})
