/**
 * Parser numérico tolerante a pt-BR ("1.234,56") e en ("1234.56"), portado do
 * protótipo validado (num2). Heurística: se sobra vírgula seguida de 1-2 dígitos
 * no fim, trata como separador decimal pt-BR (e pontos como milhar); senão,
 * assume formato en e descarta vírgulas de milhar.
 */
export function parseNumberPtBrOrEn(value: unknown): number {
  if (value == null || value === '') return 0

  let s = String(value).replace(/R\$|\s|%/g, '')

  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }

  const n = parseFloat(s)
  return Number.isNaN(n) ? 0 : n
}
