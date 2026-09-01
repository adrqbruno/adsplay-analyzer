import type { AnalyzeResult } from '../engine/analyze'
import type { EngineParams } from '../engine/types'

/**
 * Snapshot congelado de uma corrida do motor, salvo no histórico do cliente.
 * Omite `termRows`: reconstruível a partir do Upload associado (rawRows +
 * columnMap) e não vale a pena duplicar no banco a cada análise salva.
 */
export interface Analysis extends Omit<AnalyzeResult, 'termRows'> {
  id: string
  clientId: string
  uploadId: string
  fileName: string
  createdAt: number
  params: EngineParams
}
