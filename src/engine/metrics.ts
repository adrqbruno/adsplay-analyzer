import type { AdsRow, Metrics } from './types'

export function computeMetrics(rows: AdsRow[]): Metrics {
  let cost = 0
  let clicks = 0
  let impr = 0
  let conv = 0
  let val = 0

  for (const r of rows) {
    cost += r.cost
    clicks += r.clicks
    impr += r.impr
    conv += r.conv
    val += r.val
  }

  return {
    cost,
    clicks,
    impr,
    conv,
    val,
    cpc: clicks ? cost / clicks : 0,
    ctr: impr ? clicks / impr : 0,
    cr: clicks ? conv / clicks : 0,
    cpa: conv ? cost / conv : Infinity,
    roas: cost ? val / cost : 0,
    n: rows.length,
  }
}

export function groupBy<T>(rows: T[], keyFn: (row: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const row of rows) {
    const key = keyFn(row)
    ;(result[key] ??= []).push(row)
  }
  return result
}

export function average(values: number[]): number {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
}
