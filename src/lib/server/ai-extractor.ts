/**
 * ai-extractor.ts
 * Fallback de extração com IA (Claude Haiku) para deliberações com baixa confiança.
 * Chamado apenas quando a extração regex retorna confidence < 0.70.
 *
 * Usa o Anthropic SDK com saída estruturada em JSON.
 * Requer: ANTHROPIC_API_KEY no ambiente.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedFields } from "./nlp-extractor";

// Campos que a IA deve extrair (subconjunto dos ExtractedFields)
interface AIExtractedFields {
  numero_deliberacao: string | null;
  data_reuniao: string | null;         // ISO: "YYYY-MM-DD"
  interessado: string | null;
  processo: string | null;
  assunto: string | null;
  resultado: string | null;
  resumo_pleito: string | null;
  fundamento_decisao: string | null;
}

const RESULTADOS_VALIDOS = new Set([
  "Deferido", "Indeferido", "Parcialmente Deferido", "Retirado de Pauta",
  "Ratificado", "Aprovado", "Aprovado com Ressalvas", "Aprovado por Unanimidade",
  "Recomendado", "Determinado", "Autorizado",
]);

const SYSTEM_PROMPT = `Você é um especialista em análise de deliberações de agências reguladoras brasileiras (ARTESP, ANEEL, ANVISA, ANATEL, ANS, ANP, ANTAQ, ANTT, ANA etc.).

Extraia os campos solicitados do texto de uma deliberação regulatória em formato JSON. Siga rigorosamente as instruções:

1. numero_deliberacao: Número da deliberação. Ex: "1234", "1234.56". Apenas os dígitos/pontos após "DELIBERAÇÃO Nº". Null se não encontrar.

2. data_reuniao: Data da reunião em formato ISO "YYYY-MM-DD". Procure por frases como "X de [mês] de AAAA", "realizada em DD/MM/AAAA", "São Paulo, DD de [mês] de AAAA". Null se não encontrar.

3. interessado: Nome da empresa, pessoa física ou entidade requerente. Aparece após "Interessado:", "Requerente:", "Empresa:". Null se não encontrar.

4. processo: Número do processo SEI ou administrativo. Aparece após "SEI nº", "Processo nº", "SEI!". Null se não encontrar.

5. assunto: Tema/assunto da deliberação. Aparece após "Assunto:". Null se não encontrar.

6. resultado: Decisão normalizada. Use EXATAMENTE um dos valores válidos abaixo, ou null se incerto:
   - "Deferido", "Indeferido", "Parcialmente Deferido", "Retirado de Pauta"
   - "Ratificado", "Aprovado", "Aprovado com Ressalvas", "Aprovado por Unanimidade"
   - "Recomendado", "Determinado", "Autorizado"

7. resumo_pleito: Resumo do que está sendo pedido/deliberado. Procure por parágrafos que começam com "Trata-se", "Cuida-se", "A presente deliberação", ou seções "Resumo:", "Objeto:", "Ementa:". Máximo 600 caracteres. Null se não encontrar.

8. fundamento_decisao: Fundamento legal/técnico da decisão. Procure após "Fundamento:", "Em face do exposto", "DECIDE:", "Decide-se:". Máximo 800 caracteres. Null se não encontrar.

Responda APENAS com um objeto JSON válido, sem texto adicional, sem markdown.`;

/**
 * Extrai campos usando Claude Haiku e mescla com os campos já extraídos por regex.
 * Só preenche campos que ainda são null nos partialFields.
 */
export async function extractFieldsWithAI(
  text: string,
  partialFields: ExtractedFields,
): Promise<{ fields: ExtractedFields; ai_used: boolean; ai_error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { fields: partialFields, ai_used: false, ai_error: "ANTHROPIC_API_KEY não configurada" };
  }

  // Limita o texto para reduzir custo (primeiros 8000 chars cobrem a maioria dos campos)
  const textSlice = text.slice(0, 8000);

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extraia os campos do seguinte texto de deliberação:\n\n${textSlice}`,
        },
      ],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== "text") {
      return { fields: partialFields, ai_used: false, ai_error: "Resposta inesperada da API" };
    }

    // Parse do JSON retornado pela IA
    let aiFields: Partial<AIExtractedFields>;
    try {
      // Remove possível markdown code block
      const jsonStr = rawContent.text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      aiFields = JSON.parse(jsonStr);
    } catch {
      return { fields: partialFields, ai_used: false, ai_error: "JSON inválido retornado pela IA" };
    }

    // Mescla: usa valor da IA apenas para campos ainda null no regex
    const merged: ExtractedFields = { ...partialFields };

    if (!merged.numero_deliberacao && aiFields.numero_deliberacao) {
      merged.numero_deliberacao = String(aiFields.numero_deliberacao).slice(0, 50);
    }
    if (!merged.data_reuniao && aiFields.data_reuniao) {
      // Valida formato ISO
      if (/^\d{4}-\d{2}-\d{2}$/.test(aiFields.data_reuniao)) {
        merged.data_reuniao = aiFields.data_reuniao;
      }
    }
    if (!merged.interessado && aiFields.interessado) {
      merged.interessado = String(aiFields.interessado).slice(0, 100);
    }
    if (!merged.processo && aiFields.processo) {
      merged.processo = String(aiFields.processo).slice(0, 100);
    }
    if (!merged.assunto && aiFields.assunto) {
      merged.assunto = String(aiFields.assunto).slice(0, 300);
    }
    if (!merged.resultado && aiFields.resultado) {
      // Valida contra lista permitida
      if (RESULTADOS_VALIDOS.has(aiFields.resultado)) {
        merged.resultado = aiFields.resultado;
      }
    }
    if (!merged.resumo_pleito && aiFields.resumo_pleito) {
      merged.resumo_pleito = String(aiFields.resumo_pleito).slice(0, 600);
    }
    if (!merged.fundamento_decisao && aiFields.fundamento_decisao) {
      merged.fundamento_decisao = String(aiFields.fundamento_decisao).slice(0, 800);
    }

    return { fields: merged, ai_used: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { fields: partialFields, ai_used: false, ai_error: msg };
  }
}
