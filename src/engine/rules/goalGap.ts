import type { Finding } from '../../types/finding'
import type { GoalTargets, Metrics } from '../types'

/**
 * Meta do cliente: compara CPA/ROAS da conta contra o valor COMBINADO com o
 * cliente — absoluto, não relativo à média interna (diferente das outras
 * regras). Responde "estamos batendo a meta?", não "quem é o pior da casa".
 * Some silenciosamente quando nenhuma meta foi definida para o cliente.
 */
export function goalGapRule(accountMetrics: Metrics, goals: GoalTargets): Finding | null {
  const rows: Record<string, unknown>[] = []
  let amount = 0

  if (goals.targetCpa && goals.targetCpa > 0 && Number.isFinite(accountMetrics.cpa) && accountMetrics.cpa > goals.targetCpa) {
    const excess = (accountMetrics.cpa - goals.targetCpa) * accountMetrics.conv
    amount += excess
    rows.push({
      metric: 'CPA',
      cpaAtual: accountMetrics.cpa,
      cpaMeta: goals.targetCpa,
      gap: (accountMetrics.cpa - goals.targetCpa) / goals.targetCpa,
      excess,
    })
  }

  if (goals.targetRoas && goals.targetRoas > 0 && accountMetrics.roas < goals.targetRoas) {
    // Receita que faltou para bater a meta de ROAS com o custo já investido.
    const requiredVal = accountMetrics.cost * goals.targetRoas
    const gapValue = requiredVal - accountMetrics.val
    if (gapValue > 0) {
      amount += gapValue
      rows.push({
        metric: 'ROAS',
        roasAtual: accountMetrics.roas,
        roasMeta: goals.targetRoas,
        gap: (goals.targetRoas - accountMetrics.roas) / goals.targetRoas,
        excess: gapValue,
      })
    }
  }

  if (!rows.length) return null

  return {
    id: 'goalGap',
    bucket: 'goalGap',
    severity: 'high',
    title: 'Meta do cliente — distância entre o real e o combinado',
    amount,
    why: 'Comparado à meta combinada com o cliente, não à média interna da conta usada nas outras regras — é o número que decide se a conta está entregando o que foi prometido.',
    columns: [
      { key: 'metric', label: 'Métrica' },
      { key: 'cpaAtual', label: 'CPA real', align: 'right' },
      { key: 'cpaMeta', label: 'CPA meta', align: 'right' },
      { key: 'roasAtual', label: 'ROAS real', align: 'right' },
      { key: 'roasMeta', label: 'ROAS meta', align: 'right' },
      { key: 'gap', label: 'Gap', align: 'right' },
      { key: 'excess', label: 'Distância R$', align: 'right' },
    ],
    rows,
  }
}
