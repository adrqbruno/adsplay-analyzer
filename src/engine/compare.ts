import { computeMetrics, groupBy } from './metrics'
import type { AdsRow, Metrics } from './types'

export type Trend = 'melhorou' | 'piorou' | 'estavel'

const STABLE_THRESHOLD = 0.02 // variação de CPA abaixo de 2% é tratada como estável

export interface CampaignDelta {
  campaign: string
  costA: number
  costB: number
  costDelta: number
  convA: number
  convB: number
  convDelta: number
  cpaA: number
  cpaB: number
  /** (cpaA - cpaB) / cpaB — negativo é melhora (CPA caiu). Infinity/NaN quando cpaB é 0/Infinity. */
  cpaDeltaPct: number
  trend: Trend
}

export interface CompareResult {
  accountA: Metrics
  accountB: Metrics
  campaigns: CampaignDelta[]
}

function cpaDeltaPct(cpaA: number, cpaB: number): number {
  if (!Number.isFinite(cpaB) || cpaB === 0) return Number.isFinite(cpaA) ? Infinity : 0
  if (!Number.isFinite(cpaA)) return Infinity
  return (cpaA - cpaB) / cpaB
}

function trendFor(cpaA: number, cpaB: number, delta: number): Trend {
  // Sem conversão em um dos dois lados: não dá pra falar de tendência de eficiência.
  if (!Number.isFinite(cpaA) || !Number.isFinite(cpaB)) return 'estavel'
  if (Math.abs(delta) < STABLE_THRESHOLD) return 'estavel'
  return delta < 0 ? 'melhorou' : 'piorou'
}

/**
 * Compara duas linhas do tempo (A = período atual, B = período anterior),
 * campanha a campanha, por CPA/custo/conversões. Só usa linhas de keyword
 * (mesma convenção do resto do motor). Campanhas que existem em só um dos
 * períodos entram com 0 no outro lado — nunca inventa dado que não existe.
 */
export function comparePeriods(keywordRowsA: AdsRow[], keywordRowsB: AdsRow[]): CompareResult {
  const accountA = computeMetrics(keywordRowsA)
  const accountB = computeMetrics(keywordRowsB)

  const byCampaignA = groupBy(keywordRowsA, (r) => r.campaign)
  const byCampaignB = groupBy(keywordRowsB, (r) => r.campaign)
  const allCampaigns = new Set([...Object.keys(byCampaignA), ...Object.keys(byCampaignB)])

  const campaigns: CampaignDelta[] = []
  for (const campaign of allCampaigns) {
    const mA = computeMetrics(byCampaignA[campaign] ?? [])
    const mB = computeMetrics(byCampaignB[campaign] ?? [])
    const delta = cpaDeltaPct(mA.cpa, mB.cpa)

    campaigns.push({
      campaign,
      costA: mA.cost,
      costB: mB.cost,
      costDelta: mA.cost - mB.cost,
      convA: mA.conv,
      convB: mB.conv,
      convDelta: mA.conv - mB.conv,
      cpaA: mA.cpa,
      cpaB: mB.cpa,
      cpaDeltaPct: delta,
      trend: trendFor(mA.cpa, mB.cpa, delta),
    })
  }

  campaigns.sort((a, b) => Math.abs(b.costDelta) - Math.abs(a.costDelta))

  return { accountA, accountB, campaigns }
}
