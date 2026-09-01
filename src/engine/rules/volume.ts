import type { Finding } from '../../types/finding'
import { average, groupBy } from '../metrics'
import type { AdsRow } from '../types'

const LOST_SHARE_THRESHOLD = 0.15

/**
 * Volume: por campanha, compara a média de Parcela perdida (orçamento) vs
 * (classificação) — só considerando valores > 0 — e aponta o gargalo
 * dominante. Usa todas as linhas (keywords + termos), como no protótipo.
 * Some silenciosamente se o CSV não trouxe nenhuma das colunas de Lost IS.
 */
export function volumeRule(allRows: AdsRow[]): Finding | null {
  if (!allRows.some((r) => r.hasLost)) return null

  const byCampaign = groupBy(allRows, (r) => r.campaign)
  const rows: Record<string, unknown>[] = []

  for (const [campaign, campaignRows] of Object.entries(byCampaign)) {
    const lostBudget = average(campaignRows.map((r) => r.lost_b).filter((v) => v > 0))
    const lostRank = average(campaignRows.map((r) => r.lost_r).filter((v) => v > 0))
    if (Math.max(lostBudget, lostRank) <= LOST_SHARE_THRESHOLD) continue

    rows.push({
      campaign,
      lostBudget,
      lostRank,
      bottleneck: lostBudget > lostRank ? 'budget' : 'rank',
    })
  }

  if (!rows.length) return null

  return {
    id: 'volume',
    bucket: 'volume',
    severity: 'med',
    title: 'Volume — perda de impressões (orçamento vs ranking)',
    amount: 0,
    noAmount: true,
    why: 'Os remédios são opostos. Perda por orçamento pede mais verba onde o CPA já é bom; perda por ranking pede lance maior ou melhor Quality Score. Não troque um pelo outro.',
    columns: [
      { key: 'campaign', label: 'Campanha' },
      { key: 'lostBudget', label: 'Perdido (orçam.)', align: 'right' },
      { key: 'lostRank', label: 'Perdido (rank)', align: 'right' },
      { key: 'bottleneck', label: 'Gargalo dominante' },
    ],
    rows,
  }
}
