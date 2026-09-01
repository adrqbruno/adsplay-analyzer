import Papa from 'papaparse'

export interface CsvIngestSuccess {
  ok: true
  headers: string[]
  rows: Record<string, string>[]
  /** Quantas linhas antes do cabeçalho foram descartadas (linhas de título do export). */
  skippedRows: number
}

export interface CsvIngestFailure {
  ok: false
  message: string
}

export type CsvIngestResult = CsvIngestSuccess | CsvIngestFailure

const HEADER_HINT = /campanha|campaign|custo|cost|convers|conversion/i
const MAX_HEADER_SCAN_ROWS = 10
const MIN_HEADER_COLUMNS = 3

/**
 * Faz o parse de um CSV de export do Google Ads tolerando 1-2 linhas de título
 * antes do cabeçalho real (comum em exports da interface). Detecta a linha de
 * cabeçalho pela primeira linha, dentro de uma janela de varredura, com pelo
 * menos MIN_HEADER_COLUMNS células preenchidas e que contenha um termo típico
 * de cabeçalho (campanha/custo/conversões).
 */
export function ingestCsv(csvText: string): CsvIngestResult {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true })
  const matrix = parsed.data

  if (!matrix.length) {
    return { ok: false, message: 'Não consegui ler linhas nesse arquivo. Confirme que é um CSV do Google Ads.' }
  }

  const headerIndex = findHeaderRowIndex(matrix)
  if (headerIndex === -1) {
    return {
      ok: false,
      message: 'Não encontrei uma linha de cabeçalho reconhecível. Confirme que é um export do Google Ads.',
    }
  }

  const headerRow = matrix[headerIndex] ?? []
  const headers = headerRow.map((h) => h.trim()).filter(Boolean)
  if (headers.length < MIN_HEADER_COLUMNS) {
    return {
      ok: false,
      message: 'O cabeçalho veio com poucas colunas. Se o export tem linhas de título no topo, remova-as e reenvie.',
    }
  }

  const rows: Record<string, string>[] = []
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const line = matrix[i] ?? []
    if (!line.some((cell) => cell?.trim())) continue
    const row: Record<string, string> = {}
    headerRow.forEach((rawHeader, idx) => {
      const key = rawHeader.trim()
      if (key) row[key] = line[idx] ?? ''
    })
    rows.push(row)
  }

  return { ok: true, headers, rows, skippedRows: headerIndex }
}

function findHeaderRowIndex(matrix: string[][]): number {
  const limit = Math.min(matrix.length, MAX_HEADER_SCAN_ROWS)
  for (let i = 0; i < limit; i++) {
    const row = matrix[i] ?? []
    const nonEmptyCount = row.filter((cell) => cell?.trim()).length
    if (nonEmptyCount >= MIN_HEADER_COLUMNS && row.some((cell) => HEADER_HINT.test(cell))) {
      return i
    }
  }
  return -1
}
