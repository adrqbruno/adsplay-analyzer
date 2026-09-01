import { useMemo, useState } from 'react'
import { db } from '../../db/db'
import { analyze, DEFAULT_ENGINE_PARAMS, detectColumns, ingestCsv, REQUIRED_ROLES } from '../../engine'
import type { EngineParams } from '../../engine/types'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { generateId } from '../../lib/id'
import type { Analysis } from '../../types/analysis'
import type { Client, ClientSettings } from '../../types/client'
import type { ColumnMap, ColumnRole } from '../../types/columnMap'
import type { Upload } from '../../types/upload'
import { BackupPanel } from '../backup/BackupPanel'
import { ComparePanel } from '../compare/ComparePanel'
import { HistoryList } from '../history/HistoryList'
import { ColumnMappingTable } from '../mapping/ColumnMappingTable'
import { NgramPanel } from '../ngrams/NgramPanel'
import { Controls } from '../results/Controls'
import { FindingsList } from '../results/FindingsList'
import { GoalSettings } from '../results/GoalSettings'
import { KpiStrip } from '../results/KpiStrip'
import { Dropzone } from '../upload/Dropzone'

type Step = 'upload' | 'mapping' | 'results'
type Tab = 'new' | 'history' | 'compare' | 'backup'

interface ParsedFile {
  fileName: string
  headers: string[]
  rawRows: Record<string, string>[]
}

interface ActiveAnalysis {
  uploadId: string
  fileName: string
  rawRows: Record<string, string>[]
  columnMap: ColumnMap
}

interface WorkspaceProps {
  client: Client
  onUpdateClientSettings: (id: string, settings: ClientSettings) => Promise<void>
}

