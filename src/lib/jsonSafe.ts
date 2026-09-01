// JSON (e o jsonb do Postgres) não representam Infinity — JSON.stringify vira
// null. Mas Metrics.cpa pode ser Infinity quando não há conversão. Marcamos e
// revertemos via replacer/reviver para o backup local e o sync na nuvem darem
// round-trip fiel.
const INFINITY_TAG = '__Infinity__'
const NEG_INFINITY_TAG = '__-Infinity__'

export function jsonSafeReplacer(_key: string, value: unknown): unknown {
  if (value === Infinity) return INFINITY_TAG
  if (value === -Infinity) return NEG_INFINITY_TAG
  return value
}

export function jsonSafeReviver(_key: string, value: unknown): unknown {
  if (value === INFINITY_TAG) return Infinity
  if (value === NEG_INFINITY_TAG) return -Infinity
  return value
}

/** Round-trip de um valor pelas mesmas regras (útil antes de mandar pra um jsonb do Supabase). */
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, jsonSafeReplacer)) as T
}

export function fromJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value), jsonSafeReviver) as T
}
