import { describe, expect, it } from 'vitest'
import { buildRows, splitKeywordsAndTerms } from '../buildRows'
import { groupsRule } from '../rules/groups'
import { DEFAULT_ENGINE_PARAMS } from '../types'
import { loadFixture } from './fixture'

describe('groupsRule (fixture)', () => {
  const { rawRows, columnMap } = loadFixture()
  const rows = buildRows(rawRows, columnMap)
  const { keywords } = splitKeywordsAndTerms(rows, Boolean(columnMap.type))

  it('flags ad groups whose CPA exceeds their own campaign average, not the account average', () => {
    const finding = groupsRule(keywords, DEFAULT_ENGINE_PARAMS)
    expect(finding).not.toBeNull()
    if (!finding) return

    expect(finding.amount).toBeCloseTo(7383.71, 1)
    expect(finding.rows.map((r) => `${r.campaign} / ${r.group}`)).toEqual([
      'Display - Remkt / Remkt 30d',
      'PMax - Prop / Asset Group 1',
      'Search - Marca / Marca Exata',
    ])
  })

  it('compares against the parent campaign CPA, not the account CPA', () => {
    // "Search - Marca" campaign CPA (~15.9) is well below the account CPA
    // (~63.5); its outlier group is only caught because it's benchmarked
    // against its own campaign, not the account.
    const finding = groupsRule(keywords, DEFAULT_ENGINE_PARAMS)
    const marcaExata = finding?.rows.find((r) => r.group === 'Marca Exata')
    expect(marcaExata?.campaignCpa).toBeLessThan(20)
    expect(marcaExata?.groupCpa).toBeGreaterThan((marcaExata?.campaignCpa as number) * DEFAULT_ENGINE_PARAMS.cpaMultiplier)
  })
})
