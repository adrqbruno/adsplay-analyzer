export type FindingBucket = 'cpa' | 'waste' | 'volume' | 'groups'

export type Severity = 'high' | 'med' | 'low'

export interface FindingColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

export interface Finding {
  id: string
  bucket: FindingBucket
  severity: Severity
  title: string
  /** Impacto em R$ do achado; 0 quando `noAmount` é true (achado sem valor monetário direto). */
  amount: number
  noAmount?: boolean
  why: string
  columns: FindingColumn[]
  rows: Record<string, unknown>[]
}
