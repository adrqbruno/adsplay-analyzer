import Dexie, { type Table } from 'dexie'
import type { Analysis } from '../types/analysis'
import type { Client } from '../types/client'
import type { Upload } from '../types/upload'

// Continua sendo a fonte de verdade local (local-first). O sync opcional com
// o Supabase (db/supabase.ts, db/cloudSync.ts) espelha estas tabelas na
// nuvem só quando o usuário aciona explicitamente — nunca automático.
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
