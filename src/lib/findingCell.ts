import { formatMoney, formatNumber, formatPercent } from './format'

const BOTTLENECK_LABEL: Record<string, string> = {
  budget: 'Orçamento → subir verba',
  rank: 'Ranking → lance / QS',
}

/** Formatação em texto puro de uma célula de Finding.rows, compartilhada entre a UI (FindingCard) e o export em PDF. */
export function formatFindingCellText(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(', ')
  if (key === 'bottleneck') return BOTTLENECK_LABEL[String(value)] ?? String(value)

  if (typeof value === 'number') {
    if (/roas/i.test(key)) return `${formatNumber(value, { maximumFractionDigits: 2 })}×`
    if (/lost|rank|budget|share|gap/i.test(key)) return formatPercent(value)
    if (/cpa|cost|excess|benchmark/i.test(key)) return formatMoney(value)
    return formatNumber(value)
  }

  return String(value ?? '—')
}
