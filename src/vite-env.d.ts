/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Opcionais — sem elas, o sync com a nuvem (Supabase) fica desligado e o app roda 100% local. */
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
