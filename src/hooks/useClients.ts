import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { generateId } from '../lib/id'
import type { Client, ClientSettings } from '../types/client'

export function useClients() {
  const clients = useLiveQuery(() => db.clients.orderBy('name').toArray(), [], undefined)

  async function createClient(name: string): Promise<string> {
    const id = generateId()
    const now = Date.now()
    await db.clients.add({ id, name: name.trim(), createdAt: now, updatedAt: now })
    return id
  }

  async function renameClient(id: string, name: string): Promise<void> {
    await db.clients.update(id, { name: name.trim(), updatedAt: Date.now() })
  }

  async function updateClientSettings(id: string, settings: ClientSettings): Promise<void> {
    await db.clients.update(id, { settings, updatedAt: Date.now() })
  }

  async function deleteClient(id: string): Promise<void> {
    await db.transaction('rw', db.clients, db.uploads, db.analyses, async () => {
      await db.analyses.where('clientId').equals(id).delete()
      await db.uploads.where('clientId').equals(id).delete()
      await db.clients.delete(id)
    })
  }

  return {
    clients: (clients ?? []) as Client[],
    loading: clients === undefined,
    createClient,
    renameClient,
    updateClientSettings,
    deleteClient,
  }
}
