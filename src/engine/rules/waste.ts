import type { Finding } from '../../types/finding'
import type { AdsRow, EngineParams } from '../types'

const MAX_ROWS_SHOWN = 25

function zeroConvAboveCutoff(termRows: AdsRow[], cutoff: number): AdsRow[] {
  return termRows.filter((r) => r.conv === 0 && r.term && r.cost >= cutoff).sort((a, b) => b.cost - a.cost)
}

/** Resumo usado no controle de sensibilidade da UI, independente de haver achado ou não. */
export function wasteSummary(termRows: AdsRow[], params: EngineParams): { count: number; total: number } {
  const zero = zeroConvAboveCutoff(termRows, params.wasteCutoff)
  return { count: zero.length, total: zero.reduce((sum, r) => sum + r.cost, 0) }
}

/**
 * Desperdício: termos de pesquisa com 0 conversão e gasto acima do corte,
 * ordenados por gasto decrescente. Total recuperável = soma do custo.
 */
export function wasteRule(termRows: AdsRow[], params: EngineParams, accountCost: number): Finding | null {
  const zero = zeroConvAboveCutoff(termRows, params.wasteCutoff)
  if (!zero.length) return null

  const total = zero.reduce((sum, r) => sum + r.cost, 0)
  const allZeroCount = termRows.filter((r) => r.conv === 0 && r.term).length
  const shown = zero.slice(0, MAX_ROWS_SHOWN)

  const cutoffLabel = params.wasteCutoff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const truncatedNote = zero.length > MAX_ROWS_SHOWN ? ` Mostrando os ${MAX_ROWS_SHOWN} maiores de ${zero.length}.` : ''

  return {
    id: 'waste',
    bucket: 'waste',
    severity: total > accountCost * 0.1 ? 'high' : 'med',
    title: 'Desperdício — termos com gasto e zero conversão',
    amount: total,
    why: `Candidatos a negativa. ${allZeroCount} termos gastaram sem converter; ${zero.length} passam do seu corte de R$ ${cutoffLabel}. Revise antes de negativar em massa (termos de topo podem ter papel assistido).${truncatedNote}`,
    columns: [
      { key: 'term', label: 'Termo de pesquisa' },
      { key: 'campaign', label: 'Campanha' },
      { key: 'cost', label: 'Gasto', align: 'right' },
      { key: 'clicks', label: 'Cliques', align: 'right' },
    ],
    rows: shown.map((r) => ({
      term: r.term || '—',
      campaign: r.campaign,
      cost: r.cost,
      clicks: r.clicks,
    })),
  }
}
