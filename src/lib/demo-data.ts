/**
 * demo-data.ts
 * Dados fictícios da ARTESP para visualização da plataforma sem Supabase.
 * 25 deliberações, 5 diretores, votações realistas.
 * Remova este arquivo quando o Supabase estiver configurado e em produção.
 */

// ─── IDs fixos ────────────────────────────────────────────────────────────
const A1 = "demo-agency-artesp";
const D1 = "demo-dir-1"; // Presidente
const D2 = "demo-dir-2";
const D3 = "demo-dir-3";
const D4 = "demo-dir-4";
const D5 = "demo-dir-5";

// ─── Deliberações ─────────────────────────────────────────────────────────
// Dados calculados: 25 deliberações, 22 Deferido, 3 Indeferido (005, 010, 016)
// Votos: 5 diretores por deliberação = 125 votos totais

const DELIBERACOES_RAW = [
  { n: "001/2024", reuniao: "321", data: "2024-03-13", interessado: "Rota das Bandeiras S.A.", processo: "SEI nº 023.0001/2024", microtema: "tarifa",         resultado: "Deferido",    resumo: "Reajuste tarifário anual de pedágio conforme cláusula contratual 25.2, índice IPCA acumulado de 4,62%.", fundamento: "A revisão tarifária está em conformidade com os termos contratuais e laudos técnicos que atestam o equilíbrio econômico-financeiro da concessão." },
  { n: "002/2024", reuniao: "321", data: "2024-03-13", interessado: "CCR Via Bandeirantes S.A.", processo: "SEI nº 023.0002/2024", microtema: "obras",          resultado: "Deferido",    resumo: "Aprovação do projeto executivo de duplicação do trecho de 20km (km 90 a 110) da SP-348.", fundamento: "O projeto atende às normas técnicas do DNIT, com prazo de execução de 36 meses e valor de R$ 340 milhões." },
  { n: "003/2024", reuniao: "322", data: "2024-04-10", interessado: "Autopista Litoral Sul S.A.", processo: "SEI nº 023.0015/2024", microtema: "multa",          resultado: "Deferido",    resumo: "Aplicação de multa por descumprimento do índice mínimo de qualidade do pavimento (IRI) no trecho km 40 a 55.", fundamento: "Laudo técnico confirma IRI médio de 3,8 contra limite máximo de 2,5 previsto contratualmente. Multa de R$ 1,2 milhão." },
  { n: "004/2024", reuniao: "322", data: "2024-04-10", interessado: "CCR RodoVias S.A.", processo: "SEI nº 023.0018/2024", microtema: "contrato",        resultado: "Deferido",    resumo: "Aprovação do 5º Termo Aditivo ao Contrato de Concessão, prevendo reprogramação do CAPEX para 2024-2026.", fundamento: "O aditivo alinha investimentos às prioridades de mobilidade regional, com acréscimo de R$ 180 milhões em obras de segurança." },
  { n: "005/2024", reuniao: "323", data: "2024-05-08", interessado: "EcoRodovias S.A. (Eco101)", processo: "SEI nº 023.0031/2024", microtema: "reequilibrio",   resultado: "Indeferido",  resumo: "Pedido de reequilíbrio econômico-financeiro alegando impactos de legislação ambiental superveniente.", fundamento: "A ARTESP não reconhece desequilíbrio contratual, pois o risco regulatório ambiental é alocado à concessionária nos termos do edital." },
  { n: "006/2024", reuniao: "323", data: "2024-05-08", interessado: null, processo: "SEI nº 023.0032/2024", microtema: "fiscalizacao",   resultado: "Deferido",    resumo: "Aprovação do Relatório de Fiscalização do 1º Trimestre de 2024, com avaliação de todas as 22 concessões rodoviárias estaduais.", fundamento: "Índice geral de conformidade de 94,3%, acima da meta mínima de 90% prevista no plano de fiscalização." },
  { n: "007/2024", reuniao: "324", data: "2024-06-12", interessado: "Paulo Roberto Machado (Usuário)", processo: "SEI nº 023.0044/2024", microtema: "usuario",          resultado: "Deferido",    resumo: "Recurso de usuário contra cobrança indevida de pedágio na SP-160, Rodovia dos Imigrantes, trecho de emergência.", fundamento: "Verificou-se falha no sistema de isenção para veículos de emergência. Concessionária notificada para ressarcimento e correção." },
  { n: "008/2024", reuniao: "324", data: "2024-06-12", interessado: "CCR SPVias S.A.", processo: "SEI nº 023.0048/2024", microtema: "seguranca",        resultado: "Deferido",    resumo: "Aprovação do Plano de Segurança Viária 2024-2026 para o trecho da SP-070 Campinas–Sorocaba.", fundamento: "O plano contempla instalação de 180 barreiras New Jersey, revitalização de 95% da sinalização horizontal e 12 novos postos SAU." },
  { n: "009/2024", reuniao: "325", data: "2024-07-10", interessado: "CCR ViaOeste S.A.", processo: "SEI nº 023.0056/2024", microtema: "tarifa",         resultado: "Deferido",    resumo: "Revisão tarifária ordinária do pedágio no km 42 da SP-280 (Rodovia Castelo Branco), com reajuste de 5,1%.", fundamento: "Cálculo atuarial confirma manutenção do equilíbrio econômico-financeiro com aplicação do índice estipulado em contrato." },
  { n: "010/2024", reuniao: "325", data: "2024-07-10", interessado: "Autopista Fernão Dias S.A.", processo: "SEI nº 023.0061/2024", microtema: "obras",          resultado: "Indeferido",  resumo: "Pedido de aprovação de viaduto de interligação no km 42 da SP-280, trecho urbano de Barueri, fora do escopo contratual.", fundamento: "O projeto não integra o Programa de Exploração Rodoviária aprovado, cabendo à concessionária apresentar proposta de aditamento." },
  { n: "011/2024", reuniao: "326", data: "2024-08-14", interessado: "Intervias S.A.", processo: "SEI nº 023.0077/2024", microtema: "multa",          resultado: "Deferido",    resumo: "Auto de infração por descumprimento do prazo de manutenção de rodovia (SP-147) em 87 dias corridos.", fundamento: "Reiterada inadimplência contratual. Multa de R$ 850 mil, com prazo de 30 dias para regularização." },
  { n: "012/2024", reuniao: "327", data: "2024-09-11", interessado: "Autoban S.A.", processo: "SEI nº 023.0089/2024", microtema: "contrato",        resultado: "Deferido",    resumo: "Prorrogação contratual da Concessão Anhanguera-Bandeirantes por 5 anos adicionais, com novos investimentos de R$ 2,8 bilhões.", fundamento: "A prorrogação é de interesse público, com cláusulas de desempenho aprimoradas e metas de descarbonização incluídas." },
  { n: "013/2024", reuniao: "327", data: "2024-09-11", interessado: "EcoRodovias S.A.", processo: "SEI nº 023.0092/2024", microtema: "ambiental",       resultado: "Deferido",    resumo: "Aprovação do Programa de Recuperação Ambiental da SP-150 (Via Anchieta), trecho da Serra do Mar.", fundamento: "O programa atende às condicionantes da Licença de Operação CETESB nº 154.820/2023 e ao PRAD aprovado pela SMA." },
  { n: "014/2024", reuniao: "328", data: "2024-10-09", interessado: "Espólio de José Ferreira Lima", processo: "SEI nº 023.0101/2024", microtema: "desapropriacao", resultado: "Deferido",    resumo: "Aprovação de indenização por desapropriação de faixa de domínio na SP-348, km 87 a 91, área de 12.400 m².", fundamento: "Laudo de avaliação aprovado pela ARTESP. Valor de R$ 3,2 milhões, dentro do prazo legal de desapropriação amigável." },
  { n: "015/2024", reuniao: "328", data: "2024-10-09", interessado: "CCR SPVias S.A.", processo: "SEI nº 023.0105/2024", microtema: "reequilibrio",   resultado: "Deferido",    resumo: "Aprovação do reequilíbrio tarifário decorrente da revisão ordinária quinquenal do contrato de concessão.", fundamento: "Auditoria independente validou a planilha de custos e receitas. Ajuste de 3,7% no fluxo de caixa previsto." },
  { n: "016/2024", reuniao: "329", data: "2024-11-13", interessado: "EcoRodovias S.A.", processo: "SEI nº 023.0118/2024", microtema: "fiscalizacao",   resultado: "Indeferido",  resumo: "Notificação por descumprimento de prazo de obras de ampliação de posto de pesagem na BR-116, km 22.", fundamento: "A concessionária não apresentou justificativa técnica adequada para o atraso de 180 dias. Mantida a penalidade contratual." },
  { n: "017/2024", reuniao: "330", data: "2024-12-11", interessado: "Rota Sorocabana S.A.", processo: "SEI nº 023.0131/2024", microtema: "tarifa",         resultado: "Deferido",    resumo: "Revisão tarifária extraordinária da SP-021 (Rodovia Raposo Tavares), km 11 ao 40, em razão de fatos imprevisíveis.", fundamento: "Reconhecido o impacto de decreto municipal que alterou o traçado do acesso à praça de pedágio. Ajuste de 2,1%." },
  { n: "018/2025", reuniao: "331", data: "2025-02-12", interessado: "CCR RodoAnel S.A.", processo: "SEI nº 023.0008/2025", microtema: "obras",          resultado: "Deferido",    resumo: "Aprovação do projeto executivo de alça de acesso no km 38 da SP-330, interligando ao Rodoanel Mário Covas.", fundamento: "O projeto reduz congestionamentos estimados em 40% no trecho urbano de Campinas. Investimento de R$ 67 milhões." },
  { n: "019/2025", reuniao: "331", data: "2025-02-12", interessado: "Rota Sorocabana S.A.", processo: "SEI nº 023.0011/2025", microtema: "contrato",        resultado: "Deferido",    resumo: "Aprovação do 2º Aditivo à Concessão Rota Sorocabana, incluindo obras complementares de drenagem e iluminação.", fundamento: "As obras são necessárias para conformidade com o Plano de Drenagem Urbana do município de Sorocaba." },
  { n: "020/2025", reuniao: "332", data: "2025-03-12", interessado: "Associação Paulista dos Usuários de Rodovias", processo: "SEI nº 023.0019/2025", microtema: "usuario",          resultado: "Deferido",    resumo: "Aprovação de proposta de implantação de sistema de chamada de emergência 24h em todas as concessões estaduais.", fundamento: "A medida reduz o tempo médio de atendimento de 18 para 7 minutos. Custo compartilhado entre concessionárias." },
  { n: "021/2025", reuniao: "333", data: "2025-04-09", interessado: "CCR Via Bandeirantes S.A.", processo: "SEI nº 023.0029/2025", microtema: "tarifa",         resultado: "Deferido",    resumo: "Revisão tarifária ordinária anual da SP-348, com reajuste de 6,2% pelo IPCA-E de referência.", fundamento: "Cálculo atuarial homologado pela Auditoria da ARTESP. Tarifa básica passa de R$ 9,80 para R$ 10,41." },
  { n: "022/2025", reuniao: "334", data: "2025-05-14", interessado: "CCR ViaLeste S.A.", processo: "SEI nº 023.0041/2025", microtema: "multa",          resultado: "Deferido",    resumo: "Auto de infração nº 008/2025 por falha na manutenção de sinalização de advertência no km 22 da SP-070.", fundamento: "Vistoria confirma sinalização deteriorada. Risco à segurança dos usuários. Multa de R$ 340 mil e prazo de 15 dias para correção." },
  { n: "023/2025", reuniao: "335", data: "2025-06-11", interessado: "Triângulo do Sol Auto-Estradas S.A.", processo: "SEI nº 023.0055/2025", microtema: "obras",          resultado: "Deferido",    resumo: "Aprovação do projeto de duplicação da pista Norte da SP-310 (Via Washington Luís), km 178 a 195.", fundamento: "Obra de alto impacto regional. Redução estimada de 30% nos acidentes graves. Investimento de R$ 420 milhões." },
  { n: "024/2025", reuniao: "336", data: "2025-07-09", interessado: "Autoban S.A.", processo: "SEI nº 023.0068/2025", microtema: "contrato",        resultado: "Deferido",    resumo: "Aprovação do Plano de Negócios revisado da Autoban para o período 2025-2030, com investimentos de R$ 4,1 bilhões.", fundamento: "O plano incorpora metas ESG, corredores exclusivos para VLT e implantação de Free Flow nas principais praças." },
  { n: "025/2025", reuniao: "337", data: "2025-08-13", interessado: null, processo: "SEI nº 023.0081/2025", microtema: "seguranca",        resultado: "Deferido",    resumo: "Aprovação do Plano Integrado de Segurança Viária 2025-2027 para todas as rodovias concedidas no Estado de SP.", fundamento: "Meta de redução de 25% nos acidentes fatais até 2027. Investimento total de R$ 890 milhões em infraestrutura de segurança." },
] as const;

