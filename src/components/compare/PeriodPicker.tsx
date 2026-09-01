import { useState } from 'react'
import { buildRows, detectColumns, ingestCsv, REQUIRED_ROLES, splitKeywordsAndTerms } from '../../engine'
import type { AdsRow } from '../../engine/types'
import type { ColumnMap, ColumnRole } from '../../types/columnMap'
import { ColumnMappingTable } from '../mapping/ColumnMappingTable'
import { Dropzone } from '../upload/Dropzone'

interface ParsedFile {
  fileName: string
  headers: string[]
  rawRows: Record<string, string>[]
}

export interface PeriodData {
  fileName: string
  keywordRows: AdsRow[]
}

interface PeriodPickerProps {
  label: string
  hint: string
  ready: PeriodData | null
  onReady: (data: PeriodData) => void
  onClear: () => void
}

export function PeriodPicker({ label, hint, ready, onReady, onClear }: PeriodPickerProps) {
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [columnMap, setColumnMap] = useState<ColumnMap>({})
  const [autoDetected, setAutoDetected] = useState<ColumnMap>({})
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    setError(null)
    file
      .text()
      .then((text) => {
        const result = ingestCsv(text)
        if (!result.ok) {
          setError(result.message)
          return
        }
        const map = detectColumns(result.headers)
        setParsed({ fileName: file.name, headers: result.headers, rawRows: result.rows })
        setColumnMap(map)
        setAutoDetected(map)
      })
      .catch(() => setError('Falha ao processar o arquivo.'))
  }

  function handleMapChange(role: ColumnRole, header: string | undefined) {
    setColumnMap((prev) => ({ ...prev, [role]: header }))
  }

  function confirm() {
    if (!parsed) return
    const missing = REQUIRED_ROLES.filter((role) => !columnMap[role])
    if (missing.length) {
      window.alert(`Mapeie a(s) coluna(s) obrigatória(s): ${missing.join(', ')}`)
      return
    }
    const rows = buildRows(parsed.rawRows, columnMap)
    const { keywords } = splitKeywordsAndTerms(rows, Boolean(columnMap.type))
    onReady({ fileName: parsed.fileName, keywordRows: keywords })
    setParsed(null)
  }

  if (ready) {
    return (
      <div className="rounded-2xl border-2 border-ok bg-ok-bg px-5 py-4">
        <div className="font-display text-sm font-semibold text-ink">{label}</div>
        <div className="mt-1 text-sm text-body">{ready.fileName}</div>
        <button type="button" onClick={onClear} className="mt-2 font-display text-sm font-semibold text-violet hover:underline">
          Trocar arquivo
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-lilac-line bg-paper p-5">
      <div className="mb-1 font-display text-sm font-semibold text-ink">{label}</div>
      <div className="mb-3 text-[12.5px] text-mute">{hint}</div>

      {!parsed && <Dropzone onFile={handleFile} />}

      {parsed && (
        <div>
          <ColumnMappingTable headers={parsed.headers} columnMap={columnMap} autoDetected={autoDetected} onChange={handleMapChange} />
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={confirm} className="rounded-full bg-violet px-5 py-2 font-display text-sm font-semibold text-white hover:bg-violet-deep">
              Confirmar
            </button>
            <button type="button" onClick={() => setParsed(null)} className="rounded-full border-2 border-lilac-line px-5 py-2 font-display text-sm font-semibold text-violet hover:border-violet hover:bg-lilac">
              Trocar arquivo
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-3 text-sm font-semibold text-danger">{error}</div>}
    </div>
  )
}
