import type { SupabaseClient } from '@supabase/supabase-js'
import { fromJsonSafe, toJsonSafe } from '../lib/jsonSafe'
import type { Analysis } from '../types/analysis'
import type { Client, ClientSettings } from '../types/client'
import type { ColumnMap } from '../types/columnMap'
import type { Upload } from '../types/upload'
import { db } from './db'
import { supabase } from './supabase'

function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Sync com a nuvem não está configurado.')
  return supabase
}

// ---- mapeamento camelCase (app) <-> snake_case (Postgres) ----

interface CloudClientRow {
  id: string
  name: string
  created_at: string
  updated_at: string
  settings: ClientSettings | null
}

function clientToRow(c: Client): CloudClientRow {
  return {
    id: c.id,
    name: c.name,
    created_at: new Date(c.createdAt).toISOString(),
    updated_at: new Date(c.updatedAt).toISOString(),
    settings: c.settings ? toJsonSafe(c.settings) : null,
  }
}

function rowToClient(row: CloudClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    settings: row.settings ? fromJsonSafe(row.settings) : undefined,
  }
}

interface CloudUploadRow {
  id: string
  client_id: string
  file_name: string
  uploaded_at: string
  headers: string[]
  column_map: ColumnMap
  row_count: number
  raw_rows: Record<string, string>[]
}

function uploadToRow(u: Upload): CloudUploadRow {
  return {
    id: u.id,
    client_id: u.clientId,
    file_name: u.fileName,
    uploaded_at: new Date(u.uploadedAt).toISOString(),
    headers: u.headers,
    column_map: u.columnMap,
    row_count: u.rowCount,
    raw_rows: u.rawRows,
  }
}

function rowToUpload(row: CloudUploadRow): Upload {
  return {
    id: row.id,
    clientId: row.client_id,
    fileName: row.file_name,
    uploadedAt: new Date(row.uploaded_at).getTime(),
    headers: row.headers,
    columnMap: row.column_map,
    rowCount: row.row_count,
    rawRows: row.raw_rows,
  }
}

interface CloudAnalysisRow {
  id: string
  client_id: string
  upload_id: string
  file_name: string
  created_at: string
  params: Analysis['params']
  account_metrics: Analysis['accountMetrics']
  campaign_count: number
  findings: Analysis['findings']
  waste_info: Analysis['wasteInfo']
}

function analysisToRow(a: Analysis): CloudAnalysisRow {
  return {
    id: a.id,
    client_id: a.clientId,
    upload_id: a.uploadId,
    file_name: a.fileName,
    created_at: new Date(a.createdAt).toISOString(),
    params: toJsonSafe(a.params),
    account_metrics: toJsonSafe(a.accountMetrics),
    campaign_count: a.campaignCount,
    findings: toJsonSafe(a.findings),
    waste_info: a.wasteInfo,
  }
}

function rowToAnalysis(row: CloudAnalysisRow): Analysis {
  return {
    id: row.id,
    clientId: row.client_id,
    uploadId: row.upload_id,
    fileName: row.file_name,
    createdAt: new Date(row.created_at).getTime(),
    params: fromJsonSafe(row.params),
    accountMetrics: fromJsonSafe(row.account_metrics),
    campaignCount: row.campaign_count,
    findings: fromJsonSafe(row.findings),
    wasteInfo: row.waste_info,
  }
}

export interface SyncSummary {
  clients: number
  uploads: number
  analyses: number
}

/** Sincroniza um cliente + todos os uploads e análises dele para a nuvem (upsert por id). */
export async function pushClientToCloud(clientId: string): Promise<SyncSummary> {
  const sb = requireSupabase()
  const client = await db.clients.get(clientId)
  if (!client) throw new Error('Cliente não encontrado localmente.')

  const uploads = await db.uploads.where('clientId').equals(clientId).toArray()
  const analyses = await db.analyses.where('clientId').equals(clientId).toArray()

  const { error: clientError } = await sb.from('clients').upsert(clientToRow(client))
  if (clientError) throw new Error(clientError.message)

  if (uploads.length) {
    const { error } = await sb.from('uploads').upsert(uploads.map(uploadToRow))
    if (error) throw new Error(error.message)
  }
  if (analyses.length) {
    const { error } = await sb.from('analyses').upsert(analyses.map(analysisToRow))
    if (error) throw new Error(error.message)
  }

  return { clients: 1, uploads: uploads.length, analyses: analyses.length }
}

export interface CloudClientSummary {
  id: string
  name: string
  updatedAt: number
}

export async function listCloudClients(): Promise<CloudClientSummary[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('clients').select('id, name, updated_at').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    updatedAt: new Date(row.updated_at as string).getTime(),
  }))
}

/** Baixa um cliente da nuvem + seus uploads e análises, mesclando no banco local (upsert). */
export async function pullClientFromCloud(clientId: string): Promise<SyncSummary> {
  const sb = requireSupabase()

  const { data: clientRow, error: clientError } = await sb.from('clients').select('*').eq('id', clientId).single()
  if (clientError) throw new Error(clientError.message)

  const { data: uploadRows, error: uploadsError } = await sb.from('uploads').select('*').eq('client_id', clientId)
  if (uploadsError) throw new Error(uploadsError.message)

  const { data: analysisRows, error: analysesError } = await sb.from('analyses').select('*').eq('client_id', clientId)
  if (analysesError) throw new Error(analysesError.message)

  const client = rowToClient(clientRow as CloudClientRow)
  const uploads = (uploadRows ?? []).map((r) => rowToUpload(r as CloudUploadRow))
  const analyses = (analysisRows ?? []).map((r) => rowToAnalysis(r as CloudAnalysisRow))

  await db.transaction('rw', db.clients, db.uploads, db.analyses, async () => {
    await db.clients.put(client)
    await Promise.all(uploads.map((u) => db.uploads.put(u)))
    await Promise.all(analyses.map((a) => db.analyses.put(a)))
  })

  return { clients: 1, uploads: uploads.length, analyses: analyses.length }
}