export function Workspace({ client, onUpdateClientSettings }: WorkspaceProps) {
  const clientId = client.id
  const defaultParams: EngineParams = {
    cpaMultiplier: client.settings?.cpaMultiplier ?? DEFAULT_ENGINE_PARAMS.cpaMultiplier,
    wasteCutoff: client.settings?.wasteCutoff ?? DEFAULT_ENGINE_PARAMS.wasteCutoff,
  }
  const goals = { targetCpa: client.settings?.targetCpa, targetRoas: client.settings?.targetRoas }

  const [tab, setTab] = useState<Tab>('new')
  const [step, setStep] = useState<Step>('upload')
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [columnMap, setColumnMap] = useState<ColumnMap>({})
  const [autoDetected, setAutoDetected] = useState<ColumnMap>({})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveAnalysis | null>(null)
  const [params, setParams] = useState<EngineParams>(defaultParams)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)

  const { analyses } = useAnalysisHistory(clientId)

  const liveResult = useMemo(() => {
    if (!active) return null
    return analyze(active.rawRows, active.columnMap, params, goals)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `goals` é derivado de client.settings a cada render; comparar por referência recalcularia sempre
  }, [active, params, client.settings?.targetCpa, client.settings?.targetRoas])

  function resetToUpload() {
    setParsed(null)
    setColumnMap({})
    setAutoDetected({})
    setUploadError(null)
    setActive(null)
    setStep('upload')
  }

  function handleFile(file: File) {
    setUploadError(null)
    file
      .text()
      .then((text) => {
        const result = ingestCsv(text)
        if (!result.ok) {
          setUploadError(result.message)
          return
        }
        const map = detectColumns(result.headers)
        setParsed({ fileName: file.name, headers: result.headers, rawRows: result.rows })
        setColumnMap(map)
        setAutoDetected(map)
        setStep('mapping')
      })
      .catch(() => setUploadError('Falha ao processar o arquivo.'))
  }

  function handleMapChange(role: ColumnRole, header: string | undefined) {
    setColumnMap((prev) => ({ ...prev, [role]: header }))
  }

  async function runDiagnosis() {
    if (!parsed) return
    const missing = REQUIRED_ROLES.filter((role) => !columnMap[role])
    if (missing.length) {
      window.alert(`Mapeie a(s) coluna(s) obrigatória(s): ${missing.join(', ')}`)
      return
    }

    const uploadId = generateId()
    const upload: Upload = {
      id: uploadId,
      clientId,
      fileName: parsed.fileName,
      uploadedAt: Date.now(),
      headers: parsed.headers,
      columnMap,
      rowCount: parsed.rawRows.length,
      rawRows: parsed.rawRows,
    }
    await db.uploads.add(upload)

    const { termRows: _termRows, ...resultFields } = analyze(parsed.rawRows, columnMap, defaultParams, goals)
    const analysisRecord: Analysis = {
      id: generateId(),
      clientId,
      uploadId,
      fileName: parsed.fileName,
      createdAt: Date.now(),
      params: defaultParams,
      ...resultFields,
    }
    await db.analyses.add(analysisRecord)

    setParams(defaultParams)
    setActive({ uploadId, fileName: parsed.fileName, rawRows: parsed.rawRows, columnMap })
    setStep('results')
    setSaveMessage(null)
  }

  async function openHistoryAnalysis(analysis: Analysis) {
    const upload = await db.uploads.get(analysis.uploadId)
    if (!upload) {
      window.alert('Não encontrei o upload original desta análise (pode ter sido removido).')
      return
    }
    setParams(analysis.params)
    setActive({ uploadId: upload.id, fileName: analysis.fileName, rawRows: upload.rawRows, columnMap: upload.columnMap })
    setStep('results')
    setSaveMessage(null)
    setTab('new')
  }

  async function saveCurrentSnapshot() {
    if (!active || !liveResult) return
    const { termRows: _termRows, ...resultFields } = liveResult
    const analysisRecord: Analysis = {
      id: generateId(),
      clientId,
      uploadId: active.uploadId,
      fileName: active.fileName,
      createdAt: Date.now(),
      params,
      ...resultFields,
    }
    await db.analyses.add(analysisRecord)
    setSaveMessage('Salvo no histórico.')
  }

  async function saveAsClientDefault() {
    await onUpdateClientSettings(clientId, { ...client.settings, cpaMultiplier: params.cpaMultiplier, wasteCutoff: params.wasteCutoff })
    setSettingsMessage('Definido como padrão deste cliente.')
    setTimeout(() => setSettingsMessage(null), 3000)
  }

  async function saveGoals(newGoals: Pick<ClientSettings, 'targetCpa' | 'targetRoas'>) {
    await onUpdateClientSettings(clientId, { ...client.settings, ...newGoals })
  }

  async function exportPdf() {
    if (!active || !liveResult) return
    const { downloadDiagnosisPdf } = await import('../../lib/pdf')
    downloadDiagnosisPdf({ clientName: client.name, fileName: active.fileName, createdAt: Date.now(), params, result: liveResult })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">{client.name}</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['new', 'Novo diagnóstico'],
              ['compare', 'Comparar períodos'],
              ['history', 'Histórico'],
              ['backup', 'Backup'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 font-display text-sm font-semibold ${
                tab === key ? 'bg-violet text-white' : 'border-2 border-lilac-line text-violet hover:border-violet'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'backup' && <BackupPanel />}

      {tab === 'compare' && <ComparePanel />}

      {tab === 'history' && <HistoryList analyses={analyses} onOpen={(a) => void openHistoryAnalysis(a)} />}

      {tab === 'new' && (
        <div>
          {step === 'upload' && (
            <div className="rounded-[26px] border-2 border-lilac-line bg-paper p-7">
              <Dropzone onFile={handleFile} />
              <div className="mt-3.5 flex items-center justify-center gap-2 text-[13px] text-mute">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} className="text-ok">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Processamento 100% local — o CSV não é enviado a nenhum servidor.
              </div>
              {uploadError && <div className="mt-3.5 rounded-2xl border-2 border-[#F0C0C0] bg-danger-bg px-4.5 py-3.5 text-sm font-semibold text-danger">{uploadError}</div>}
            </div>
          )}

          {step === 'mapping' && parsed && (
            <div className="rounded-[26px] border-2 border-lilac-line bg-paper p-7">
              <p className="mb-4 mt-0 text-body">
                Detectei as colunas abaixo automaticamente. Ajuste qualquer uma que estiver errada — só <b>Custo</b>, <b>Conversões</b> e a coluna de{' '}
                <b>Campanha</b> são obrigatórias.
              </p>
              <ColumnMappingTable headers={parsed.headers} columnMap={columnMap} autoDetected={autoDetected} onChange={handleMapChange} />
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => void runDiagnosis()} className="rounded-full bg-violet px-7 py-3 font-display text-base font-semibold text-white hover:bg-violet-deep">
                  Rodar diagnóstico
                </button>
                <button type="button" onClick={resetToUpload} className="rounded-full border-2 border-lilac-line px-7 py-3 font-display text-base font-semibold text-violet hover:border-violet hover:bg-lilac">
                  Trocar arquivo
                </button>
              </div>
              <div className="mt-3.5 flex gap-2 text-[13px] text-mute">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} className="mt-0.5 flex-none text-violet">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span>
                  Linhas de <b>keyword</b> e <b>termo de pesquisa</b> são separadas pela coluna "Tipo" quando existir; sem ela, a análise de desperdício usa todas
                  as linhas com termo.
                </span>
              </div>
            </div>
          )}

          {step === 'results' && active && liveResult && (
            <div>
              <div className="mb-5">
                <GoalSettings client={client} onSave={saveGoals} />
              </div>

              <div className="rounded-[26px] border-2 border-lilac-line bg-paper p-7">
                <KpiStrip metrics={liveResult.accountMetrics} campaignCount={liveResult.campaignCount} />
                <div className="mt-5.5">
                  <Controls params={params} onChange={setParams} wasteInfo={liveResult.wasteInfo} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => void saveCurrentSnapshot()} className="rounded-full bg-violet px-5 py-2 font-display text-sm font-semibold text-white hover:bg-violet-deep">
                    Salvar esta análise
                  </button>
                  <button type="button" onClick={() => void exportPdf()} className="rounded-full border-2 border-lilac-line px-5 py-2 font-display text-sm font-semibold text-violet hover:border-violet hover:bg-lilac">
                    Exportar PDF
                  </button>
                  <button type="button" onClick={() => void saveAsClientDefault()} className="rounded-full border-2 border-lilac-line px-5 py-2 font-display text-sm font-semibold text-violet hover:border-violet hover:bg-lilac">
                    Salvar como padrão deste cliente
                  </button>
                  <button type="button" onClick={resetToUpload} className="rounded-full border-2 border-lilac-line px-5 py-2 font-display text-sm font-semibold text-violet hover:border-violet hover:bg-lilac">
                    Novo diagnóstico
                  </button>
                  {saveMessage && <span className="text-sm text-ok">{saveMessage}</span>}
                  {settingsMessage && <span className="text-sm text-ok">{settingsMessage}</span>}
                </div>
              </div>

              <h3 className="my-4 text-[22px]">Achados priorizados por impacto</h3>
              <FindingsList findings={liveResult.findings} />

              <div className="mt-6">
                <NgramPanel termRows={liveResult.termRows} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
