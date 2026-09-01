import { useState } from 'react'
import { exportBackup, readBackupFile, restoreBackup } from '../../db/backup'

export function BackupPanel() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleExport() {
    setBusy(true)
    setMessage(null)
    try {
      const blob = await exportBackup()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `adsplay-backup-${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File) {
    if (
      !window.confirm(
        'Importar um backup substitui TODOS os clientes, uploads e análises salvos neste navegador pelo conteúdo do arquivo. Essa ação não pode ser desfeita. Continuar?',
      )
    ) {
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const data = await readBackupFile(file)
      await restoreBackup(data)
      setMessage(`Backup restaurado: ${data.clients.length} cliente(s), ${data.analyses.length} análise(s).`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Falha ao importar o backup.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-lilac-line bg-paper p-5">
      <h3 className="mb-1 font-display text-base font-semibold text-ink">Backup local</h3>
      <p className="mb-4 text-sm text-mute">
        Tudo fica só neste navegador. Exporte um arquivo para guardar ou trocar de máquina — e importe de volta quando precisar.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleExport()}
          className="rounded-full bg-violet px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-violet-deep disabled:cursor-not-allowed disabled:bg-lilac-line"
        >
          Exportar backup
        </button>
        <label className="cursor-pointer rounded-full border-2 border-lilac-line px-5 py-2.5 font-display text-sm font-semibold text-violet hover:border-violet hover:bg-lilac">
          Importar backup
          <input
            type="file"
            accept="application/json"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void handleImport(file)
            }}
          />
        </label>
      </div>
      {message && <p className="mt-3 text-sm text-violet-ink">{message}</p>}
    </div>
  )
}
