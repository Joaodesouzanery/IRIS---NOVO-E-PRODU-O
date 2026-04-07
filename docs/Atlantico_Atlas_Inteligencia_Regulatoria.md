# Atlântico Atlas — Plataforma de Inteligência Regulatória de Duas Pontas
## Pesquisa estratégica: como seria o produto se a Palantir o construísse para o Brasil

> Documento conceitual. O objetivo é desenhar, com profundidade de especialista no setor regulatório brasileiro, qual seria o produto **perfeito** se uma empresa do calibre da Palantir decidisse atender simultaneamente as agências reguladoras federais e o mercado regulado.

---

## 1. Context — por que este produto precisa existir

O Brasil tem **12 agências reguladoras federais** após a transformação da ANPD em agência via MP 1.317/2025 — ANEEL, ANATEL, ANP, ANVISA, ANS, ANAC, ANTT, ANTAQ, ANCINE, ANA, ANM e ANPD ([Conjur](https://www.conjur.com.br/2025-set-23/doze-agencias-e-perfeicao-governamental-anpd-e-futuro-da-administracao-publica/)). Juntas elas:

- **Arrecadam mais de R$ 130 bilhões/ano** mas operam com orçamento de ~R$ 5 bilhões — déficit estrutural de pessoal e tecnologia ([Sinagências](https://sinagencias.org.br/os-servidores-das-agencias-reguladoras-estao-no-limite/)).
- Editaram **1.415 atos normativos entre abr/2021–abr/2024**, mas Análise de Impacto Regulatório foi aplicada em apenas **17,8%** dos casos ([Conjur](https://www.conjur.com.br/2024-set-10/por-um-uso-mais-racional-da-analise-de-impacto-regulatorio-no-brasil/)).
- Estão em **vácuo de governança**: mais da metade das 60 cadeiras de diretoria estão vagas ou ocupadas por substitutos ([Strategos](https://strategosconsultoria.com.br/novas-indicacoes-nas-agencias-reguladoras-federais/)).
- Sofrem com **judicialização crescente** — STF teve que limitar a interferência do TCU para preservar a discricionariedade técnica ([CNN Brasil](https://www.cnnbrasil.com.br/infra/stf-limita-o-alcance-do-tcu-sobre-agencias-reguladoras/)).
- Operam todas no **SEI (Sistema Eletrônico de Informações)**, gerando um corpus uniforme e estruturável de processos administrativos ([ANTT](https://portal.antt.gov.br/en/sei)).

Do outro lado, o mercado regulado movimenta trilhões e usa hoje ferramentas dispersas: **Inteligov** monitora tramitação legislativa e atos normativos com alertas IA ([Inteligov](https://www.inteligov.com.br/orgaos-reguladores)); **RelGov** faz curadoria de risco regulatório ([RelGov](https://www.relgov.com.br/)); **Mattos Filho/Pinheiro Neto** atendem casos individuais via consultoria-hora ([Mattos Filho](https://www.mattosfilho.com.br/en/practice-areas/infrastructure-and-energy/)). Ninguém oferece o que a Palantir oferece para inteligência militar: **uma ontologia operacional única, com ações, agentes IA e simulação**.

A oportunidade: construir **a primeira plataforma de inteligência regulatória de duas pontas do mundo lusófono**, na qual a mesma ontologia serve a agência (modelo Gotham — fiscalização, AIR, supervisão) e o mercado regulado (modelo Foundry — risco, jurimetria, prospectiva), com permissionamento granular separando os dois lados ([Palantir Ontology](https://www.palantir.com/platforms/ontology/)).

---

## 1.5 O DNA Gotham aplicado ao setor regulatório brasileiro

> Esta seção é o coração técnico-conceitual do produto. O Gotham, dentre as três plataformas da Palantir, é o que mais se aproxima do que uma agência reguladora *precisa fazer todos os dias*: cruzar dados de fontes incompatíveis, navegar por relações entre entidades, manter cadeia de custódia e operar sob escrutínio público. Aqui dissecamos o Gotham e mostramos como cada uma de suas capacidades nucleares se traduziria em valor concreto para uma agência brasileira.

### 1.5.1 O que é o Gotham, em uma frase honesta

Gotham é um **sistema operacional para tomada de decisão investigativa**, originalmente desenhado para CIA, NSA, FBI e ramos militares americanos, hoje em uso por aliados da OTAN e por agências de fronteira ([Palantir Gotham](https://www.palantir.com/platforms/gotham/), [Built In](https://builtin.com/articles/what-is-palantir)). Não é um BI, não é um data lake, não é um CRM. É uma camada que **integra, correlaciona, modela e age** sobre dados que originalmente vivem em sistemas que não conversam entre si — exatamente a condição em que vivem hoje as agências reguladoras brasileiras.

A descrição oficial é "*enterprise platform for planning missions and running investigations using disparate data, while maintaining privacy and access controls*" ([Digital Marketplace UK](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/801146272055049)). Substitua "missions" por "campanhas de fiscalização" e "investigations" por "processos administrativos sancionadores" e a definição encaixa perfeitamente.

### 1.5.2 As 8 capacidades nucleares do Gotham — e como cada uma vira uma vantagem regulatória brasileira

#### A. Ontologia dinâmica de entidades
**No Gotham:** o mundo é modelado como pessoas, organizações, ativos, locais, eventos e documentos, todos conectados por links navegáveis bidirecionalmente. Não há SQL — o analista navega pelo grafo ([Inside Palantir Gotham](https://goldingresearch.substack.com/p/inside-palantir-gotham)).

**Tradução regulatória brasileira:** o "mundo regulatório" como grafo único — concessionárias, contratos, processos SEI, deliberações, diretores, sanções, ações no DataJud, acórdãos TCU, indicadores ARSESP/ANEEL e notícias setoriais — todos como objetos vivos. O fiscal da ANEEL não precisa saber onde ficam os dados; ele clica em uma concessionária e vê o histórico de pedidos de revisão tarifária, as ações judiciais correlatas, os votos dos diretores, os acórdãos do TCU sobre o mesmo objeto.

#### B. Entity Resolution (resolução de entidades)
**No Gotham:** "Heavy investment in deduplication and entity resolution" ([AEANET](https://www.aeanet.org/what-is-palantir-gotham/)). O sistema reconhece que "John A. Smith", "J. Smith" e "Smith, John" são o mesmo indivíduo, mesmo com grafias divergentes, fontes diferentes e ruído.

**Tradução regulatória brasileira:** o problema das **razões sociais e CNPJs múltiplos** que assolam a fiscalização. O grupo X tem 14 SPEs, troca razão social a cada 3 anos, opera via testas-de-ferro. Hoje cada agência vê apenas seu pedaço. O Gotham-style do Atlântico Atlas resolveria: "*JLR Concessões Ltda.*", "*JLR Infra SPE I S.A.*" e "*Grupo Logística Rodoviária Holding*" como uma única entidade-mãe, com histórico unificado de sanções da ANTT, processos no TCU e ações na Justiça Federal. Essa é a mesma técnica usada pelo COAF brasileiro, que produziu **18.762 RIFs em 2024 (+335,9% vs 2015)** justamente porque cruza redes societárias ([Poder360](https://www.poder360.com.br/seguranca-publica/coaf-operacoes-suspeitas-2025/)).

#### C. Link Analysis (análise de links/redes)
**No Gotham:** "*Link analysis, geospatial analysis, and temporal analysis to uncover hidden relationships and patterns*" ([Yahoo Finance](https://finance.yahoo.com/news/palantir-gotham-powers-next-gen-140500701.html)). Permite ao analista descobrir, por exemplo, que duas empresas aparentemente independentes compartilham o mesmo endereço, o mesmo contador e o mesmo procurador.

**Tradução regulatória brasileira:** detecção de **conluio em consultas públicas** (mesmo IP enviando contribuições "independentes"), **triangulações fraudulentas** em processos de outorga, identificação de **lobbies coordenados** em audiências legislativas que afetam a agência. Também: descoberta de servidores que migraram para empresas reguladas pouco depois de votar a favor delas (porta giratória).

#### D. Geospatial Analysis
**No Gotham:** "*integrate data across Palantir Gotham into a cohesive map-based landscape, which can then be used to discover data trends, perform quick geographic searches, and create heatmap analyses*". Inclui sobreposição de vídeo ao vivo de drones e satélites sobre camadas geoespaciais ([NASDAQ](https://www.nasdaq.com/articles/palantir-gotham-powers-next-gen-data-intelligence-and-operations)).

**Tradução regulatória brasileira:**
- **ANM:** sobreposição de polígonos de lavra, autos de infração ambiental, áreas de proteção, comunidades indígenas e ações judiciais. Heatmap de risco minerário em tempo real.
- **ANTT:** mapa nacional de concessões rodoviárias com KPIs operacionais, acidentes, multas e pedidos de reequilíbrio plotados sobre o traçado.
- **ANP:** poços, dutos, terminais e incidentes ambientais geo-referenciados com alertas para sobreposição com áreas de exclusão.
- **ANATEL:** cobertura prometida vs cobertura medida (via medições da Anatel + crowdsourcing), por município.
- **ANA:** outorgas de uso da água + estações de monitoramento + áreas críticas de escassez.

Hoje cada agência tem seu próprio "mapinha" desconectado. Atlântico Atlas-Gotham unificaria.

#### E. Temporal Analysis
**No Gotham:** linhas do tempo de eventos correlacionados, capacidade de "*reproduzir*" um caso minuto a minuto, identificar ondas e padrões cíclicos.

**Tradução regulatória brasileira:** *time-travel regulatório*. Para um caso de revisão tarifária extraordinária, o analista vê numa única timeline: o pedido protocolado, as notas técnicas internas, o parecer do procurador, os votos dos diretores, a publicação no DOU, a ação judicial, a liminar, a sentença, o acórdão TCU subsequente. Se três casos análogos terminaram em ação no STJ, o sistema mostra os fatores de risco *antes* da decisão.

#### F. Provenance e Chain of Custody
**No Gotham:** "*Gotham's provenance and access control fit law enforcement and counter-fraud applications*" — toda informação carrega metadado de origem, transformações aplicadas e quem acessou. O *Checkpoints product* exige justificativa para ações sensíveis ([Palantir Privacy and Governance Whitepaper](https://www.palantir.com/assets/xrfr7uokpv1b/6pey1VnYHULqeggNbPKqP0/9f577de3e3dfb9fc031bd75dc7526517/Palantir_Privacy_and_Governance_Whitepaper__1_.pdf)).

**Tradução regulatória brasileira:** este é talvez **o ponto mais importante de todo o produto**. A maior crítica histórica às agências reguladoras brasileiras é a **opacidade decisória** que abre brecha à teoria da captura ([Migalhas](https://www.migalhas.com.br/depeso/342714/agencias-reguladoras--a-teoria-da-captura-e-atuacao-do-tribunal-de)). Provenance nativa significa:
- Toda decisão tem rastreabilidade até o documento-fonte exato (página, parágrafo, hash do PDF).
- Cada acesso a dados sensíveis (proposta tarifária ainda não publicada, identidade de denunciante) gera log assinado.
- O TCU pode auditar em tempo real "*quem viu o quê, quando, por qual razão*".
- O *Checkpoint* impede que qualquer ação de impacto seja executada sem justificativa textual registrada (ex: "estou consultando o histórico do CNPJ X porque ele é parte no processo Y").

Isso responde diretamente ao debate sobre poderes do TCU sobre as agências ([CNN Brasil](https://www.cnnbrasil.com.br/infra/stf-limita-o-alcance-do-tcu-sobre-agencias-reguladoras/)): em vez de o TCU intervir tecnicamente, ele *audita o processo decisório* — que é seu papel constitucional legítimo.

#### G. Privacy & Civil Liberties Engineering
**No Gotham:** Palantir mantém um time chamado *Privacy and Civil Liberties Engineering* dedicado a garantir que controles de privacidade sejam executados em código, não em política ([Palantir Privacy Whitepaper](https://www.palantir.com/assets/xrfr7uokpv1b/6pey1VnYHULqeggNbPKqP0/9f577de3e3dfb9fc031bd75dc7526517/Palantir_Privacy_and_Governance_Whitepaper__1_.pdf)). Isso virou tema de regulação acadêmica e debate público ([Sage — Ulbricht & Egbert 2024](https://journals.sagepub.com/doi/10.1177/20539517241255108), [Privacy International](https://privacyinternational.org/sites/default/files/2020-11/All%20roads%20lead%20to%20Palantir%20with%20Palantir%20response%20v3.pdf)).

**Tradução regulatória brasileira:** *LGPD-by-design*. Em uma agência reguladora, dados pessoais aparecem em todo lugar — partes de processos, autores de denúncias, beneficiários de benefícios tarifários, servidores. O Atlântico Atlas-Gotham implementaria:
- **Mascaramento contextual:** o servidor de pauta vê o nome do diretor; o estagiário só vê o cargo.
- **Purpose binding:** dados sobre denunciantes só podem ser cruzados em processos onde a denúncia é a origem; nunca em fishing expeditions.
- **Retention enforced:** prazos de eliminação de dados pessoais executados pelo sistema, não pela boa vontade do administrador.
- **DPO dashboard:** o DPO da agência tem painel próprio mostrando todos os tratamentos em curso, com alertas para violações.

#### H. Mission Workflow & AI-Enabled Operations
**No Gotham:** o Gotham AI-Enabled Operations white paper descreve workflows de missão em que humano e IA colaboram, com humano sempre no laço para decisões críticas ([Palantir Gotham AI Operations PDF](https://www.palantir.com/assets/xrfr7uokpv1b/3A0y10xksgXENvRMNaAsUu/ed8f7f1ed534c0101f64536a85f7297b/Gotham_AI-Enabled_Operations_White_Paper.pdf)). A parceria com Microsoft em ago/2024 trouxe GPT-4 para redes classificadas pela primeira vez ([Microsoft News](https://news.microsoft.com/source/2024/08/08/palantir-and-microsoft-partner-to-deliver-enhanced-analytics-and-ai-services-to-classified-networks-for-critical-national-security-operations/)).

**Tradução regulatória brasileira:** workflows estruturados de fiscalização, sancionamento, AIR e supervisão contratual. Não é "chatbot que responde sobre regulação" — é um *processo formal* em que cada etapa tem inputs, outputs, responsáveis e checkpoints. A IA acelera (sumarizando 2.000 páginas de processo, propondo enquadramentos, sugerindo precedentes), mas **a decisão é sempre humana e assinada**.

### 1.5.3 Do Gotham militar para o Gotham regulatório — adaptações brasileiras críticas

O Gotham original carrega DNA militar/policial. Trazer para uma agência reguladora civil exige adaptações conceituais essenciais:

| Dimensão | Gotham militar | Atlântico Atlas regulatório |
|----------|----------------|---------------------|
| **Sigilo** | Default = secreto | Default = público (LAI) |
| **Alvo** | Adversário externo | Regulado e a própria atuação interna |
| **Prova** | Inteligência (orientativa) | Evidência (com valor jurídico) |
| **Output** | Operação/captura | Ato administrativo motivado |
| **Auditoria** | Controle interno militar | TCU + MPF + controle social |
| **Latência** | Tempo real (segundos) | Tempo procedimental (dias) |
| **Adversário** | Estado/grupo armado | Assimetria de informação |
| **Ética** | Regras de engajamento | Devido processo legal |

A vantagem do produto-conceito é que **as capacidades técnicas (entity resolution, link analysis, geospatial, provenance) são neutras** — só os defaults, a UX e os controles mudam. A engenharia da Palantir é reutilizável; a filosofia operacional precisa ser totalmente brasileira.

### 1.5.4 Caso de uso narrativo — "O dia em que o Atlântico Atlas-Gotham resolveu uma fraude regulatória"

> *Hipotético. Ilustrativo do potencial.*

**Cenário:** A ANEEL recebe pedido de revisão tarifária extraordinária de uma distribuidora alegando perda de receita por inadimplência. Valor pleiteado: R$ 800 milhões.

**Sem Atlântico Atlas-Gotham (status quo):** A análise leva 8 meses. Equipe técnica monta planilhas manualmente, cruza com dados parciais da própria agência. Decisão sai com fundamentação genérica. Vai para o judiciário em qualquer cenário.

**Com Atlântico Atlas-Gotham (cenário-alvo):**
1. **D+0:** Pedido entra no SEI. Atlântico Atlas detecta automaticamente o tipo, cria objeto `PleitoRevisaoTarifaria`, vincula ao `ContratoConcessao` e ao `Regulado`.
2. **D+0:** *Entity resolution* identifica que a distribuidora é parte de holding com 4 SPEs. Histórico financeiro consolidado aparece.
3. **D+1:** *Link analysis* mostra que 3 dos 5 maiores "inadimplentes" alegados são empresas do mesmo grupo econômico — auto-inadimplência usada para inflar pleito.
4. **D+1:** *Temporal analysis* mostra que a alegação de queda de receita coincide com 2 outras concessionárias do mesmo controlador (padrão coordenado).
5. **D+2:** *Geospatial* sobrepõe área de concessão com dados da Receita Federal sobre faturamento real dos clientes ditos inadimplentes — discrepância de 60%.
6. **D+3:** Agente "Vigia de Jurisprudência" alerta que os 4 últimos casos análogos foram indeferidos pela ANEEL e mantidos pelo TJ.
7. **D+5:** Nota técnica gerada com evidência rastreável até hash de cada PDF original. Pedido vai à pauta com recomendação de indeferimento.
8. **D+15:** Diretoria delibera com voto fundamentado. Cada citação é hyperlink ao documento original. Audit log imutável.

Tempo total: **2 semanas em vez de 8 meses**, com qualidade técnica e rastreabilidade superior. Custo: o equivalente a *uma fração* do salário das equipes que ficariam dedicadas. Externalidade: a sociedade economiza R$ 800 milhões em majoração tarifária indevida.

Este é o tipo de resultado que o Gotham produz no contexto militar/policial, e que pode ser produzido no contexto regulatório com adaptação correta.

### 1.5.5 O que as consultorias regulatórias brasileiras NÃO conseguem oferecer

As consultorias regulatórias e jurídicas no Brasil — Mattos Filho, Pinheiro Neto, BMA, Demarest, EY, Accenture — são extraordinárias em **conhecimento jurídico-regulatório**. Elas dominam a Lei 13.848/2019, o Decreto 10.411/2020, a doutrina da OCDE sobre AIR e os precedentes do STF e TCU sobre regulação.

Mas elas operam em um **modelo artesanal**: cada caso é montado por humanos, em planilhas e memorandos, com prazo de semanas. O *deal flow* da Mattos Filho em concessões mostra a sofisticação jurídica ([Mattos Filho — Infrastructure & Energy](https://www.mattosfilho.com.br/en/practice-areas/infrastructure-and-energy/)), mas **não há ontologia subjacente** — cada novo caso reinicia o conhecimento.

O produto Gotham-style oferece o que **nenhuma consultoria pode oferecer**:
1. **Memória operacional persistente** — todo caso já trabalhado fica como objeto na ontologia, alimentando a inteligência futura.
2. **Tempo-resposta industrial** — análise que leva 3 semanas em consultoria é gerada em 30 minutos com o mesmo rigor.
3. **Cobertura total e contínua** — não depende de o cliente "lembrar de pedir"; o radar opera 24/7.
4. **Rastreabilidade cruzada** — uma pergunta sobre uma agência aciona automaticamente conhecimento de todas as outras 11.
5. **Custo marginal próximo de zero** — a partir do segundo caso, cada análise adicional é quase gratuita.

A consultoria continuará existindo — para defesa de teses, sustentação oral, *deal making*. Mas a parte de **inteligência operacional contínua** migra para o produto. É exatamente o mesmo movimento que a Bloomberg fez no mercado financeiro: não substituiu economistas, mas tornou impossível operar sem terminal.

### 1.5.6 Por que isso não existe ainda no Brasil

Quatro razões honestas:

1. **Custo de entrada altíssimo.** Construir a ontologia + os 12 conectores SEI + os crawlers + a infra de provenance é trabalho de 3 anos com time de 30 engenheiros. Nenhum player brasileiro de RegTech tem capital para isso. Inteligov optou (corretamente, dado seu capital) por monitoramento de baixo, não inteligência operacional ([Inteligov](https://www.inteligov.com.br/orgaos-reguladores)).
2. **Falta de cultura de produto no setor público brasileiro.** Agências costumam contratar serviços, não produtos. Mudar isso exige um cliente-âncora visionário — historicamente o BNDES, a Receita Federal e o STF cumpriram esse papel em outros domínios.
3. **Desconfiança do estrangeiro.** A Palantir nunca entraria diretamente — tem histórico polêmico de privacy ([The Conversation](https://theconversation.com/when-the-government-can-see-everything-how-one-company-palantir-is-mapping-the-nations-data-263178)), não fala português, e o ambiente regulatório-jurídico brasileiro é único. **Tem que ser empresa brasileira, com capital brasileiro, código auditável.**
4. **A janela está abrindo.** A combinação de SEI universal, dados abertos crescentes, LGPD e maturidade do mercado regulado cria a primeira oportunidade real de produto desta categoria no Brasil.

---

## 2. Conceito do produto — Atlântico Atlas

**Nome:** Atlântico Atlas — *Análise, Tramitação, Legislação, Aplicação, Supervisão*.

**Manifesto em uma frase:** *"Toda decisão regulatória do Brasil — passada, presente e futura — vista como um único objeto vivo, navegável, simulável e auditável."*

**Princípios fundadores:**

1. **Ontologia, não banco de dados.** Processos, normas, decisões, regulados, fiscais, mercados, indicadores e sanções são *objetos com comportamento*, não linhas de tabela. Toda relação é navegável bidirecionalmente. Inspirado diretamente na arquitetura semântica + cinética do Foundry ([Palantir Docs](https://www.palantir.com/docs/foundry/ontology/overview)).
2. **Zero captura, máxima auditoria.** Cada visualização, cada export, cada chamada de modelo gera log imutável assinado. O TCU pode auditar a plataforma em tempo real. Aborda diretamente o problema histórico de captura regulatória discutido no setor ([Migalhas](https://www.migalhas.com.br/depeso/342714/agencias-reguladoras--a-teoria-da-captura-e-atuacao-do-tribunal-de)).
3. **Duas portas, uma fundação.** *Porta Pública* (agência, MPF, TCU, controle social) e *Porta Mercado* (regulados, consultorias, escritórios) compartilham a ontologia, mas operam em namespaces isolados com criptografia separada. Espelha o modelo Gotham/Foundry da Palantir ([Palantir Platform Overview](https://www.palantir.com/docs/foundry/platform-overview/overview)).
4. **IA como copiloto técnico, não como oráculo.** Todo output de modelo é rastreável até o documento-fonte e validável por humano. Análoga à filosofia do AIP de chain-of-thought + auditabilidade ([Palantir AIP](https://www.palantir.com/docs/foundry/aip/overview)).
5. **Soberania de dados.** Hospedagem em nuvem nacional (TIVIT, Embratel, Locaweb) ou on-premise nas próprias agências. Cumprimento estrito de LGPD, com data residency garantida.
6. **Open by default, secret by exception.** Por padrão tudo segue Lei de Acesso à Informação. Sigilo é classificação explícita com prazo, não estado de repouso.

---

## 3. A Ontologia Atlântico Atlas

A ontologia é o coração do produto. Define **15 tipos de objetos primários** com seus *links* (relações navegáveis) e *actions* (mutações controladas).

### 3.1 Objetos Semânticos (15 tipos)

| # | Objeto | Propriedades-chave | Origem dos dados |
|---|--------|---------------------|------------------|
| 1 | **Norma** | tipo (lei/decreto/resolução/portaria), órgão, ementa, data, vigência, hierarquia, AIR vinculada | DOU, LexML, sites das agências |
| 2 | **Processo Administrativo** | número SEI, autuação, partes, fase, despachos, prazos | SEI federal + SEI das agências |
| 3 | **Deliberação / Ato Decisório** | colegiado, relator, votos, dispositivo, fundamento | Atas, deliberações, resoluções |
| 4 | **Diretor / Servidor** | mandato, indicação, declaração de conflitos, histórico de votos | Indicações Casa Civil, atas |
| 5 | **Regulado** (empresa/pessoa física) | CNPJ/CPF, setor, contratos vigentes, histórico de sanções, tier de risco | Receita Federal, JUCESPs, agências |
| 6 | **Contrato de Concessão / Outorga** | objeto, prazo, valor, contraprestação, cronograma, garantias | ANTT, ANEEL, ANATEL, ANP |
| 7 | **Auto de Infração / Sanção** | tipo, valor, fundamento, fase recursal, status pagamento | Sistemas sancionatórios das agências |
| 8 | **Indicador de Mercado** | tarifa, índice de qualidade, KPI setorial, série temporal | Dashboards das agências, ANEEL/ARSESP |
| 9 | **Consulta Pública / Audiência** | objeto, contribuições, sumário, ato resultante | Portais das agências |
| 10 | **AIR (Análise de Impacto Regulatório)** | problema, alternativas, custo-benefício, indicadores monitorados | Repositórios AIR das agências |
| 11 | **Ação Judicial Correlata** | tribunal, partes, status, decisão liminar, mérito | DataJud CNJ, escavador |
| 12 | **Acórdão TCU / CGU** | número, área, recomendação, prazo de cumprimento | Portal TCU, e-CGU |
| 13 | **Stakeholder Político** | parlamentar, ministério, frente, posições registradas | Câmara, Senado, Inteligov-style |
| 14 | **Evento Regulatório** | crise, apagão, recall, acidente, surto — ponto pivô temporal | Notícias, registros das agências |
| 15 | **Documento Bruto** (PDF/HTML) | hash, URL, snapshot temporal, texto extraído, embeddings | Crawler distribuído |

### 3.2 Relações (Links bidirecionais — exemplos críticos)

```
Norma —regula→ Setor —contém→ Regulado
Regulado —parte_de→ Processo —produz→ Deliberação —fundamenta→ Sanção
Diretor —votou_em→ Deliberação —cita→ Norma
AIR —antecede→ Norma —é_questionada_em→ Ação Judicial
Acórdão TCU —recomenda→ Processo —reabre→ Deliberação
Evento Regulatório —pivota→ Indicador —dispara→ Consulta Pública
```

A força do modelo é que **uma única query semântica responde perguntas que hoje exigem semanas de pesquisa manual**. Ex.: *"Quais diretores votaram a favor de reequilíbrios contratuais cujos contratos foram posteriormente questionados pelo TCU, e qual foi a magnitude financeira agregada?"* — em Atlântico Atlas isso é um traversal de 4 hops na ontologia.

### 3.3 Actions (Cinética — operações controladas com auditoria)

- `criarAIR(tema, alternativas, dataPrazo)` — cria objeto AIR vinculado a uma proposta de norma. **Audit log obrigatório.**
- `registrarVoto(diretorId, deliberacaoId, sentido, justificativa)` — só executável por usuário com papel `DIRETOR` da agência correta.
- `aplicarSancao(reguladoId, tipo, valor, fundamento)` — exige dupla aprovação (operador + supervisor) e abre prazo recursal automaticamente.
- `simularImpacto(normaProposta, cenários)` — invoca função de simulação Monte Carlo, retorna distribuição de impactos por regulado/setor.
- `marcarConflitoInteresse(diretorId, processoId, motivo)` — bloqueia automaticamente o objeto e notifica corregedoria.

Cada action é uma **função tipada** rodando dentro de um sandbox auditável — modelo direto do "kinetic layer" descrito no Foundry ([Palantir Ontology Docs](https://www.palantir.com/docs/foundry/ontology/overview)).

---

## 4. Os 9 Módulos do Produto

### Módulo 1 — INGESTÃO UNIVERSAL
**O que faz:** Crawler distribuído + pipeline de extração que normaliza qualquer documento regulatório brasileiro em objetos da ontologia.

**Capacidades:**
- Conectores nativos para SEI federal, SEIs das 12 agências, DOU, LexML, DataJud CNJ, Portal TCU, Câmara, Senado, sites institucionais.
- OCR forense para PDFs digitalizados (imagens), com confidence score por campo extraído.
- Detecção automática de tipo de documento (deliberação, ata, resolução, portaria, parecer técnico, voto, ofício, AIR).
- Splitter inteligente para documentos compostos (atas com N processos por exemplo).
- Fila com concorrência configurável, retry exponencial, deduplicação por SHA-256 + match semântico.
- *Diff temporal*: detecta quando uma norma é revogada, alterada ou consolidada e mantém grafo de versões.

### Módulo 2 — JURIMETRIA & PERFIL DE COLEGIADO
**O que faz:** Análise quantitativa do comportamento decisório de cada diretor, colegiado e agência ao longo do tempo.

**Capacidades:**
- Perfil individual de diretor: taxa de divergência, microtemas dominantes, alinhamento com pares, sensibilidade a tipo de regulado.
- Mapa de coalizões intra-colegiado.
- Detecção de vieses estatisticamente significativos (ex: setor X tem 40% mais deferimentos que setor Y).
- Identificação de pontos de inflexão temporais (mudança de jurisprudência interna).
- Predição calibrada: dado um pleito, qual a probabilidade de deferimento, com intervalo de confiança e *fatores que mais influenciam*.
- **Lado Agência:** insumo para corregedoria e indicação de novos membros.
- **Lado Mercado:** estratégia de pleito e timing.

### Módulo 3 — RADAR REGULATÓRIO PROSPECTIVO
**O que faz:** Antecipa em **30, 90 e 180 dias** quais temas tendem a virar regulação, com base em sinais fracos.

**Sinais combinados:**
- Frequência crescente em consultas públicas
- Acórdãos TCU recentes recomendando ação
- Projetos de lei tramitando em comissão
- Eventos regulatórios (crises, acidentes)
- Ações judiciais em massa em tribunais superiores
- Notícias e mídia setorial (NLP)
- Movimentação em audiências das frentes parlamentares

**Output:** *Heatmap* de temas com score de probabilidade × impacto, detalhado por setor regulado. Concorrente direto e mais sofisticado que Inteligov.

### Módulo 4 — AIR EM ESCALA (motor de Análise de Impacto Regulatório)
**O que faz:** Resolve o problema apontado pela OCDE e pelo IPEA: **AIR é cara, demorada e por isso só é feita em 17,8% dos atos** ([Conjur](https://www.conjur.com.br/2024-set-10/por-um-uso-mais-racional-da-analise-de-impacto-regulatorio-no-brasil/)).

**Capacidades:**
- Templates configuráveis por agência, alinhados ao Decreto 10.411/2020.
- Bibliotecas de alternativas regulatórias com casos análogos do Brasil e exterior.
- Simulação Monte Carlo de impactos: tarifa, emprego, investimento, arrecadação, qualidade de serviço.
- Coleta automatizada de contribuições da consulta pública com clusterização semântica.
- Quality gates: a AIR só pode ser publicada se passar checklist OCDE (proporcionalidade, alternativa zero, indicadores monitorados).
- Rastreamento ex-post: monitora os indicadores definidos na AIR durante a vigência da norma, gerando relatório de aderência automático.

### Módulo 5 — SUPERVISÃO DE CONCESSÕES (Compliance Twin)
**O que faz:** Cria um **digital twin** de cada contrato de concessão. Cada cláusula é um objeto monitorado em tempo real.

**Capacidades:**
- Linha do tempo de obrigações contratuais com semáforo de cumprimento.
- Cruzamento automático com indicadores operacionais publicados pela própria concessionária.
- Detecção de pedidos de reequilíbrio recorrentes do mesmo objeto.
- Simulação de impacto de eventos extraordinários sobre o contrato (custos, prazos, taxa interna).
- Geração automática de notas técnicas de fiscalização baseadas em evidência rastreável.
- **Caso real benchmark:** modelo análogo ao Palantir/FDA para supply chain do food safety ([FedScoop](https://fedscoop.com/palantir-fda-data-analytics-platform/)).

### Módulo 6 — INTELIGÊNCIA DE FISCALIZAÇÃO (lado Agência)
**O que faz:** Equivalente regulatório do *Gotham*. Aloca recursos escassos de fiscalização para os pontos de maior risco.

**Capacidades:**
- Score de risco por regulado, calibrado por: histórico sancionatório, denúncias, acórdãos TCU, ações judiciais, comportamento de pares no setor.
- Priorização automática de inspeções com explicação dos fatores.
- Detecção de anomalias em séries temporais (consumo, atendimentos, produção declarada).
- Cruzamento de redes societárias para identificar operadores que tentam esconder histórico via troca de razão social.
- Análise de correspondência entre pleitos paralelos do mesmo grupo econômico em agências distintas.

### Módulo 7 — RISCO REGULATÓRIO & ESTRATÉGIA (lado Mercado)
**O que faz:** O contrário do Módulo 6: o regulado vê a si mesmo, seus concorrentes e o ambiente.

**Capacidades:**
- Painel de riscos vivos: o que está sendo discutido na agência que afeta meu negócio?
- *War room* de pleito: dado um pleito específico, gera estratégia (relator provável, jurisprudência favorável, riscos de divergência, momento ideal de protocolo).
- Benchmark setorial: como meus pares se saíram em pleitos análogos?
- Calendário regulatório customizado.
- Alertas em tempo real para qualquer movimentação que afete contratos vigentes.
- **Substitui o que Inteligov+RelGov+consultoria-hora oferecem hoje, fragmentado.**

### Módulo 8 — JURISDIÇÃO CRUZADA (TCU, MPF, Judiciário)
**O que faz:** Conecta o ato regulatório a seu *afterlife* nos órgãos de controle.

**Capacidades:**
- Toda deliberação fica linkada às ações judiciais, acórdãos TCU e procedimentos MPF que a citam.
- Mapa de risco de judicialização: dado um ato em discussão, qual a probabilidade de virar processo no STF/STJ?
- Histórico de "como acabou": para cada tipo de decisão regulatória, qual o desfecho médio nas instâncias de controle.
- Aborda diretamente o problema de fricção TCU vs. agência discutido pelo STF ([CNN Brasil](https://www.cnnbrasil.com.br/infra/stf-limita-o-alcance-do-tcu-sobre-agencias-reguladoras/)).

### Módulo 9 — AGENT STUDIO REGULATÓRIO (camada de IA)
**O que faz:** Permite criar agentes IA especializados que operam *sobre a ontologia*, não em cima de texto cru. Inspirado diretamente no AIP Agent Studio da Palantir ([Palantir Docs](https://www.palantir.com/docs/foundry/agent-studio/overview)).

**Agentes pré-construídos:**
- **Relator-Sintético:** dado um processo, esboça minuta de voto considerando jurisprudência interna e externa.
- **Analista de Conflitos:** examina cada nova pauta vs. declarações de impedimento de cada diretor.
- **Auditor-Cidadão:** chatbot público que responde "o que esta agência decidiu sobre X nos últimos 5 anos?" com evidência rastreável.
- **Tradutor Regulatório:** transforma juridiquês em linguagem cidadã preservando precisão técnica.
- **Vigia de Jurisprudência:** alerta quando uma decisão de hoje contraria precedente da própria agência.

Toda chamada de modelo gera **chain-of-thought logado e revisável** + **citações rastreáveis até o documento-fonte**, espelhando o padrão Palantir AIP ([Palantir AIP Overview](https://www.palantir.com/docs/foundry/aip/overview)).

---

## 5. Arquitetura técnica (visão executiva)

```
┌────────────────────────────────────────────────────────────────┐
│                      PORTAS DE ACESSO                          │
│  ┌────────────────┐         ┌────────────────────────────┐    │
│  │ Porta Pública  │         │  Porta Mercado             │    │
│  │ (Gotham-mode)  │         │  (Foundry-mode)            │    │
│  │ Agências/TCU/  │         │  Regulados/Consultorias/   │    │
│  │ MPF/CGU        │         │  Escritórios/Investidores  │    │
│  └────────┬───────┘         └────────────┬───────────────┘    │
└───────────┼──────────────────────────────┼────────────────────┘
            │                              │
            ▼                              ▼
┌────────────────────────────────────────────────────────────────┐
│        CAMADA DE PERMISSIONAMENTO E AUDITORIA (Apollo-like)    │
│   Namespaces isolados • RBAC granular • Logs imutáveis (blob)  │
└────────────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────┐
│                  ONTOLOGIA Atlântico Atlas (Core)              │
│  Objetos × Links × Actions × Functions × Time-travel snapshots │
└────────────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                             │
│  Postgres (objetos)  •  ClickHouse (séries temporais)          │
│  pgvector (embeddings) • S3-compat (docs brutos)               │
│  DuckDB (analytics ad-hoc) • Parquet (lake)                    │
└────────────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────┐
│                    CAMADA DE INGESTÃO                          │
│  Crawlers distribuídos • OCR farm • Pipeline NLP regex+LLM     │
│  Conectores: SEI, DOU, LexML, DataJud, TCU, Câmara, Senado     │
└────────────────────────────────────────────────────────────────┘
```

**Princípios de engenharia:**
- **Tudo versionado:** ontologia tem migrações tipo Git; objetos têm time-travel; roll-back é uma operação suportada.
- **Read replicas isoladas por porta:** dados sensíveis nunca cruzam o limite entre agência e mercado.
- **Modelos rodando em VPC nacional** com fallback offline para soberania.
- **Audit log assinado e exportável para o TCU** em tempo real.

---

## 6. Modelo de negócio e GTM (Go-to-Market)

### 6.1 Tier público (Porta Pública)
- **Cliente:** as 12 agências federais, depois agências estaduais (ARSESP, Agergs, Arsep etc.), depois TCU/MPF/CGU.
- **Modelo:** licença anual por agência, dimensionada por nº de processos/ano.
- **Range:** R$ 8–25 milhões/ano por agência grande (ANEEL, ANATEL, ANP).
- **Entrada:** ANM ou ANTAQ (menores, mais flexíveis, com déficit tecnológico maior).
- **Validação:** parceria com a Casa Civil + ENAP para piloto institucional.

### 6.2 Tier mercado (Porta Mercado)
- **Cliente:** top-50 grupos econômicos regulados, top-20 escritórios e top-10 consultorias (Mattos Filho, Pinheiro Neto, BMA, EY, Accenture).
- **Modelo:** SaaS por seat + por setor monitorado.
- **Range:** R$ 200k–2M/ano por cliente.
- **Diferencial vs Inteligov/RelGov:** ao invés de monitoramento, **inteligência operacional sobre a ontologia compartilhada com a fonte primária**.

### 6.3 Pirâmide de adoção
1. **Ano 1:** 1 agência piloto + 5 clientes mercado fundadores. Foco em casos de uso únicos (ex: AIR automatizada, jurimetria).
2. **Ano 2:** 3 agências + 20 clientes mercado. Lançamento dos agentes IA.
3. **Ano 3:** 6 agências + 50 clientes mercado. Crossover: agências começam a usar dados agregados anonimizados do lado mercado para calibrar fiscalização (com governança).
4. **Ano 5:** standard de fato do setor regulatório brasileiro. Expansão para LATAM (CRE no México, Sernac no Chile, Enargas na Argentina).

---

## 7. Benchmarks e diferenciação

| Dimensão | Palantir Foundry | Inteligov/RelGov | Mattos Filho/EY | **Atlântico Atlas** |
|----------|-------------------|-------------------|-----------------|-----------|
| **Foco** | Genérico operacional | Monitoramento normativo | Consultoria humana | Regulação como ontologia viva |
| **Modelo** | Plataforma + serviços | SaaS de alertas | Hora-consultor | SaaS + serviços |
| **Brasil-nativo** | Não | Sim | Sim | Sim |
| **Ontologia regulatória** | Construir do zero | Não | Não | Pronta |
| **Duas pontas** | Sim (genérico) | Não (só regulado) | Não (só regulado) | Sim, regulatório-nativo |
| **AIR automatizada** | Não | Não | Manual | Sim, motor proprietário |
| **Agentes IA com ontologia** | AIP | Não | Não | Sim, pré-treinados |
| **Auditoria pelo TCU** | Não nativo | Não | N/A | Nativa |
| **Soberania de dados** | Cloud US (mais Azure Gov) | Cloud BR | N/A | Cloud BR/on-prem |

A linha "Duas pontas regulatório-nativo" é o **fosso defensivo (moat)** principal: nenhum concorrente atual consegue copiar isso sem reconstruir a ontologia inteira do zero, e nenhum produto americano (incluindo a própria Palantir, se ela fosse entrar) tem o conhecimento institucional do SEI, do DOU, das Leis 9.784, 13.848 e 13.874, e do Decreto 10.411.

---

## 8. Os 7 riscos críticos do produto

1. **Risco de captura percebida.** Se uma agência adotar Atlântico Atlas e a empresa também vender para os regulados, a percepção pública pode ser de captura. **Mitigação:** auditoria em tempo real pelo TCU, governança independente, conselho consultivo com OAB/MPF.
2. **Risco político.** Mudança de governo pode descontinuar contratos. **Mitigação:** entrar via ENAP/ATRICON, criar dependência operacional progressiva.
3. **Risco de soberania.** Hostilidade a empresas estrangeiras de inteligência (vide debate sobre a própria Palantir nos EUA — [The Conversation](https://theconversation.com/when-the-government-can-see-everything-how-one-company-palantir-is-mapping-the-nations-data-263178)). **Mitigação:** capital nacional, dados em solo BR, código auditável.
4. **Risco LGPD.** Cruzamento de dados pessoais (servidores, partes de processos) é zona cinzenta. **Mitigação:** privacy by design, DPO interno, parecer da ANPD desde o dia 1.
5. **Risco técnico.** Ontologia pode virar canivete suíço infinito sem foco. **Mitigação:** versionamento tipo Git, governança rígida via comitê semântico.
6. **Risco de adoção interna.** Servidores das agências estão sobrecarregados ([Sinagências](https://sinagencias.org.br/os-servidores-das-agencias-reguladoras-estao-no-limite/)) e podem resistir a mais um sistema. **Mitigação:** integração nativa com SEI (não substitui, amplia), curva de adoção gradual.
7. **Risco competitivo.** Inteligov + escritórios podem se aliar contra. **Mitigação:** não competir no monitoramento básico (commoditizado), diferenciar via simulação, jurimetria e AIR.

---

## 9. Roadmap conceitual (3 fases × 18 meses)

### Fase Foundation (meses 1–6)
- Definir ontologia v1.0 (15 objetos primários)
- Construir conectores SEI + DOU + LexML
- Pipeline de ingestão e extração para 3 agências-piloto (ANEEL, ANTT, ANM)
- POC do Módulo 2 (Jurimetria) e Módulo 3 (Radar)
- Parceria com 1 agência + 3 clientes mercado fundadores

### Fase Expansion (meses 7–12)
- Lançar Módulos 4 (AIR), 5 (Concessões), 6 (Fiscalização)
- Conectores DataJud + TCU + Câmara + Senado
- Agent Studio v1 com 5 agentes pré-treinados
- 2ª agência cliente, +10 clientes mercado
- Certificação LGPD + parecer ANPD

### Fase Platform (meses 13–18)
- Módulo 8 (Jurisdição Cruzada) e Módulo 9 (Agent Studio aberto)
- Workshop de aplicações low-code para servidores criarem suas próprias views
- Marketplace interno de agentes/funções
- Expansão para 5 agências + 30 clientes mercado
- Início de internacionalização (México/Chile)

---

## 10. Verificação conceitual — como saber se este produto seria "perfeito"

A pesquisa só vale se as perguntas-pivô abaixo tiverem respostas afirmativas. São os critérios qualitativos que definem se o produto está à altura do que a Palantir construiria:

1. **Teste do diretor:** um diretor recém-empossado consegue, em 30 minutos, ver o histórico de votos do colegiado nos últimos 5 anos por microtema, com fundamentação rastreável até o documento original?
2. **Teste do servidor de fiscalização:** dado um setor regulado, Atlântico Atlas aponta os 10 alvos prioritários da próxima campanha de fiscalização com explicação dos fatores em até 5 cliques?
3. **Teste do cidadão jornalista:** um jornalista consegue, sem login, descobrir quais empresas tiveram pedidos de reequilíbrio deferidos em ano eleitoral?
4. **Teste da consultoria:** um sócio de Mattos Filho consegue gerar memorando de risco regulatório de cliente novo em < 2h, com evidência citada?
5. **Teste do TCU:** o auditor do TCU consegue ver, em real time, quem acessou o quê dentro da agência X nos últimos 30 dias?
6. **Teste de simulação:** dada uma proposta de revisão tarifária, Atlântico Atlas roda Monte Carlo de impactos e mostra distribuição em < 5 minutos?
7. **Teste de soberania:** os dados nunca saem do solo brasileiro, e auditores podem provar isso?
8. **Teste de auditabilidade IA:** toda saída do agente "Relator-Sintético" pode ser revertida a citações de documentos oficiais?
9. **Teste do AIR:** a taxa nacional de uso de AIR sobe de 17,8% para >60% em agências que adotam Atlântico Atlas?
10. **Teste de longevidade:** o produto é mantenível mesmo se a empresa que o construiu desaparecer? (resposta: ontologia open-spec, conectores open-source, dados em formatos abertos)

---

## Fontes consultadas

### Sobre a Palantir e arquitetura
- [Palantir Gotham — página oficial](https://www.palantir.com/platforms/gotham/)
- [Palantir Gotham — Service Definition (UK G-Cloud)](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/801146272055049)
- [Palantir Gotham AI-Enabled Operations White Paper (PDF)](https://www.palantir.com/assets/xrfr7uokpv1b/3A0y10xksgXENvRMNaAsUu/ed8f7f1ed534c0101f64536a85f7297b/Gotham_AI-Enabled_Operations_White_Paper.pdf)
- [Palantir Privacy & Governance Whitepaper (PDF)](https://www.palantir.com/assets/xrfr7uokpv1b/6pey1VnYHULqeggNbPKqP0/9f577de3e3dfb9fc031bd75dc7526517/Palantir_Privacy_and_Governance_Whitepaper__1_.pdf)
- [Palantir Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview)
- [Palantir Platform Overview](https://www.palantir.com/docs/foundry/platform-overview/overview)
- [Palantir AIP Overview](https://www.palantir.com/docs/foundry/aip/overview)
- [AIP Agent Studio](https://www.palantir.com/docs/foundry/agent-studio/overview)
- [Inside Palantir Gotham — Oliver Golding](https://goldingresearch.substack.com/p/inside-palantir-gotham)
- [What is Palantir Gotham — AEANET](https://www.aeanet.org/what-is-palantir-gotham/)
- [Yahoo Finance — Gotham powers next-gen ops](https://finance.yahoo.com/news/palantir-gotham-powers-next-gen-140500701.html)
- [NASDAQ — Gotham powers next-gen data intelligence](https://www.nasdaq.com/articles/palantir-gotham-powers-next-gen-data-intelligence-and-operations)
- [Microsoft + Palantir partnership for classified networks (ago/2024)](https://news.microsoft.com/source/2024/08/08/palantir-and-microsoft-partner-to-deliver-enhanced-analytics-and-ai-services-to-classified-networks-for-critical-national-security-operations/)
- [Palantir/FDA contracts — FedScoop](https://fedscoop.com/palantir-fda-data-analytics-platform/)
- [What is Palantir — Built In](https://builtin.com/articles/what-is-palantir)
- [The Conversation — Palantir mapping nation's data](https://theconversation.com/when-the-government-can-see-everything-how-one-company-palantir-is-mapping-the-nations-data-263178)
- [Sage — Ulbricht & Egbert 2024 — In Palantir We Trust?](https://journals.sagepub.com/doi/10.1177/20539517241255108)
- [Privacy International — All roads lead to Palantir (PDF)](https://privacyinternational.org/sites/default/files/2020-11/All%20roads%20lead%20to%20Palantir%20with%20Palantir%20response%20v3.pdf)
- [Poder360 — COAF, RIFs e link analysis no Brasil](https://www.poder360.com.br/seguranca-publica/coaf-operacoes-suspeitas-2025/)

### Sobre o setor regulatório brasileiro
- [Conjur — 12 agências reguladoras / ANPD](https://www.conjur.com.br/2025-set-23/doze-agencias-e-perfeicao-governamental-anpd-e-futuro-da-administracao-publica/)
- [Strategos — Indicações 2024/2025](https://strategosconsultoria.com.br/novas-indicacoes-nas-agencias-reguladoras-federais/)
- [Sinagências — Servidores no limite](https://sinagencias.org.br/os-servidores-das-agencias-reguladoras-estao-no-limite/)
- [Inteligov blog — Modelo das agências reguladoras](https://www.blog.inteligov.com.br/agencias-reguladoras)
- [Câmara — Comissão e fortalecimento das agências](https://www.camara.leg.br/noticias/1186404-comissao-debate-fortalecimento-das-agencias-reguladoras/)
- [TCU — Situação das agências reguladoras](https://portal.tcu.gov.br/imprensa/noticias/situacao-das-agencias-reguladoras-necessita-de-atencao-apontam-dados-do-tcu)
- [CNN Brasil — STF limita TCU sobre agências](https://www.cnnbrasil.com.br/infra/stf-limita-o-alcance-do-tcu-sobre-agencias-reguladoras/)
- [Migalhas — Captura regulatória e TCU](https://www.migalhas.com.br/depeso/342714/agencias-reguladoras--a-teoria-da-captura-e-atuacao-do-tribunal-de)
- [Conjur — Uso racional da AIR](https://www.conjur.com.br/2024-set-10/por-um-uso-mais-racional-da-analise-de-impacto-regulatorio-no-brasil/)
- [Conjur — Regulamentação da AIR precisa revisão](https://www.conjur.com.br/2024-abr-02/a-regulamentacao-da-analise-de-impacto-regulatorio-ja-necessita-de-revisao/)
- [CGU — Boas práticas regulatórias (PDF)](https://repositorio.cgu.gov.br/bitstream/1/78223/1/Livro_Boas_Praticas_Regulatorias.pdf)
- [IPEA — Quem faz AIR no Brasil](https://repositorio.ipea.gov.br/bitstreams/85b0484f-c2d0-45a5-be96-93311737445d/download)

### Sobre concorrentes e SEI
- [Inteligov — Monitoramento de Órgãos Reguladores](https://www.inteligov.com.br/orgaos-reguladores)
- [Inteligov — Monitoramento](https://www.inteligov.com.br/monitoramento)
- [RelGov / Integra](https://www.relgov.com.br/)
- [SEI ANTT](https://portal.antt.gov.br/en/sei)
- [ANAC SEI](https://www.gov.br/anac/pt-br/sistemas/protocolo-eletronico-sei)
- [Mattos Filho — Infrastructure & Energy](https://www.mattosfilho.com.br/en/practice-areas/infrastructure-and-energy/)
- [Mattos Filho — Tech & Law trends 2026](https://www.mattosfilho.com.br/en/unico/technology-law-brazil-trends/)
