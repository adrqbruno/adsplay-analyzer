import { useState } from 'react'
import type { Client, ClientSettings } from '../../types/client'

interface GoalSettingsProps {
  client: Client
  onSave: (goals: Pick<ClientSettings, 'targetCpa' | 'targetRoas'>) => Promise<void>
}

export function GoalSettings({ client, onSave }: GoalSettingsProps) {
  const [targetCpa, setTargetCpa] = useState(client.settings?.targetCpa?.toString() ?? '')
  const [targetRoas, setTargetRoas] = useState(client.settings?.targetRoas?.toString() ?? '')
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    await onSave({
      targetCpa: targetCpa ? Number(targetCpa) : undefined,
      targetRoas: targetRoas ? Number(targetRoas) : undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="rounded-2xl border-2 border-lilac-line bg-paper-2 px-5 py-4">
      <div className="mb-1 font-display text-sm font-semibold text-ink">
        Meta deste cliente <span className="font-body text-xs font-normal text-mute">(opcional)</span>
      </div>
      <p className="mb-3 text-[12.5px] text-mute">
        CPA e/ou ROAS combinados com o cliente, comparados contra o real da conta — diferente da média interna usada nas outras regras.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-mute" htmlFor="targetCpa">
            Meta de CPA (R$)
          </label>
          <input
            id="targetCpa"
            type="number"
            min={0}
            step="0.01"
            value={targetCpa}
            onChange={(e) => setTargetCpa(e.target.value)}
            placeholder="ex.: 80"
            className="w-32 rounded-xl border-2 border-lilac-line px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-mute" htmlFor="targetRoas">
            Meta de ROAS (×)
          </label>
          <input
            id="targetRoas"
            type="number"
            min={0}
            step="0.1"
            value={targetRoas}
            onChange={(e) => setTargetRoas(e.target.value)}
            placeholder="ex.: 4"
            className="w-32 rounded-xl border-2 border-lilac-line px-3 py-2 text-sm text-ink"
          />
        </div>
        <button type="button" onClick={() => void handleSave()} className="rounded-full bg-violet px-5 py-2 font-display text-sm font-semibold text-white hover:bg-violet-deep">
          Salvar meta
        </button>
        {saved && <span className="text-sm text-ok">Meta salva.</span>}
      </div>
    </div>
  )
}
