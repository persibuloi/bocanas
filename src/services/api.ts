import axios from 'axios';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  throw new Error(
    'Faltan variables de entorno de Airtable. Define VITE_AIRTABLE_API_KEY y VITE_AIRTABLE_BASE_ID en tu .env'
  );
}

export const api = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Helper: paginación y reintentos para Airtable
export async function fetchAllWithPagination<T = any>(
  path: string,
  params: Record<string, any> = {},
  maxPages = Infinity,
  maxRetries = 3
): Promise<T[]> {
  let results: T[] = []
  let offset: string | undefined = undefined
  let pageCount = 0

  do {
    const query = { ...params, ...(offset ? { offset } : {}) }
    let attempt = 0
    // Reintentos con backoff para 429
    while (true) {
      try {
        const { data } = await api.get(path, { params: query })
        results = results.concat(data.records || [])
        offset = data.offset
        pageCount++
        break
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 429 && attempt < maxRetries) {
          // Respetar Retry-After si existe
          const h = err?.response?.headers || {}
          const retryAfterSec = Number(h['retry-after'] || h['Retry-After'] || h['x-ratelimit-reset'] || 0)
          const headerWaitMs = isNaN(retryAfterSec) ? 0 : Math.max(0, retryAfterSec * 1000)
          // Exponential backoff con jitter
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000)
          const jitter = Math.floor(Math.random() * 250)
          const wait = Math.max(headerWaitMs, backoffMs + jitter)
          await new Promise(res => setTimeout(res, wait))
          attempt++
          continue
        }
        throw err
      }
    }
  } while (offset && pageCount < maxPages)

  return results
}
