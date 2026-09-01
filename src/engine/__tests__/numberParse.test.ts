import { describe, expect, it } from 'vitest'
import { parseNumberPtBrOrEn } from '../numberParse'

describe('parseNumberPtBrOrEn', () => {
  it('parses pt-BR formatted numbers (thousand dot, comma decimal)', () => {
    expect(parseNumberPtBrOrEn('1.234,56')).toBe(1234.56)
    expect(parseNumberPtBrOrEn('218,11')).toBe(218.11)
  })

  it('parses en formatted numbers (dot decimal)', () => {
    expect(parseNumberPtBrOrEn('1234.56')).toBe(1234.56)
    expect(parseNumberPtBrOrEn('218.11')).toBe(218.11)
  })

  it('strips currency and percent symbols', () => {
    expect(parseNumberPtBrOrEn('R$ 1.234,56')).toBe(1234.56)
    expect(parseNumberPtBrOrEn('60,8%')).toBe(60.8)
  })

  it('treats a trailing comma with 3+ digits as an en thousand separator', () => {
    expect(parseNumberPtBrOrEn('1,234')).toBe(1234)
  })

  it('returns 0 for empty, null and undefined', () => {
    expect(parseNumberPtBrOrEn('')).toBe(0)
    expect(parseNumberPtBrOrEn(null)).toBe(0)
    expect(parseNumberPtBrOrEn(undefined)).toBe(0)
  })

  it('returns 0 for unparseable garbage', () => {
    expect(parseNumberPtBrOrEn('—')).toBe(0)
    expect(parseNumberPtBrOrEn('n/a')).toBe(0)
  })
})
