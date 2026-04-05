/**
 * embeddings.ts
 * Geração de embeddings para busca semântica com pgvector.
 * Usa OpenAI text-embedding-3-small (1536 dims, $0.00002/1K tokens).
 *
 * Graceful degradation: retorna null se OPENAI_API_KEY não estiver configurada
 * ou se ocorrer qualquer erro — o pipeline nunca falha por causa de embeddings.
 */

const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_TEXT_CHARS = 8_000; // ~2.000 tokens

/**
 * Gera um embedding de 1536 dimensões para o texto fornecido.
 * Retorna null se OPENAI_API_KEY não estiver disponível ou em caso de erro.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, MAX_TEXT_CHARS),
      encoding_format: "float",
    });

    return response.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/**
 * Formata um array de números como string para inserção no Supabase
 * com a extensão pgvector: '[0.1, 0.2, ...]'
 */
export function embeddingToString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
