import { useMemo, useState } from 'react'
import { ngramReport } from '../../engine'
import type { AdsRow } from '../../engine/types'
import { formatMoney, formatNumber } from '../../lib/format'

interface NgramPanelProps {
  termRows: AdsRow[]
}

const MAX_ROWS = 20

export function NgramPanel({ termRows }: NgramPanelProps) {
  const [n, setN] = useState<1 | 2>(1)
  const [onlyWaste, setOnlyWaste] = useState(true)

  const report = useMemo(() => ngramReport(termRows, { n, minTerms: 2 }), [termRows, n])
  const rows = (onlyWaste ? report.filter((r) => r.conv === 0) : report).slice(0, MAX_ROWS)

  const hasTerms = termRows.some((r) => r.term)
  if (!hasTerms) return null

  return (
    <div className="rounded-2xl border-2 border-lilac-line bg-paper p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Padrões em termos de pesquisa</h3>
          <p className="mt-0.5 text-sm text-mute">
            Palavras que se repetem em vários termos de pesquisa — útil para achar negativas em lote (ex.: "grátis" aparecendo em vários termos que gastam sem
            converter).
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border-2 border-lilac-line">
            <button
              type="button"
              onClick={() => setN(1)}
              className={`px-3 py-1.5 font-display text-xs font-semibold ${n === 1 ? 'bg-violet text-white' : 'bg-paper text-violet hover:bg-lilac'}`}
            >
              Palavra
            </button>
            <button
              type="button"
              onClick={() => setN(2)}
              className={`px-3 py-1.5 font-display text-xs font-semibold ${n === 2 ? 'bg-violet text-white' : 'bg-paper text-violet hover:bg-lilac'}`}
            >
              Par de palavras
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <input type="checkbox" checked={onlyWaste} onChange={(e) => setOnlyWaste(e.target.checked)} className="accent-violet" />
            só desperdício (0 conv.)
          </label>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-paper-2 px-4 py-6 text-center text-sm text-mute">Nenhum padrão recorrente encontrado com os filtros atuais.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className="border-b-2 border-line px-2.5 py-2 text-left text-xs font-bold text-mute">{n === 1 ? 'Palavra' : 'Par de palavras'}</th>
                <th className="border-b-2 border-line px-2.5 py-2 text-right text-xs font-bold text-mute">Termos</th>
                <th className="border-b-2 border-line px-2.5 py-2 text-right text-xs font-bold text-mute">Gasto</th>
                <th className="border-b-2 border-line px-2.5 py-2 text-right text-xs font-bold text-mute">Conversões</th>
                <th className="border-b-2 border-line px-2.5 py-2 text-right text-xs font-bold text-mute">CPA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ngram}>
                  <td className="border-b border-line px-2.5 py-2.5 text-ink">{r.ngram}</td>
                  <td className="border-b border-line px-2.5 py-2.5 text-right tabular-nums text-ink">{formatNumber(r.termCount)}</td>
                  <td className="border-b border-line px-2.5 py-2.5 text-right tabular-nums font-semibold text-violet">{formatMoney(r.cost)}</td>
                  <td className="border-b border-line px-2.5 py-2.5 text-right tabular-nums text-ink">{formatNumber(r.conv, { maximumFractionDigits: 1 })}</td>
                  <td className="border-b border-line px-2.5 py-2.5 text-right tabular-nums text-ink">{formatMoney(r.cpa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
