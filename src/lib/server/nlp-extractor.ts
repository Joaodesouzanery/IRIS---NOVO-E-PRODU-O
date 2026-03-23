/**
 * nlp-extractor.ts
 * Port exato de worker/app/pipeline/nlp_extractor.py
 * Extrai campos estruturados de texto de deliberações usando regex.
 */

// ─── Regex patterns (idênticos ao Python) ─────────────────────────────────
const RE_DELIBERACAO = /DELIBERA[ÇC][AÃ]O\s*N[ºo°]?\s*([\d\.]+)/gi;
const RE_REUNIAO = /(\d{3,4})[ªa°º]?\s*(?:Reuni[aã]o\s*)?(?:Ordin[aá]ria|Extraordin[aá]ria)/gi;
const RE_PROCESSO = /(?:SEI[!]?\s*n[ºo°°]?|Processo\s*(?:SEI)?\s*n[ºo°°]?)\s*([\d\.\/\-]+)/gi;
const RE_RESULTADO = /\b(DEFERIDO|INDEFERIDO|DEFERIMENTO|INDEFERIMENTO|PARCIALMENTE\s*DEFERIDO|RETIRADO\s*DE\s*PAUTA)\b/gi;
const RE_INTERESSADO = /(?:Interessado[:\s]+|Requerente[:\s]+|Empresa[:\s]+)([^\n]{3,100})/gi;

// Data por extenso: "14 de março de 2023"
const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4,
  maio: 5, junho: 6, julho: 7, agosto: 8,
  setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};
const RE_DATA_EXTENSO = /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/gi;
const RE_DATA_NUMERICA = /(\d{2})\/(\d{2})\/(\d{4})/g;

// Extração de nomes de votação via contexto
// Captura: "Diretor Fulano de Tal votou", "Voto do Diretor Fulano", etc.
const RE_VOTO_CONTEXTO = [
  /(?:Diretor[a]?\s+|Conselheiro[a]?\s+)((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s*){2,5})(?:votou|vot[ao]|manifestou)/gi,
  /(?:voto\s+d[oa]\s+(?:Diretor[a]?\s+|Conselheiro[a]?\s+))((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s*){2,5})/gi,
  /\b((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÀÜ][a-záéíóúâêôãõçàü]+\s+){1,4})(?:–|-)\s*(?:Favorável|Contrári[ao]|Favoravel|Abstenção|Ausente)/gi,
];

// ─── Utilitários ──────────────────────────────────────────────────────────
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

  const day = parseInt(match[1], 10);
  const mesNome = match[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const year = parseInt(match[3], 10);
  const month = MESES[mesNome];

  if (!month || day < 1 || day > 31 || year < 1990 || year > 2099) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDataNumerica(text: string): string | null {
  RE_DATA_NUMERICA.lastIndex = 0;
  const match = RE_DATA_NUMERICA.exec(text);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1990 || year > 2099) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeResultado(raw: string): string | null {
  const upper = raw.toUpperCase().replace(/\s+/g, " ").trim();
  if (upper.includes("PARCIALMENTE")) return "Parcialmente Deferido";
  if (upper.includes("RETIRADO")) return "Retirado de Pauta";
  if (upper.includes("INDEFERIDO") || upper.includes("INDEFERIMENTO")) return "Indeferido";
  if (upper.includes("DEFERIDO") || upper.includes("DEFERIMENTO")) return "Deferido";
  return null;
}

// ─── Tipo de retorno ──────────────────────────────────────────────────────
export interface ExtractedFields {
  numero_deliberacao: string | null;
  reuniao_ordinaria: string | null;
  data_reuniao: string | null;    // ISO date: "YYYY-MM-DD"
  interessado: string | null;
  processo: string | null;
  resultado: string | null;
  pauta_interna: boolean;
  resumo_pleito: string | null;
  fundamento_decisao: string | null;
  nomes_votacao: string[];        // nomes brutos para o name-matcher
}

// ─── Extração principal ───────────────────────────────────────────────────
export function extractFields(text: string): ExtractedFields {
  const numero_deliberacao = firstMatch(text, RE_DELIBERACAO);
  const reuniao_ordinaria = firstMatch(text, RE_REUNIAO);
  const interessado = firstMatch(text, RE_INTERESSADO);
  const processo = firstMatch(text, RE_PROCESSO);

  // Data: tenta extenso primeiro, depois numérico
  const data_reuniao = parseDataExtenso(text) ?? parseDataNumerica(text);

  // Resultado: pega o mais frequente se houver múltiplos
  const resultadoRaw = allMatches(text, RE_RESULTADO);
  let resultado: string | null = null;
  if (resultadoRaw.length > 0) {
    // Frequência
    const freq = new Map<string, number>();
    for (const r of resultadoRaw) {
      const norm = normalizeResultado(r);
      if (norm) freq.set(norm, (freq.get(norm) ?? 0) + 1);
    }
    if (freq.size > 0) {
      resultado = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  // Pauta interna: detecta pela ausência de "interessado" explícito
  // ou pela presença de keywords de pauta administrativa
  const PAUTA_INTERNA_KEYWORDS = [
    "pauta interna",
    "expediente interno",
    "assunto administrativo",
    "remuneração",
    "pessoal",
    "recursos humanos",
  ];
  const textLower = text.toLowerCase();
  const pauta_interna =
    !interessado ||
    PAUTA_INTERNA_KEYWORDS.some((kw) => textLower.includes(kw));

  // Resumo do pleito: parágrafo após "Trata-se" ou "Resumo:" ou "Objeto:"
  const RE_RESUMO = /(?:Trata-se[^.]*\.|Resumo[:\s]+|Objeto[:\s]+)([\s\S]{20,500}?)(?=\n\n|\n[A-Z]|$)/i;
  const resumoMatch = RE_RESUMO.exec(text);
  const resumo_pleito = resumoMatch ? resumoMatch[1].trim() : null;

  // Fundamento da decisão: parágrafo após "Fundamento" ou "Considerando" ou "DECIDE"
  const RE_FUNDAMENTO =
    /(?:Fundamento[:\s]+|Em face do exposto|DECIDE[:\s]+|Decide-se[:\s]+)([\s\S]{20,1000}?)(?=\n\n|\n[A-Z]{3}|$)/i;
  const fundMatch = RE_FUNDAMENTO.exec(text);
  const fundamento_decisao = fundMatch ? fundMatch[1].trim() : null;

  // Nomes de votação
  const nomes_votacao: string[] = [];
  for (const pattern of RE_VOTO_CONTEXTO) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const nome = m[1].trim();
      if (nome.length > 4 && !nomes_votacao.includes(nome)) {
        nomes_votacao.push(nome);
      }
    }
  }

  return {
    numero_deliberacao,
    reuniao_ordinaria,
    data_reuniao,
    interessado,
    processo,
    resultado,
    pauta_interna,
    resumo_pleito,
    fundamento_decisao,
    nomes_votacao,
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
