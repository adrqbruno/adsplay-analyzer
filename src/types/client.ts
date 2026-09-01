export interface ClientSettings {
  cpaMultiplier?: number
  wasteCutoff?: number
}

export interface Client {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  /** Fase 2: thresholds customizados persistidos por workspace. */
  settings?: ClientSettings
}
