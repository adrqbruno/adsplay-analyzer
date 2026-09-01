import { describe, expect, it } from 'vitest'
import { ingestCsv } from '../csvIngest'

describe('ingestCsv', () => {
  it('parses a clean CSV with a header on the first line', () => {
    const csv = 'Campanha,Custo,Conversões\nCampanha A,100,5\nCampanha B,200,10\n'
    const result = ingestCsv(csv)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.headers).toEqual(['Campanha', 'Custo', 'Conversões'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ Campanha: 'Campanha A', Custo: '100', 'Conversões': '5' })
    expect(result.skippedRows).toBe(0)
  })

  it('detects and skips title rows before the real header', () => {
    const csv = [
      'Relatório de campanhas',
      '01/01/2026 a 31/01/2026',
      'Campanha,Custo,Conversões',
      'Campanha A,100,5',
    ].join('\n')

    const result = ingestCsv(csv)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.headers).toEqual(['Campanha', 'Custo', 'Conversões'])
    expect(result.rows).toHaveLength(1)
    expect(result.skippedRows).toBe(2)
  })

  it('fails with a helpful message on an empty file', () => {
    const result = ingestCsv('')
    expect(result.ok).toBe(false)
  })

  it('fails when no recognizable header row is found', () => {
    const csv = ['foo,bar,baz', 'x,y,z'].join('\n')
    const result = ingestCsv(csv)
    expect(result.ok).toBe(false)
  })

  it('fails when the file only has 2 columns, below the minimum', () => {
    const csv = ['Campanha,Custo', 'A,1'].join('\n')
    const result = ingestCsv(csv)
    expect(result.ok).toBe(false)
  })
})
