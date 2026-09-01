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

export function formatSignedMoney(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = formatMoney(Math.abs(value))
  if (value > 0) return `+${abs}`
  if (value < 0) return `-${abs}`
  return abs
}

export function formatSignedPercent(value: number, options?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1, ...options })}%`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
