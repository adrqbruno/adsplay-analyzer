import type { Finding } from '../../types/finding'
import { computeMetrics, groupBy } from '../metrics'
import type { AdsRow, EngineParams } from '../types'

/**
 * Grupos fora da curva: cada grupo de anúncios comparado à média da própria
 * campanha-mãe (não à média da conta). Mesma fórmula de excesso da regra de CPA.
 */
export function groupsRule(keywordRows: AdsRow[], params: EngineParams): Finding | null {
  const byCampaign = groupBy(keywordRows, (r) => r.campaign)
  const rows: Record<string, unknown>[] = []
  let total = 0

  for (const [campaign, campaignRows] of Object.entries(byCampaign)) {
    const campaignMetrics = computeMetrics(campaignRows)
    if (!Number.isFinite(campaignMetrics.cpa) || campaignMetrics.cpa === 0) continue

    const byGroup = groupBy(campaignRows, (r) => r.group)
    for (const [group, groupRows] of Object.entries(byGroup)) {
      const groupMetrics = computeMetrics(groupRows)
      const isOutlier =
        Number.isFinite(groupMetrics.cpa) &&
        groupMetrics.cpa > campaignMetrics.cpa * params.cpaMultiplier &&
        groupMetrics.cost > 0
      if (!isOutlier) continue

      const excess = (groupMetrics.cpa - campaignMetrics.cpa) * groupMetrics.conv
      const amount = excess > 0 ? excess : groupMetrics.cost
      total += amount

      rows.push({
        campaign,
        group,
        groupCpa: groupMetrics.cpa,
        campaignCpa: campaignMetrics.cpa,
        cost: groupMetrics.cost,
        excess: amount,
      })
    }
  }

  if (!rows.length) return null
  rows.sort((a, b) => (b.excess as number) - (a.excess as number))

  return {
    id: 'groups',
    bucket: 'groups',
    severity: 'med',
    title: 'Grupos de anúncios fora da curva da própria campanha',
    amount: total,
    why: `Onde mexer primeiro: grupos com CPA acima de ${params.cpaMultiplier.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}× a média da campanha-mãe. São os pontos de sangria mais localizados.`,
    columns: [
      { key: 'campaign', label: 'Campanha' },
      { key: 'group', label: 'Grupo' },
      { key: 'groupCpa', label: 'CPA grupo', align: 'right' },
      { key: 'campaignCpa', label: 'CPA campanha', align: 'right' },
      { key: 'cost', label: 'Custo', align: 'right' },
      { key: 'excess', label: 'Excesso R$', align: 'right' },
    ],
    rows,
  }
}
