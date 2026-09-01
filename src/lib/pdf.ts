import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AnalyzeResult } from '../engine/analyze'
import type { EngineParams } from '../engine/types'
import { formatDateTime, formatMoney, formatNumber } from './format'
import { formatFindingCellText } from './findingCell'

const VIOLET: [number, number, number] = [123, 47, 191]
const VIOLET_DEEP: [number, number, number] = [91, 30, 147]
const INK: [number, number, number] = [42, 34, 51]
const MUTE: [number, number, number] = [139, 131, 148]
const LILAC: [number, number, number] = [244, 237, 251]
const LILAC_LINE: [number, number, number] = [228, 211, 245]
const PAPER_2: [number, number, number] = [251, 248, 254]

export interface PdfReportInput {
  clientName: string
  fileName: string
  createdAt: number
  params: EngineParams
  result: Pick<AnalyzeResult, 'accountMetrics' | 'campaignCount' | 'findings' | 'wasteInfo'>
}

function docWithLastAutoTable(doc: jsPDF): jsPDF & { lastAutoTable?: { finalY: number } } {
  return doc as jsPDF & { lastAutoTable?: { finalY: number } }
}

// jsPDF's built-in "helvetica" font only covers WinAnsi (Windows-1252) glyphs —
// "→" isn't one of them and renders as garbage with broken kerning. Swap it
// for an ASCII arrow before any text hits the PDF.
function pdfSafeText(text: string): string {
  return text.replace(/→/g, '->')
}

/** Monta o PDF de diagnóstico com a marca Adsplay, 100% client-side (sem servidor). */
export function buildDiagnosisPdf(input: PdfReportInput): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = 54

  // Marca
  doc.setDrawColor(...VIOLET)
  doc.setLineWidth(2)
  doc.circle(margin + 7, y - 4, 7, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...INK)
  doc.text('Adsplay Analisador', margin + 24, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTE)
  doc.text('Diagnóstico de campanhas Google Ads · processado localmente', margin + 24, y + 13)

  y += 34
  doc.setDrawColor(...LILAC_LINE)
  doc.line(margin, y, pageWidth - margin, y)
  y += 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text(input.clientName, margin, y)
  y += 15

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTE)
  doc.text(`Arquivo: ${input.fileName}`, margin, y)
  y += 13
  doc.text(`Relatório gerado em ${formatDateTime(Date.now())} · Análise de ${formatDateTime(input.createdAt)}`, margin, y)
  y += 13
  doc.text(
    `Sensibilidade de CPA: ${input.params.cpaMultiplier.toFixed(1)}× · Corte de desperdício: ${formatMoney(input.params.wasteCutoff)}`,
    margin,
    y,
  )
  y += 26

  // KPIs
  const { accountMetrics: m, campaignCount } = input.result
  const kpis: [string, string][] = [
    ['Custo total', formatMoney(m.cost)],
    ['Conversões', formatNumber(m.conv, { maximumFractionDigits: 1 })],
    ['CPA médio', formatMoney(m.cpa)],
    ['ROAS', `${formatNumber(m.roas, { maximumFractionDigits: 2 })}×`],
    ['Campanhas', formatNumber(campaignCount)],
  ]
  const kpiColWidth = (pageWidth - margin * 2) / kpis.length
  kpis.forEach(([label, value], i) => {
    const x = margin + i * kpiColWidth
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTE)
    doc.text(label.toUpperCase(), x, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...INK)
    doc.text(value, x, y + 15)
  })
  y += 40

  // Achados
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(...VIOLET_DEEP)
  doc.text('Achados priorizados por impacto', margin, y)
  y += 18

  if (!input.result.findings.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...MUTE)
    doc.text('Nenhum gargalo acima dos limiares usados nesta análise.', margin, y)
    y += 20
  }

  for (const finding of input.result.findings) {
    if (y > pageHeight - 130) {
      doc.addPage()
      y = 50
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    const amountLabel = finding.noAmount ? '' : `   ${formatMoney(finding.amount)}`
    doc.text(pdfSafeText(`${finding.title}${amountLabel}`), margin, y)
    y += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTE)
    const whyLines = doc.splitTextToSize(pdfSafeText(finding.why), pageWidth - margin * 2)
    doc.text(whyLines, margin, y)
    y += whyLines.length * 10.5 + 6

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [finding.columns.map((c) => pdfSafeText(c.label))],
      body: finding.rows.map((row) => finding.columns.map((c) => pdfSafeText(formatFindingCellText(c.key, row[c.key])))),
      styles: { fontSize: 8, textColor: INK, cellPadding: 5 },
      headStyles: { fillColor: LILAC, textColor: VIOLET, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: PAPER_2 },
      theme: 'grid',
    })

    y = (docWithLastAutoTable(doc).lastAutoTable?.finalY ?? y) + 22
  }

  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTE)
    doc.text('Gerado localmente pelo Adsplay Analisador — nenhum dado do cliente saiu do navegador.', margin, pageHeight - 24)
    doc.text(`${p} / ${pageCount}`, pageWidth - margin - 20, pageHeight - 24)
  }

  return doc
}

export function downloadDiagnosisPdf(input: PdfReportInput) {
  const doc = buildDiagnosisPdf(input)
  const stamp = new Date(input.createdAt).toISOString().slice(0, 10)
  const safeName = input.clientName.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
  doc.save(`adsplay-diagnostico-${safeName}-${stamp}.pdf`)
}
