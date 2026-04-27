export const TORNEOS = ['X Empresarial', 'XI Empresarial', 'XII Empresarial'] as const

export type Torneo = (typeof TORNEOS)[number]
