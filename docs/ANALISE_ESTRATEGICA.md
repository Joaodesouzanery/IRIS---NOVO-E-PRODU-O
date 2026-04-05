# IRIS Regulação — Análise Estratégica e Roadmap

> **Documento de produto** · Versão 1.0 · Abril 2026

---

## Índice

1. [O que o IRIS faz hoje](#1-o-que-o-iris-faz-hoje)
2. [Oportunidades de otimização](#2-oportunidades-de-otimização)
3. [Benchmarking com Palantir](#3-benchmarking-com-palantir)
4. [Features inspiradas na Palantir](#4-features-inspiradas-na-palantir-adaptáveis-ao-iris)
5. [Contexto competitivo](#5-contexto-competitivo)
6. [Roadmap sugerido](#6-roadmap-sugerido)

---

## 1. O que o IRIS faz hoje

O IRIS Regulação é uma plataforma de inteligência regulatória construída para agências brasileiras (hoje: ARTESP). Digitaliza o ciclo completo das deliberações do conselho diretivo — da ata em PDF ao painel analítico — sem intervenção manual significativa.

### 1.1 Ingesta inteligente de PDFs

O pipeline extrai automaticamente campos estruturados de deliberações em formato PDF usando uma estratégia em múltiplos estágios:

| Estágio | O que faz |
|---|---|
| **Validação** | Verifica magic bytes, detecta PDF bomb (limite de 500 streams), aplica timeout de 25 s |
| **Extração de texto** | `pdf-parse` + correção de codificação para diacríticos portugueses |
| **Limpeza** | Remove cabeçalhos/rodapés repetidos por contagem de frequência de linhas |
| **NLP por regex** | Extrai 12 campos: número, data, processo SEI, interessado, assunto, resultado, votação, fundamento |
| **Dedup** | SHA-256 do arquivo impede reprocessamento; fallback semântico por `numero_deliberacao` ou `data + agencia + interessado` |
| **Confiança** | Score 0–1 ponderado por campo (número: 22%, data: 18%, resultado: 18%, interessado: 14%, …) |

**Limitação atual:** PDFs escaneados (sem camada de texto) retornam erro — sem OCR.

### 1.2 Classificação regulatória por microtema

Sistema determinístico de keyword scoring em 13 categorias:

`tarifa` · `obras` · `multa` · `contrato` · `reequilibrio` · `fiscalizacao` · `seguranca` · `ambiental` · `desapropriacao` · `adimplencia` · `pessoal` · `usuario` · `outros`

Frases mais longas recebem peso maior para reduzir falsos positivos (ex: "reajuste tarifário" > "tarifa").

### 1.3 Analytics de votação e governança

- **Matriz de votação** — diretores × deliberações com tipo de voto (Favorável, Desfavorável, Abstenção, Ausente)
- **Fidelidade** — taxa de consenso/divergência por diretor
- **Taxa de litígio** — % de deliberações com votos dissidentes por período
- **Taxa de sanção** — combinação de multas e indeferimentos
- **Mandatos** — linha do tempo de mandatos ativos/encerrados com participação acumulada

### 1.4 Risco regulatório de empresas

Score calculado em tempo real sobre o histórico de deliberações:

| Nível | Critério |
|---|---|
| 🔴 Alto | ≥ 3 indeferimentos nos últimos 90 dias |
| 🟡 Médio | Tendência de aumento de multas ou irregularidades |
| 🟢 Baixo | Histórico sem indeferimentos recentes |

Tendência: `melhorando` / `estável` / `piorando` com base na evolução trimestral.

### 1.5 Alertas proativos

Gerados automaticamente via `computeAlertas`:

- **Empresa em risco** — ≥ 3 indeferimentos em 90 dias (severidade: alta)
- **Tema emergente** — crescimento > 20% em relação ao trimestre anterior (média)
- **Diretor divergente** — taxa de dissidência > 30% (média)

### 1.6 Boletim regulatório agendado

Geração de newsletters periódicas (semanal / quinzenal / mensal) com seleção de seções por agência e lista de destinatários configurável.

---

## 2. Oportunidades de otimização

### 2.1 Pipeline de extração (Quick Wins)

**OCR para PDFs escaneados**

Hoje, deliberações digitalizadas por scanner retornam erro. A adição de Tesseract.js (browser) ou `tesseract.js` (Node) como fallback quando `charsPerPage < 80` eliminaria essa barreira. Estimativa: cobre ~15-30% das deliberações de agências mais antigas.

```
extractPdfText(buffer)
  ├── pdf-parse → texto OK? → continuar
  └── charsPerPage < 80 → Tesseract OCR → retry pipeline
```

**LLM como fallback de extração**

Quando `extraction_confidence < 0.60`, enviar o texto para um modelo leve (GPT-4o-mini ou Claude Haiku) com um prompt estruturado para preencher campos ausentes. Custo estimado: ~$0.002 por deliberação problemática.

```
confidence < 0.60 → LLM extraction prompt →
  { numero_deliberacao, data_reuniao, resultado, interessado }
```

**Chunking para PDFs multi-deliberação**

Atas longas (reuniões com 20+ pautas) contêm múltiplas deliberações em um único PDF. Detectar marcadores `DELIBERAÇÃO Nº` e dividir em chunks antes de extrair, gerando N registros de um arquivo.

---

### 2.2 Analytics avançados (Médio prazo)

**Índice de Concentração Regulatória (HHI)**

Adaptar o Herfindahl-Hirschman Index para medir qual empresa concentra mais deliberações por agência. Útil para identificar players sistêmicos (too-regulated-to-fail).

```
HHI = Σ (deliberações_empresa_i / total)²
```

**Análise de sobrevivência de mandatos**

Medir quanto tempo, em média, um diretor leva até registrar o primeiro voto divergente. Curve de Kaplan-Meier por agência e por período histórico.

**Correlação entre microtemas**

Identificar quais temas co-ocorrem na mesma reunião (ex: `obras` e `reequilibrio` frequentemente juntos = risco de sequência de pedidos). Matriz de correlação de Pearson sobre contagens mensais.

**Predição de resultado**

Modelo simples (Random Forest ou regressão logística) treinado sobre:
- microtema
- empresa (risk score)
- diretor relator (taxa histórica de deferimento)
- ano do mandato do presidente

Output: probabilidade estimada de deferimento antes da deliberação.

---

### 2.3 Produto e UX (Médio prazo)

**Timeline interativa por empresa**

Linha do tempo cronológica de todas as interações regulatórias de uma empresa: cada deliberação como evento, filtrada por tipo, resultado e relator. Permite ver padrões de comportamento ao longo de anos.

**Comparador de agências**

Dashboard side-by-side entre duas agências (ex: ARTESP vs ANTT vs ANEEL) com KPIs alinhados: taxa de deferimento, consenso, tempo médio de processo, distribuição de microtemas.

**Integração com o sistema SEI**

O número de processo SEI já é extraído dos PDFs. Integração com a API pública do SEI (gov.br) para buscar o status atual do processo, documentos relacionados e movimentações — trazendo contexto vivo para cada deliberação.

**Exportação em formatos legais**

Além do CSV atual, exportar deliberações como:
- DOCX formatado (para uso em peças jurídicas)
- PDF timbrado com logotipo da agência
- JSON-LD (formato semântico para interoperabilidade entre agências)

---

### 2.4 Infraestrutura (Médio/Longo prazo)

**Busca semântica com pgvector**

Adicionar embeddings de deliberações no PostgreSQL via `pgvector`. Permite buscas como "deliberações similares a esta" ou "empresas com processos parecidos" sem depender de palavras-chave exatas.

```sql
SELECT id, assunto,
       embedding <=> query_embedding AS similarity
FROM deliberacoes
ORDER BY similarity
LIMIT 10;
```

**Autenticação com Supabase Auth**

Implementar JWT + Row Level Security real no Supabase. Hoje a RLS está habilitada mas com política allow-all. Adicionar roles: `viewer`, `editor`, `admin` por agência.

**Rate limiting e observabilidade**

- Rate limiting via Upstash Redis (Vercel Edge Middleware)
- Métricas de latência e erros de extração via Axiom ou Grafana Cloud
- Alertas de degradação do pipeline (confidence < 0.5 em > 20% dos uploads)

---

## 3. Benchmarking com Palantir

### 3.1 Visão geral das plataformas Palantir

| Plataforma | Foco principal | Usuários alvo |
|---|---|---|
| **Gotham** | Inteligência investigativa, análise de redes, detecção de ameaças em tempo real | Defesa, inteligência, segurança pública |
| **Foundry** | Integração de dados heterogêneos, pipelines ETL, analytics operacional | Agências civis, utilities, empresas |
| **AIP** (AI Platform) | Governança de IA, audit trail de modelos, compliance de inferência | Todos os setores com IA regulada |

Para o setor regulatório, **Foundry + AIP** são as plataformas mais relevantes.

---

### 3.2 Comparação feature-a-feature

| Capacidade | IRIS Regulação | Palantir Foundry | Palantir AIP |
|---|---|---|---|
| **Processamento de documentos** | PDF → campos via regex + NLP | Pipeline Builder visual + LLM integration | Semantic search + chunking automático |
| **Classificação temática** | Keyword scoring determinístico | ML models + ontology-based tagging | Fine-tuned classifiers com governance |
| **Analytics de votação** | Matriz diretores × deliberações | Tabelas dinâmicas + network graphs | N/A (não é core) |
| **Risk scoring de entidades** | Score calculado em tempo real (alto/médio/baixo) | Object-level risk scores com lineage | Inference history por score |
| **Alertas** | Regras hardcoded (3 tipos) | Alertas configuráveis pelo usuário | Alertas de drift de modelo |
| **Audit trail** | Não implementado | Data lineage completo por campo | Inference history + sistema de avaliações |
| **Controle de acesso** | RLS allow-all (sem auth real) | PBAC (Purpose-Based Access Control) | Georestrictions + purpose restrictions |
| **Grafo de relacionamentos** | Não implementado | Network analysis nativo (Gotham) | N/A |
| **Integração de dados externos** | Manual (só PDFs) | 200+ conectores (APIs, databases, cloud) | Conectores LLM + RAG sobre dados externos |
| **Multi-agência** | Estrutura existe, UX limitada | Multi-tenant nativo | Multi-workspace |
| **Open source** | Sim (repositório público) | Não (proprietário) | Não (proprietário) |
| **Custo** | Low | $50K–$500K+/ano | Adicional ao Foundry |

---

### 3.3 Onde a Palantir não cobre o mercado brasileiro

A Palantir **não tem case studies publicados** com ANEEL, ANATEL, ANTT, ARTESP ou outras agências reguladoras brasileiras. A ANEEL atualmente usa **Informatica PowerCenter** para qualidade de dados — não Palantir.

Razões prováveis:

1. **Custo**: Contratos Palantir Foundry partem de ~$50K/ano, inviável para agências com orçamentos restritos
2. **Idioma**: Sem suporte nativo a português, LGPD, ou padrões brasileiros (SEI, processos administrativos)
3. **Especialização**: Palantir foca em defesa e grandes utilities — o ecossistema de autarquias reguladoras é nicho
4. **Soberania de dados**: Agências brasileiras têm restrições de onde os dados podem residir

**O gap é real e endereçável pelo IRIS.**

---

## 4. Features inspiradas na Palantir — adaptáveis ao IRIS

> Versão expandida · 8 features com arquitetura técnica, mockups e casos de uso concretos.

---

### 4.1 Dossiê Regulatório por Empresa (inspirado no Dossier do Gotham)

**O que a Palantir tem:** O _Dossier_ é um editor colaborativo que agrega dados de múltiplas fontes sobre uma entidade em um único documento vivo — anotações, evidências, timelines — acessível por toda a equipe de investigação.

**Status no IRIS:** ✅ Implementado parcialmente — a página `/dashboard/empresas/[id]` já existe.

**Implementação concluída (neste ciclo):**
- Timeline cronológica vertical com eventos coloridos por resultado (verde/vermelho/cinza)
- Score de risco com tendência histórica
- Diretores envolvidos com contagem de votos favoráveis/contrários
- Tabela de histórico completo com links para cada deliberação

**Próximos passos:**
- Notas colaborativas internas (campo `notas` por empresa, salvos no banco)
- Documentos SEI vinculados via integração gov.br
- Exportação do dossiê em PDF timbrado

**Interface atual:**
```
┌─────────────────────────────────────────────────────────┐
│  CCR Via Bandeirantes S.A.         [Risco Baixo] [↑]    │
│  132 deliberações · Última: 15/03/2024                  │
├─────────────────────────────────────────────────────────┤
│ TIMELINE REGULATÓRIA                                     │
│  ●  2024-03-15  tarifa    Deferido  Delib. 006/2024      │
│  ●  2024-02-08  obras     Deferido  Delib. 002/2024      │
│  ○  2023-11-22  multa     Indeferido  Delib. 089/2023    │
├─────────────────────────────────────────────────────────┤
│ DIRETORES ENVOLVIDOS       Taxa Aprovação: 78%          │
│  A.I. Barnabé   ✓ 48  ✗ 2                              │
│  D.A. Zanatto   ✓ 45  ✗ 3                              │
└─────────────────────────────────────────────────────────┘
```

**API:** `GET /api/v1/empresas/{nome_encoded}` — retorna `EmpresaDetalhe` com `historico: Deliberacao[]`

**Complexidade:** Média — dados já existem, falta UI de notas e integração SEI.

---

### 4.2 Grafo Diretores-Empresas (inspirado no Network Analysis do Gotham)

**O que a Palantir tem:** O _Gotham_ é famoso por sua visualização de grafos para análise de redes — quem se conecta com quem, força dos laços, clusters de relacionamento. Usado inicialmente para inteligência militar, mas o padrão é aplicável a qualquer rede de entidades.

**Adaptação para o IRIS:**

Grafo interativo com D3.js `force-simulation`:

```
Nós:
  🔵 Diretores  (tamanho = número de deliberações)
  🟠 Empresas   (tamanho = número de deliberações)
  🟢 Microtemas (nós secundários, opcional)

Arestas:
  ─── Voto favorable  (verde, espessura = contagem)
  ─── Voto desfavorável (vermelho)
  ─── Co-ocorrência em reunião (cinza pontilhado)
```

**Casos de uso regulatórios concretos:**

| Pergunta | Como o grafo responde |
|---|---|
| "O Diretor X tem viés favorável à empresa Y?" | Aresta vermelha espessa entre X e Y |
| "Quais empresas são reguladas pelo mesmo grupo de diretores?" | Cluster visual de nós laranjas próximos |
| "Qual empresa concentra mais poder regulatório?" | Nó laranja de maior raio |
| "Quais diretores participam de mais processos de obras?" | Aresta azul espessa ligando diretor ao nó 'obras' |

**Schema de dados para o grafo:**

```typescript
interface GraphData {
  nodes: Array<{
    id: string;
    type: "diretor" | "empresa" | "microtema";
    label: string;
    size: number;      // proporcional ao número de deliberações
    color: string;
  }>;
  edges: Array<{
    source: string;   // diretor_id
    target: string;   // empresa nome ou microtema
    weight: number;   // número de deliberações
    direction: "favoravel" | "desfavoravel" | "misto";
  }>;
}
```

**Endpoint:** `GET /api/v1/analytics/grafo?agencia_id=...` (a criar)

**Complexidade:** Alta — requer `d3-force` ou `vis-network`, endpoint de agregação e UI de zoom/filtro.

---

### 4.3 Ontologia Regulatória Brasileira (inspirado no Ontology do Foundry)

**O que a Palantir tem:** O _Ontology_ do Foundry é um modelo semântico central — cada entidade do mundo real (pessoa, empresa, evento) é representada como um "objeto" com propriedades e relacionamentos tipados. Permite que diferentes sistemas falem a mesma linguagem e que dados sejam exportados em formato interoperável.

**Adaptação para o IRIS — definição formal:**

```typescript
// Ontologia do domínio regulatório brasileiro
// Compatível com JSON-LD + schema.org/GovernmentPermit

interface Agencia {
  "@type": "GovernmentOrganization";
  sigla: string;           // "ARTESP"
  nome_completo: string;   // "Agência de Transporte do Estado de São Paulo"
  esfera: "federal" | "estadual";
  setor: string;           // "transporte", "energia", "telecomunicações"
  diretores: Diretor[];
  deliberacoes: Deliberacao[];
}

interface Deliberacao {
  "@type": "GovernmentPermit";
  numero: string;          // "001/2024"
  data: ISO8601Date;
  processo_sei: string;    // "SEI nº 001.0100.000001.2024"
  interessado: Empresa;
  resultado: ResultadoEnum;
  microtema: MicrotemaEnum;
  votos: Voto[];
  fundamento: string;      // texto legal da decisão
  embedding?: number[];    // vetor semântico (pgvector)
}

interface Empresa {
  "@type": "Organization";
  nome: string;
  cnpj?: string;
  setor?: string;
  score_risco: "alto" | "medio" | "baixo";
  deliberacoes: Deliberacao[];
}
```

**Exportação JSON-LD (para TCU, CGU, pesquisadores):**

```json
{
  "@context": "https://schema.org",
  "@type": "GovernmentPermit",
  "identifier": "ARTESP/DEL/001/2024",
  "name": "Deliberação 001/2024 - ARTESP",
  "datePublished": "2024-01-15",
  "issuedBy": { "@type": "GovernmentOrganization", "name": "ARTESP" },
  "about": { "@type": "Organization", "name": "CCR Via Bandeirantes" },
  "governmentBeneficiaryType": "Concessão de Rodovias",
  "permitAudience": { "@type": "Audience", "audienceType": "Transporte" }
}
```

**Valor estratégico:** Permite integração com o Portal da Transparência, LicitaNet e SIESG sem necessidade de adaptadores customizados.

**Complexidade:** Média — modelagem bem definida, implementação é serialização + endpoint de exportação.

---

### 4.4 Audit Trail de Extração (inspirado no AIP Inference History)

**O que a Palantir tem:** O _AIP_ mantém histórico completo de cada inferência: qual modelo gerou qual output, com que dados de entrada, quem aprovou, quem corrigiu. Permite auditoria regulatória de sistemas de IA.

**Status no IRIS:** Campo `raw_extracted` (JSONB) já existe no banco — precisa ser enriquecido.

**Extensão do schema atual:**

```typescript
// Extensão de raw_extracted para incluir proveniência por campo
interface ExtractionAuditTrail {
  campos: {
    [fieldName: string]: {
      valor: string | null;
      fonte: "regex" | "llm" | "manual";
      regex_pattern?: string;       // ex: "RE_DELIBERACAO"
      llm_model?: string;           // ex: "claude-haiku-4-5"
      confianca: number;            // 0.0–1.0
      corrigido_por?: string;       // email do usuário
      corrigido_em?: string;        // ISO timestamp
      valor_original?: string;      // valor antes da correção manual
    };
  };
  pipeline_version: string;         // "1.2.0"
  processing_time_ms: number;
  chunks_detected: number;          // se o PDF foi dividido
  llm_enriched: boolean;            // se Claude foi chamado
}
```

**UI de auditoria:**
```
┌─────────────────────────────────────────────────────────────┐
│  Proveniência da Extração — Deliberação 001/2024             │
├──────────────────┬───────────┬──────────┬───────────────────┤
│ Campo            │ Fonte     │ Confiança│ Corrigido         │
├──────────────────┼───────────┼──────────┼───────────────────┤
│ numero_delib     │ regex     │ 0.95     │ —                 │
│ data_reuniao     │ regex     │ 0.88     │ —                 │
│ resultado        │ llm       │ 0.72     │ —                 │
│ interessado      │ manual    │ 1.00     │ joao@artesp 14:22 │
│ microtema        │ regex     │ 0.64     │ —                 │
└──────────────────┴───────────┴──────────┴───────────────────┘
```

**Valor:** Permite ao TCU e ao CGU auditar como cada campo foi extraído e quem o validou, eliminando a "caixa preta" da IA regulatória.

**Complexidade:** Baixa — extensão do schema + UI na página de detalhe da deliberação.

---

### 4.5 Configurador Visual de Extração (inspirado no Pipeline Builder do Foundry)

**O que a Palantir tem:** O _Pipeline Builder_ do Foundry permite que usuários não-técnicos montem fluxos de ETL (extração, transformação, carga) por meio de blocos visuais arrastáveis — sem escrever código.

**Adaptação para o IRIS:**

Cada agência tem vocabulário específico. A ANEEL chama de "Processo" o que a ARTESP chama de "SEI nº". A ANATEL usa "Número de Protocolo". O Configurador resolve isso sem alterar o código-base.

**Modelo de configuração por agência (YAML):**

```yaml
# /config/agencias/ANEEL/extracao.yaml
agencia: ANEEL
versao: "1.1"

campos:
  numero_deliberacao:
    rotulos: ["Resolução Nº", "REN Nº", "Deliberação Nº"]
    formato: "\\d{3,4}/\\d{4}"
    obrigatorio: true

  processo:
    rotulos: ["Processo Nº", "Protocolo SEI", "NIREQ"]
    formato: "\\d{4}\\.\\d{6}/\\d{4}-\\d{2}"

microtemas_adicionais:
  - nome: "tarifas_energia"
    keywords: ["tarifa de energia", "TUSD", "TUST", "bandeira tarifária"]
  - nome: "concessoes_geracao"
    keywords: ["outorga de geração", "PCH", "UHE", "usina hidrelétrica"]

confianca:
  threshold_llm: 0.55   # abaixo disso, chama Claude Haiku
  threshold_revisao: 0.70  # abaixo disso, marca para revisão humana
```

**UI de edição:**
- Tabela editável de rótulos por campo
- Editor de keywords por microtema com preview em tempo real
- Sliders de threshold de confiança
- Botão "Testar com PDF" — processa um arquivo de exemplo e mostra campos extraídos

**Complexidade:** Alta — requer engine de configuração carregada dinamicamente no pipeline.

---

### 4.6 Alertas Personalizáveis (inspirado no AIP Alert System)

**O que a Palantir tem:** O _AIP_ permite criar alertas configuráveis sobre inferências de modelos — "notifique-me quando o modelo de risco superar X" — com integração a e-mail, Slack ou webhooks.

**Adaptação para o IRIS:**

Sistema de regras de alerta sem código, persistido por agência:

```typescript
interface AlertaRegra {
  id: string;
  agencia_id: string;
  nome: string;             // "Multas excessivas - CCR"
  ativo: boolean;
  condicao: {
    campo: "interessado" | "microtema" | "resultado" | "diretor_id";
    operador: "eq" | "contains" | "count_gte" | "pct_gte";
    valor: string | number;
    janela_dias?: number;   // "nos últimos X dias"
  };
  threshold: number;        // ex: 3 (quantidade) ou 0.3 (percentual)
  acao: {
    tipo: "email" | "webhook" | "dashboard";
    destino?: string;       // email ou URL do webhook
  };
  severidade: "high" | "medium" | "low";
}
```

**Exemplos de regras configuráveis:**

| Regra | Condição | Threshold | Ação |
|---|---|---|---|
| "CCR com muitas multas" | interessado=CCR + microtema=multa | 3 em 30 dias | Email |
| "Consenso baixo no conselho" | resultado + is_divergente | >20% das reuniões | Dashboard |
| "Empresa nova com indeferimento" | resultado=Indeferido + empresa_nova | 1 ocorrência | Webhook |
| "Obras acima de R$100M" | microtema=obras + valor_pleito | >100 | Email |

**Engine de avaliação:** roda a cada inserção de nova deliberação, avalia todas as regras ativas da agência.

**Complexidade:** Média — tabela de regras + engine de avaliação via trigger Supabase ou background job.

---

### 4.7 Benchmark entre Agências (inspirado no Foundry Multi-Tenant Analytics)

**O que a Palantir tem:** O _Foundry_ suporta análise comparativa entre "workspaces" (equivalente a agências) com métricas alinhadas — permite que um órgão supervisor compare performance de múltiplas entidades reguladas.

**Adaptação para o IRIS:**

Dashboard comparativo `/dashboard/benchmark` com:

```
┌──────────────────────────────────────────────────────────────┐
│  BENCHMARK DE AGÊNCIAS REGULADORAS              Período: 2024 │
├────────────────┬──────────┬──────────┬──────────┬────────────┤
│ Indicador      │ ARTESP   │ ANTT     │ ANEEL    │ Ref. Setor │
├────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Taxa Deferimento│  72%    │  68%     │  74%     │  70%       │
│ Taxa Consenso  │  91%     │  88%     │  95%     │  90%       │
│ Deliberações/mês│  12     │  8       │  22      │  —         │
│ Tempo médio    │  —       │  —       │  —       │  —         │
│ Qualidade IA   │  84%     │  79%     │  82%     │  —         │
│ Taxa Multas    │  18%     │  24%     │  12%     │  —         │
├────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Score Governa. │  79/100  │  72/100  │  83/100  │  —         │
└────────────────┴──────────┴──────────┴──────────┴────────────┘
```

**Visualizações:**
- **Radar chart** — ARTESP vs. ANTT vs. ANEEL em 6 eixos (consenso, deferimento, qualidade, sanções, tempo, cobertura)
- **Scatter plot** — Volume (eixo X) vs. Taxa Deferimento (eixo Y) por agência
- **Evolução comparativa** — Linhas para cada agência ao longo do tempo

**Casos de uso para o TCU:**
- Identificar agências com padrão de governança abaixo da média setorial
- Comparar evolução de diferentes gestões ao longo do tempo
- Detectar outliers (agência com taxa de multas 3× acima da média)

**API:** `GET /api/v1/benchmark?agencias=ARTESP,ANTT,ANEEL&year=2024`

**Complexidade:** Média — já existem os dados; é principalmente aggregação paralela e UI.

---

### 4.8 API Pública Regulatória (inspirado na Palantir Ontology API)

**O que a Palantir tem:** A _Palantir Ontology API_ expõe objetos do Foundry via endpoints REST padronizados com autenticação por API key — permitindo que sistemas externos consultem dados diretamente, sem acessar o painel.

**Adaptação para o IRIS:**

API pública com autenticação por API key para consumo por TCU, CGU, pesquisadores e sistemas de terceiros:

**Endpoints públicos (prefixo `/api/public/v1/`):**

```
GET /deliberacoes
  ?agencia=ARTESP
  &microtema=tarifa
  &resultado=Deferido
  &date_from=2024-01-01
  &format=json|csv|jsonld

GET /deliberacoes/{id}

GET /empresas/{nome}/historico

GET /agencias/{sigla}/kpis
  ?year=2024
```

**Autenticação via API key:**

```http
GET /api/public/v1/deliberacoes?agencia=ARTESP
Authorization: Bearer iris_pub_xxxxxxxxxxxxx
X-Rate-Limit-Policy: research
```

**Resposta JSON-LD (para interoperabilidade):**

```json
{
  "@context": "https://schema.org",
  "@type": "GovernmentPermit",
  "identifier": "ARTESP-DEL-001-2024",
  "datePublished": "2024-01-15",
  "name": "Autorização de reajuste tarifário 001/2024",
  "issuedBy": {
    "@type": "GovernmentOrganization",
    "name": "ARTESP",
    "sameAs": "https://www.artesp.sp.gov.br"
  },
  "about": { "@type": "Organization", "name": "CCR Via Bandeirantes S.A." },
  "result": "Deferido",
  "regulatoryTopic": "tarifa"
}
```

**Modelo de acesso por tier:**

| Tier | Rate Limit | Campos disponíveis | Custo |
|---|---|---|---|
| **Pesquisador** | 1.000 req/dia | Todos exceto `raw_text` | Gratuito |
| **Institucional** | 50.000 req/dia | Todos os campos | Convênio |
| **Governo** | Ilimitado | Todos + embeddings | Gratuito |

**Documentação automática:** OpenAPI 3.1 gerado via `next-swagger-doc` ou similar.

**Complexidade:** Alta — requer tabela de API keys, middleware de autenticação e rate limiting (Upstash Redis).

---

## 5. Contexto competitivo

### 5.1 Plataformas internacionais de inteligência regulatória

| Produto | Foco | Preço estimado | Limitações para BR |
|---|---|---|---|
| **FiscalNote** | Monitoramento legislativo e regulatório federal/estadual | $50K+/ano | Focado nos EUA, sem deliberações de autarquias |
| **Regology** | AI agents para compliance contínuo | Não divulgado | Mercado americano, sem LGPD nativo |
| **Compliance.ai** | Monitoramento de mudanças regulatórias | $20K+/ano | Sem extração de PDFs de atas de reunião |
| **Visualping** | Rastreamento de páginas web e PDFs | $50/mês | Sem estruturação ou analytics |
| **Informatica** | Qualidade e governança de dados | Enterprise | Usado por ANEEL, mas sem analytics regulatório |
| **Palantir Foundry** | Data integration + analytics | $50K–$500K+/ano | Sem suporte a autarquias brasileiras, custo proibitivo |

### 5.2 O mercado brasileiro

- **~40 agências reguladoras** no Brasil (federais + estaduais), todas produzindo deliberações em PDF
- **300+ startups GovTech** no Brasil em 2025 (crescimento de 275% desde 2019)
- **Nova lei de IA brasileira** criou o SIA (Sistema Nacional para Regulação e Governança de IA), coordenando ANPD, ANATEL, ANVISA, ANAC, ANEEL, Banco Central — todas precisarão de ferramentas de inteligência regulatória
- **Concentração em Brasília**: ANATEL, ANS, ANVISA, ANEEL, ANTT, ANTAQ, ANAC, ANP, ANA, ANCINE, BCB, CVM — mercado endereçável significativo

### 5.3 Vantagem competitiva do IRIS

1. **Nativo em português** — NLP calibrado para o vocabulário jurídico-regulatório brasileiro
2. **Especializado em autarquias** — não é um produto horizontal, é vertical para agências reguladoras
3. **Custo radicalmente menor** que Palantir/FiscalNote
4. **Open source** — agências públicas podem auditar, contribuir e adaptar
5. **Integração com ecossistema gov.br** — SEI, LicitaNet, Portal da Transparência

---

## 6. Roadmap sugerido

### Curto prazo — 1 a 3 meses

| Feature | Impacto | Esforço | Arquivo principal |
|---|---|---|---|
| OCR para PDFs escaneados | Alto | Médio | `src/lib/server/pdf-extractor.ts` |
| LLM fallback quando confidence < 0.60 | Alto | Médio | `src/lib/server/pipeline.ts` |
| Audit trail de proveniência de campos | Médio | Baixo | Schema `raw_extracted` |
| Autenticação Supabase Auth + RLS real | Alto | Alto | `src/lib/supabase/` |
| Rate limiting (Upstash) | Médio | Baixo | `middleware.ts` |
| Busca semântica com pgvector | Alto | Médio | `src/app/api/v1/deliberacoes/route.ts` |

### Médio prazo — 3 a 6 meses

| Feature | Impacto | Esforço |
|---|---|---|
| Grafo diretores-empresas | Alto | Alto |
| Dossiê regulatório por empresa | Alto | Médio |
| Chunking multi-deliberação por PDF | Alto | Médio |
| Comparador entre agências | Médio | Médio |
| Timeline interativa por empresa | Médio | Médio |
| Integração com API SEI | Alto | Alto |
| Exportação DOCX/PDF timbrado | Baixo | Baixo |

### Longo prazo — 6 a 12 meses

| Feature | Impacto | Esforço |
|---|---|---|
| Predição de resultado (ML) | Alto | Alto |
| Ontologia regulatória JSON-LD | Alto | Médio |
| Configurador visual de extração | Alto | Muito Alto |
| Multi-agência com tenants isolados | Muito Alto | Alto |
| Marketplace de templates por setor | Médio | Alto |
| API pública para integração com TCU/CGU | Alto | Alto |

---

## Apêndice: Fontes e referências

- [Palantir AIP Overview](https://www.palantir.com/docs/foundry/aip/overview)
- [Palantir Foundry Document Processing](https://www.palantir.com/docs/foundry/ontology/document-processing)
- [Palantir AI Governance Blog](https://blog.palantir.com/ai-systems-governance-through-the-palantir-platform-74e52d95bdb5)
- [Informatica ANEEL Case Study](https://www.informatica.com/customer-success-stories/aneel.html)
- [World Economic Forum — Brazil GovTech 2025](https://www.weforum.org/stories/2025/04/brazil-govtech-digital-public-infrastructure-development/)
- [Visualping — Top Regulatory Compliance Tools](https://visualping.io/blog/top-tools-monitor-regulative-intelligence-compliance)
- [Regology AI Compliance Platform](https://www.regology.com/)
