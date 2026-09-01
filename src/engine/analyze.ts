import type { ColumnMap } from '../types/columnMap'
import type { Finding } from '../types/finding'
import { buildRows, splitKeywordsAndTerms } from './buildRows'
import { computeMetrics } from './metrics'
import { cpaRule } from './rules/cpa'
import { goalGapRule } from './rules/goalGap'
import { groupsRule } from './rules/groups'
import { volumeRule } from './rules/volume'
import { wasteRule, wasteSummary } from './rules/waste'
import type { AdsRow, EngineParams, GoalTargets, Metrics } from './types'

export interface AnalyzeResult {
  accountMetrics: Metrics
  campaignCount: number
  findings: Finding[]
  wasteInfo: { count: number; total: number }
  /** Linhas de termo de pesquisa (ou todas as linhas, sem coluna Tipo) — para análises auxiliares como n-gramas. */
  termRows: AdsRow[]
}

/**
 * Ponto de entrada do motor: recebe as linhas cruas do CSV + o mapeamento de
 * colunas escolhido, roda as regras e devolve os achados ordenados por
 * impacto em R$ decrescente (achados sem valor monetário direto, como Volume,
 * vão ao final). `goals` é opcional — sem meta definida para o cliente, a
 * regra de gap simplesmente não entra nos achados.
 */
export function analyze(
  rawRows: Record<string, string>[],
  columnMap: ColumnMap,
  params: EngineParams,
  goals: GoalTargets = {},
): AnalyzeResult {
  const rows = buildRows(rawRows, columnMap)
  const { keywords, terms } = splitKeywordsAndTerms(rows, Boolean(columnMap.type))
  const accountMetrics = computeMetrics(keywords)

  const findings = [
    goalGapRule(accountMetrics, goals),
    cpaRule(keywords, accountMetrics, params),
    wasteRule(terms, params, accountMetrics.cost),
    volumeRule(rows),
    groupsRule(keywords, params),
  ].filter((f): f is Finding => f !== null)

  findings.sort((a, b) => b.amount - a.amount)

  return {
    accountMetrics,
    campaignCount: new Set(keywords.map((r) => r.campaign)).size,
    findings,
    wasteInfo: wasteSummary(terms, params),
    termRows: terms,
  }
}
