import type { ColumnMap, ColumnRole } from '../types/columnMap'

/** Dicionário de auto-detecção de colunas (PT-BR + EN), portado do protótipo. */
const DICT: Record<ColumnRole, RegExp[]> = {
  account: [/^conta$/i, /account/i],
  campaign: [/campanha/i, /^campaign/i],
  group: [/grupo de an[uú]ncios/i, /ad group/i, /grupo/i],
  ad: [/^an[uú]ncio/i, /^ad$/i, /headline/i, /t[ií]tulo/i],
  term: [/palavra-chave|termo|keyword|search term/i],
  type: [/^tipo$/i, /^type$/i],
  impr: [/impress[õo]es|impr\.?/i, /impressions/i],
  clicks: [/cliques|clicks|clique/i],
  cost: [/custo|cost|spend|investimento/i],
  conv: [/convers[õo]es|conversions|conv\.?/i],
  val: [/valor de convers|conv\.? value|conversion value|receita|revenue/i],
  lost_b: [/perdid.*(or[çc]amento|budget)|lost is.*budget|is perdida.*or[çc]/i],
  lost_r: [/perdid.*(classifica|rank)|lost is.*rank/i],
  is: [/parcela de impress[õo]es(?!.*perd)|search impr\.? share|^impression share/i],
}

export interface RoleDescriptor {
  role: ColumnRole
  label: string
  hint: string
}

/** Papéis exibidos na tela de mapeamento, na ordem da hierarquia do export. */
export const ROLES: RoleDescriptor[] = [
  { role: 'campaign', label: 'Campanha', hint: 'nível — obrigatório' },
  { role: 'group', label: 'Grupo de anúncios', hint: '' },
  { role: 'ad', label: 'Anúncio', hint: '' },
  { role: 'term', label: 'Palavra-chave / Termo', hint: '' },
  { role: 'type', label: 'Tipo (keyword vs termo)', hint: 'opcional' },
  { role: 'impr', label: 'Impressões', hint: '' },
  { role: 'clicks', label: 'Cliques', hint: '' },
  { role: 'cost', label: 'Custo', hint: 'obrigatório' },
  { role: 'conv', label: 'Conversões', hint: 'obrigatório' },
  { role: 'val', label: 'Valor de conversão', hint: '' },
  { role: 'is', label: 'Parcela de impressões', hint: '' },
  { role: 'lost_b', label: 'Perdido (orçamento)', hint: '' },
  { role: 'lost_r', label: 'Perdido (classificação)', hint: '' },
]

export const REQUIRED_ROLES: ColumnRole[] = ['campaign', 'cost', 'conv']

/** Tenta casar cada papel com o primeiro header que combina com sua regex. */
export function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {}
  for (const role of Object.keys(DICT) as ColumnRole[]) {
    const patterns = DICT[role]
    const match = headers.find((header) => patterns.some((re) => re.test(header)))
    if (match) map[role] = match
  }
  return map
}
