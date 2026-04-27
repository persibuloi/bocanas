// Helpers seguros para componer filterByFormula de Airtable.
// Escapan los valores para evitar inyección de fórmulas a partir de datos
// controlados por el usuario (nombres, ids, etc.).

const escapeString = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

export const fieldRef = (name: string): string => `{${name.replace(/[{}]/g, '')}}`

export const eqString = (field: string, value: string): string =>
  `${fieldRef(field)} = '${escapeString(value)}'`

export const eqNumber = (field: string, value: number): string => {
  if (!Number.isFinite(value)) throw new Error(`Valor numérico inválido para ${field}`)
  return `${fieldRef(field)} = ${value}`
}

export const and = (conds: ReadonlyArray<string>): string | undefined => {
  const parts = conds.filter(Boolean)
  if (parts.length === 0) return undefined
  if (parts.length === 1) return parts[0]
  return `AND(${parts.join(', ')})`
}

export const search = (field: string, value: string): string =>
  `FIND(LOWER('${escapeString(value)}'), LOWER(${fieldRef(field)} & ''))`

// Solo exportado para tests
export const __escapeString = escapeString
