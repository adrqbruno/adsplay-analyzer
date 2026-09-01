import Dexie, { type Table } from 'dexie'
import type { Analysis } from '../types/analysis'
import type { Client } from '../types/client'
import type { Upload } from '../types/upload'

// BACKEND-PLUG: quando existir backend, esta classe pode virar um cache local
// sincronizado (ex.: via Dexie Cloud ou uma camada de sync própria), mantendo
// as mesmas tabelas espelhando o servidor. Auth/sync entrariam aqui.
export class AdsplayDB extends Dexie {
  clients!: Table<Client, string>
  uploads!: Table<Upload, string>
  analyses!: Table<Analysis, string>

  constructor() {
    super('adsplay-analyzer')
    this.version(1).stores({
      clients: 'id, name, updatedAt',
      uploads: 'id, clientId, uploadedAt',
      analyses: 'id, clientId, uploadId, createdAt',
    })
  }
}

export const db = new AdsplayDB()
