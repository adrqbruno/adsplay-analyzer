import { useState } from 'react'
import { formatMoney } from '../../lib/format'
import { formatFindingCellText } from '../../lib/findingCell'
import type { Finding } from '../../types/finding'

interface FindingCardProps {
  finding: Finding
  defaultOpen?: boolean
}

const SEVERITY_LABEL: Record<Finding['severity'], string> = {
  high: 'Alto impacto',
  med: 'Médio',
  low: 'Baixo',
}

const SEVERITY_CLASS: Record<Finding['severity'], string> = {
  high: 'bg-danger-bg text-danger',
  med: 'bg-warn-bg text-warn',
  low: 'bg-lilac text-violet',
}

function renderCell(key: string, value: unknown) {
  if (Array.isArray(value)) {
    return (
      <span className="flex flex-wrap justify-end gap-1">
        {value.map((v) => (
          <span key={String(v)} className="inline-block rounded-full bg-lilac px-2.5 py-0.5 text-[11px] font-bold text-violet">
            {String(v)}
          </span>
        ))}
      </span>
    )
  }

  if (key === 'bottleneck') {
    const isBudget = value === 'budget'
    return (
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isBudget ? 'bg-warn-bg text-warn' : 'bg-danger-bg text-danger'}`}>
        {isBudget ? 'Orçamento → subir verba' : 'Ranking → lance / QS'}
      </span>
    )
  }

  return formatFindingCellText(key, value)
}

export function FindingCard({ finding, defaultOpen = false }: FindingCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border-2 border-lilac-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-paper-2 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className={`flex-none rounded-xl px-2.5 py-1 text-[11px] font-bold ${SEVERITY_CLASS[finding.severity]}`}>
          {SEVERITY_LABEL[finding.severity]}
        </span>
        <span className="flex-1 font-display text-base font-semibold text-ink">{finding.title}</span>
        {!finding.noAmount && <span className="font-display text-base font-bold text-violet">{formatMoney(finding.amount)}</span>}
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className={`flex-none text-mute transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1.5">
          <div className="my-3 rounded-[14px] bg-lilac px-4 py-3 text-sm text-violet-ink">{finding.why}</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {finding.columns.map((col) => (
                    <th key={col.key} className={`border-b-2 border-line px-2.5 py-2 text-xs font-bold text-mute ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finding.rows.map((row, i) => (
                  // eslint-disable-next-line react/no-array-index-key -- linhas não têm um id estável próprio
                  <tr key={i}>
                    {finding.columns.map((col) => (
                      <td key={col.key} className={`border-b border-line px-2.5 py-2.5 text-ink tabular-nums ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                        {renderCell(col.key, row[col.key])}
                      </td>
                    ))}
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