// ─── Funções geradoras de dados demo ─────────────────────────────────────

export const demoData = {
  // GET /api/v1/agencias
  agencias() {
    return [
      {
        id: A1,
        sigla: "ARTESP",
        nome: "Agência de Transporte do Estado de São Paulo",
        nome_completo: "Agência Reguladora de Serviços Públicos Delegados de Transporte do Estado de São Paulo",
        ativo: true,
        created_at: "2020-01-10T10:00:00Z",
      },
    ];
  },

  // GET /api/v1/diretores
  diretores() {
    return [
      { id: D1, nome: "Carlos Eduardo Mendonça", agencia_id: A1, cargo: "Presidente", needs_review: false, ativo: true, nome_variantes: [], created_at: "2020-01-10T10:00:00Z" },
      { id: D2, nome: "Fernanda Luz Ribeiro",    agencia_id: A1, cargo: "Diretora",   needs_review: false, ativo: true, nome_variantes: [], created_at: "2021-03-10T10:00:00Z" },
      { id: D3, nome: "Rodrigo Alves Correia",   agencia_id: A1, cargo: "Diretor",    needs_review: false, ativo: true, nome_variantes: [], created_at: "2020-07-22T10:00:00Z" },
      { id: D4, nome: "Beatriz Santos Lima",     agencia_id: A1, cargo: "Diretora",   needs_review: false, ativo: true, nome_variantes: [], created_at: "2022-01-05T10:00:00Z" },
      { id: D5, nome: "Paulo Henrique Vieira",   agencia_id: A1, cargo: "Diretor",    needs_review: false, ativo: true, nome_variantes: [], created_at: "2021-09-01T10:00:00Z" },
    ];
  },

  // GET /api/v1/mandatos
  mandatos() {
    return [
      { id: "demo-m-1", diretor_id: D1, diretor_nome: "Carlos Eduardo Mendonça", cargo: "Presidente", agencia_id: A1, data_inicio: "2024-01-15", data_fim: "2028-01-14", status: "Ativo" },
      { id: "demo-m-2", diretor_id: D2, diretor_nome: "Fernanda Luz Ribeiro",    cargo: "Diretora",   agencia_id: A1, data_inicio: "2023-03-10", data_fim: "2027-03-09", status: "Ativo" },
      { id: "demo-m-3", diretor_id: D3, diretor_nome: "Rodrigo Alves Correia",   cargo: "Diretor",    agencia_id: A1, data_inicio: "2022-07-22", data_fim: "2026-07-21", status: "Ativo" },
      { id: "demo-m-4", diretor_id: D4, diretor_nome: "Beatriz Santos Lima",     cargo: "Diretora",   agencia_id: A1, data_inicio: "2024-01-05", data_fim: "2028-01-04", status: "Ativo" },
      { id: "demo-m-5", diretor_id: D5, diretor_nome: "Paulo Henrique Vieira",   cargo: "Diretor",    agencia_id: A1, data_inicio: "2023-09-01", data_fim: "2027-08-31", status: "Ativo" },
    ];
  },

  // GET /api/v1/dashboard/overview
  overview() {
    return {
      total_deliberacoes: 25,
      deferidos: 22,
      indeferidos: 3,
      sem_resultado: 0,
      taxa_deferimento: "88.0",
      reunioes_unicas: 17,
      avg_confidence: 0.87,
      top_microtema: "tarifa",
    };
  },

  // GET /api/v1/dashboard/microtemas
  microtemas() {
    return [
      { microtema: "tarifa",         total: 4, deferido: 4, indeferido: 0, pct_deferido: 100.0, pct_indeferido: 0.0 },
      { microtema: "obras",          total: 4, deferido: 3, indeferido: 1, pct_deferido: 75.0,  pct_indeferido: 25.0 },
      { microtema: "contrato",       total: 4, deferido: 4, indeferido: 0, pct_deferido: 100.0, pct_indeferido: 0.0 },
      { microtema: "multa",          total: 3, deferido: 3, indeferido: 0, pct_deferido: 100.0, pct_indeferido: 0.0 },
      { microtema: "reequilibrio",   total: 2, deferido: 1, indeferido: 1, pct_deferido: 50.0,  pct_indeferido: 50.0 },
      { microtema: "fiscalizacao",   total: 2, deferido: 1, indeferido: 1, pct_deferido: 50.0,  pct_indeferido: 50.0 },
      { microtema: "usuario",        total: 2, deferido: 2, indeferido: 0, pct_deferido: 100.0, pct_indeferido: 0.0 },
      { microtema: "seguranca",      total: 2, deferido: 2, indeferido: 0, pct_deferido: 100.0, pct_indeferido: 0.0 },
      { microtema: "ambiental",      total: 1, deferido: 1, indeferido: 0, pct_deferido: 100.0, pct_indeferido: 0.0 },
      { microtema: "desapropriacao", total: 1, deferido: 1, indeferido: 0, pct_deferido: 100.0, pct_indeferido: 0.0 },
    ];
  },

  // GET /api/v1/dashboard/microtemas/evolution
  microtemasEvolution() {
    return [
      { period: "2024-03", tarifa: 1, obras: 1 },
      { period: "2024-04", multa: 1, contrato: 1 },
      { period: "2024-05", reequilibrio: 1, fiscalizacao: 1 },
      { period: "2024-06", usuario: 1, seguranca: 1 },
      { period: "2024-07", tarifa: 1, obras: 1 },
      { period: "2024-08", multa: 1 },
      { period: "2024-09", contrato: 1, ambiental: 1 },
      { period: "2024-10", desapropriacao: 1, reequilibrio: 1 },
      { period: "2024-11", fiscalizacao: 1 },
      { period: "2024-12", tarifa: 1 },
      { period: "2025-02", obras: 1, contrato: 1 },
      { period: "2025-03", usuario: 1 },
      { period: "2025-04", tarifa: 1 },
      { period: "2025-05", multa: 1 },
      { period: "2025-06", obras: 1 },
      { period: "2025-07", contrato: 1 },
      { period: "2025-08", seguranca: 1 },
    ];
  },

  // GET /api/v1/dashboard/diretores/overview
  diretoresOverview() {
    return [
      { diretor_id: D1, diretor_nome: "Carlos Eduardo Mendonça", total: 25, favoravel: 23, desfavoravel: 2, divergente: 1, pct_favor: 92.0 },
      { diretor_id: D2, diretor_nome: "Fernanda Luz Ribeiro",    total: 25, favoravel: 23, desfavoravel: 2, divergente: 1, pct_favor: 92.0 },
      { diretor_id: D3, diretor_nome: "Rodrigo Alves Correia",   total: 25, favoravel: 23, desfavoravel: 2, divergente: 1, pct_favor: 92.0 },
      { diretor_id: D4, diretor_nome: "Beatriz Santos Lima",     total: 25, favoravel: 22, desfavoravel: 3, divergente: 0, pct_favor: 88.0 },
      { diretor_id: D5, diretor_nome: "Paulo Henrique Vieira",   total: 25, favoravel: 23, desfavoravel: 2, divergente: 1, pct_favor: 92.0 },
    ];
  },

  // GET /api/v1/dashboard/reunioes/calendar
  reunioesCalendar() {
    const dates = [...new Set(DELIBERACOES_RAW.map((d) => d.data))];
    return dates.map((date) => ({
      date,
      count: DELIBERACOES_RAW.filter((d) => d.data === date).length,
    }));
  },

  // GET /api/v1/dashboard/reunioes/stats
  reunioesStats() {
    const byMonth = new Map<string, { total: number; deferido: number; indeferido: number }>();
    for (const d of DELIBERACOES_RAW) {
      const period = d.data.slice(0, 7);
      if (!byMonth.has(period)) byMonth.set(period, { total: 0, deferido: 0, indeferido: 0 });
      const s = byMonth.get(period)!;
      s.total++;
      if (d.resultado === "Deferido") s.deferido++;
      else if (d.resultado === "Indeferido") s.indeferido++;
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, s]) => ({ period, ...s }));
  },

  // GET /api/v1/votacao/matrix
  votacaoMatrix() {
    return [
      { diretor_id: D1, diretor_nome: "Carlos Eduardo Mendonça", total: 25, favoravel: 23, desfavoravel: 2, abstencao: 0, divergente: 1 },
      { diretor_id: D2, diretor_nome: "Fernanda Luz Ribeiro",    total: 25, favoravel: 23, desfavoravel: 2, abstencao: 0, divergente: 1 },
      { diretor_id: D3, diretor_nome: "Rodrigo Alves Correia",   total: 25, favoravel: 23, desfavoravel: 2, abstencao: 0, divergente: 1 },
      { diretor_id: D4, diretor_nome: "Beatriz Santos Lima",     total: 25, favoravel: 22, desfavoravel: 3, abstencao: 0, divergente: 0 },
      { diretor_id: D5, diretor_nome: "Paulo Henrique Vieira",   total: 25, favoravel: 23, desfavoravel: 2, abstencao: 0, divergente: 1 },
    ];
  },

  // GET /api/v1/votacao/distribution
  votacaoDistribution() {
    return [
      { tipo_voto: "Favoravel",    count: 114, pct: "91.2" },
      { tipo_voto: "Desfavoravel", count: 11,  pct: "8.8" },
    ];
  },

  // GET /api/v1/votacao/fidelidade
  votacaoFidelidade() {
    return [
      { diretor_id: D1, diretor_nome: "Carlos Eduardo Mendonça", total_votos: 25, votos_nominais: 3, votos_divergentes: 1, taxa_fidelidade: "96.0" },
      { diretor_id: D2, diretor_nome: "Fernanda Luz Ribeiro",    total_votos: 25, votos_nominais: 3, votos_divergentes: 1, taxa_fidelidade: "96.0" },
      { diretor_id: D3, diretor_nome: "Rodrigo Alves Correia",   total_votos: 25, votos_nominais: 3, votos_divergentes: 1, taxa_fidelidade: "96.0" },
      { diretor_id: D4, diretor_nome: "Beatriz Santos Lima",     total_votos: 25, votos_nominais: 3, votos_divergentes: 0, taxa_fidelidade: "100.0" },
      { diretor_id: D5, diretor_nome: "Paulo Henrique Vieira",   total_votos: 25, votos_nominais: 3, votos_divergentes: 1, taxa_fidelidade: "96.0" },
    ];
  },

  // GET /api/v1/deliberacoes  (com suporte a filtros básicos)
  deliberacoes(params?: {
    page?: number;
    limit?: number;
    microtema?: string;
    resultado?: string;
    search?: string;
    year?: string;
    pauta_interna?: string;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    let items = DELIBERACOES_RAW.map((d, i) => ({
      id: `demo-del-${String(i + 1).padStart(3, "0")}`,
      agencia_id: A1,
      numero_deliberacao: d.n,
      reuniao_ordinaria: `${d.reuniao}ª Reunião Ordinária`,
      data_reuniao: d.data,
      interessado: d.interessado,
      processo: d.processo,
      microtema: d.microtema,
      resultado: d.resultado,
      pauta_interna: d.interessado === null,
      resumo_pleito: d.resumo,
      fundamento_decisao: d.fundamento,
      extraction_confidence: 0.87 + (i % 5) * 0.02,
      auto_classified: true,
      created_at: `${d.data}T10:00:00Z`,
      votos: _buildVotos(`demo-del-${String(i + 1).padStart(3, "0")}`, i),
    }));

    // Filtros
    if (params?.microtema) items = items.filter((d) => d.microtema === params.microtema);
    if (params?.resultado)  items = items.filter((d) => d.resultado === params.resultado);
    if (params?.year)       items = items.filter((d) => d.data_reuniao.startsWith(params.year!));
    if (params?.pauta_interna !== undefined)
      items = items.filter((d) => String(d.pauta_interna) === params.pauta_interna);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (d) =>
          d.interessado?.toLowerCase().includes(q) ||
          d.processo?.toLowerCase().includes(q) ||
          d.numero_deliberacao?.toLowerCase().includes(q)
      );
    }

    const total = items.length;
    const offset = (page - 1) * limit;
    const sliced = items.slice(offset, offset + limit);

    return {
      data: sliced,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  },

  // GET /api/v1/deliberacoes/[id]
  deliberacaoById(id: string) {
    const paginated = this.deliberacoes({ limit: 100 });
    return paginated.data.find((d) => d.id === id) ?? null;
  },

  // GET /api/v1/upload/batch (demo mode — simula upload sem processar)
  uploadDemo(filenames: string[]) {
    return {
      total: filenames.length,
      queued: 0,
      rejected: filenames.length,
      results: filenames.map((f) => ({
        filename: f,
        job_id: null,
        status: "rejected" as const,
        message: "Upload desabilitado no modo demo. Configure o Supabase para processar PDFs reais.",
      })),
    };
  },
};

