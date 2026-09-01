import { formatDateTime, formatMoney } from '../../lib/format'
import type { Analysis } from '../../types/analysis'

interface HistoryListProps {
  analyses: Analysis[]
  onOpen: (analysis: Analysis) => void
}

export function HistoryList({ analyses, onOpen }: HistoryListProps) {
  if (!analyses.length) {
    return <div className="rounded-2xl border-2 border-lilac-line px-5 py-12 text-center text-mute">Nenhuma análise salva ainda para este cliente.</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {analyses.map((a) => {
        const total = a.findings.reduce((sum, f) => sum + (f.noAmount ? 0 : f.amount), 0)
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onOpen(a)}
            className="flex items-center gap-4 rounded-2xl border-2 border-lilac-line bg-paper px-5 py-4 text-left hover:border-violet"
          >
            <div className="flex-1">
              <div className="font-display text-[15px] font-semibold text-ink">{a.fileName}</div>
              <div className="text-[13px] text-mute">{formatDateTime(a.createdAt)}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-sm font-bold text-violet">{formatMoney(total)}</div>
              <div className="text-[12.5px] text-mute">
                {a.findings.length} achado{a.findings.length === 1 ? '' : 's'}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
