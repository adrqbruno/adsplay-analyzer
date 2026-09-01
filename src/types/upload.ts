import type { ColumnMap } from './columnMap'

export interface Upload {
  id: string
  clientId: string
  fileName: string
  uploadedAt: number
  headers: string[]
  columnMap: ColumnMap
  rowCount: number
  /** CSV cru (linhas normalizadas por header), guardado para reabrir e reanalisar com params diferentes. */
  rawRows: Record<string, string>[]
}
