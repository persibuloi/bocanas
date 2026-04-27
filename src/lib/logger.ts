// Logger condicional: solo escribe en desarrollo.
// En producción, los console.* son removidos por esbuild (vite.config.ts),
// pero envolvemos las llamadas para mantener intención clara.

const isDev = import.meta.env?.DEV === true

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args)
  },
  error: (...args: unknown[]): void => {
    console.error(...args)
  },
}
