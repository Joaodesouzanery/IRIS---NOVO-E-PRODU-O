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

// Unanimidade como fallback quando nenhum verbo explícito é encontrado
const RE_UNANIMIDADE = /unanimidade\s+de\s+votos/gi;

// ─── Datas ─────────────────────────────────────────────────────────────────
const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4,
  maio: 5, junho: 6, julho: 7, agosto: 8,
  setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};
const RE_DATA_EXTENSO  = /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/gi;
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

// Padrão D: bloco de assinatura ARTESP — "Nome Completo\nDiretor-Presidente"
// Captura o nome que aparece imediatamente acima do cargo no rodapé do documento.
const RE_ASSINATURA = /^([A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü][a-záéíóúâêôãõçàü\s]+)\s*\n\s*(?:Diretor(?:-Presidente)?|Diretora(?:-Presidente)?|Conselheiro(?:-Presidente)?|Conselheira|Presidente)/gm;

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

function parseDataExtenso(text: string): string | null {
  RE_DATA_EXTENSO.lastIndex = 0;
  const match = RE_DATA_EXTENSO.exec(text);
  if (!match) return null;
  const day   = parseInt(match[1], 10);
  const mesNome = match[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const year  = parseInt(match[3], 10);
  const month = MESES[mesNome];
  if (!month || day < 1 || day > 31 || year < 1990 || year > 2099) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
  const RE_RESUMO = /(?:Trata-se[^.]*\.|Resumo[:\s]+|Objeto[:\s]+)([\s\S]{20,500}?)(?=\n\n|\n[A-Z]|$)/i;
  const resumo_pleito = RE_RESUMO.exec(text)?.[1]?.trim() ?? null;

  // Fundamento da decisão
  const RE_FUNDAMENTO = /(?:Fundamento[:\s]+|Em face do exposto|DECIDE[:\s]+|Decide-se[:\s]+)([\s\S]{20,1000}?)(?=\n\n|\n[A-Z]{3}|$)/i;
  const fundamento_decisao = RE_FUNDAMENTO.exec(text)?.[1]?.trim() ?? null;

  // Número da reunião (apenas o ordinal)
  const numero_reuniao = firstMatch(text, RE_NUMERO_REUNIAO);

  // ─── Nomes de diretores: contexto + bloco de assinatura ─────────────────
  const nomes_votacao: string[] = [];
  const nomes_votacao_favor: string[] = [];
  const nomes_votacao_contra: string[] = [];

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

  // Padrão E (bloco de assinatura — padrão ARTESP/SEI)
  RE_ASSINATURA.lastIndex = 0;
  let sig: RegExpExecArray | null;
  while ((sig = RE_ASSINATURA.exec(text)) !== null) {
    const nome = sig[1].trim();
    if (nome.length > 4 && !nomes_votacao.includes(nome)) nomes_votacao.push(nome);
  }

  // Fallback: sem direção explícita → todos considerados a favor (deliberações unânimes)
  if (nomes_votacao_favor.length === 0 && nomes_votacao.length > 0) {
    nomes_votacao_favor.push(...nomes_votacao);
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
