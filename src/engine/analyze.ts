import type { ColumnMap } from '../types/columnMap'
import type { Finding } from '../types/finding'
import { buildRows, splitKeywordsAndTerms } from './buildRows'
import { computeMetrics } from './metrics'
import { cpaRule } from './rules/cpa'
import { groupsRule } from './rules/groups'
import { volumeRule } from './rules/volume'
import { wasteRule, wasteSummary } from './rules/waste'
import type { EngineParams, Metrics } from './types'

export interface AnalyzeResult {
  accountMetrics: Metrics
  campaignCount: number
  findings: Finding[]
  wasteInfo: { count: number; total: number }
}

/**
 * Ponto de entrada do motor: recebe as linhas cruas do CSV + o mapeamento de
 * colunas escolhido, roda as 4 regras e devolve os achados ordenados por
 * impacto em R$ decrescente (achados sem valor monetário direto, como Volume,
 * vão ao final).
 */
export function analyze(rawRows: Record<string, string>[], columnMap: ColumnMap, params: EngineParams): AnalyzeResult {
  const rows = buildRows(rawRows, columnMap)
  const { keywords, terms } = splitKeywordsAndTerms(rows, Boolean(columnMap.type))
  const accountMetrics = computeMetrics(keywords)

  const findings = [
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
  }
}
