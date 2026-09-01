import { describe, expect, it } from 'vitest'
import { goalGapRule } from '../rules/goalGap'
import type { Metrics } from '../types'

function metrics(overrides: Partial<Metrics>): Metrics {
  return {
    cost: 0,
    clicks: 0,
    impr: 0,
    conv: 0,
    val: 0,
    cpc: 0,
    ctr: 0,
    cr: 0,
    cpa: Infinity,
    roas: 0,
    n: 0,
    ...overrides,
  }
}

describe('goalGapRule', () => {
  it('returns null when no goal is set for the client', () => {
    const m = metrics({ cost: 1000, conv: 10, cpa: 100 })
    expect(goalGapRule(m, {})).toBeNull()
  })

  it('flags a CPA above the target, with excess = (cpa - target) * conv', () => {
    const m = metrics({ cost: 1000, conv: 10, cpa: 100 })
    const finding = goalGapRule(m, { targetCpa: 80 })
    expect(finding).not.toBeNull()
    expect(finding?.amount).toBeCloseTo((100 - 80) * 10)
    const row = finding?.rows.find((r) => r.metric === 'CPA')
    expect(row?.cpaAtual).toBe(100)
    expect(row?.cpaMeta).toBe(80)
    expect(row?.gap).toBeCloseTo(0.25)
  })

  it('does not flag CPA when it is already at or below the target', () => {
    const m = metrics({ cost: 1000, conv: 20, cpa: 50 })
    expect(goalGapRule(m, { targetCpa: 80 })).toBeNull()
  })

  it('does not flag CPA when there are no conversions (cpa is Infinity)', () => {
    const m = metrics({ cost: 1000, conv: 0, cpa: Infinity })
    expect(goalGapRule(m, { targetCpa: 80 })).toBeNull()
  })

  it('flags a ROAS below the target, with the revenue gap needed to hit it', () => {
    const m = metrics({ cost: 1000, val: 2000, roas: 2 })
    const finding = goalGapRule(m, { targetRoas: 4 })
    expect(finding).not.toBeNull()
    // precisaria de 1000*4 = 4000 de receita; só tem 2000 -> falta 2000
    expect(finding?.amount).toBeCloseTo(2000)
    const row = finding?.rows.find((r) => r.metric === 'ROAS')
    expect(row?.roasAtual).toBe(2)
    expect(row?.roasMeta).toBe(4)
    expect(row?.gap).toBeCloseTo(0.5)
  })

  it('does not flag ROAS when it already meets the target', () => {
    const m = metrics({ cost: 1000, val: 5000, roas: 5 })
    expect(goalGapRule(m, { targetRoas: 4 })).toBeNull()
  })

  it('combines both gaps into one finding when both targets are missed', () => {
    const m = metrics({ cost: 1000, conv: 10, cpa: 100, val: 2000, roas: 2 })
    const finding = goalGapRule(m, { targetCpa: 80, targetRoas: 4 })
    expect(finding?.rows).toHaveLength(2)
    expect(finding?.amount).toBeCloseTo(200 + 2000)
  })

  it('always uses high severity — a missed client goal is inherently significant', () => {
    const m = metrics({ cost: 1000, conv: 10, cpa: 100 })
    const finding = goalGapRule(m, { targetCpa: 80 })
    expect(finding?.severity).toBe('high')
  })
})
