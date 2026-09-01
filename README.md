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
- Tailwind CSS v4 com o design system Adsplay (tokens em `src/index.css`)
- Vitest para testes do motor de análise

## Estrutura de pastas

```
src/
  engine/        motor de diagnóstico — módulos puros, sem dependência de UI
  types/         tipos de domínio (Client, Upload, ColumnMap, Finding, Analysis)
  db/            Dexie: schema, instância do banco, export/import de backup
  components/    UI (layout, clientes, upload, mapeamento, resultados, histórico)
  hooks/         hooks React que ligam UI ao db/engine
  lib/           formatação e utilidades pequenas
```

`db/` e a maior parte de `components/` ainda serão adicionados nos próximos
passos (fluxo de UI, depois persistência multi-cliente e backup).

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
