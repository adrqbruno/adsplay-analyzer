import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { detectColumns } from '../columnDetect'
import { ingestCsv } from '../csvIngest'
import type { ColumnMap } from '../../types/columnMap'

const FIXTURE_PATH = fileURLToPath(new URL('../../../fixture-exemplo.csv', import.meta.url))

export function loadFixture(): { rawRows: Record<string, string>[]; columnMap: ColumnMap } {
  const csvText = readFileSync(FIXTURE_PATH, 'utf-8')
  const result = ingestCsv(csvText)
  if (!result.ok) throw new Error(`fixture inválido: ${result.message}`)
  return { rawRows: result.rows, columnMap: detectColumns(result.headers) }
}
