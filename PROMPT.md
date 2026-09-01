# Projeto: Adsplay Analyzer — Diagnóstico de campanhas Google Ads (multi-cliente, local-first)

## Contexto
Sou fundador de uma consultoria de performance marketing (AdRoq) especializada
em FX/CFD, prop firms e B2B SaaS. Preciso de uma ferramenta interna para analisar
campanhas de Google Ads de vários clientes. O usuário exporta o CSV completo da
conta (hierarquia: conta → campanha → grupo de anúncios → anúncio → keyword →
termo de pesquisa) e a ferramenta devolve um diagnóstico priorizado por impacto em R$.

Já existe um protótipo validado em HTML single-file (colado ao final deste arquivo).
A lógica de diagnóstico dele está CORRETA e testada — use-a como especificação
funcional, não a jogue fora. Este projeto é a evolução estruturada dele.

## Decisão de arquitetura (já tomada — não me pergunte de novo)
- **Local-first, sem backend.** Nenhum dado de cliente sai do navegador. Isso é
  requisito de privacidade, não preferência.
- **Persistência via IndexedDB** (use a lib `dexie`). Guardar clientes, uploads
  históricos e resultados de análise localmente.
- **Multi-cliente:** o app organiza dados por cliente (workspace). Cada cliente
  tem seu histórico de análises.
- **Export/import de backup:** botão para exportar todo o banco local em um arquivo
  JSON e reimportar (para trocar de máquina). Isso substitui "conta na nuvem".
- Deixe um comentário `// BACKEND-PLUG:` em cada ponto onde um backend entraria
  no futuro (auth, sync, storage remoto), mas NÃO implemente backend agora.

## Stack
- **Vite + React + TypeScript**
- **Dexie** (IndexedDB) para persistência
- **PapaParse** para CSV
- **Recharts** para gráficos
- **Tailwind CSS** para estilo (com o design system Adsplay abaixo)
- Sem framework de backend. Site 100% estático, deployável no Vercel/Netlify.

## Design system Adsplay (aplicar rigorosamente)
- Cor de marca: roxo/violeta. Tokens:
  `--violet:#7B2FBF`, `--violet-deep:#5B1E93`, `--violet-ink:#3E1568`,
  `--lilac:#F4EDFB`, `--lilac-line:#E4D3F5`, `--ink:#2A2233`, `--body:#5C5566`.
  Semânticos: ok `#5BB98B`, warn `#E8763C`, danger `#D64545`.
- Fundo claro. Cards com borda roxa clara e cantos bem arredondados (radius ~20px).
- Tipografia: **Baloo 2** (600/700) para títulos — arredondada, amigável;
  **Nunito Sans** para corpo. Sentence case, nunca ALL CAPS.
- Botões: pill roxo preenchido (primário), pill com borda (secundário).
- Marcador de lista/ação = check roxo (✓), como na identidade da Adsplay.
- Padrão decorativo: arcos concêntricos roxos no hero (opcional, sutil).
- Não usar sombras pesadas nem gradientes decorativos. Flat e limpo.

## Funcionalidades — Fase 1 (portar e estruturar o que já existe)
1. **Gestão de clientes:** criar/selecionar/renomear/excluir workspaces de cliente.
2. **Upload de CSV** com dropzone. Processamento local.
3. **Auto-detecção de colunas** (PT-BR + EN) com tela de mapeamento editável.
   Roles: campaign, group, ad, term, type, impr, clicks, cost, conv, val, is,
   lost_b (perdido orçamento), lost_r (perdido ranking). Obrigatórias: campaign,
   cost, conv. Regex de detecção estão no protótipo — reaproveite e expanda.
   Trate exports com linhas de título antes do cabeçalho (detectar e pular).
   Parsing numérico deve lidar com formato pt-BR ("1.234,56") e en ("1234.56").
4. **Motor de diagnóstico** (a lógica já validada — replique fielmente):
   - **CPA alto:** cada nível comparado à média do nível ACIMA (campanha vs conta,
     grupo vs campanha), com múltiplo ajustável (default 1,3×). Decompor o driver:
     CPC caro / CTR baixo / Conv. rate baixa.
   - **Desperdício:** termos de pesquisa com 0 conversão e gasto ≥ corte em R$
     (ajustável via slider). Ordenar por gasto. Somar total recuperável.
   - **Volume:** por campanha, comparar perdido-orçamento vs perdido-ranking,
     apontar gargalo dominante (remédios opostos).
   - **Grupos fora da curva** vs a média da própria campanha-mãe.
   - Priorizar TODOS os achados por impacto em R$ (excesso = (cpa - benchmark) * conv).
5. **Resultados:** KPIs da conta + cards de achados expansíveis, ordenados por R$,
   com severidade (alto/médio/baixo), tabela de detalhe e leitura/ação de cada um.
6. **Persistência:** salvar cada análise no histórico do cliente (data, arquivo,
   resumo dos achados). Poder reabrir uma análise passada.

## Funcionalidades — Fase 2 (implementar depois da Fase 1 estar sólida; deixe scaffolding)
- **Comparação período a período:** subir dois exports (ex.: mês atual vs anterior)
  e ver o delta de CPA, custo, conversões e o que melhorou/piorou por campanha.
