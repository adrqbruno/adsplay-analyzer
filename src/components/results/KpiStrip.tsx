import { formatMoney, formatNumber } from '../../lib/format'
import type { Metrics } from '../../engine/types'

interface KpiStripProps {
  metrics: Metrics
  campaignCount: number
}

export function KpiStrip({ metrics, campaignCount }: KpiStripProps) {
  const kpis = [
    { label: 'Custo total', value: formatMoney(metrics.cost) },
    { label: 'Conversões', value: formatNumber(metrics.conv, { maximumFractionDigits: 1 }) },
    { label: 'CPA médio', value: formatMoney(metrics.cpa) },
    { label: 'ROAS', value: `${formatNumber(metrics.roas, { maximumFractionDigits: 2 })}×`, tone: metrics.roas >= 1 ? 'ok' : 'warn' },
    { label: 'Campanhas', value: formatNumber(campaignCount) },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-2xl border-2 border-lilac-line bg-paper px-4.5 py-4">
          <div className="mb-1 text-xs font-bold text-mute">{kpi.label}</div>
          <div
            className={`font-display text-2xl font-bold ${
              'tone' in kpi && kpi.tone === 'ok' ? 'text-ok' : 'tone' in kpi && kpi.tone === 'warn' ? 'text-warn' : 'text-ink'
            }`}
          >
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  )
}
