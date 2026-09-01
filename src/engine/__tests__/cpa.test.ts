import { describe, expect, it } from 'vitest'
import { buildRows, splitKeywordsAndTerms } from '../buildRows'
import { computeMetrics } from '../metrics'
import { cpaRule } from '../rules/cpa'
import { DEFAULT_ENGINE_PARAMS } from '../types'
import { loadFixture } from './fixture'

describe('cpaRule (fixture)', () => {
  const { rawRows, columnMap } = loadFixture()
  const rows = buildRows(rawRows, columnMap)
  const { keywords } = splitKeywordsAndTerms(rows, Boolean(columnMap.type))
  const accountMetrics = computeMetrics(keywords)

  it('computes the account CPA as cost/conv over keyword rows only', () => {
    expect(keywords).toHaveLength(46)
    expect(accountMetrics.cost).toBeCloseTo(59489.79, 2)
    expect(accountMetrics.conv).toBeCloseTo(937.15, 2)
    expect(accountMetrics.cpa).toBeCloseTo(63.4795, 2)
  })

  it('flags campaigns whose CPA exceeds the account average by the multiplier, sorted by excess desc', () => {
    const finding = cpaRule(keywords, accountMetrics, DEFAULT_ENGINE_PARAMS)
    expect(finding).not.toBeNull()
    if (!finding) return

    expect(finding.severity).toBe('high')
    expect(finding.amount).toBeCloseTo(24663.75, 1)
    expect(finding.rows.map((r) => r.campaign)).toEqual(['Search - Genrico FX', 'Display - Remkt', 'PMax - Prop'])
    expect(finding.rows.map((r) => r.excess as number)).toEqual([
      expect.closeTo(12222.43, 1),
      expect.closeTo(8302.98, 1),
      expect.closeTo(4138.34, 1),
    ])
  })

  it('does not flag "Search - Marca", whose CPA is below the account average', () => {
    const finding = cpaRule(keywords, accountMetrics, DEFAULT_ENGINE_PARAMS)
    expect(finding?.rows.some((r) => r.campaign === 'Search - Marca')).toBe(false)
  })

  it('decomposes the driver (CPC caro / CTR baixo) for flagged campaigns', () => {
    const finding = cpaRule(keywords, accountMetrics, DEFAULT_ENGINE_PARAMS)
    const genericoFx = finding?.rows.find((r) => r.campaign === 'Search - Genrico FX')
    expect(genericoFx?.drivers).toEqual(['CPC caro', 'CTR baixo'])
  })
})
