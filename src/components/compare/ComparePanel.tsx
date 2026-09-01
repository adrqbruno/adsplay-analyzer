import { useMemo, useState } from 'react'
import { comparePeriods } from '../../engine'
import type { Trend } from '../../engine/compare'
import { formatMoney, formatNumber, formatSignedMoney, formatSignedPercent } from '../../lib/format'
import { PeriodPicker, type PeriodData } from './PeriodPicker'

const TREND_LABEL: Record<Trend, string> = {
  melhorou: 'Melhorou',
  piorou: 'Piorou',
  estavel: 'Estável',
}

const TREND_CLASS: Record<Trend, string> = {
  melhorou: 'bg-ok-bg text-ok',
  piorou: 'bg-danger-bg text-danger',
  estavel: 'bg-lilac text-mute',
}

export function ComparePanel() {
  const [current, setCurrent] = useState<PeriodData | null>(null)
  const [previous, setPrevious] = useState<PeriodData | null>(null)

  const result = useMemo(
    () => (current && previous ? comparePeriods(current.keywordRows, previous.keywordRows) : null),
    [current, previous],
  )

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PeriodPicker label="Período atual" hint="Ex.: o mês que você quer avaliar." ready={current} onReady={setCurrent} onClear={() => setCurrent(null)} />
        <PeriodPicker label="Período anterior" hint="Ex.: o mês anterior, para comparar." ready={previous} onReady={setPrevious} onClear={() => setPrevious(null)} />
      </div>

      {!result && (
        <div className="mt-4 rounded-2xl border-2 border-lilac-line px-5 py-8 text-center text-mute">
          Suba os dois exports acima para ver o delta de CPA, custo e conversões por campanha.
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="rounded-2xl border-2 border-lilac-line bg-paper px-4.5 py-4">
              <div className="mb-1 text-xs font-bold text-mute">Custo total</div>
              <div className="font-display text-xl font-bold text-ink">
                {formatMoney(result.accountA.cost)} <span className="text-sm font-normal text-mute">vs {formatMoney(result.accountB.cost)}</span>
              </div>
              <div className={`mt-1 text-sm font-semibold ${result.accountA.cost > result.accountB.cost ? 'text-danger' : 'text-ok'}`}>
                {formatSignedMoney(result.accountA.cost - result.accountB.cost)}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-lilac-line bg-paper px-4.5 py-4">
              <div className="mb-1 text-xs font-bold text-mute">Conversões</div>
              <div className="font-display text-xl font-bold text-ink">
                {formatNumber(result.accountA.conv, { maximumFractionDigits: 1 })}{' '}
                <span className="text-sm font-normal text-mute">vs {formatNumber(result.accountB.conv, { maximumFractionDigits: 1 })}</span>
              </div>
              <div className={`mt-1 text-sm font-semibold ${result.accountA.conv >= result.accountB.conv ? 'text-ok' : 'text-danger'}`}>
                {result.accountA.conv - result.accountB.conv >= 0 ? '+' : ''}
                {formatNumber(result.accountA.conv - result.accountB.conv, { maximumFractionDigits: 1 })}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-lilac-line bg-paper px-4.5 py-4">
              <div className="mb-1 text-xs font-bold text-mute">CPA médio</div>
              <div className="font-display text-xl font-bold text-ink">
                {formatMoney(result.accountA.cpa)} <span className="text-sm font-normal text-mute">vs {formatMoney(result.accountB.cpa)}</span>
              </div>
              <div className={`mt-1 text-sm font-semibold ${result.accountA.cpa <= result.accountB.cpa ? 'text-ok' : 'text-danger'}`}>
                {formatSignedPercent((result.accountA.cpa - result.accountB.cpa) / result.accountB.cpa)}
              </div>
            </div>
          </div>

          <h3 className="mb-3 text-lg">Delta por campanha</h3>
          <div className="overflow-x-auto rounded-2xl border-2 border-lilac-line">
            <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
              <thead>
                <tr className="bg-paper-2">
                  <th className="border-b-2 border-line px-3 py-2.5 text-left text-xs font-bold text-mute">Campanha</th>
                  <th className="border-b-2 border-line px-3 py-2.5 text-right text-xs font-bold text-mute">Custo atual</th>
                  <th className="border-b-2 border-line px-3 py-2.5 text-right text-xs font-bold text-mute">Δ Custo</th>
                  <th className="border-b-2 border-line px-3 py-2.5 text-right text-xs font-bold text-mute">Conv. atual</th>
                  <th className="border-b-2 border-line px-3 py-2.5 text-right text-xs font-bold text-mute">Δ Conv.</th>
                  <th className="border-b-2 border-line px-3 py-2.5 text-right text-xs font-bold text-mute">CPA atual</th>
                  <th className="border-b-2 border-line px-3 py-2.5 text-right text-xs font-bold text-mute">CPA anterior</th>
                  <th className="border-b-2 border-line px-3 py-2.5 text-left text-xs font-bold text-mute">Tendência</th>
                </tr>
              </thead>
              <tbody>
                {result.campaigns.map((c) => (
                  <tr key={c.campaign}>
                    <td className="border-b border-line px-3 py-2.5 text-ink">{c.campaign}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right tabular-nums text-ink">{formatMoney(c.costA)}</td>
                    <td className={`border-b border-line px-3 py-2.5 text-right tabular-nums font-semibold ${c.costDelta > 0 ? 'text-danger' : 'text-ok'}`}>
                      {formatSignedMoney(c.costDelta)}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right tabular-nums text-ink">{formatNumber(c.convA, { maximumFractionDigits: 1 })}</td>
                    <td className={`border-b border-line px-3 py-2.5 text-right tabular-nums font-semibold ${c.convDelta >= 0 ? 'text-ok' : 'text-danger'}`}>
                      {c.convDelta >= 0 ? '+' : ''}
                      {formatNumber(c.convDelta, { maximumFractionDigits: 1 })}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 text-right tabular-nums text-ink">{formatMoney(c.cpaA)}</td>
                    <td className="border-b border-line px-3 py-2.5 text-right tabular-nums text-mute">{formatMoney(c.cpaB)}</td>
                    <td className="border-b border-line px-3 py-2.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TREND_CLASS[c.trend]}`}>{TREND_LABEL[c.trend]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
