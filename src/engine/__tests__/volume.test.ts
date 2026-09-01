import { describe, expect, it } from 'vitest'
import { buildRows } from '../buildRows'
import { volumeRule } from '../rules/volume'
import { loadFixture } from './fixture'

describe('volumeRule (fixture)', () => {
  const { rawRows, columnMap } = loadFixture()
  const rows = buildRows(rawRows, columnMap)

  it('classifies the dominant bottleneck (budget vs rank) per campaign', () => {
    const finding = volumeRule(rows)
    expect(finding).not.toBeNull()
    if (!finding) return

    expect(finding.noAmount).toBe(true)
    expect(finding.amount).toBe(0)

    const byCampaign = Object.fromEntries(finding.rows.map((r) => [r.campaign as string, r.bottleneck]))
    expect(byCampaign).toEqual({
      'Search - Marca': 'budget',
      'Search - Genrico FX': 'rank',
      'PMax - Prop': 'rank',
      'Display - Remkt': 'rank',
    })
  })

  it('only counts positive lost-share values in the per-campaign average', () => {
    const finding = volumeRule(rows)
    const marca = finding?.rows.find((r) => r.campaign === 'Search - Marca')
    expect(marca?.lostBudget).toBeCloseTo(0.2899, 3)
    expect(marca?.lostRank).toBeCloseTo(0.2602, 3)
  })

  it('returns null when no row has a Lost IS column mapped (no invented finding)', () => {
    const rowsWithoutLost = rows.map((r) => ({ ...r, hasLost: false }))
    expect(volumeRule(rowsWithoutLost)).toBeNull()
  })
})