- **Export do diagnóstico em PDF** (client-side) com a marca Adsplay, para entregar
  ao cliente.
- **Regras customizáveis:** o usuário define seus próprios thresholds por cliente
  e eles ficam salvos naquele workspace.
- **Search Terms n-gram:** quebrar termos em n-gramas para achar padrões de
  desperdício recorrentes (ex.: a palavra "grátis" aparece em X termos que gastam Y).

## Qualidade e boas práticas
- TypeScript estrito. Tipar o modelo de dados (Client, Upload, ColumnMap, Finding).
- Separar o **motor de análise em módulos puros e testáveis** (`/src/engine/`),
  independentes da UI. Cada regra (cpa, waste, volume, groups) em seu arquivo.
- **Escreva testes** (Vitest) para o motor, com um CSV fixture sintético. Os números
  do fixture devem bater com valores esperados — este é o contrato de correção.
  (Há um fixture pronto e seus valores esperados na seção "Fixture de teste" abaixo.)
- Acessível: foco de teclado visível, prefers-reduced-motion respeitado, responsivo.
- README com: como rodar (`npm i && npm run dev`), estrutura de pastas, e como
  adicionar uma nova regra de diagnóstico ao motor.
- Commits pequenos e descritivos.

## Ordem de execução que espero de você
1. Primeiro, me proponha a estrutura de pastas e o modelo de dados (types) e
   AGUARDE meu ok antes de codar tudo.
2. Scaffold do projeto (Vite+React+TS+Tailwind+Dexie), design system aplicado.
3. Motor de análise em `/src/engine/` + testes passando com o fixture.
4. UI: fluxo upload → mapeamento → resultados.
5. Persistência multi-cliente + histórico.
6. Backup export/import.
Só depois partimos para a Fase 2.

## Importante
- Não invente diagnóstico onde o dado não suporta: se faltar coluna (ex.: sem
  Lost IS), a análise de Volume some silenciosamente, não gera achado falso.
- Casos atípicos que fogem das regras devem ser marcados como "revisar manualmente",
  nunca forçados num diagnóstico.
- Mantenha o parsing tolerante: exports do Google Ads variam por idioma e por
  colunas selecionadas.

## Fixture de teste (contrato de correção do motor)
Gere no scaffolding um CSV sintético com a mesma forma do export real (colunas
PT-BR: `Conta, Campanha, Grupo de anúncios, Palavra-chave / Termo, Tipo,
Impressões, Cliques, Custo, Conversões, Valor de conversão,
Parcela de impressões de pesquisa, Parcela perdida (orçamento),
Parcela perdida (classificação)`), com linhas de tipo "Palavra-chave" e
"Termo de pesquisa" misturadas. Os testes do motor devem assertar, entre outros:
- CPA médio da conta é calculado como custo_total / conversões_total (só linhas de keyword).
- Desperdício = soma do custo de termos de pesquisa com 0 conversão acima do corte.
- Volume classifica o gargalo dominante por campanha comparando perdido-orçamento
  vs perdido-ranking.
- Achados vêm ordenados por impacto em R$ decrescente.
Use o protótipo abaixo como fonte-verdade da fórmula de cada regra.

---

## PROTÓTIPO VALIDADO (fonte-verdade da lógica de diagnóstico)

O arquivo HTML single-file abaixo já foi testado: os cálculos do seu motor JS
foram conferidos contra um motor Python de referência e os números bateram
(CPA da conta e total de desperdício idênticos). Extraia dele as regex de
auto-detecção de colunas, o parser numérico pt-BR/en (`num2`), e as fórmulas
de cada regra de diagnóstico. Porte essa lógica para módulos TypeScript puros
em `/src/engine/`; não copie o HTML como está.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Analisador de campanha — Adsplay</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
<style>
:root{
  --violet:#7B2FBF;--violet-deep:#5B1E93;--violet-ink:#3E1568;--violet-bright:#9B3FE0;
  --lilac:#F4EDFB;--lilac-line:#E4D3F5;--ink:#2A2233;--body:#5C5566;--mute:#8B8394;
  --paper:#fff;--paper-2:#FBF8FE;--line:#EDE6F4;
  --ok:#5BB98B;--ok-bg:#EAF6EF;--warn:#E8763C;--warn-bg:#FBEDE4;--danger:#D64545;--danger-bg:#FBEAEA;
  --radius:20px;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--body);font-family:"Nunito Sans",system-ui,sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:1160px;margin:0 auto;padding:0 28px}
h1,h2,h3,h4,.baloo{font-family:"Baloo 2",system-ui,sans-serif;font-weight:600;color:var(--ink)}

