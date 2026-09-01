import { describe, expect, it } from 'vitest'
import { comparePeriods } from '../compare'
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

describe('comparePeriods', () => {
  it('marks a campaign as "melhorou" when CPA drops more than the stable threshold', () => {
    const a = [row({ campaign: 'Marca', cost: 100, conv: 10 })] // cpa 10
    const b = [row({ campaign: 'Marca', cost: 150, conv: 10 })] // cpa 15
    const result = comparePeriods(a, b)
    const marca = result.campaigns.find((c) => c.campaign === 'Marca')
    expect(marca?.cpaA).toBeCloseTo(10)
    expect(marca?.cpaB).toBeCloseTo(15)
    expect(marca?.cpaDeltaPct).toBeCloseTo((10 - 15) / 15)
    expect(marca?.trend).toBe('melhorou')
  })

  it('marks a campaign as "piorou" when CPA rises more than the stable threshold', () => {
    const a = [row({ campaign: 'Marca', cost: 200, conv: 10 })] // cpa 20
    const b = [row({ campaign: 'Marca', cost: 100, conv: 10 })] // cpa 10
    const result = comparePeriods(a, b)
    const marca = result.campaigns.find((c) => c.campaign === 'Marca')
    expect(marca?.trend).toBe('piorou')
  })

  it('marks a campaign as "estavel" when CPA barely moves', () => {
    const a = [row({ campaign: 'Marca', cost: 101, conv: 10 })] // cpa 10.1
    const b = [row({ campaign: 'Marca', cost: 100, conv: 10 })] // cpa 10
    const result = comparePeriods(a, b)
    const marca = result.campaigns.find((c) => c.campaign === 'Marca')
    expect(marca?.trend).toBe('estavel')
  })

  it('includes a campaign that only exists in one period, zeroed on the other side, without a fabricated trend', () => {
    const a = [row({ campaign: 'Nova', cost: 50, conv: 5 })]
    const b: AdsRow[] = []
    const result = comparePeriods(a, b)
    const nova = result.campaigns.find((c) => c.campaign === 'Nova')
    expect(nova?.costB).toBe(0)
    expect(nova?.cpaB).toBe(Infinity)
    expect(nova?.trend).toBe('estavel')
  })

  it('sorts campaigns by the magnitude of the cost delta, descending', () => {
    const a = [row({ campaign: 'Grande', cost: 1000, conv: 10 }), row({ campaign: 'Pequena', cost: 110, conv: 10 })]
    const b = [row({ campaign: 'Grande', cost: 100, conv: 10 }), row({ campaign: 'Pequena', cost: 100, conv: 10 })]
    const result = comparePeriods(a, b)
    expect(result.campaigns.map((c) => c.campaign)).toEqual(['Grande', 'Pequena'])
  })

  it('computes account-level metrics per period independently', () => {
    const a = [row({ cost: 100, conv: 10, clicks: 20, impr: 200 })]
    const b = [row({ cost: 300, conv: 10, clicks: 20, impr: 200 })]
    const result = comparePeriods(a, b)
    expect(result.accountA.cpa).toBeCloseTo(10)
    expect(result.accountB.cpa).toBeCloseTo(30)
  })
})
