/**
 * nlp-extractor-llm.ts
 * Fallback de extração de campos via Claude Haiku quando a confiança do extrator
 * regex está abaixo do threshold (< 0.60).
 *
 * Graceful degradation: retorna {} se ANTHROPIC_API_KEY não estiver configurada
 * ou se ocorrer qualquer erro — o pipeline nunca falha por causa do LLM.
 */

import type { ExtractedFields } from "./nlp-extractor";

const LLM_CONFIDENCE_THRESHOLD = 0.60;
const MAX_TEXT_CHARS = 8_000; // ~2.000 tokens — barato no Haiku

export { LLM_CONFIDENCE_THRESHOLD };

type LLMFields = Partial<Pick<ExtractedFields,
  | "numero_deliberacao"
  | "data_reuniao"
  | "interessado"
  | "processo"
  | "assunto"
  | "resultado"
  | "resumo_pleito"
  | "fundamento_decisao"
>>;

const EXTRACTION_PROMPT = `Você é um extrator de campos de deliberações regulatórias brasileiras.
Analise o texto abaixo e extraia os campos no formato JSON especificado.
Retorne APENAS o JSON, sem texto adicional.

Campos a extrair:
- numero_deliberacao: número da deliberação (ex: "001/2024", "DEL-123") ou null
- data_reuniao: data da reunião no formato YYYY-MM-DD ou null
- interessado: nome da empresa/entidade requerente ou null
- processo: número do processo SEI ou administrativo ou null
- assunto: assunto/ementa principal da deliberação ou null (máx 300 chars)
- resultado: um de ["Deferido","Indeferido","Parcialmente Deferido","Retirado de Pauta","Aprovado","Aprovado com Ressalvas","Ratificado","Recomendado","Determinado","Autorizado"] ou null
- resumo_pleito: resumo do que está sendo pedido ou null (máx 500 chars)
- fundamento_decisao: fundamento/justificativa da decisão ou null (máx 500 chars)

JSON esperado:
{
  "numero_deliberacao": "...",
  "data_reuniao": "YYYY-MM-DD",
  "interessado": "...",
  "processo": "...",
  "assunto": "...",
  "resultado": "...",
  "resumo_pleito": "...",
  "fundamento_decisao": "..."
}`;

/**
 * Usa Claude Haiku para extrair campos ausentes de uma deliberação.
 * Retorna apenas os campos não-nulos encontrados pelo LLM.
 * Se ANTHROPIC_API_KEY não estiver configurada ou ocorrer erro, retorna {}.
 */
export async function extractFieldsWithLLM(text: string): Promise<LLMFields> {
  if (!process.env.ANTHROPIC_API_KEY) return {};

  try {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const truncated = text.slice(0, MAX_TEXT_CHARS);

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nTexto da deliberação:\n\n${truncated}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Tenta parsear o JSON da resposta
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const parsed: Record<string, unknown> = JSON.parse(jsonMatch[0]);

    // Valida e sanitiza cada campo antes de retornar
    const result: LLMFields = {};

    if (typeof parsed.numero_deliberacao === "string" && parsed.numero_deliberacao.length > 0) {
      result.numero_deliberacao = parsed.numero_deliberacao.slice(0, 50);
    }
    if (typeof parsed.data_reuniao === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.data_reuniao)) {
      result.data_reuniao = parsed.data_reuniao;
    }
    if (typeof parsed.interessado === "string" && parsed.interessado.length > 0) {
      result.interessado = parsed.interessado.slice(0, 255);
    }
    if (typeof parsed.processo === "string" && parsed.processo.length > 0) {
      result.processo = parsed.processo.slice(0, 100);
    }
    if (typeof parsed.assunto === "string" && parsed.assunto.length > 0) {
      result.assunto = parsed.assunto.slice(0, 300);
    }

    const RESULTADOS_VALIDOS = new Set([
      "Deferido", "Indeferido", "Parcialmente Deferido", "Retirado de Pauta",
      "Aprovado", "Aprovado com Ressalvas", "Ratificado",
      "Recomendado", "Determinado", "Autorizado",
    ]);
    if (typeof parsed.resultado === "string" && RESULTADOS_VALIDOS.has(parsed.resultado)) {
      result.resultado = parsed.resultado;
    }
    if (typeof parsed.resumo_pleito === "string" && parsed.resumo_pleito.length > 0) {
      result.resumo_pleito = parsed.resumo_pleito.slice(0, 500);
    }
    if (typeof parsed.fundamento_decisao === "string" && parsed.fundamento_decisao.length > 0) {
      result.fundamento_decisao = parsed.fundamento_decisao.slice(0, 500);
    }

    return result;
  } catch {
    // Silently fail — o pipeline continua com os campos extraídos pelo regex
    return {};
  }
}

/**
 * Merge campos: os valores do regex têm prioridade.
 * O LLM preenche apenas campos que o regex deixou como null.
 */
export function mergeWithLLMFields(
  regexFields: ExtractedFields,
  llmFields: LLMFields
): ExtractedFields {
  return {
    ...regexFields,
    numero_deliberacao: regexFields.numero_deliberacao ?? llmFields.numero_deliberacao ?? null,
    data_reuniao:       regexFields.data_reuniao       ?? llmFields.data_reuniao       ?? null,
    interessado:        regexFields.interessado        ?? llmFields.interessado        ?? null,
    processo:           regexFields.processo           ?? llmFields.processo           ?? null,
    assunto:            regexFields.assunto            ?? llmFields.assunto            ?? null,
    resultado:          regexFields.resultado          ?? llmFields.resultado          ?? null,
    resumo_pleito:      regexFields.resumo_pleito      ?? llmFields.resumo_pleito      ?? null,
    fundamento_decisao: regexFields.fundamento_decisao ?? llmFields.fundamento_decisao ?? null,
  };
}
