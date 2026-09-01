import type { AnalyzeResult } from '../engine/analyze'
import type { EngineParams } from '../engine/types'

/** Snapshot congelado de uma corrida do motor, salvo no histórico do cliente. */
export interface Analysis extends AnalyzeResult {
  id: string
  clientId: string
  uploadId: string
  fileName: string
  createdAt: number
  params: EngineParams
}
