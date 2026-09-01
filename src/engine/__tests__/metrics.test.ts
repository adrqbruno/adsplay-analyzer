import { describe, expect, it } from 'vitest'
import { average, computeMetrics, groupBy } from '../metrics'
import type { AdsRow } from '../types'

function row(overrides: Partial<AdsRow>): AdsRow {
  return {
    campaign: 'C',
    group: 'G',
    ad: '',
    term: '',
    type: '',
    impr: 0,
    clicks: 0,
    cost: 0,
    conv: 0,
    val: 0,
    is: 0,
    lost_b: 0,
    lost_r: 0,
    hasLost: false,
    ...overrides,
  }
}

describe('computeMetrics', () => {
  it('sums the base metrics and derives the rates', () => {
    const rows = [
      row({ impr: 100, clicks: 10, cost: 50, conv: 2, val: 200 }),
      row({ impr: 100, clicks: 10, cost: 50, conv: 2, val: 200 }),
    ]
    const m = computeMetrics(rows)

    expect(m.impr).toBe(200)
    expect(m.clicks).toBe(20)
    expect(m.cost).toBe(100)
    expect(m.conv).toBe(4)
    expect(m.val).toBe(400)
    expect(m.n).toBe(2)
    expect(m.cpc).toBeCloseTo(5)
    expect(m.ctr).toBeCloseTo(0.1)
    expect(m.cr).toBeCloseTo(0.2)
    expect(m.cpa).toBeCloseTo(25)
    expect(m.roas).toBeCloseTo(4)
  })

  it('returns Infinity CPA when there are no conversions', () => {
    const m = computeMetrics([row({ cost: 100, conv: 0 })])
    expect(m.cpa).toBe(Infinity)
  })

  it('returns zeroed rates for an empty list instead of dividing by zero', () => {
    const m = computeMetrics([])
    expect(m.cpc).toBe(0)
    expect(m.ctr).toBe(0)
    expect(m.cr).toBe(0)
    expect(m.roas).toBe(0)
    expect(m.cpa).toBe(Infinity)
  })
})

describe('groupBy', () => {
  it('groups rows by the given key', () => {
    const rows = [row({ campaign: 'A' }), row({ campaign: 'B' }), row({ campaign: 'A' })]
    const grouped = groupBy(rows, (r) => r.campaign)
    expect(Object.keys(grouped).sort()).toEqual(['A', 'B'])
    expect(grouped.A).toHaveLength(2)
    expect(grouped.B).toHaveLength(1)
  })
})

describe('average', () => {
  it('averages a list of numbers', () => {
    expect(average([1, 2, 3])).toBe(2)
  })

  it('returns 0 for an empty list', () => {
    expect(average([])).toBe(0)
  })
})
