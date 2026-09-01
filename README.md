# Adsplay Analyzer

Diagnosticador de campanhas Google Ads — local-first, multi-cliente, sem backend.
Todo o processamento do CSV acontece no navegador; nada é enviado a um servidor.

## Como rodar

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (site estático)
npm run test      # roda os testes (Vitest)
npm run lint      # lint (oxlint)
```

## Stack

- Vite + React + TypeScript (strict)
- Dexie (IndexedDB) para persistência local
- PapaParse para parsing de CSV
- Recharts para gráficos
- jsPDF + jspdf-autotable para o export de diagnóstico em PDF (lazy-loaded, só baixa no clique de "Exportar PDF")
- Tailwind CSS v4 com o design system Adsplay (tokens em `src/index.css`)
- Vitest para testes do motor de análise

## Estrutura de pastas

```
src/
  engine/        motor de diagnóstico — módulos puros, sem dependência de UI
  types/         tipos de domínio (Client, Upload, ColumnMap, Finding, Analysis)
  db/            Dexie: schema, instância do banco, export/import de backup
  components/    UI (layout, clientes, upload, mapeamento, resultados, histórico,
                  comparação de períodos, n-gramas)
  hooks/         hooks React que ligam UI ao db/engine
  lib/           formatação, export de PDF e utilidades pequenas
```

## Funcionalidades

**Fase 1** — upload → mapeamento → diagnóstico (CPA, desperdício, volume,
grupos), multi-cliente com histórico salvo via Dexie, backup local export/import
em JSON.

**Fase 2** — thresholds customizáveis por cliente ("Salvar como padrão deste
cliente" na tela de resultados, lido de `Client.settings`); comparação
período a período (aba "Comparar períodos": sobe dois exports e mostra o
delta de custo/conversões/CPA por campanha, com tendência melhorou/piorou/
estável); export do diagnóstico em PDF com a marca Adsplay (`src/lib/pdf.ts`);
padrões recorrentes em termos de pesquisa por n-grama (`src/engine/ngrams.ts`,
painel "Padrões em termos de pesquisa" na tela de resultados).

## Como adicionar uma nova regra de diagnóstico ao motor

1. Crie `src/engine/rules/minhaRegra.ts` exportando uma função que recebe
   `AdsRow[]` (e `EngineParams` quando a regra tiver threshold ajustável) e
   devolve `Finding | null` — `null` quando a regra não encontrou nada ou não
   tem dados suficientes para rodar (nunca force um achado sem suporte nos
   dados; veja `volumeRule` para o padrão de "some silenciosamente" quando
   falta uma coluna).
2. Monte `rows: Record<string, unknown>[]` e `columns: FindingColumn[]` com as
   colunas que a tabela de detalhe do achado vai mostrar — a UI é genérica e
   renderiza qualquer achado a partir desses dois campos.
3. Registre a regra em `src/engine/analyze.ts`, adicionando sua chamada ao
   array de `findings` (ela já é filtrada e ordenada por `amount` ali).
4. Exporte a função em `src/engine/index.ts`.
5. Escreva testes em `src/engine/__tests__/minhaRegra.test.ts` usando o
   fixture (`loadFixture()` em `__tests__/fixture.ts`) e valores de referência
   calculados de forma independente (não copie a fórmula da regra para o
   teste — recalcule à mão ou com um script separado, senão um bug na fórmula
   passa despercebido).

Todo o motor é puro (sem import de React/DOM) e testável com `npm run test`.
