export interface ClientSettings {
  cpaMultiplier?: number
  wasteCutoff?: number
  /** Meta de CPA (R$) combinada com o cliente — comparação absoluta, não relativa à média interna. */
  targetCpa?: number
  /** Meta de ROAS (×) combinada com o cliente. */
  targetRoas?: number
}

export interface Client {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  /** Fase 2: thresholds customizados persistidos por workspace. */
  settings?: ClientSettings
}