nav{border-bottom:1px solid var(--line);background:var(--paper);position:sticky;top:0;z-index:20}
.nav-in{max-width:1160px;margin:0 auto;padding:15px 28px;display:flex;align-items:center;gap:16px}
.logo{display:flex;align-items:center;gap:9px;font-family:"Baloo 2";font-weight:700;font-size:23px;color:var(--ink)}
.logo .mark{width:28px;height:28px;border:3px solid var(--violet);border-radius:50%;display:grid;place-items:center}
.logo .mark::after{content:"";width:0;height:0;border-left:7px solid var(--violet);border-top:4.5px solid transparent;border-bottom:4.5px solid transparent;margin-left:2px}
.logo sup{font-size:9px;color:var(--mute)}
.logo small{font-family:"Nunito Sans";font-weight:700;font-size:12px;color:var(--violet);background:var(--lilac);padding:3px 10px;border-radius:12px;margin-left:6px}
.steps{margin-left:auto;display:flex;gap:8px;font-size:13px;font-weight:700}
.steps span{color:var(--mute);display:flex;align-items:center;gap:8px}
.steps span.on{color:var(--violet)}
.steps span .b{width:22px;height:22px;border-radius:50%;background:var(--lilac);color:var(--mute);display:grid;place-items:center;font-family:"Baloo 2";font-size:12px}
.steps span.on .b{background:var(--violet);color:#fff}
.steps .arw{color:var(--lilac-line)}

.hero{background:linear-gradient(180deg,var(--lilac) 0%,var(--paper) 100%);padding:52px 0 30px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--paper);border:1px solid var(--lilac-line);color:var(--violet);font-weight:700;font-size:13px;padding:7px 16px;border-radius:20px;margin-bottom:18px}
.eyebrow .d{width:7px;height:7px;border-radius:50%;background:var(--violet)}
h1{font-size:clamp(30px,4.6vw,46px);line-height:1.02;letter-spacing:-.015em;margin:0 0 14px;max-width:20ch}
h1 .go{color:var(--violet)}
.lede{font-size:18px;color:var(--body);max-width:60ch;margin:0}

