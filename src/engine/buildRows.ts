import type { ColumnMap, ColumnRole } from '../types/columnMap'
import { parseNumberPtBrOrEn } from './numberParse'
import type { AdsRow } from './types'

function get(row: Record<string, string>, map: ColumnMap, role: ColumnRole): string | undefined {
  const header = map[role]
  return header ? row[header] : undefined
}

export function buildRows(rawRows: Record<string, string>[], map: ColumnMap): AdsRow[] {
  const hasLost = Boolean(map.lost_b || map.lost_r)

  return rawRows.map((r) => ({
    campaign: (get(r, map, 'campaign') || '—').trim(),
    group: (get(r, map, 'group') || '—').trim(),
    ad: (get(r, map, 'ad') || '').trim(),
    term: (get(r, map, 'term') || '').trim(),
    type: (get(r, map, 'type') || '').trim().toLowerCase(),
    impr: parseNumberPtBrOrEn(get(r, map, 'impr')),
    clicks: parseNumberPtBrOrEn(get(r, map, 'clicks')),
    cost: parseNumberPtBrOrEn(get(r, map, 'cost')),
    conv: parseNumberPtBrOrEn(get(r, map, 'conv')),
    val: parseNumberPtBrOrEn(get(r, map, 'val')),
    is: parseNumberPtBrOrEn(get(r, map, 'is')),
    lost_b: parseNumberPtBrOrEn(get(r, map, 'lost_b')),
    lost_r: parseNumberPtBrOrEn(get(r, map, 'lost_r')),
    hasLost,
  }))
}

/**
 * Separa linhas de keyword vs termo de pesquisa pela coluna Tipo, quando
 * mapeada. Sem essa coluna, todas as linhas servem para as duas análises
 * (fallback do protótipo) — e se a coluna existir mas nenhuma linha casar com
 * "palavra/keyword", cai de volta para o conjunto completo também.
 */
export function splitKeywordsAndTerms(
  rows: AdsRow[],
  hasTypeColumn: boolean,
): { keywords: AdsRow[]; terms: AdsRow[] } {
  if (!hasTypeColumn) {
    return { keywords: rows, terms: rows }
  }

  const keywords = rows.filter((r) => /palavra|keyword/.test(r.type))
  const terms = rows.filter((r) => /termo|search/.test(r.type))

  return { keywords: keywords.length ? keywords : rows, terms }
}
