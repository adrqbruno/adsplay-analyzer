import type { Finding } from '../../types/finding'
import { FindingCard } from './FindingCard'

interface FindingsListProps {
  findings: Finding[]
}

export function FindingsList({ findings }: FindingsListProps) {
  if (!findings.length) {
    return (
      <div className="rounded-2xl border-2 border-lilac-line px-5 py-12 text-center text-mute">
        <div className="mb-1.5 font-display text-xl font-semibold text-body">Nenhum gargalo acima dos limiares atuais</div>
        <div>Afrouxe a sensibilidade de CPA ou reduza o corte de desperdício para ver mais.</div>
      </div>
    )
  }

  return (
    <div>
      {findings.map((finding, i) => (
        <FindingCard key={finding.id} finding={finding} defaultOpen={i === 0} />
      ))}
    </div>
  )
}