section{padding:34px 0}
.panel{border:2px solid var(--lilac-line);border-radius:26px;background:var(--paper);overflow:hidden;margin-bottom:26px}
.p-top{padding:20px 28px;background:var(--lilac);border-bottom:2px solid var(--lilac-line);display:flex;align-items:center;gap:14px}
.p-top .badge{background:var(--violet);color:#fff;font-family:"Baloo 2";font-weight:600;font-size:13px;padding:5px 14px;border-radius:16px}
.p-top h2{font-size:20px;margin:0;color:var(--violet-deep)}
.p-body{padding:26px 28px}

/* dropzone */
.drop{border:2.5px dashed var(--lilac-line);border-radius:var(--radius);padding:46px 24px;text-align:center;background:var(--paper-2);cursor:pointer;transition:border-color .18s,background .18s}
.drop:hover,.drop.dragover{border-color:var(--violet);background:var(--lilac)}
.drop .ic{width:56px;height:56px;border-radius:18px;background:var(--violet);display:grid;place-items:center;margin:0 auto 16px;color:#fff}
.drop .ic svg{width:28px;height:28px}
.drop .big{font-family:"Baloo 2";font-weight:600;font-size:20px;color:var(--ink);margin-bottom:6px}
.drop .sm{font-size:14px;color:var(--mute)}
.drop input{display:none}
.privacy{margin-top:14px;font-size:13px;color:var(--mute);display:flex;align-items:center;gap:8px;justify-content:center}
.privacy svg{width:16px;height:16px;color:var(--ok)}

/* mapping table */
.maprow{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
.maprow:last-child{border-bottom:none}
.maprow .role{font-family:"Baloo 2";font-weight:600;font-size:15px;color:var(--ink)}
.maprow .role small{display:block;font-family:"Nunito Sans";font-weight:400;font-size:12.5px;color:var(--mute)}
.maprow .arw{color:var(--violet)}
.maprow select{width:100%;padding:10px 12px;border:2px solid var(--lilac-line);border-radius:12px;font-family:inherit;font-size:14px;color:var(--ink);background:var(--paper)}
.maprow select:focus{outline:none;border-color:var(--violet)}
.maprow.matched select{border-color:var(--ok);background:var(--ok-bg)}
.maprow.missing select{border-color:var(--warn)}
.tag-auto{font-size:11px;font-weight:700;color:var(--ok);margin-left:8px}

.controls{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-end;margin-bottom:8px}
.ctrl{flex:1 1 240px}
.ctrl label{display:block;font-family:"Baloo 2";font-weight:600;font-size:14px;color:var(--ink);margin-bottom:8px}
.ctrl label .val{color:var(--violet);float:right}
.ctrl input[type=range]{width:100%;accent-color:var(--violet)}
.ctrl input[type=number]{width:120px;padding:9px 12px;border:2px solid var(--lilac-line);border-radius:12px;font-family:inherit;font-size:15px}

.btn{background:var(--violet);color:#fff;border:none;font-family:"Baloo 2";font-weight:600;font-size:16px;padding:13px 30px;border-radius:24px;cursor:pointer;transition:background .15s}
.btn:hover{background:var(--violet-deep)}
.btn:disabled{background:var(--lilac-line);cursor:not-allowed}
.btn.ghost{background:var(--paper);color:var(--violet);border:2px solid var(--lilac-line)}
.btn.ghost:hover{border-color:var(--violet);background:var(--lilac)}
.actions{display:flex;gap:12px;margin-top:22px;flex-wrap:wrap}

/* KPI strip */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:8px}
.kpi{background:var(--paper);border:2px solid var(--lilac-line);border-radius:18px;padding:16px 18px}
.kpi .k{font-weight:700;font-size:12px;color:var(--mute);margin-bottom:5px}
.kpi .v{font-family:"Baloo 2";font-weight:700;font-size:24px;color:var(--ink)}
.kpi .v.ok{color:var(--ok)}.kpi .v.warn{color:var(--warn)}

/* finding cards */
.finding{border:2px solid var(--lilac-line);border-radius:18px;padding:0;margin-bottom:16px;overflow:hidden}
.f-head{display:flex;align-items:center;gap:12px;padding:16px 20px;background:var(--paper-2);cursor:pointer}
.f-head .sev{font-size:11px;font-weight:700;padding:4px 11px;border-radius:12px;flex:none}
.sev.high{background:var(--danger-bg);color:var(--danger)}
.sev.med{background:var(--warn-bg);color:var(--warn)}
.sev.low{background:var(--lilac);color:var(--violet)}
.f-head .ft{font-family:"Baloo 2";font-weight:600;font-size:16px;color:var(--ink);flex:1}
.f-head .amt{font-family:"Baloo 2";font-weight:700;font-size:16px;color:var(--violet)}
.f-head .chev{color:var(--mute);transition:transform .2s}
.finding.open .chev{transform:rotate(180deg)}
.f-body{padding:0 20px;max-height:0;overflow:hidden;transition:max-height .25s,padding .25s}
.finding.open .f-body{padding:6px 20px 20px;max-height:1400px}
.f-body table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:8px}
.f-body th{text-align:left;font-weight:700;color:var(--mute);font-size:12px;padding:8px 10px;border-bottom:2px solid var(--line)}
.f-body td{padding:9px 10px;border-bottom:1px solid var(--line);color:var(--ink)}
.f-body td.num{text-align:right;font-variant-numeric:tabular-nums}
.f-body tr:last-child td{border-bottom:none}
.f-body .why{background:var(--lilac);border-radius:14px;padding:12px 16px;margin:12px 0;font-size:14px;color:var(--violet-ink)}
.f-body .why b{color:var(--violet-deep)}
.pill{display:inline-block;font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;background:var(--lilac);color:var(--violet)}
.pill.b{background:var(--warn-bg);color:var(--warn)}
.pill.r{background:var(--danger-bg);color:var(--danger)}

.empty-msg{text-align:center;padding:50px 20px;color:var(--mute)}
.empty-msg .big{font-family:"Baloo 2";font-weight:600;font-size:20px;color:var(--body);margin-bottom:6px}
.hidden{display:none!important}
.note{font-size:13px;color:var(--mute);margin-top:14px;display:flex;gap:8px;align-items:flex-start}
.note svg{width:16px;height:16px;color:var(--violet);flex:none;margin-top:2px}
.err{background:var(--danger-bg);border:2px solid #F0C0C0;color:var(--danger);border-radius:14px;padding:14px 18px;font-size:14px;font-weight:600;margin-top:14px}

footer{background:var(--lilac);border-top:1px solid var(--lilac-line);padding:28px 0;color:var(--mute);font-size:13px;margin-top:30px}
footer .wrap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;align-items:center}
@media(max-width:760px){.steps{display:none}.maprow{grid-template-columns:1fr}.maprow .arw{display:none}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>

<nav>
  <div class="nav-in">
    <div class="logo"><span class="mark"></span>Adsplay<sup>®</sup><small>Analisador</small></div>
    <div class="steps">
      <span class="on" id="st1"><span class="b">1</span>Upload</span>
      <span class="arw">›</span>
      <span id="st2"><span class="b">2</span>Mapear</span>
      <span class="arw">›</span>
      <span id="st3"><span class="b">3</span>Diagnóstico</span>
    </div>
  </div>
</nav>

<header class="hero">
  <div class="wrap">
    <span class="eyebrow"><span class="d"></span>Google Ads · Controle · Otimização · Experimento</span>
    <h1>Suba o export da conta. <span class="go">Receba o diagnóstico priorizado em R$.</span></h1>
    <p class="lede">A ferramenta lê a hierarquia inteira — conta, campanha, grupo, anúncio, keyword e termo — calcula os gargalos sobre os seus números e ordena tudo por quanto você recupera. Nada sai do seu navegador.</p>
  </div>
</header>

<main class="wrap">

<!-- STEP 1: UPLOAD -->
<section id="sec-upload">
  <div class="panel">
    <div class="p-top"><span class="badge">Passo 1</span><h2>Envie o CSV do Google Ads</h2></div>
    <div class="p-body">
      <label class="drop" id="drop">
        <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 5v13"/></svg></span>
        <span class="big">Arraste o arquivo aqui ou clique para selecionar</span>
        <span class="sm">CSV exportado do Google Ads · com todos os níveis num arquivo só</span>
        <input type="file" id="file" accept=".csv,text/csv">
      </label>
      <div class="privacy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Processamento 100% local — o CSV não é enviado a nenhum servidor.</div>
      <div id="upErr" class="err hidden"></div>
    </div>
  </div>
</section>

<!-- STEP 2: MAPPING -->
<section id="sec-map" class="hidden">
  <div class="panel">
    <div class="p-top"><span class="badge">Passo 2</span><h2>Confirme as colunas</h2></div>
    <div class="p-body">
      <p style="margin-top:0;color:var(--body)">Detectei as colunas abaixo automaticamente. Ajuste qualquer uma que estiver errada — só <b>Custo</b>, <b>Conversões</b> e a coluna de <b>nível</b> são obrigatórias.</p>
      <div id="mapTable"></div>
      <div class="actions">
        <button class="btn" id="runBtn">Rodar diagnóstico</button>
        <button class="btn ghost" id="resetBtn">Trocar arquivo</button>
      </div>
      <div class="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg><span>Linhas de <b>keyword</b> e <b>termo de pesquisa</b> são separadas pela coluna “Tipo” quando existir; sem ela, a análise de desperdício usa todas as linhas com termo.</span></div>
    </div>
  </div>
</section>

<!-- STEP 3: RESULTS -->
<section id="sec-results" class="hidden">
  <div class="panel">
    <div class="p-top"><span class="badge">Passo 3</span><h2>Diagnóstico da conta</h2></div>
    <div class="p-body">
      <div class="kpis" id="kpis"></div>

      <div class="controls" style="margin-top:22px">
        <div class="ctrl">
          <label>Sensibilidade de CPA <span class="val" id="multVal">1,3×</span></label>
          <input type="range" id="mult" min="1.1" max="2.5" step="0.1" value="1.3">
          <div style="font-size:12.5px;color:var(--mute);margin-top:4px">Marca um nível quando o CPA passa deste múltiplo da média do nível acima.</div>
        </div>
        <div class="ctrl">
          <label>Corte de desperdício (termo com 0 conversão)</label>
          <div style="display:flex;align-items:center;gap:10px">R$ <input type="number" id="wasteCut" min="0" step="10" value="100"><span style="font-size:13px;color:var(--mute)" id="wasteInfo"></span></div>
        </div>
      </div>
    </div>
  </div>

  <h3 style="font-size:22px;margin:6px 0 16px">Achados priorizados por impacto</h3>
  <div id="findings"></div>
</section>

</main>

<footer>
  <div class="wrap">
    <div class="logo" style="font-size:19px"><span class="mark" style="width:23px;height:23px;border-width:2.5px"></span>Adsplay<sup>®</sup></div>
    <span>Analisador de campanha · framework controle · otimização · experimento · v1</span>
  </div>
</footer>

<script>
const CK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:var(--violet);vertical-align:-3px;margin-right:6px"><path d="M5 13l4 4L19 7"/></svg>';
const money=v=>isFinite(v)?'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const pct=v=>(v*100).toLocaleString('pt-BR',{maximumFractionDigits:0})+'%';

// ---- column auto-detect dictionaries (PT-BR + EN) ----
const DICT={
  account:[/^conta$/i,/account/i],
  campaign:[/campanha/i,/^campaign/i],
  group:[/grupo de an[uú]ncios/i,/ad group/i,/grupo/i],
  ad:[/^an[uú]ncio/i,/^ad$/i,/headline/i,/t[ií]tulo/i],
  term:[/palavra-chave|termo|keyword|search term/i],
  type:[/^tipo$/i,/^type$/i],
  impr:[/impress[õo]es|impr\.?/i,/impressions/i],
  clicks:[/cliques|clicks|clique/i],
  cost:[/custo|cost|spend|investimento/i],
  conv:[/convers[õo]es|conversions|conv\.?/i],
  val:[/valor de convers|conv\.? value|conversion value|receita|revenue/i],
  lost_b:[/perdid.*(or[çc]amento|budget)|lost is.*budget|is perdida.*or[çc]/i],
  lost_r:[/perdid.*(classifica|rank)|lost is.*rank/i],
  is:[/parcela de impress[õo]es(?!.*perd)|search impr\.? share|^impression share/i]
};
const ROLES=[
  ['campaign','Campanha','nível — obrigatório'],
  ['group','Grupo de anúncios',''],
  ['ad','Anúncio',''],
  ['term','Palavra-chave / Termo',''],
  ['type','Tipo (keyword vs termo)','opcional'],
  ['impr','Impressões',''],
  ['clicks','Cliques',''],
  ['cost','Custo','obrigatório'],
  ['conv','Conversões','obrigatório'],
  ['val','Valor de conversão',''],
  ['is','Parcela de impressões',''],
  ['lost_b','Perdido (orçamento)',''],
  ['lost_r','Perdido (classificação)','']
];
const REQUIRED=['campaign','cost','conv'];

let RAW=[], HEADERS=[], MAP={};

function detect(headers){
  const m={};
  for(const [role,rx] of Object.entries(DICT)){
    for(const h of headers){ if(rx.some(r=>r.test(h))){ m[role]=h; break; } }
  }
  return m;
}
function num(v){ if(v==null)return 0; let s=(''+v).replace(/[R$\s%.]/g,m=>m==='.'?'':m).replace(',','.').replace(/[^\d.\-]/g,''); let n=parseFloat(s); return isNaN(n)?0:n; }
// smarter numeric: handle "1.234,56" and "1234.56"
function num2(v){
  if(v==null||v==='')return 0;
  let s=(''+v).replace(/R\$|\s|%/g,'');
  if(/,\d{1,2}$/.test(s)) s=s.replace(/\./g,'').replace(',','.'); // pt-br
  else s=s.replace(/,/g,'');
  let n=parseFloat(s); return isNaN(n)?0:n;
}

// ---------- STEP 1 ----------
const drop=document.getElementById('drop'),file=document.getElementById('file');
['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('dragover')}));
['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('dragover')}));
drop.addEventListener('drop',ev=>{const f=ev.dataTransfer.files[0];if(f)handleFile(f)});
file.addEventListener('change',ev=>{const f=ev.target.files[0];if(f)handleFile(f)});

function handleFile(f){
  document.getElementById('upErr').classList.add('hidden');
  Papa.parse(f,{header:true,skipEmptyLines:true,dynamicTyping:false,
    complete:res=>{
      if(!res.data.length||!res.meta.fields){showUpErr('Não consegui ler linhas nesse arquivo. Confirme que é um CSV do Google Ads.');return;}
      // Google Ads exports often have 1-2 title rows before header — Papa may misread.
      RAW=res.data; HEADERS=res.meta.fields.filter(h=>h&&h.trim());
      if(HEADERS.length<3){showUpErr('O cabeçalho veio com poucas colunas. Se o export tem linhas de título no topo, remova-as e reenvie.');return;}
      MAP=detect(HEADERS);
      if(!MAP.cost&&!MAP.conv){showUpErr('Não localizei colunas de Custo/Conversões. Você poderá mapear manualmente na próxima tela.');}
      buildMap(); goStep(2);
    },
    error:()=>showUpErr('Falha ao processar o arquivo.')});
}
function showUpErr(m){const e=document.getElementById('upErr');e.textContent=m;e.classList.remove('hidden');}

// ---------- STEP 2 ----------
function buildMap(){
  const t=document.getElementById('mapTable'); t.innerHTML='';
  ROLES.forEach(([role,label,hint])=>{
    const auto=MAP[role];
    const req=REQUIRED.includes(role);
    const opts=['<option value="">— não usar —</option>'].concat(
      HEADERS.map(h=>`<option value="${h}" ${h===auto?'selected':''}>${h}</option>`)).join('');
    const cls=auto?'matched':(req?'missing':'');
    t.insertAdjacentHTML('beforeend',`
      <div class="maprow ${cls}" data-role="${role}">
        <div class="role">${label}${req?' <span style="color:var(--danger)">*</span>':''}${auto?'<span class="tag-auto">✓ auto</span>':''}<small>${hint}</small></div>
        <div class="arw">→</div>
        <div><select data-role="${role}">${opts}</select></div>
      </div>`);
  });
  t.querySelectorAll('select').forEach(s=>s.addEventListener('change',e=>{
    MAP[e.target.dataset.role]=e.target.value||undefined;
    const row=e.target.closest('.maprow');
    row.classList.toggle('matched',!!e.target.value);
    row.classList.toggle('missing',REQUIRED.includes(e.target.dataset.role)&&!e.target.value);
  }));
}
document.getElementById('resetBtn').onclick=()=>{RAW=[];HEADERS=[];MAP={};file.value='';goStep(1);};
document.getElementById('runBtn').onclick=()=>{
  for(const r of REQUIRED){ if(!MAP[r]){alert('Mapeie a coluna obrigatória: '+r);return;} }
  analyze(); goStep(3);
};

function goStep(n){
  document.getElementById('sec-upload').classList.toggle('hidden',n!==1);
  document.getElementById('sec-map').classList.toggle('hidden',n!==2);
  document.getElementById('sec-results').classList.toggle('hidden',n!==3);
  [1,2,3].forEach(i=>document.getElementById('st'+i).classList.toggle('on',i<=n));
  window.scrollTo({top:0,behavior:'smooth'});
}

// ---------- STEP 3: ENGINE ----------
let ROWS=[], KW=[], TERMS=[], ACCT={};
function get(row,role){return MAP[role]?row[MAP[role]]:undefined;}
function mets(list){
  let cost=0,clicks=0,impr=0,conv=0,val=0;
  list.forEach(r=>{cost+=r.cost;clicks+=r.clicks;impr+=r.impr;conv+=r.conv;val+=r.val;});
  return {cost,clicks,impr,conv,val,
    cpc:clicks?cost/clicks:0, ctr:impr?clicks/impr:0, cr:clicks?conv/clicks:0,
    cpa:conv?cost/conv:Infinity, roas:cost?val/cost:0, n:list.length};
}
function analyze(){
  ROWS=RAW.map(r=>({
    campaign:(get(r,'campaign')||'—').trim(),
    group:(get(r,'group')||'—').trim(),
    ad:(get(r,'ad')||'').trim(),
    term:(get(r,'term')||'').trim(),
    type:(get(r,'type')||'').trim().toLowerCase(),
    impr:num2(get(r,'impr')),clicks:num2(get(r,'clicks')),cost:num2(get(r,'cost')),
    conv:num2(get(r,'conv')),val:num2(get(r,'val')),
    is:num2(get(r,'is')),lost_b:num2(get(r,'lost_b')),lost_r:num2(get(r,'lost_r')),
    hasLost: MAP.lost_b||MAP.lost_r
  }));
  const hasType=!!MAP.type;
  if(hasType){
    KW=ROWS.filter(r=>/palavra|keyword/.test(r.type));
    TERMS=ROWS.filter(r=>/termo|search/.test(r.type));
    if(!KW.length)KW=ROWS; // fallback
  }else{KW=ROWS;TERMS=ROWS;}
  ACCT=mets(KW);
  renderKpis(); render();
}
function renderKpis(){
  const k=document.getElementById('kpis');
  k.innerHTML=`
    <div class="kpi"><div class="k">Custo total</div><div class="v">${money(ACCT.cost)}</div></div>
    <div class="kpi"><div class="k">Conversões</div><div class="v">${ACCT.conv.toLocaleString('pt-BR',{maximumFractionDigits:1})}</div></div>
    <div class="kpi"><div class="k">CPA médio</div><div class="v ${ACCT.cpa>0?'':''}">${money(ACCT.cpa)}</div></div>
    <div class="kpi"><div class="k">ROAS</div><div class="v ${ACCT.roas>=1?'ok':'warn'}">${ACCT.roas.toLocaleString('pt-BR',{maximumFractionDigits:2})}×</div></div>
    <div class="kpi"><div class="k">Campanhas</div><div class="v">${new Set(KW.map(r=>r.campaign)).size}</div></div>`;
}

const multEl=document.getElementById('mult'),multVal=document.getElementById('multVal'),wasteCut=document.getElementById('wasteCut');
multEl.oninput=()=>{multVal.textContent=(+multEl.value).toLocaleString('pt-BR',{minimumFractionDigits:1})+'×';render();};
wasteCut.oninput=render;

function groupBy(list,key){const m={};list.forEach(r=>{(m[r[key]]=m[r[key]]||[]).push(r)});return m;}

function render(){
  const MULT=+multEl.value, CUT=+wasteCut.value;
  const out=[]; // {sev,amount,title,html}

  // ---- 1) CPA alto: campanha vs conta, com decomposição ----
  const camps=groupBy(KW,'campaign');
  let cpaRows='';
  Object.entries(camps).forEach(([name,rows])=>{
    const m=mets(rows);
    if(m.cpa>ACCT.cpa*MULT && isFinite(m.cpa)){
      const drivers=[];
      if(m.cpc>ACCT.cpc*MULT)drivers.push('CPC caro');
      if(m.ctr<ACCT.ctr/MULT)drivers.push('CTR baixo');
      if(m.cr<ACCT.cr/MULT)drivers.push('Conv. rate baixa');
      const excess=(m.cpa-ACCT.cpa)*m.conv; // R$ gastos acima do benchmark
      cpaRows+=`<tr><td>${name}</td><td class="num">${money(m.cpa)}</td><td class="num">${money(ACCT.cpa)}</td><td>${drivers.map(d=>`<span class="pill">${d}</span>`).join(' ')||'<span class="pill">misto</span>'}</td><td class="num">${money(m.cost)}</td><td class="num" style="color:var(--danger);font-weight:700">${money(excess)}</td></tr>`;
      out.push({_bucket:'cpa',amount:excess>0?excess:m.cost});
    }
  });
  const cpaTotal=out.filter(o=>o._bucket==='cpa').reduce((s,o)=>s+o.amount,0);
  if(cpaRows){
    findingsPush(out,'cpa',cpaTotal,'high','CPA acima da média — eficiência escapando',`
      <div class="why">${CK}<b>Leitura:</b> estas campanhas custam por conversão acima de ${MULT.toLocaleString('pt-BR',{minimumFractionDigits:1})}× a média da conta. A coluna <b>driver</b> isola a etapa culpada — ataque o driver, não o CPA no geral.</div>
      <table><thead><tr><th>Campanha</th><th class="num">CPA</th><th class="num">Média conta</th><th>Driver</th><th class="num">Custo</th><th class="num">Excesso R$</th></tr></thead><tbody>${cpaRows}</tbody></table>`);
  }

  // ---- 2) Desperdício: termos 0 conv acima do corte ----
  const zero=TERMS.filter(r=>r.conv===0 && r.term && r.cost>=CUT).sort((a,b)=>b.cost-a.cost);
  const wasteTotal=zero.reduce((s,r)=>s+r.cost,0);
  const allZero=TERMS.filter(r=>r.conv===0&&r.term);
  document.getElementById('wasteInfo').textContent=`${zero.length} termos ≥ corte · ${money(wasteTotal)} recuperáveis`;
  if(zero.length){
    let rows=zero.slice(0,25).map(r=>`<tr><td>${r.term||'—'}</td><td>${r.campaign}</td><td class="num">${money(r.cost)}</td><td class="num">${r.clicks.toLocaleString('pt-BR')}</td></tr>`).join('');
    findingsPush(out,'waste',wasteTotal,wasteTotal>ACCT.cost*0.1?'high':'med','Desperdício — termos com gasto e zero conversão',`
      <div class="why">${CK}<b>Ação:</b> candidatos a <b>negativa</b>. ${allZero.length} termos gastaram sem converter; ${zero.length} passam do seu corte de ${money(CUT)}. Revise antes de negativar em massa (termos de topo podem ter papel assistido).</div>
      <table><thead><tr><th>Termo de pesquisa</th><th>Campanha</th><th class="num">Gasto</th><th class="num">Cliques</th></tr></thead><tbody>${rows}</tbody></table>
      ${zero.length>25?`<div style="font-size:12.5px;color:var(--mute);margin-top:8px">Mostrando os 25 maiores de ${zero.length}.</div>`:''}`);
  }

  // ---- 3) Volume: budget vs rank por campanha ----
  if(KW.some(r=>r.hasLost)){
    let volRows='';let volFlag=0;
    Object.entries(groupBy(ROWS,'campaign')).forEach(([name,rows])=>{
      const lb=avg(rows.map(r=>r.lost_b).filter(v=>v>0));
      const lr=avg(rows.map(r=>r.lost_r).filter(v=>v>0));
      if(Math.max(lb,lr)>0.15){
        volFlag++;
        const dom=lb>lr?'<span class="pill b">Orçamento → subir verba</span>':'<span class="pill r">Ranking → lance / QS</span>';
        volRows+=`<tr><td>${name}</td><td class="num">${pct(lb)}</td><td class="num">${pct(lr)}</td><td>${dom}</td></tr>`;
      }
    });
    if(volRows){
      findingsPush(out,'vol',0,'med','Volume — perda de impressões (orçamento vs ranking)',`
        <div class="why">${CK}<b>Decisão:</b> os remédios são opostos. Perda por <b>orçamento</b> pede mais verba onde o CPA já é bom; perda por <b>ranking</b> pede lance maior ou melhor Quality Score. Não troque um pelo outro.</div>
        <table><thead><tr><th>Campanha</th><th class="num">Perdido (orçam.)</th><th class="num">Perdido (rank)</th><th>Gargalo dominante</th></tr></thead><tbody>${volRows}</tbody></table>`,true);
    }
  }

  // ---- 4) Grupos com CPA fora vs a própria campanha ----
  let grpRows='';
  Object.entries(camps).forEach(([cname,crows])=>{
    const cm=mets(crows);
    if(!isFinite(cm.cpa)||cm.cpa===0)return;
    Object.entries(groupBy(crows,'group')).forEach(([gname,grows])=>{
      const gm=mets(grows);
      if(gm.cpa>cm.cpa*MULT&&isFinite(gm.cpa)&&gm.cost>0){
        const excess=(gm.cpa-cm.cpa)*gm.conv;
        grpRows+=`<tr><td>${cname}</td><td>${gname}</td><td class="num">${money(gm.cpa)}</td><td class="num">${money(cm.cpa)}</td><td class="num">${money(gm.cost)}</td><td class="num" style="color:var(--danger);font-weight:700">${money(excess>0?excess:gm.cost)}</td></tr>`;
        out.push({_bucket:'grp',amount:excess>0?excess:gm.cost});
      }
    });
  });
  const grpTotal=out.filter(o=>o._bucket==='grp').reduce((s,o)=>s+o.amount,0);
  if(grpRows){
    findingsPush(out,'grp',grpTotal,'med','Grupos de anúncios fora da curva da própria campanha',`
      <div class="why">${CK}<b>Onde mexer primeiro:</b> grupos com CPA acima de ${MULT.toLocaleString('pt-BR',{minimumFractionDigits:1})}× a média da campanha-mãe. São os pontos de sangria mais localizados.</div>
      <table><thead><tr><th>Campanha</th><th>Grupo</th><th class="num">CPA grupo</th><th class="num">CPA campanha</th><th class="num">Custo</th><th class="num">Excesso R$</th></tr></thead><tbody>${grpRows}</tbody></table>`);
  }

  // ---- assemble, sorted by amount ----
  paint();
}
function avg(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:0;}

let FINDINGS=[];
function findingsPush(_,bucket,amount,sev,title,html,noAmount){FINDINGS.push({bucket,amount,sev,title,html,noAmount});}
function paint(){/* placeholder replaced below */}

// override: collect then paint
const _origRender=render;
render=function(){
  FINDINGS=[];
  _origRender();
  FINDINGS.sort((a,b)=>b.amount-a.amount);
  const box=document.getElementById('findings');
  if(!FINDINGS.length){box.innerHTML=`<div class="finding"><div class="empty-msg"><div class="big">Nenhum gargalo acima dos limiares atuais</div><div>Afrouxe a sensibilidade de CPA ou reduza o corte de desperdício para ver mais.</div></div></div>`;return;}
  box.innerHTML=FINDINGS.map((f,i)=>`
    <div class="finding ${i===0?'open':''}">
      <div class="f-head" onclick="this.parentElement.classList.toggle('open')">
        <span class="sev ${f.sev}">${f.sev==='high'?'Alto impacto':f.sev==='med'?'Médio':'Baixo'}</span>
        <span class="ft">${f.title}</span>
        ${f.noAmount?'':`<span class="amt">${money(f.amount)}</span>`}
        <svg class="chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="f-body">${f.html}</div>
    </div>`).join('');
};
</script>
</body>
</html>
```

*(fim do protótipo — a partir daqui é você quem constrói o projeto estruturado)*