// ─── Helper interno: monta votos de uma deliberação ──────────────────────
function _buildVotos(delId: string, index: number) {
  const dirs = [
    { id: D1, nome: "Carlos Eduardo Mendonça" },
    { id: D2, nome: "Fernanda Luz Ribeiro" },
    { id: D3, nome: "Rodrigo Alves Correia" },
    { id: D4, nome: "Beatriz Santos Lima" },
    { id: D5, nome: "Paulo Henrique Vieira" },
  ];

  // Deliberações indeferidas: índices 4, 9, 15 (del 005, 010, 016)
  const isIndeferido = [4, 9, 15].includes(index);
  // Divergentes: Dir-2 no índice 4, Dir-1 no índice 9, Dir-3+Dir-5 no índice 15
  const divergentIds: Record<number, string[]> = {
    4: [D2],
    9: [D1],
    15: [D3, D5],
  };

  return dirs.map((d, vi) => {
    const isDivergente = isIndeferido && (divergentIds[index] ?? []).includes(d.id);
    const tipo_voto = isIndeferido && !isDivergente ? "Desfavoravel" : "Favoravel";
    return {
      id: `${delId}-v${vi + 1}`,
      deliberacao_id: delId,
      diretor_id: d.id,
      diretor_nome: d.nome,
      tipo_voto,
      is_divergente: isDivergente,
      is_nominal: isIndeferido,
    };
  });
}
