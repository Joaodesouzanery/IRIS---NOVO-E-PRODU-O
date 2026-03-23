/**
 * demo-data.ts
 * Dados fictícios para visualização da plataforma sem Supabase configurado.
 * Inclui 3 agências reguladoras brasileiras (transporte, energia, saúde)
 * com 25 deliberações, 9 diretores e votações matematicamente consistentes.
 * Remova quando o Supabase estiver ativo em produção.
 */

// ─── IDs fixos ─────────────────────────────────────────────────────────────
const A_ARTESP = "demo-agency-artesp";
const A_ANEEL  = "demo-agency-aneel";
const A_ANVISA = "demo-agency-anvisa";

// Diretores ARTESP
const DA1 = "demo-dir-artesp-1"; // Carlos Eduardo Mendonça
const DA2 = "demo-dir-artesp-2"; // Fernanda Luz Ribeiro
const DA3 = "demo-dir-artesp-3"; // Rodrigo Alves Correia

// Diretores ANEEL
const DN1 = "demo-dir-aneel-1";  // Sandoval Feitosa Filho
const DN2 = "demo-dir-aneel-2";  // Maria Vitória Campos
const DN3 = "demo-dir-aneel-3";  // José Luís Schiffer

// Diretores ANVISA
const DV1 = "demo-dir-anvisa-1"; // Ana Beatriz Mendes
const DV2 = "demo-dir-anvisa-2"; // Roberto Santos Lima
const DV3 = "demo-dir-anvisa-3"; // Cristiane Prado

// ─── Mapeamento agência → diretores ──────────────────────────────────────
const AGENCY_DIRS: Record<string, Array<{ id: string; nome: string }>> = {
  [A_ARTESP]: [
    { id: DA1, nome: "Carlos Eduardo Mendonça" },
    { id: DA2, nome: "Fernanda Luz Ribeiro" },
    { id: DA3, nome: "Rodrigo Alves Correia" },
  ],
  [A_ANEEL]: [
    { id: DN1, nome: "Sandoval Feitosa Filho" },
    { id: DN2, nome: "Maria Vitória Campos" },
    { id: DN3, nome: "José Luís Schiffer" },
  ],
  [A_ANVISA]: [
    { id: DV1, nome: "Ana Beatriz Mendes" },
    { id: DV2, nome: "Roberto Santos Lima" },
    { id: DV3, nome: "Cristiane Prado" },
  ],
};

// ─── Deliberações brutas ──────────────────────────────────────────────────
// 25 total: 10 ARTESP, 8 ANEEL, 7 ANVISA
// Indeferidos: ARTESP 005 e 010, ANEEL 006, ANVISA 005 (4 total → taxa 84%)
// Votos: 3 por deliberação = 75 total (67 Favoravel, 8 Desfavoravel)
// Para indeferidos: 2 Desfavoravel (maioria) + 1 Favoravel (divergente)

type DelRaw = {
  id: string;
  agencia: string;
  n: string;
  reuniao: string;
  data: string;
  interessado: string | null;
  processo: string;
  microtema: string;
  resultado: "Deferido" | "Indeferido";
  resumo: string;
  fundamento: string;
  // IDs que votaram diferente da maioria (divergentes)
  divergentes?: string[];
};

