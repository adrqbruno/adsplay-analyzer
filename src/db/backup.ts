import type { Analysis } from '../types/analysis'
import type { Client } from '../types/client'
import type { Upload } from '../types/upload'
import { jsonSafeReplacer, jsonSafeReviver } from '../lib/jsonSafe'
import { db } from './db'

export interface BackupFile {
  version: 1
  exportedAt: number
  clients: Client[]
  uploads: Upload[]
  analyses: Analysis[]
}

export async function exportBackup(): Promise<Blob> {
  const [clients, uploads, analyses] = await Promise.all([db.clients.toArray(), db.uploads.toArray(), db.analyses.toArray()])
  const backup: BackupFile = { version: 1, exportedAt: Date.now(), clients, uploads, analyses }
  return new Blob([JSON.stringify(backup, jsonSafeReplacer, 2)], { type: 'application/json' })
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text()
  let data: BackupFile
  try {
    data = JSON.parse(text, jsonSafeReviver) as BackupFile
  } catch {
    throw new Error('Não consegui ler esse arquivo como JSON de backup.')
  }
  if (data.version !== 1 || !Array.isArray(data.clients) || !Array.isArray(data.uploads) || !Array.isArray(data.analyses)) {
    throw new Error('Arquivo de backup inválido ou de uma versão não suportada.')
  }
  return data
}

/**
 * Substitui todo o conteúdo local pelo do backup. Destrutivo — a tela que
 * chama isso deve confirmar com o usuário antes.
 */
export async function restoreBackup(data: BackupFile): Promise<void> {
  await db.transaction('rw', db.clients, db.uploads, db.analyses, async () => {
    await Promise.all([db.clients.clear(), db.uploads.clear(), db.analyses.clear()])
    await Promise.all([
      data.clients.length ? db.clients.bulkAdd(data.clients) : Promise.resolve(),
      data.uploads.length ? db.uploads.bulkAdd(data.uploads) : Promise.resolve(),
      data.analyses.length ? db.analyses.bulkAdd(data.analyses) : Promise.resolve(),
    ])
  })
}
