export interface AdsRow {
  campaign: string
  group: string
  ad: string
  term: string
  type: string
  impr: number
  clicks: number
  cost: number
  conv: number
  val: number
  is: number
  lost_b: number
  lost_r: number
  /** true quando o CSV tinha ao menos uma das colunas de Parcela perdida mapeada. */
  hasLost: boolean
}

export interface Metrics {
  cost: number
  clicks: number
  impr: number
  conv: number
  val: number
  cpc: number
  ctr: number
  cr: number
  /** Infinity quando conv === 0 (sem conversão, CPA indefinido). */
  cpa: number
  roas: number
  n: number
}

export interface EngineParams {
  /** Múltiplo da média do nível acima a partir do qual o CPA é considerado alto. */
  cpaMultiplier: number
  /** Gasto mínimo (R$) para um termo de pesquisa com 0 conversão entrar no achado de desperdício. */
  wasteCutoff: number
}

export const DEFAULT_ENGINE_PARAMS: EngineParams = {
  cpaMultiplier: 1.3,
  wasteCutoff: 100,
}

/**
 * Metas absolutas combinadas com o cliente — diferente de EngineParams, que
 * ajusta a sensibilidade das comparações relativas internas da conta. Ambas
 * opcionais: sem meta definida, a regra de gap não gera achado.
 */
export interface GoalTargets {
  targetCpa?: number
  targetRoas?: number
}
