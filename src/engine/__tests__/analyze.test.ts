import { describe, expect, it } from 'vitest'
import { analyze } from '../analyze'
import { DEFAULT_ENGINE_PARAMS } from '../types'
import { loadFixture } from './fixture'

describe('analyze (fixture, integration)', () => {
  const { rawRows, columnMap } = loadFixture()

  it('returns findings ordered by R$ impact, descending', () => {
    const result = analyze(rawRows, columnMap, DEFAULT_ENGINE_PARAMS)
    expect(result.findings.map((f) => f.bucket)).toEqual(['cpa', 'groups', 'waste', 'volume'])

    const amounts = result.findings.map((f) => f.amount)
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a))
  })

  it('computes the account KPIs', () => {
    const result = analyze(rawRows, columnMap, DEFAULT_ENGINE_PARAMS)
    expect(result.accountMetrics.cpa).toBeCloseTo(63.4795, 2)
    expect(result.accountMetrics.cost).toBeCloseTo(59489.79, 2)
    expect(result.campaignCount).toBe(4)
    expect(result.wasteInfo).toEqual({ count: 11, total: expect.closeTo(5227.86, 1) })
  })

  it('never invents a Volume finding when Lost IS columns are absent', () => {
    const mapWithoutLost = { ...columnMap, lost_b: undefined, lost_r: undefined }
    const result = analyze(rawRows, mapWithoutLost, DEFAULT_ENGINE_PARAMS)
    expect(result.findings.some((f) => f.bucket === 'volume')).toBe(false)
  })

  it('relaxing the CPA multiplier removes the cpa finding', () => {
    const lenient = analyze(rawRows, columnMap, { ...DEFAULT_ENGINE_PARAMS, cpaMultiplier: 5 })
    expect(lenient.findings.some((f) => f.bucket === 'cpa')).toBe(false)
  })

  it('lowering the waste cutoff to 0 only grows (or keeps) the waste total', () => {
    const strict = analyze(rawRows, columnMap, { ...DEFAULT_ENGINE_PARAMS, wasteCutoff: 0 }).wasteInfo.total
    const lenient = analyze(rawRows, columnMap, DEFAULT_ENGINE_PARAMS).wasteInfo.total
    expect(strict).toBeGreaterThanOrEqual(lenient)
  })
})