const DELIBERACOES_RAW: DelRaw[] = [
  // ── ARTESP (Transporte) ───────────────────────────────────────────────
  { id: "demo-artesp-001", agencia: A_ARTESP, n: "001/2024", reuniao: "321ª Reunião Ordinária", data: "2024-03-13",
    interessado: "Rota das Bandeiras S.A.", processo: "SEI nº 023.0001/2024", microtema: "tarifa", resultado: "Deferido",
    resumo: "Reajuste tarifário anual de pedágio da Rota das Bandeiras pelo índice IPCA acumulado de 4,62%.",
    fundamento: "Revisão em conformidade com cláusula contratual 25.2. Laudos técnicos atestam equilíbrio econômico-financeiro." },
  { id: "demo-artesp-002", agencia: A_ARTESP, n: "002/2024", reuniao: "322ª Reunião Ordinária", data: "2024-04-10",
    interessado: "CCR Via Bandeirantes S.A.", processo: "SEI nº 023.0009/2024", microtema: "obras", resultado: "Deferido",
    resumo: "Aprovação do projeto executivo de duplicação de 20 km do trecho km 90-110 da SP-348.",
    fundamento: "Projeto atende normas do DNIT. Prazo de 36 meses e investimento de R$ 340 milhões aprovados." },
  { id: "demo-artesp-003", agencia: A_ARTESP, n: "003/2024", reuniao: "323ª Reunião Ordinária", data: "2024-05-08",
    interessado: "Autopista Litoral Sul S.A.", processo: "SEI nº 023.0022/2024", microtema: "multa", resultado: "Deferido",
    resumo: "Multa por descumprimento do IRI mínimo no trecho km 40-55 da rodovia concedida.",
    fundamento: "Laudo confirma IRI médio de 3,8 (limite contratual: 2,5). Multa de R$ 1,2 milhão aplicada." },
  { id: "demo-artesp-004", agencia: A_ARTESP, n: "004/2024", reuniao: "324ª Reunião Ordinária", data: "2024-06-12",
    interessado: "CCR RodoVias S.A.", processo: "SEI nº 023.0035/2024", microtema: "contrato", resultado: "Deferido",
    resumo: "Aprovação do 5º Termo Aditivo ao Contrato de Concessão, reprogramando CAPEX para 2024-2026.",
    fundamento: "Aditivo alinha investimentos às prioridades regionais, acrescendo R$ 180 milhões em obras de segurança." },
  { id: "demo-artesp-005", agencia: A_ARTESP, n: "005/2024", reuniao: "325ª Reunião Ordinária", data: "2024-07-10",
    interessado: "EcoRodovias S.A.", processo: "SEI nº 023.0048/2024", microtema: "reequilibrio", resultado: "Indeferido",
    resumo: "Pedido de reequilíbrio econômico-financeiro alegando impactos de legislação ambiental superveniente.",
    fundamento: "Risco regulatório ambiental é alocado à concessionária pelo edital. Desequilíbrio contratual não reconhecido.",
    divergentes: [DA3] },
  { id: "demo-artesp-006", agencia: A_ARTESP, n: "006/2024", reuniao: "326ª Reunião Ordinária", data: "2024-08-14",
    interessado: "CCR SPVias S.A.", processo: "SEI nº 023.0057/2024", microtema: "tarifa", resultado: "Deferido",
    resumo: "Revisão tarifária ordinária da SP-070 com reajuste de 5,1% pelo índice contratual.",
    fundamento: "Cálculo atuarial homologado pela Auditoria ARTESP. Mantido equilíbrio econômico-financeiro." },
  { id: "demo-artesp-007", agencia: A_ARTESP, n: "007/2024", reuniao: "327ª Reunião Ordinária", data: "2024-09-11",
    interessado: "Intervias S.A.", processo: "SEI nº 023.0071/2024", microtema: "obras", resultado: "Deferido",
    resumo: "Aprovação do projeto de ampliação da capacidade viária da SP-147, km 22 ao 45.",
    fundamento: "Obra essencial para fluxo regional. Investimento de R$ 95 milhões, prazo de execução de 24 meses." },
  { id: "demo-artesp-008", agencia: A_ARTESP, n: "008/2024", reuniao: "328ª Reunião Ordinária", data: "2024-10-09",
    interessado: "Autoban S.A.", processo: "SEI nº 023.0085/2024", microtema: "multa", resultado: "Deferido",
    resumo: "Auto de infração por descumprimento do prazo de conservação do pavimento na SP-330.",
    fundamento: "Inadimplência contratual reiterada. Multa de R$ 850 mil, prazo de 30 dias para regularização." },
  { id: "demo-artesp-009", agencia: A_ARTESP, n: "009/2024", reuniao: "329ª Reunião Ordinária", data: "2024-11-13",
    interessado: "Rota Sorocabana S.A.", processo: "SEI nº 023.0099/2024", microtema: "contrato", resultado: "Deferido",
    resumo: "Aprovação do 2º Aditivo à Concessão Rota Sorocabana incluindo obras de drenagem e iluminação.",
    fundamento: "Obras necessárias para conformidade com Plano de Drenagem Urbana de Sorocaba. Investimento de R$ 28 milhões." },
  { id: "demo-artesp-010", agencia: A_ARTESP, n: "010/2024", reuniao: "330ª Reunião Ordinária", data: "2024-12-11",
    interessado: null, processo: "SEI nº 023.0112/2024", microtema: "fiscalizacao", resultado: "Indeferido",
    resumo: "Proposta de abertura de processo administrativo por inadimplências identificadas na SP-021.",
    fundamento: "Divergência sobre critérios de avaliação do indicador de pavimento. Processo devolvido para revisão técnica.",
    divergentes: [DA2] },

  // ── ANEEL (Energia Elétrica) ──────────────────────────────────────────
  { id: "demo-aneel-001", agencia: A_ANEEL, n: "001/2024", reuniao: "878ª Reunião Ordinária de Diretoria", data: "2024-03-13",
    interessado: "ENEL Distribuição São Paulo S.A.", processo: "ANEEL nº 48500.003412/2024", microtema: "tarifa", resultado: "Deferido",
    resumo: "Homologação do reajuste tarifário anual da ENEL Distribuição São Paulo, com índice de 8,2%.",
    fundamento: "Reajuste calculado conforme metodologia do IPCA. Tarifa homologada nos termos da Resolução ANEEL nº 1.000/2021." },
  { id: "demo-aneel-002", agencia: A_ANEEL, n: "002/2024", reuniao: "879ª Reunião Ordinária de Diretoria", data: "2024-04-24",
    interessado: "CPFL Energia S.A.", processo: "ANEEL nº 48500.005127/2024", microtema: "contrato", resultado: "Deferido",
    resumo: "Aprovação do 3º Aditivo ao Contrato de Concessão da CPFL Energia para expansão da rede no interior paulista.",
    fundamento: "Expansão atende metas do Plano Decenal de Energia 2033. Investimento adicional de R$ 520 milhões aprovado." },
  { id: "demo-aneel-003", agencia: A_ANEEL, n: "003/2024", reuniao: "880ª Reunião Ordinária de Diretoria", data: "2024-05-22",
    interessado: "Light Serviços de Eletricidade S.A.", processo: "ANEEL nº 48500.006891/2024", microtema: "multa", resultado: "Deferido",
    resumo: "Auto de infração à Light SESA por descumprimento do indicador DEC no 1º trimestre de 2024.",
    fundamento: "DEC apurado de 14,3h contra meta regulatória de 12h. Multa de R$ 3,2 milhões aplicada." },
  { id: "demo-aneel-004", agencia: A_ANEEL, n: "004/2024", reuniao: "881ª Reunião Ordinária de Diretoria", data: "2024-07-17",
    interessado: null, processo: "ANEEL nº 48500.009043/2024", microtema: "fiscalizacao", resultado: "Deferido",
    resumo: "Relatório de Fiscalização das Distribuidoras de Energia Elétrica do Nordeste — 1º Ciclo 2024.",
    fundamento: "Conformidade de 91,4% nas distribuidoras inspecionadas. Plano de ação expedido para as não conformes." },
  { id: "demo-aneel-005", agencia: A_ANEEL, n: "005/2024", reuniao: "882ª Reunião Ordinária de Diretoria", data: "2024-09-11",
    interessado: "CEMIG Distribuição S.A.", processo: "ANEEL nº 48500.011278/2024", microtema: "tarifa", resultado: "Deferido",
    resumo: "Homologação da revisão tarifária periódica da CEMIG Distribuição com custo de capital de 8,43% a.a.",
    fundamento: "Revisão quinquenal calculada conforme metodologia do 4º Ciclo de Revisões Tarifárias Periódicas." },
  { id: "demo-aneel-006", agencia: A_ANEEL, n: "006/2024", reuniao: "883ª Reunião Ordinária de Diretoria", data: "2024-10-23",
    interessado: "Celesc Distribuição S.A.", processo: "ANEEL nº 48500.013556/2024", microtema: "reequilibrio", resultado: "Indeferido",
    resumo: "Pedido de reequilíbrio econômico-financeiro da Celesc por impacto das secas severas de 2023.",
    fundamento: "Risco hidrológico é alocado ao setor elétrico pela regulamentação. Pedido não fundamenta desequilíbrio contratual.",
    divergentes: [DN1] },
  { id: "demo-aneel-007", agencia: A_ANEEL, n: "007/2025", reuniao: "884ª Reunião Ordinária de Diretoria", data: "2025-01-15",
    interessado: "Energisa Minas-Rio Distribuidora S.A.", processo: "ANEEL nº 48500.000892/2025", microtema: "contrato", resultado: "Deferido",
    resumo: "Aprovação do 1º Aditivo ao Contrato de Concessão da Energisa Minas-Rio, incorporando novos municípios.",
    fundamento: "Expansão em conformidade com a Resolução Autorizativa nº 11.234/2024 e Plano de Universalização." },
  { id: "demo-aneel-008", agencia: A_ANEEL, n: "008/2025", reuniao: "885ª Reunião Ordinária de Diretoria", data: "2025-03-12",
    interessado: "Furnas Centrais Elétricas S.A.", processo: "ANEEL nº 48500.002341/2025", microtema: "obras", resultado: "Deferido",
    resumo: "Aprovação do Plano de Obras de Transmissão 2025-2027 para o corredor Minas–Rio–São Paulo.",
    fundamento: "Plano prevê R$ 2,8 bilhões em novas linhas de 500kV, garantindo confiabilidade ao sistema elétrico nacional." },

  // ── ANVISA (Saúde) ────────────────────────────────────────────────────
  { id: "demo-anvisa-001", agencia: A_ANVISA, n: "001/2024", reuniao: "n.º 3041 Ordinária", data: "2024-03-20",
    interessado: "Roche Farma Brasil Ltda.", processo: "ANVISA nº 25351.900101/2024", microtema: "usuario", resultado: "Deferido",
    resumo: "Recurso da Roche Farma contra indeferimento do registro do medicamento Polivy (polatuzumabe vedotina).",
    fundamento: "Reavaliação da evidência clínica confirmou benefício-risco favorável. Registro deferido com monitoramento pós-comercialização obrigatório." },
  { id: "demo-anvisa-002", agencia: A_ANVISA, n: "002/2024", reuniao: "n.º 3042 Ordinária", data: "2024-05-15",
    interessado: "EMS S.A.", processo: "ANVISA nº 25351.900487/2024", microtema: "seguranca", resultado: "Deferido",
    resumo: "Alerta de segurança e recolhimento do lote BT23-041 do antibiótico Cefalexina 500mg por contaminação.",
    fundamento: "Análise microbiológica confirmou Bacillus cereus acima do limite aceitável. Recolhimento voluntário aprovado." },
  { id: "demo-anvisa-003", agencia: A_ANVISA, n: "003/2024", reuniao: "n.º 3043 Ordinária", data: "2024-07-24",
    interessado: "Pfizer Brasil Ltda.", processo: "ANVISA nº 25351.900812/2024", microtema: "contrato", resultado: "Deferido",
    resumo: "Aprovação de Termo de Ajustamento de Conduta com a Pfizer Brasil relativo a irregularidades em BPF.",
    fundamento: "TAC prevê R$ 45 milhões em adequações de planta fabril e cronograma de regularização de 18 meses." },
  { id: "demo-anvisa-004", agencia: A_ANVISA, n: "004/2024", reuniao: "n.º 3044 Ordinária", data: "2024-09-18",
    interessado: null, processo: "ANVISA nº 25351.901134/2024", microtema: "fiscalizacao", resultado: "Deferido",
    resumo: "Relatório de Fiscalização de Boas Práticas de Fabricação nas indústrias farmacêuticas da Região Sul.",
    fundamento: "83% das 36 indústrias inspecionadas em conformidade plena. Plano de ação expedido para os demais." },
  { id: "demo-anvisa-005", agencia: A_ANVISA, n: "005/2024", reuniao: "n.º 3045 Ordinária", data: "2024-11-06",
    interessado: "Eurofarma Laboratórios S.A.", processo: "ANVISA nº 25351.901478/2024", microtema: "seguranca", resultado: "Indeferido",
    resumo: "Pedido de cancelamento de alerta de segurança sobre suplemento alimentar da Eurofarma.",
    fundamento: "Evidências apresentadas insuficientes para reverter a classificação de risco. Alerta de segurança mantido.",
    divergentes: [DV1] },
  { id: "demo-anvisa-006", agencia: A_ANVISA, n: "006/2025", reuniao: "n.º 3046 Ordinária", data: "2025-01-29",
    interessado: "Medley Farmacêutica Ltda.", processo: "ANVISA nº 25351.900089/2025", microtema: "usuario", resultado: "Deferido",
    resumo: "Aprovação do Programa de Acesso Expandido ao Dupixent (dupilumabe) para dermatite atópica grave.",
    fundamento: "Critérios de elegibilidade aprovados. Programa beneficia estimados 15.000 pacientes sem acesso ao tratamento padrão." },
  { id: "demo-anvisa-007", agencia: A_ANVISA, n: "007/2025", reuniao: "n.º 3047 Ordinária", data: "2025-03-19",
    interessado: null, processo: "ANVISA nº 25351.900312/2025", microtema: "contrato", resultado: "Deferido",
    resumo: "Aprovação do Protocolo de Vigilância Pós-Comercialização de medicamentos de alto risco registrados em 2024.",
    fundamento: "Protocolo alinha a ANVISA às diretrizes OMS para farmacovigilância ativa. Implementação em 90 dias." },
];

