/**
 * nlp-extractor.ts
 * Extrai campos estruturados de texto de deliberações usando regex.
 * Suporta o padrão real das deliberações ARTESP:
 *   - Verbos decisórios: RATIFICA, APROVA, RECOMENDA, DETERMINA, AUTORIZA
 *   - Assinaturas de diretores em bloco ao final do documento
 *   - Campo "Assunto:" presente em todas as deliberações
 * Mantém retrocompatibilidade com padrão DEFERIDO/INDEFERIDO de outras agências.
 */

// ─── Regex patterns ────────────────────────────────────────────────────────
const RE_DELIBERACAO = /DELIBERA[ÇC][AÃ]O\s*N[ºo°]?\s*([\d\.]+)/gi;
const RE_REUNIAO     = /(\d{3,4})[ªa°º]?\s*(?:Reuni[aã]o\s*)?(?:Ordin[aá]ria|Extraordin[aá]ria)/gi;
const RE_PROCESSO    = /(?:SEI[!]?\s*n[ºo°°]?|Processo\s*(?:SEI)?\s*n[ºo°°]?)\s*([\d\.\/\-]+)/gi;
const RE_INTERESSADO = /(?:Interessado[:\s]+|Requerente[:\s]+|Empresa[:\s]+)([^\n]{3,100})/gi;
const RE_ASSUNTO     = /Assunto[:\s]+([^\n]{3,300})/gi;

// Captura verbos de decisão reais das deliberações brasileiras.
// Prioridade de normalização definida em normalizeResultado().
const RE_RESULTADO = /\b(DEFERIDO|INDEFERIDO|DEFERIMENTO|INDEFERIMENTO|PARCIALMENTE\s*DEFERIDO|RETIRADO\s*DE\s*PAUTA|RATIFICA(?:DO)?|APROVA(?:DO)?(?:\s*COM\s*RESSALVAS)?|RECOMENDA(?:DO)?|DETERMINA(?:DO)?|AUTORIZA(?:DO)?)\b/gi;

// Unanimidade — qualquer das frases comuns em deliberações brasileiras
const RE_UNANIMIDADE = /(?:por\s+unanimidade(?:\s+d[eo]s?\s+(?:votos?|presentes?))?|unanimidade\s+d[eo]s?\s+votos?|unanimidade\s+d[eo]s?\s+presentes?|aprovad[oa]\s+(?:pelos?\s+presentes?\s+)?por\s+unanimidade)/gi;

// Voto dissidente / divergente — extrai o nome do diretor que votou contra
const RE_VOTO_DISSIDENTE =
  /(?:pelo\s+voto\s+(?:dissidente|divergente|contrário)\s+d[oa]?\s+(?:Diretor[a]?\s+)?|Diretor[a]?\s+\S+\s+votou?\s+(?:de\s+forma\s+)?(?:contrári[ao]|dissidente|divergente)[,\s]+)((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s+){1,5})/gi;

// ─── Datas ─────────────────────────────────────────────────────────────────
const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4,
  maio: 5, junho: 6, julho: 7, agosto: 8,
  setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};
const RE_DATA_EXTENSO  = /(\d{1,2})\s+de\s+([a-záéíóúâêôãõçàü]+)\s+de\s+(\d{4})/gi;
const RE_DATA_NUMERICA = /(\d{2})\/(\d{2})\/(\d{4})/g;

// ─── Extração de nomes de diretores ───────────────────────────────────────
// Padrões A/B/C: contexto de voto em frases narrativas
const RE_VOTO_CONTEXTO = [
  /(?:Diretor[a]?\s+|Conselheiro[a]?\s+)((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s*){2,5})(?:votou|vot[ao]|manifestou)/gi,
  /(?:voto\s+d[oa]\s+(?:Diretor[a]?\s+|Conselheiro[a]?\s+))((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s*){2,5})/gi,
  /\b((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s+){1,4})(?:–|-)\s*(?:Favorável|Contrári[ao]|Favoravel|Abstenção|Ausente)/gi,
];

// Pattern D extendido: captura nome E direção do voto para split favor/contra
const RE_VOTO_DIRECAO =
  /\b((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s+){1,4})(?:–|-)\s*(Favor[aá]vel|Contr[aá]ri[ao]|Absten[çc][aã]o|Ausente)/gi;

// Número ordinal da reunião — apenas o dígito "1176"
const RE_NUMERO_REUNIAO = /(\d{3,4})[ªa°º]?\s*Reuni[aã]o/gi;

