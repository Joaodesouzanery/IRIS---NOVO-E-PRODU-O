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

### 4.1 Dossiê Regulatório por Empresa (inspirado no Dossier do Gotham)

**O que a Palantir tem:** O _Dossier_ é um editor colaborativo que agrega dados de múltiplas fontes sobre uma entidade em um único documento vivo — anotações, evidências, timelines.

**Adaptação para o IRIS:**

Uma "Pasta da Empresa" que consolida em uma tela:
- Timeline cronológica de todas as deliberações
- Histórico de multas e indeferimentos
- Diretores que mais votaram em processos da empresa
- Documentos SEI vinculados
- Notas internas da equipe da agência
- Score de risco com evolução histórica

```
/dashboard/360/[empresa_id]  →  já existe parcialmente
  ├── Timeline (novo)
  ├── Votação por diretor (novo)
  ├── Documentos SEI (novo — requer integração)
  └── Notas colaborativas (novo)
```

**Complexidade:** Média — boa parte dos dados já existe no banco.

---

### 4.2 Grafo Diretores-Empresas (inspirado no Network Analysis do Gotham)

**O que a Palantir tem:** Visualização de grafos que mostra conexões entre entidades — quem votou com quem, quais empresas se relacionam através de diretores comuns.

**Adaptação para o IRIS:**

Grafo interativo (D3.js / vis.js) onde:
- **Nós azuis** = diretores
- **Nós laranjas** = empresas
- **Arestas** = deliberações em que o diretor votou sobre a empresa
- **Espessura da aresta** = número de votos
- **Cor da aresta** = direção predominante (verde = favorável, vermelho = desfavorável)

Casos de uso:
- Identificar se um diretor tem padrão consistente (sempre favorável) com uma empresa específica
- Detectar empresas que aparecem em múltiplas deliberações com diretores diferentes
- Visualizar clusters temáticos (empresas do setor de pedágios vs. concessões aeroportuárias)

**Complexidade:** Alta — requer biblioteca de grafo e modelagem de relacionamentos.

---

### 4.3 Ontologia Regulatória Brasileira (inspirado no Ontology do Foundry)

**O que a Palantir tem:** O _Ontology_ é o coração do Foundry — um modelo semântico de objetos (entidades) e seus relacionamentos, que dá significado aos dados e permite que diferentes pipelines falem a mesma linguagem.

**Adaptação para o IRIS:**

Definir formalmente a ontologia do domínio regulatório brasileiro:

```
Agência
  └── tem muitos → Diretores
  └── tem muitos → Deliberações
  └── fiscaliza muitas → Empresas

Diretor
  └── tem um → Mandato (ativo/encerrado)
  └── participa de muitos → Votos

Deliberação
  └── tem um → Processo SEI
  └── tem um → Microtema
  └── tem um → Resultado
  └── tem muitos → Votos
  └── afeta uma → Empresa (Interessado)

Empresa
  └── tem muitos → Processos SEI
  └── tem um → Score de Risco
```

Benefício prático: exportar os dados como **JSON-LD** (Linked Data) para interoperabilidade entre agências e com sistemas do governo federal (e-MEC, SIESG, TCU).

**Complexidade:** Média — é principalmente modelagem e documentação de esquema, não implementação.

---

### 4.4 Audit Trail de Extração (inspirado no AIP Inference History)

**O que a Palantir tem:** O AIP registra o histórico de todas as inferências de modelos — qual versão do modelo gerou qual resultado, quem aprovou, quando foi corrigido manualmente.

**Adaptação para o IRIS:**

Rastrear a proveniência de cada campo extraído:

```json
{
  "numero_deliberacao": {
    "valor": "001/2024",
    "fonte": "regex:RE_DELIBERACAO",
    "confiança": 0.95,
    "corrigido_por": null,
    "corrigido_em": null
  },
  "resultado": {
    "valor": "Deferido",
    "fonte": "regex:RE_RESULTADO",
    "confiança": 0.80,
    "corrigido_por": "user:joao@artesp.sp.gov.br",
    "corrigido_em": "2024-03-15T14:22:00Z"
  }
}
```

Já existe o campo `raw_extracted` (JSONB) no banco — seria uma extensão com metadados de proveniência. Permite auditar onde a IA errou e melhorar o pipeline com feedback humano.

**Complexidade:** Baixa — extensão do schema existente.

---

### 4.5 Configurador Visual de Extração (inspirado no Pipeline Builder do Foundry)

**O que a Palantir tem:** O _Pipeline Builder_ permite ao usuário não-técnico montar fluxos de transformação de dados arrastando e soltando blocos de processamento.

**Adaptação para o IRIS:**

Interface para que analistas de cada agência possam:
- Definir rótulos customizados de campos (ex: ANEEL usa "Processo" em vez de "SEI nº")
- Adicionar keywords de microtema específicas da agência
- Configurar thresholds de confiança por campo
- Definir regras de validação (ex: "número da deliberação deve ter formato NNN/AAAA")

Sem código. Via configuração YAML/JSON versionado por agência, editável em UI.

**Complexidade:** Alta — requer UI complexa e engine de configuração.

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
