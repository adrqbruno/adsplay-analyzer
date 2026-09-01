import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * BACKEND-PLUG: sync opcional para a nuvem (time compartilhado). O app
 * continua local-first por padrão — sem essas duas env vars configuradas no
 * deploy, `supabase` é `null` e toda a UI de sync some silenciosamente (ver
 * `useSupabaseAuth`/`CloudSyncPanel`). Nada de conta na nuvem é obrigatório
 * para usar a ferramenta.
 */
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

export const isCloudSyncConfigured = supabase !== null