// Padrão D: bloco de assinatura em Title Case — "Nome Completo\nDiretor-Presidente"
const RE_ASSINATURA = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü][a-záéíóúâêôãõçàü\s]+)\s*\n\s*(?:Diretor(?:-Presidente)?|Diretora(?:-Presidente)?|Conselheiro(?:-Presidente)?|Conselheira|Presidente)/gm;

// Padrão E: bloco de assinatura ARTESP em CAIXA ALTA — "NOME COMPLETO\nDiretor-Presidente"
// Necessário porque deliberações ARTESP usam nomes em maiúsculas no rodapé.
const RE_ASSINATURA_CAPS = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ]{2}[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ\s]+)\s*\n\s*(?:Diretor(?:-Presidente)?|Diretora(?:-Presidente)?|Conselheiro(?:-Presidente)?|Conselheira|Presidente)/gm;

// ─── Utilitários ───────────────────────────────────────────────────────────
function firstMatch(text: string, pattern: RegExp, group = 1): string | null {
  pattern.lastIndex = 0;
  const match = pattern.exec(text);
  return match ? match[group].trim() : null;
}

function allMatches(text: string, pattern: RegExp, group = 1): string[] {
  pattern.lastIndex = 0;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    results.push(match[group].trim());
  }
  return results;
}

