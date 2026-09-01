import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Analysis } from '../types/analysis'

export function useAnalysisHistory(clientId: string | null) {
  const analyses = useLiveQuery(
    () => (clientId ? db.analyses.where('clientId').equals(clientId).reverse().sortBy('createdAt') : Promise.resolve<Analysis[]>([])),
    [clientId],
    undefined,
  )

  return {
    analyses: (analyses ?? []) as Analysis[],
    loading: analyses === undefined,
  }
}
