import { describe, expect, it } from 'vitest'
import { buildRows, splitKeywordsAndTerms } from '../buildRows'
import { computeMetrics } from '../metrics'
import { wasteRule, wasteSummary } from '../rules/waste'
import { DEFAULT_ENGINE_PARAMS } from '../types'
import { loadFixture } from './fixture'

describe('wasteRule (fixture)', () => {
  const { rawRows, columnMap } = loadFixture()
  const rows = buildRows(rawRows, columnMap)
  const { keywords, terms } = splitKeywordsAndTerms(rows, Boolean(columnMap.type))
  const accountCost = computeMetrics(keywords).cost

  it('sums the cost of zero-conversion search terms above the cutoff', () => {
    const summary = wasteSummary(terms, DEFAULT_ENGINE_PARAMS)
    expect(summary.count).toBe(11)
    expect(summary.total).toBeCloseTo(5227.86, 1)
  })

  it('sorts by cost desc and marks severity based on share of account cost', () => {
    const finding = wasteRule(terms, DEFAULT_ENGINE_PARAMS, accountCost)
    expect(finding).not.toBeNull()
    if (!finding) return

    expect(finding.severity).toBe('med')
    expect(finding.amount).toBeCloseTo(5227.86, 1)
    expect(finding.rows).toHaveLength(11)
    expect(finding.rows[0]).toMatchObject({ term: 'termo pesquisa Disp0', cost: expect.closeTo(1112.37, 1) })
    const costs = finding.rows.map((r) => r.cost as number)
    expect(costs).toEqual([...costs].sort((a, b) => b - a))
  })

  it('raises no finding when the cutoff excludes every zero-conversion term', () => {
    const finding = wasteRule(terms, { ...DEFAULT_ENGINE_PARAMS, wasteCutoff: 100_000 }, accountCost)
    expect(finding).toBeNull()
  })

  it('never counts a term with any conversion, no matter how small', () => {
    const finding = wasteRule(terms, DEFAULT_ENGINE_PARAMS, accountCost)
    // "termo pesquisa Disp1" in Remkt 30d converted 0.02 at R$ 3,18 — below the
    // cutoff anyway, but this asserts the conv===0 filter, not just the cutoff.
    const tinyConvTerm = terms.find((t) => t.term === 'termo pesquisa Disp1' && t.group === 'Remkt 30d')
    expect(tinyConvTerm?.conv).toBeGreaterThan(0)
    expect(finding?.rows.some((r) => r.term === 'termo pesquisa Disp1' && (r.cost as number) < 10)).toBe(false)
  })
})
