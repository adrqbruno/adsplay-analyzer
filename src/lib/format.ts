export function formatMoney(value: number): string {
  return Number.isFinite(value)
    ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'
}

export function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%` : '—'
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return Number.isFinite(value) ? value.toLocaleString('pt-BR', options) : '—'
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
