import type { EngineParams } from '../../engine/types'

interface ControlsProps {
  params: EngineParams
  onChange: (params: EngineParams) => void
  wasteInfo: { count: number; total: number }
}

export function Controls({ params, onChange, wasteInfo }: ControlsProps) {
  return (
    <div className="mb-2 flex flex-wrap items-end gap-6">
      <div className="min-w-60 flex-1">
        <label className="mb-2 block font-display text-sm font-semibold text-ink" htmlFor="mult">
          Sensibilidade de CPA{' '}
          <span className="float-right text-violet">
            {params.cpaMultiplier.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}×
          </span>
        </label>
        <input
          id="mult"
          type="range"
          min={1.1}
          max={2.5}
          step={0.1}
          value={params.cpaMultiplier}
          onChange={(e) => onChange({ ...params, cpaMultiplier: Number(e.target.value) })}
          className="w-full accent-violet"
        />
        <div className="mt-1 text-[12.5px] text-mute">
          Marca um nível quando o CPA passa deste múltiplo da média do nível acima.
        </div>
      </div>

      <div className="min-w-60 flex-1">
        <label className="mb-2 block font-display text-sm font-semibold text-ink" htmlFor="wasteCut">
          Corte de desperdício (termo com 0 conversão)
        </label>
        <div className="flex items-center gap-2.5">
          R${' '}
          <input
            id="wasteCut"
            type="number"
            min={0}
            step={10}
            value={params.wasteCutoff}
            onChange={(e) => onChange({ ...params, wasteCutoff: Math.max(0, Number(e.target.value)) })}
            className="w-32 rounded-xl border-2 border-lilac-line px-3 py-2 text-[15px] text-ink"
          />
          <span className="text-sm text-mute">
            {wasteInfo.count} termos ≥ corte · {wasteInfo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} recuperáveis
          </span>
        </div>
      </div>
    </div>
  )
}