function parseOneDateExtenso(match: RegExpExecArray): string | null {
  const day     = parseInt(match[1], 10);
  const mesNome = match[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const year    = parseInt(match[3], 10);
  const month   = MESES[mesNome];
  if (!month || day < 1 || day > 31 || year < 1990 || year > 2099) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDataExtenso(text: string): string | null {
  // Primeiro: busca data próxima a contextos de reunião (mais confiável)
  const RE_DATA_REUNIAO_CTX = /(?:Reuni[aã]o|realizada?\s+em|data\s+da\s+reuni[aã]o|São\s+Paulo,?)\s*[,:]?\s*(\d{1,2})\s+de\s+([a-záéíóúâêôãõçàü]+)\s+de\s+(\d{4})/gi;
  RE_DATA_REUNIAO_CTX.lastIndex = 0;
  let m = RE_DATA_REUNIAO_CTX.exec(text);
  if (m) {
    const result = parseOneDateExtenso([m[0], m[1], m[2], m[3]] as unknown as RegExpExecArray);
    if (result) return result;
  }

  // Fallback: primeira data em extenso encontrada no documento
  RE_DATA_EXTENSO.lastIndex = 0;
  m = RE_DATA_EXTENSO.exec(text);
  if (!m) return null;
  return parseOneDateExtenso(m);
}

function parseDataNumerica(text: string): string | null {
  RE_DATA_NUMERICA.lastIndex = 0;
  const match = RE_DATA_NUMERICA.exec(text);
  if (!match) return null;
  const day   = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year  = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1990 || year > 2099) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeResultado(raw: string): string | null {
  const upper = raw.toUpperCase().replace(/\s+/g, " ").trim();
  // Verificar os padrões mais específicos primeiro para evitar falsos positivos
  if (upper.includes("PARCIALMENTE"))   return "Parcialmente Deferido";
  if (upper.includes("RETIRADO"))       return "Retirado de Pauta";
  if (upper.includes("INDEFERIDO") || upper.includes("INDEFERIMENTO")) return "Indeferido";
  if (upper.includes("DEFERIDO")   || upper.includes("DEFERIMENTO"))   return "Deferido";
  // Verbos de decisão usados nas deliberações ARTESP e similares
  if (upper.startsWith("RATIFICA"))  return "Ratificado";
  if (upper.includes("RESSALVAS"))   return "Aprovado com Ressalvas";
  if (upper.startsWith("APROVA"))    return "Aprovado";
  if (upper.startsWith("RECOMENDA")) return "Recomendado";
  if (upper.startsWith("DETERMINA")) return "Determinado";
  if (upper.startsWith("AUTORIZA"))  return "Autorizado";
  return null;
}

// ─── Tipo de retorno ───────────────────────────────────────────────────────
export interface ExtractedFields {
  numero_deliberacao: string | null;
  reuniao_ordinaria: string | null;
  numero_reuniao: string | null;    // apenas o número ordinal "1176"
  data_reuniao: string | null;      // ISO: "YYYY-MM-DD"
  interessado: string | null;
  processo: string | null;
  assunto: string | null;           // campo "Assunto:" das deliberações ARTESP
  resultado: string | null;
  pauta_interna: boolean;
  resumo_pleito: string | null;
  fundamento_decisao: string | null;
  nomes_votacao: string[];          // todos os nomes (compatibilidade)
  nomes_votacao_favor: string[];    // nomes que votaram a favor
  nomes_votacao_contra: string[];   // nomes que votaram contra/abstenção
  signatarios: string[];            // diretores identificados no bloco de assinatura
  unanimidade_detectada: boolean;   // true se "por unanimidade" encontrado no texto
}

// ─── Extração principal ───────────────────────────────────────────────────
export function extractFields(text: string): ExtractedFields {
  const numero_deliberacao = firstMatch(text, RE_DELIBERACAO);
  const reuniao_ordinaria  = firstMatch(text, RE_REUNIAO);
  const interessado        = firstMatch(text, RE_INTERESSADO);
  const processo           = firstMatch(text, RE_PROCESSO);
  const assunto            = firstMatch(text, RE_ASSUNTO);

  // Data: tenta extenso primeiro ("12 de janeiro de 2026"), depois numérico
  const data_reuniao = parseDataExtenso(text) ?? parseDataNumerica(text);

  // Resultado: pega o verbo/estado mais frequente no documento
  const resultadoRaw = allMatches(text, RE_RESULTADO);
  let resultado: string | null = null;
  if (resultadoRaw.length > 0) {
    const freq = new Map<string, number>();
    for (const r of resultadoRaw) {
      const norm = normalizeResultado(r);
      if (norm) freq.set(norm, (freq.get(norm) ?? 0) + 1);
    }
    if (freq.size > 0) {
      resultado = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
  }
  // Fallback: "unanimidade de votos" → aprovação implícita
  if (!resultado) {
    RE_UNANIMIDADE.lastIndex = 0;
    if (RE_UNANIMIDADE.exec(text)) resultado = "Aprovado por Unanimidade";
  }

  // Pauta interna: keywords administrativas ou ausência de interessado externo
  const PAUTA_INTERNA_KEYWORDS = [
    "pauta interna", "expediente interno", "assunto administrativo",
    "remuneração", "recursos humanos",
    "designação de empregado", "indicação para substituição",
    "cargo em comissão de comando", "empregado/servidor",
  ];
  const textLower = text.toLowerCase();
  const pauta_interna =
    !interessado ||
    PAUTA_INTERNA_KEYWORDS.some((kw) => textLower.includes(kw));

  // Resumo do pleito
  // Captura o parágrafo completo iniciado por marcadores comuns em deliberações brasileiras.
  // Usa \n\n ou fim de documento como delimitador de parágrafo (sem lookahead agressivo \n[A-Z]).
  const RE_RESUMO_PRINCIPAL = /(?:Trata-se|Cuida-se|Versa\s+o\s+presente|A\s+presente\s+delibera[çc][aã]o)([\s\S]{30,800}?)(?=\n\n|\f|$)/im;
  const RE_RESUMO_LABEL     = /(?:Resumo[:\s]+|Objeto[:\s]+|Ementa[:\s]+)([\s\S]{20,600}?)(?=\n\n|\f|$)/im;

  let resumo_pleito: string | null = null;
  const resumoMatch = RE_RESUMO_LABEL.exec(text) ?? RE_RESUMO_PRINCIPAL.exec(text);
  if (resumoMatch) {
    // Para RE_RESUMO_PRINCIPAL o grupo 1 é o texto após o marcador; inclui o marcador para contexto
    const raw = resumoMatch[0].trim();
    resumo_pleito = raw.length >= 20 ? raw.slice(0, 800) : null;
  }
  // Fallback: se ainda null, usa o campo assunto como resumo curto
  if (!resumo_pleito && assunto && assunto.length >= 15) {
    resumo_pleito = assunto;
  }

  // Fundamento da decisão
  const RE_FUNDAMENTO = /(?:Fundamento[:\s]+|Em face do exposto|DECIDE[:\s]+|Decide-se[:\s]+)([\s\S]{20,1000}?)(?=\n\n|\n[A-Z]{3}|$)/i;
  const fundamento_decisao = RE_FUNDAMENTO.exec(text)?.[1]?.trim() ?? null;

  // Número da reunião (apenas o ordinal)
  const numero_reuniao = firstMatch(text, RE_NUMERO_REUNIAO);

  // ─── Bloco de assinatura: coleta signatários (title-case + ALL-CAPS) ─────
  const signatarios: string[] = [];

  RE_ASSINATURA.lastIndex = 0;
  let sig: RegExpExecArray | null;
  while ((sig = RE_ASSINATURA.exec(text)) !== null) {
    const nome = sig[1].trim();
    if (nome.length > 4 && !signatarios.includes(nome)) signatarios.push(nome);
  }

  RE_ASSINATURA_CAPS.lastIndex = 0;
  let sigCaps: RegExpExecArray | null;
  while ((sigCaps = RE_ASSINATURA_CAPS.exec(text)) !== null) {
    const nome = sigCaps[1].trim();
    if (nome.length > 4 && !signatarios.includes(nome)) signatarios.push(nome);
  }

  // ─── Unanimidade ──────────────────────────────────────────────────────────
  RE_UNANIMIDADE.lastIndex = 0;
  const unanimidade_detectada = RE_UNANIMIDADE.test(text);

  // ─── Nomes de diretores: contexto + bloco de assinatura ─────────────────
  const nomes_votacao: string[] = [];
  const nomes_votacao_favor: string[] = [];
  const nomes_votacao_contra: string[] = [];

  if (unanimidade_detectada && signatarios.length > 0) {
    // Unanimidade confirmada: todos os signatários votaram a favor.
    // Ainda detectamos dissidências explícitas para sobrescrever se necessário.
    nomes_votacao.push(...signatarios);
    nomes_votacao_favor.push(...signatarios);
  } else {
    // Pattern com direção explícita: "Nome – Favorável/Contrário/Abstenção"
    RE_VOTO_DIRECAO.lastIndex = 0;
    let vd: RegExpExecArray | null;
    while ((vd = RE_VOTO_DIRECAO.exec(text)) !== null) {
      const nome = vd[1].trim();
      const tipo = vd[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (nome.length > 4) {
        if (!nomes_votacao.includes(nome)) nomes_votacao.push(nome);
        if (tipo.startsWith("favor") && !nomes_votacao_favor.includes(nome)) {
          nomes_votacao_favor.push(nome);
        } else if (!tipo.startsWith("favor") && !nomes_votacao_contra.includes(nome)) {
          nomes_votacao_contra.push(nome);
        }
      }
    }

    // Padrões A / B / C (frases narrativas — apenas nomes sem direção)
    for (const pattern of RE_VOTO_CONTEXTO) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        const nome = m[1].trim();
        if (nome.length > 4 && !nomes_votacao.includes(nome)) nomes_votacao.push(nome);
      }
    }

    // Adiciona signatários ao pool geral se ainda não encontrados
    for (const nome of signatarios) {
      if (!nomes_votacao.includes(nome)) nomes_votacao.push(nome);
    }

    // Fallback: sem direção explícita → todos considerados a favor
    if (nomes_votacao_favor.length === 0 && nomes_votacao.length > 0) {
      nomes_votacao_favor.push(...nomes_votacao);
    }
  }

  // ─── Voto dissidente / divergente ─────────────────────────────────────────
  // Move o diretor dissidente de _favor para _contra (se estava em favor)
  RE_VOTO_DISSIDENTE.lastIndex = 0;
  let diss: RegExpExecArray | null;
  while ((diss = RE_VOTO_DISSIDENTE.exec(text)) !== null) {
    const nome = diss[1].trim();
    if (nome.length > 4) {
      if (!nomes_votacao.includes(nome)) nomes_votacao.push(nome);
      // Remove de favor e adiciona a contra
      const idxFavor = nomes_votacao_favor.indexOf(nome);
      if (idxFavor !== -1) nomes_votacao_favor.splice(idxFavor, 1);
      if (!nomes_votacao_contra.includes(nome)) nomes_votacao_contra.push(nome);
    }
  }

  return {
    numero_deliberacao,
    reuniao_ordinaria,
    numero_reuniao,
    data_reuniao,
    interessado,
    processo,
    assunto,
    resultado,
    pauta_interna,
    resumo_pleito,
    fundamento_decisao,
    nomes_votacao,
    nomes_votacao_favor,
    nomes_votacao_contra,
    signatarios,
    unanimidade_detectada,
  };
}

// ─── Confiança de extração ────────────────────────────────────────────────
export function calcConfidence(fields: ExtractedFields): number {
  const checks = [
    fields.numero_deliberacao !== null,
    fields.reuniao_ordinaria !== null,
    fields.data_reuniao !== null,
    fields.interessado !== null,
    fields.processo !== null,
    fields.resultado !== null,
    fields.resumo_pleito !== null,
    fields.fundamento_decisao !== null,
  ];
  return checks.filter(Boolean).length / checks.length;
}
