import { describe, expect, it } from 'vitest'
import { ngramReport } from '../ngrams'
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

describe('ngramReport', () => {
  it('aggregates cost and conversions per word (unigram) across distinct terms', () => {
    const rows = [
      row({ term: 'curso de inglês grátis', cost: 50, conv: 0 }),
      row({ term: 'aula grátis online', cost: 30, conv: 0 }),
      row({ term: 'curso pago avançado', cost: 20, conv: 2 }),
    ]
    const report = ngramReport(rows, { n: 1, minTerms: 2 })
    const gratis = report.find((r) => r.ngram === 'grátis')
    expect(gratis).toBeDefined()
    expect(gratis?.termCount).toBe(2)
    expect(gratis?.cost).toBe(80)
    expect(gratis?.conv).toBe(0)
    expect(gratis?.cpa).toBe(Infinity)
  })

  it('excludes n-grams below the minTerms threshold (noise from a single term)', () => {
    const rows = [row({ term: 'curso exclusivo raro', cost: 10, conv: 0 })]
    const report = ngramReport(rows, { n: 1, minTerms: 2 })
    expect(report.find((r) => r.ngram === 'exclusivo')).toBeUndefined()
  })

  it('counts a repeated word within the same term only once for that term', () => {
    const rows = [
      row({ term: 'curso curso curso', cost: 10, conv: 0 }),
      row({ term: 'outro curso', cost: 5, conv: 0 }),
    ]
    const report = ngramReport(rows, { n: 1, minTerms: 2 })
    const curso = report.find((r) => r.ngram === 'curso')
    expect(curso?.termCount).toBe(2)
    expect(curso?.cost).toBe(15)
  })

  it('supports bigrams (n=2) joining consecutive tokens', () => {
    const rows = [
      row({ term: 'curso de inglês grátis', cost: 50, conv: 0 }),
      row({ term: 'aula de inglês avançado', cost: 30, conv: 1 }),
    ]
    const report = ngramReport(rows, { n: 2, minTerms: 2 })
    const bigram = report.find((r) => r.ngram === 'de inglês')
    expect(bigram?.termCount).toBe(2)
    expect(bigram?.cost).toBe(80)
  })

  it('sorts by total cost descending', () => {
    const rows = [
      row({ term: 'barato demais', cost: 5, conv: 0 }),
      row({ term: 'barato outra vez', cost: 5, conv: 0 }),
      row({ term: 'caro demais', cost: 100, conv: 0 }),
      row({ term: 'caro outra vez', cost: 100, conv: 0 }),
    ]
    const report = ngramReport(rows, { n: 1, minTerms: 2 })
    expect(report[0]?.ngram).toBe('caro')
    expect(report.map((r) => r.ngram)).toContain('demais')
  })

  it('ignores rows without a term', () => {
    const rows = [row({ term: '', cost: 999, conv: 0 })]
    expect(ngramReport(rows)).toEqual([])
  })
})
