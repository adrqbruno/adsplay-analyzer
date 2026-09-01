import type { Finding } from '../../types/finding'
import { computeMetrics, groupBy } from '../metrics'
import type { AdsRow, EngineParams, Metrics } from '../types'

/**
 * CPA alto: cada campanha comparada à média da conta (nível acima), com
 * decomposição do driver (CPC caro / CTR baixo / Conv. rate baixa).
 * Excesso R$ = (cpa - benchmark) * conversões, ou o custo total quando o
 * excesso calculado não é positivo (achado ainda é real, só não decompõe bem).
 */
export function cpaRule(keywordRows: AdsRow[], accountMetrics: Metrics, params: EngineParams): Finding | null {
  const byCampaign = groupBy(keywordRows, (r) => r.campaign)
  const rows: Record<string, unknown>[] = []
  let total = 0

  for (const [campaign, campaignRows] of Object.entries(byCampaign)) {
    const m = computeMetrics(campaignRows)
    if (!Number.isFinite(m.cpa) || m.cpa <= accountMetrics.cpa * params.cpaMultiplier) continue

    const drivers: string[] = []
    if (m.cpc > accountMetrics.cpc * params.cpaMultiplier) drivers.push('CPC caro')
    if (m.ctr < accountMetrics.ctr / params.cpaMultiplier) drivers.push('CTR baixo')
    if (m.cr < accountMetrics.cr / params.cpaMultiplier) drivers.push('Conv. rate baixa')

    const excess = (m.cpa - accountMetrics.cpa) * m.conv
    const amount = excess > 0 ? excess : m.cost
    total += amount

    rows.push({
      campaign,
      cpa: m.cpa,
      benchmarkCpa: accountMetrics.cpa,
      drivers: drivers.length ? drivers : ['misto'],
      cost: m.cost,
      excess: amount,
    })
  }

  if (!rows.length) return null
  rows.sort((a, b) => (b.excess as number) - (a.excess as number))

  return {
    id: 'cpa',
    bucket: 'cpa',
    severity: 'high',
    title: 'CPA acima da média — eficiência escapando',
    amount: total,
    why: `Estas campanhas custam por conversão acima de ${params.cpaMultiplier.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}× a média da conta. A coluna driver isola a etapa culpada — ataque o driver, não o CPA no geral.`,
    columns: [
      { key: 'campaign', label: 'Campanha' },
      { key: 'cpa', label: 'CPA', align: 'right' },
      { key: 'benchmarkCpa', label: 'Média conta', align: 'right' },
      { key: 'drivers', label: 'Driver' },
      { key: 'cost', label: 'Custo', align: 'right' },
      { key: 'excess', label: 'Excesso R$', align: 'right' },
    ],
    rows,
  }
}