// ─── demoData ─────────────────────────────────────────────────────────────
export const demoData = {
  agencias() {
    return [
      { id: A_ARTESP, sigla: "ARTESP", nome: "Agência de Transporte do Estado de SP",
        nome_completo: "Agência Reguladora de Serviços Públicos Delegados de Transporte do Estado de São Paulo",
        ativo: true, created_at: "2020-01-10T10:00:00Z" },
      { id: A_ANEEL, sigla: "ANEEL", nome: "Agência Nacional de Energia Elétrica",
        nome_completo: "Agência Nacional de Energia Elétrica",
        ativo: true, created_at: "2020-01-10T10:00:00Z" },
      { id: A_ANVISA, sigla: "ANVISA", nome: "Agência Nacional de Vigilância Sanitária",
        nome_completo: "Agência Nacional de Vigilância Sanitária",
        ativo: true, created_at: "2020-01-10T10:00:00Z" },
    ];
  },

  diretores() {
    return [
      { id: DA1, nome: "Carlos Eduardo Mendonça", agencia_id: A_ARTESP, cargo: "Diretor-Presidente", needs_review: false, ativo: true, created_at: "2020-01-10T10:00:00Z" },
      { id: DA2, nome: "Fernanda Luz Ribeiro",    agencia_id: A_ARTESP, cargo: "Diretora",           needs_review: false, ativo: true, created_at: "2021-03-10T10:00:00Z" },
      { id: DA3, nome: "Rodrigo Alves Correia",   agencia_id: A_ARTESP, cargo: "Diretor",            needs_review: false, ativo: true, created_at: "2020-07-22T10:00:00Z" },
      { id: DN1, nome: "Sandoval Feitosa Filho",  agencia_id: A_ANEEL,  cargo: "Diretor-Geral",      needs_review: false, ativo: true, created_at: "2019-06-01T10:00:00Z" },
      { id: DN2, nome: "Maria Vitória Campos",    agencia_id: A_ANEEL,  cargo: "Diretora",           needs_review: false, ativo: true, created_at: "2021-04-15T10:00:00Z" },
      { id: DN3, nome: "José Luís Schiffer",      agencia_id: A_ANEEL,  cargo: "Diretor",            needs_review: false, ativo: true, created_at: "2022-02-01T10:00:00Z" },
      { id: DV1, nome: "Ana Beatriz Mendes",      agencia_id: A_ANVISA, cargo: "Diretora-Presidente",needs_review: false, ativo: true, created_at: "2020-09-01T10:00:00Z" },
      { id: DV2, nome: "Roberto Santos Lima",     agencia_id: A_ANVISA, cargo: "Diretor",            needs_review: false, ativo: true, created_at: "2021-11-01T10:00:00Z" },
      { id: DV3, nome: "Cristiane Prado",         agencia_id: A_ANVISA, cargo: "Diretora",           needs_review: false, ativo: true, created_at: "2022-05-01T10:00:00Z" },
    ];
  },

  mandatos() {
    return [
      { id: "demo-m-1", diretor_id: DA1, diretor_nome: "Carlos Eduardo Mendonça", cargo: "Diretor-Presidente", agencia_id: A_ARTESP, data_inicio: "2024-01-15", data_fim: "2028-01-14", status: "Ativo" as const },
      { id: "demo-m-2", diretor_id: DA2, diretor_nome: "Fernanda Luz Ribeiro",    cargo: "Diretora",           agencia_id: A_ARTESP, data_inicio: "2023-03-10", data_fim: "2027-03-09", status: "Ativo" as const },
      { id: "demo-m-3", diretor_id: DA3, diretor_nome: "Rodrigo Alves Correia",   cargo: "Diretor",            agencia_id: A_ARTESP, data_inicio: "2022-07-22", data_fim: "2026-07-21", status: "Ativo" as const },
      { id: "demo-m-4", diretor_id: DN1, diretor_nome: "Sandoval Feitosa Filho",  cargo: "Diretor-Geral",      agencia_id: A_ANEEL,  data_inicio: "2023-06-01", data_fim: "2027-05-31", status: "Ativo" as const },
      { id: "demo-m-5", diretor_id: DN2, diretor_nome: "Maria Vitória Campos",    cargo: "Diretora",           agencia_id: A_ANEEL,  data_inicio: "2021-04-15", data_fim: "2025-04-14", status: "Ativo" as const },
      { id: "demo-m-6", diretor_id: DN3, diretor_nome: "José Luís Schiffer",      cargo: "Diretor",            agencia_id: A_ANEEL,  data_inicio: "2022-02-01", data_fim: "2026-01-31", status: "Ativo" as const },
      { id: "demo-m-7", diretor_id: DV1, diretor_nome: "Ana Beatriz Mendes",      cargo: "Diretora-Presidente",agencia_id: A_ANVISA, data_inicio: "2024-09-01", data_fim: "2028-08-31", status: "Ativo" as const },
      { id: "demo-m-8", diretor_id: DV2, diretor_nome: "Roberto Santos Lima",     cargo: "Diretor",            agencia_id: A_ANVISA, data_inicio: "2021-11-01", data_fim: "2025-10-31", status: "Ativo" as const },
      { id: "demo-m-9", diretor_id: DV3, diretor_nome: "Cristiane Prado",         cargo: "Diretora",           agencia_id: A_ANVISA, data_inicio: "2022-05-01", data_fim: "2026-04-30", status: "Ativo" as const },
    ];
  },

  // Aceita agencia_id para filtrar — retorna tudo se omitido
  overview(agencia_id?: string | null) {
    const rows = agencia_id ? DELIBERACOES_RAW.filter((d) => d.agencia === agencia_id) : DELIBERACOES_RAW;
    const total = rows.length;
    const deferidos = rows.filter((d) => d.resultado === "Deferido").length;
    const indeferidos = rows.filter((d) => d.resultado === "Indeferido").length;
    const dates = new Set(rows.map((d) => d.data));
    const byTema = new Map<string, number>();
    for (const d of rows) byTema.set(d.microtema, (byTema.get(d.microtema) ?? 0) + 1);
    const topMicrotema = byTema.size > 0 ? [...byTema.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
    return {
      total_deliberacoes: total,
      deferidos,
      indeferidos,
      sem_resultado: 0,
      taxa_deferimento: total > 0 ? ((deferidos / total) * 100).toFixed(1) : "0",
      reunioes_unicas: dates.size,
      avg_confidence: 0.85,
      top_microtema: topMicrotema,
    };
  },

  microtemas(agencia_id?: string | null) {
    const rows = agencia_id ? DELIBERACOES_RAW.filter((d) => d.agencia === agencia_id) : DELIBERACOES_RAW;
    const stats = new Map<string, { total: number; deferido: number; indeferido: number }>();
    for (const d of rows) {
      if (!stats.has(d.microtema)) stats.set(d.microtema, { total: 0, deferido: 0, indeferido: 0 });
      const s = stats.get(d.microtema)!;
      s.total++;
      if (d.resultado === "Deferido") s.deferido++;
      else s.indeferido++;
    }
    return [...stats.entries()]
      .map(([microtema, s]) => ({
        microtema, total: s.total, deferido: s.deferido, indeferido: s.indeferido,
        pct_deferido: s.total > 0 ? (s.deferido / s.total) * 100 : 0,
        pct_indeferido: s.total > 0 ? (s.indeferido / s.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },

  microtemasEvolution(agencia_id?: string | null) {
    const rows = agencia_id ? DELIBERACOES_RAW.filter((d) => d.agencia === agencia_id) : DELIBERACOES_RAW;
    const groups = new Map<string, Map<string, number>>();
    for (const d of rows) {
      const period = d.data.slice(0, 7);
      if (!groups.has(period)) groups.set(period, new Map());
      const pm = groups.get(period)!;
      pm.set(d.microtema, (pm.get(d.microtema) ?? 0) + 1);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, temas]) => ({ period, ...Object.fromEntries(temas) }));
  },

  // Hardcoded para evitar recalcular votos a partir do zero.
  // Valores matematicamente consistentes com _buildVotos.
  diretoresOverview(agencia_id?: string | null) {
    const all = [
      { diretor_id: DA1, diretor_nome: "Carlos Eduardo Mendonça", agencia: A_ARTESP, total: 10, favoravel: 8,  desfavoravel: 2, divergente: 0, pct_favor: 80.0 },
      { diretor_id: DA2, diretor_nome: "Fernanda Luz Ribeiro",    agencia: A_ARTESP, total: 10, favoravel: 9,  desfavoravel: 1, divergente: 1, pct_favor: 90.0 },
      { diretor_id: DA3, diretor_nome: "Rodrigo Alves Correia",   agencia: A_ARTESP, total: 10, favoravel: 9,  desfavoravel: 1, divergente: 1, pct_favor: 90.0 },
      { diretor_id: DN1, diretor_nome: "Sandoval Feitosa Filho",  agencia: A_ANEEL,  total: 8,  favoravel: 8,  desfavoravel: 0, divergente: 1, pct_favor: 100.0 },
      { diretor_id: DN2, diretor_nome: "Maria Vitória Campos",    agencia: A_ANEEL,  total: 8,  favoravel: 7,  desfavoravel: 1, divergente: 0, pct_favor: 87.5 },
      { diretor_id: DN3, diretor_nome: "José Luís Schiffer",      agencia: A_ANEEL,  total: 8,  favoravel: 7,  desfavoravel: 1, divergente: 0, pct_favor: 87.5 },
      { diretor_id: DV1, diretor_nome: "Ana Beatriz Mendes",      agencia: A_ANVISA, total: 7,  favoravel: 7,  desfavoravel: 0, divergente: 1, pct_favor: 100.0 },
      { diretor_id: DV2, diretor_nome: "Roberto Santos Lima",     agencia: A_ANVISA, total: 7,  favoravel: 6,  desfavoravel: 1, divergente: 0, pct_favor: 85.7 },
      { diretor_id: DV3, diretor_nome: "Cristiane Prado",         agencia: A_ANVISA, total: 7,  favoravel: 6,  desfavoravel: 1, divergente: 0, pct_favor: 85.7 },
    ];
    const filtered = agencia_id ? all.filter((d) => d.agencia === agencia_id) : all;
    return filtered.map(({ agencia: _, ...rest }) => rest).sort((a, b) => b.total - a.total);
  },

  reunioesCalendar(agencia_id?: string | null) {
    const rows = agencia_id ? DELIBERACOES_RAW.filter((d) => d.agencia === agencia_id) : DELIBERACOES_RAW;
    const counts = new Map<string, number>();
    for (const d of rows) counts.set(d.data, (counts.get(d.data) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
  },

  reunioesStats(agencia_id?: string | null) {
    const rows = agencia_id ? DELIBERACOES_RAW.filter((d) => d.agencia === agencia_id) : DELIBERACOES_RAW;
    const byMonth = new Map<string, { total: number; deferido: number; indeferido: number }>();
    for (const d of rows) {
      const period = d.data.slice(0, 7);
      if (!byMonth.has(period)) byMonth.set(period, { total: 0, deferido: 0, indeferido: 0 });
      const s = byMonth.get(period)!;
      s.total++;
      if (d.resultado === "Deferido") s.deferido++;
      else s.indeferido++;
    }
    return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([period, s]) => ({ period, ...s }));
  },

  votacaoMatrix(agencia_id?: string | null) {
    const all = [
      { diretor_id: DA1, diretor_nome: "Carlos Eduardo Mendonça", agencia: A_ARTESP, total: 10, favoravel: 8,  desfavoravel: 2, abstencao: 0, divergente: 0 },
      { diretor_id: DA2, diretor_nome: "Fernanda Luz Ribeiro",    agencia: A_ARTESP, total: 10, favoravel: 9,  desfavoravel: 1, abstencao: 0, divergente: 1 },
      { diretor_id: DA3, diretor_nome: "Rodrigo Alves Correia",   agencia: A_ARTESP, total: 10, favoravel: 9,  desfavoravel: 1, abstencao: 0, divergente: 1 },
      { diretor_id: DN1, diretor_nome: "Sandoval Feitosa Filho",  agencia: A_ANEEL,  total: 8,  favoravel: 8,  desfavoravel: 0, abstencao: 0, divergente: 1 },
      { diretor_id: DN2, diretor_nome: "Maria Vitória Campos",    agencia: A_ANEEL,  total: 8,  favoravel: 7,  desfavoravel: 1, abstencao: 0, divergente: 0 },
      { diretor_id: DN3, diretor_nome: "José Luís Schiffer",      agencia: A_ANEEL,  total: 8,  favoravel: 7,  desfavoravel: 1, abstencao: 0, divergente: 0 },
      { diretor_id: DV1, diretor_nome: "Ana Beatriz Mendes",      agencia: A_ANVISA, total: 7,  favoravel: 7,  desfavoravel: 0, abstencao: 0, divergente: 1 },
      { diretor_id: DV2, diretor_nome: "Roberto Santos Lima",     agencia: A_ANVISA, total: 7,  favoravel: 6,  desfavoravel: 1, abstencao: 0, divergente: 0 },
      { diretor_id: DV3, diretor_nome: "Cristiane Prado",         agencia: A_ANVISA, total: 7,  favoravel: 6,  desfavoravel: 1, abstencao: 0, divergente: 0 },
    ];
    const filtered = agencia_id ? all.filter((d) => d.agencia === agencia_id) : all;
    return filtered.map(({ agencia: _, ...rest }) => rest).sort((a, b) => b.total - a.total);
  },

  votacaoDistribution(agencia_id?: string | null) {
    // 75 votos totais: 67 Favoravel, 8 Desfavoravel
    // Por agência: ARTESP 26F+4D, ANEEL 22F+2D, ANVISA 19F+2D
    if (agencia_id === A_ARTESP) return [
      { tipo_voto: "Favoravel", count: 26, pct: "86.7" },
      { tipo_voto: "Desfavoravel", count: 4, pct: "13.3" },
    ];
    if (agencia_id === A_ANEEL) return [
      { tipo_voto: "Favoravel", count: 22, pct: "91.7" },
      { tipo_voto: "Desfavoravel", count: 2, pct: "8.3" },
    ];
    if (agencia_id === A_ANVISA) return [
      { tipo_voto: "Favoravel", count: 19, pct: "90.5" },
      { tipo_voto: "Desfavoravel", count: 2, pct: "9.5" },
    ];
    return [
      { tipo_voto: "Favoravel",    count: 67, pct: "89.3" },
      { tipo_voto: "Desfavoravel", count: 8,  pct: "10.7" },
    ];
  },

  votacaoFidelidade(agencia_id?: string | null) {
    const all = [
      { diretor_id: DA1, diretor_nome: "Carlos Eduardo Mendonça", agencia: A_ARTESP, total_votos: 10, votos_nominais: 2, votos_divergentes: 0, taxa_fidelidade: "100.0" },
      { diretor_id: DA2, diretor_nome: "Fernanda Luz Ribeiro",    agencia: A_ARTESP, total_votos: 10, votos_nominais: 2, votos_divergentes: 1, taxa_fidelidade: "90.0" },
      { diretor_id: DA3, diretor_nome: "Rodrigo Alves Correia",   agencia: A_ARTESP, total_votos: 10, votos_nominais: 2, votos_divergentes: 1, taxa_fidelidade: "90.0" },
      { diretor_id: DN1, diretor_nome: "Sandoval Feitosa Filho",  agencia: A_ANEEL,  total_votos: 8,  votos_nominais: 1, votos_divergentes: 1, taxa_fidelidade: "87.5" },
      { diretor_id: DN2, diretor_nome: "Maria Vitória Campos",    agencia: A_ANEEL,  total_votos: 8,  votos_nominais: 1, votos_divergentes: 0, taxa_fidelidade: "100.0" },
      { diretor_id: DN3, diretor_nome: "José Luís Schiffer",      agencia: A_ANEEL,  total_votos: 8,  votos_nominais: 1, votos_divergentes: 0, taxa_fidelidade: "100.0" },
      { diretor_id: DV1, diretor_nome: "Ana Beatriz Mendes",      agencia: A_ANVISA, total_votos: 7,  votos_nominais: 1, votos_divergentes: 1, taxa_fidelidade: "85.7" },
      { diretor_id: DV2, diretor_nome: "Roberto Santos Lima",     agencia: A_ANVISA, total_votos: 7,  votos_nominais: 1, votos_divergentes: 0, taxa_fidelidade: "100.0" },
      { diretor_id: DV3, diretor_nome: "Cristiane Prado",         agencia: A_ANVISA, total_votos: 7,  votos_nominais: 1, votos_divergentes: 0, taxa_fidelidade: "100.0" },
    ];
    const filtered = agencia_id ? all.filter((d) => d.agencia === agencia_id) : all;
    return filtered.map(({ agencia: _, ...rest }) => rest);
  },

  deliberacoes(params?: {
    page?: number; limit?: number; agencia_id?: string;
    microtema?: string; resultado?: string; search?: string; year?: string;
  }) {
    const page  = params?.page  ?? 1;
    const limit = params?.limit ?? 20;

    let items = DELIBERACOES_RAW.map((d) => ({
      id: d.id,
      agencia_id: d.agencia,
      numero_deliberacao: d.n,
      reuniao_ordinaria: d.reuniao,
      data_reuniao: d.data,
      interessado: d.interessado,
      processo: d.processo,
      microtema: d.microtema,
      resultado: d.resultado,
      pauta_interna: d.interessado === null,
      resumo_pleito: d.resumo,
      fundamento_decisao: d.fundamento,
      extraction_confidence: 0.85,
      auto_classified: true,
      created_at: `${d.data}T10:00:00Z`,
      votos: _buildVotos(d),
    }));

    // Filtros
    if (params?.agencia_id) items = items.filter((d) => d.agencia_id === params.agencia_id);
    if (params?.microtema)   items = items.filter((d) => d.microtema === params.microtema);
    if (params?.resultado)   items = items.filter((d) => d.resultado === params.resultado);
    if (params?.year)        items = items.filter((d) => d.data_reuniao.startsWith(params.year!));
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((d) =>
        d.interessado?.toLowerCase().includes(q) ||
        d.processo?.toLowerCase().includes(q) ||
        d.numero_deliberacao?.toLowerCase().includes(q)
      );
    }

    // Ordenar por data decrescente
    items.sort((a, b) => b.data_reuniao.localeCompare(a.data_reuniao));

    const total  = items.length;
    const offset = (page - 1) * limit;
    return { data: items.slice(offset, offset + limit), total, page, limit, pages: Math.ceil(total / limit) };
  },

  deliberacaoById(id: string) {
    const raw = DELIBERACOES_RAW.find((d) => d.id === id);
    if (!raw) return null;
    return {
      id: raw.id, agencia_id: raw.agencia, numero_deliberacao: raw.n,
      reuniao_ordinaria: raw.reuniao, data_reuniao: raw.data,
      interessado: raw.interessado, processo: raw.processo,
      microtema: raw.microtema, resultado: raw.resultado,
      pauta_interna: raw.interessado === null,
      resumo_pleito: raw.resumo, fundamento_decisao: raw.fundamento,
      extraction_confidence: 0.85, auto_classified: true,
      created_at: `${raw.data}T10:00:00Z`,
      votos: _buildVotos(raw),
    };
  },

  uploadDemo(filenames: string[]) {
    return {
      total: filenames.length, queued: 0, rejected: filenames.length,
      results: filenames.map((filename) => ({
        filename, job_id: null, status: "rejected" as const,
        message: "Upload desabilitado no modo demo. Configure o Supabase para processar PDFs reais.",
      })),
    };
  },
};

// ─── Helper: constrói votos de uma deliberação ────────────────────────────
function _buildVotos(d: DelRaw) {
  const dirs = AGENCY_DIRS[d.agencia] ?? [];
  const isIndeferido = d.resultado === "Indeferido";
  const divergentes = d.divergentes ?? [];
  return dirs.map((dir, vi) => {
    const isDivergente = isIndeferido && divergentes.includes(dir.id);
    // Se indeferido: maioria vota Desfavoravel; divergentes votam Favoravel
    const tipo_voto = isIndeferido
      ? (isDivergente ? "Favoravel" : "Desfavoravel")
      : "Favoravel";
    return {
      id: `${d.id}-v${vi + 1}`,
      deliberacao_id: d.id,
      diretor_id: dir.id,
      diretor_nome: dir.nome,
      tipo_voto,
      is_divergente: isDivergente,
      is_nominal: isIndeferido,
    };
  });
}
