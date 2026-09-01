import { describe, expect, it } from 'vitest'
import { detectColumns, REQUIRED_ROLES, ROLES } from '../columnDetect'

describe('detectColumns', () => {
  it('detects pt-BR Google Ads export headers', () => {
    const headers = [
      'Conta',
      'Campanha',
      'Grupo de anúncios',
      'Palavra-chave / Termo',
      'Tipo',
      'Impressões',
      'Cliques',
      'Custo',
      'Conversões',
      'Valor de conversão',
      'Parcela de impressões de pesquisa',
      'Parcela perdida (orçamento)',
      'Parcela perdida (classificação)',
    ]
    const map = detectColumns(headers)

    expect(map.campaign).toBe('Campanha')
    expect(map.group).toBe('Grupo de anúncios')
    expect(map.term).toBe('Palavra-chave / Termo')
    expect(map.type).toBe('Tipo')
    expect(map.impr).toBe('Impressões')
    expect(map.clicks).toBe('Cliques')
    expect(map.cost).toBe('Custo')
    expect(map.conv).toBe('Conversões')
    expect(map.val).toBe('Valor de conversão')
    expect(map.is).toBe('Parcela de impressões de pesquisa')
    expect(map.lost_b).toBe('Parcela perdida (orçamento)')
    expect(map.lost_r).toBe('Parcela perdida (classificação)')
  })

  it('detects English Google Ads export headers', () => {
    const headers = ['Campaign', 'Ad group', 'Search term', 'Cost', 'Conversions', 'Conversion value', 'Clicks', 'Impressions']
    const map = detectColumns(headers)

    expect(map.campaign).toBe('Campaign')
    expect(map.group).toBe('Ad group')
    expect(map.term).toBe('Search term')
    expect(map.cost).toBe('Cost')
    expect(map.conv).toBe('Conversions')
    expect(map.val).toBe('Conversion value')
    expect(map.clicks).toBe('Clicks')
    expect(map.impr).toBe('Impressions')
  })

  it('leaves a role unmapped when no header matches', () => {
    const map = detectColumns(['Campanha', 'Custo'])
    expect(map.conv).toBeUndefined()
    expect(map.lost_b).toBeUndefined()
  })

  it('keeps campaign, cost and conv as the required roles', () => {
    expect(REQUIRED_ROLES).toEqual(['campaign', 'cost', 'conv'])
  })

  it('exposes a role descriptor for every mapping-screen row', () => {
    const roles = ROLES.map((r) => r.role)
    expect(roles).toContain('campaign')
    expect(roles).toContain('cost')
    expect(roles).toContain('conv')
  })
})
