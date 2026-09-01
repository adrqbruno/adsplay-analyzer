import type { AdsRow } from './types'

export interface NgramStat {
  ngram: string
  /** Quantos termos de pesquisa distintos contêm esse n-grama. */
  termCount: number
  cost: number
  conv: number
  cpa: number
}

const TOKEN_SPLIT = /[^\p{L}\p{N}]+/u

function tokenize(term: string): string[] {
  return term
    .toLowerCase()
    .split(TOKEN_SPLIT)
    .filter(Boolean)
}

function ngramsOf(tokens: string[], n: number): string[] {
  if (tokens.length < n) return []
  const grams: string[] = []
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(' '))
  }
  return grams
}

export interface NgramReportOptions {
  /** Tamanho do n-grama: 1 = palavra única, 2 = par de palavras consecutivas. */
  n?: number
  /** Só reporta n-gramas presentes em pelo menos esse número de termos distintos. */
  minTerms?: number
}

/**
 * Agrupa termos de pesquisa por n-grama (palavra ou sequência de palavras) para
 * achar padrões recorrentes de desperdício — ex.: a palavra "grátis" aparecendo
 * em vários termos que gastam sem converter. Soma custo/conversão de TODAS as
 * linhas cujo termo contém o n-grama (uma linha pode contribuir para vários
 * n-gramas, mas só uma vez por n-grama mesmo se ele se repetir no termo).
 * Ordenado por custo decrescente.
 */
export function ngramReport(termRows: AdsRow[], options: NgramReportOptions = {}): NgramStat[] {
  const n = options.n ?? 1
  const minTerms = options.minTerms ?? 2

  const stats = new Map<string, { cost: number; conv: number; terms: Set<string> }>()

  for (const row of termRows) {
    if (!row.term) continue
    const tokens = tokenize(row.term)
    const uniqueGrams = new Set(ngramsOf(tokens, n))
    for (const gram of uniqueGrams) {
      const entry = stats.get(gram) ?? { cost: 0, conv: 0, terms: new Set<string>() }
      entry.cost += row.cost
      entry.conv += row.conv
      entry.terms.add(row.term)
      stats.set(gram, entry)
    }
  }

  const result: NgramStat[] = []
  for (const [ngram, entry] of stats) {
    if (entry.terms.size < minTerms) continue
    result.push({
      ngram,
      termCount: entry.terms.size,
      cost: entry.cost,
      conv: entry.conv,
      cpa: entry.conv ? entry.cost / entry.conv : Infinity,
    })
  }

  result.sort((a, b) => b.cost - a.cost)
  return result
}
