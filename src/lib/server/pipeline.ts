/**
 * Pipeline de processamento de PDF.
 * Substitui o Trigger.dev worker — chamado via waitUntil() do @vercel/functions
 * diretamente da API Route de upload, sem serviço externo.
 *
 * Melhorias:
 * - Chunking: PDFs com múltiplas deliberações geram N registros.
 * - LLM fallback: quando confidence < 0.60, Claude Haiku preenche campos ausentes.
 * - Embeddings: gerados em background após inserção para busca semântica.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractPdfText, splitIntoDeliberacoes } from "@/lib/server/pdf-extractor";
import { extractFields, calcConfidence } from "@/lib/server/nlp-extractor";
import { extractFieldsWithLLM, mergeWithLLMFields, LLM_CONFIDENCE_THRESHOLD } from "@/lib/server/nlp-extractor-llm";
import { classifyMicrotema } from "@/lib/server/classifier";
import { findBestMatch } from "@/lib/server/name-matcher";
import { generateEmbedding } from "@/lib/server/embeddings";

export async function processPdf(jobId: string, agenciaId: string): Promise<void> {
  const db = createSupabaseServerClient();

  // Marca como processing
  await db
    .from("upload_jobs")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  try {
    // Busca o job para obter o storage_path
    const { data: job } = await db
      .from("upload_jobs")
      .select("storage_path, filename")
      .eq("id", jobId)
      .single();

    if (!job) throw new Error("Job não encontrado");

    // Download do PDF do Supabase Storage
    const { data: fileData, error: downloadErr } = await db.storage
      .from("pdfs")
      .download(job.storage_path);

    if (downloadErr || !fileData) throw new Error(`Download falhou: ${downloadErr?.message}`);

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Extração de texto
    const extraction = await extractPdfText(buffer);
    if (!extraction.text || extraction.text.length < 50) {
      throw new Error("PDF sem texto extraível (possível imagem escaneada)");
    }

    // ── Chunking: divide o texto em deliberações individuais ──────────────
    const chunks = splitIntoDeliberacoes(extraction.text);

    // Busca diretores da agência para matching de nomes (uma vez para todos os chunks)
    const { data: diretores } = await db
      .from("diretores")
      .select("id, nome")
      .eq("agencia_id", agenciaId);

    const diretoresList = (diretores ?? []).map((d) => ({ id: d.id, nome: d.nome, nome_variantes: [] as string[] }));

    let insertedCount = 0;

    for (const chunk of chunks) {
      // NLP: extração de campos por regex
      let fields = extractFields(chunk);
      const confidence = calcConfidence(fields);

      // LLM fallback: enriquece campos ausentes quando confiança está baixa
      if (confidence < LLM_CONFIDENCE_THRESHOLD) {
        try {
          const llmFields = await extractFieldsWithLLM(chunk);
          fields = mergeWithLLMFields(fields, llmFields);
        } catch {
          // Silently ignore — continua com o que o regex extraiu
        }
      }

      // Classificação de microtema
      const { microtema } = classifyMicrotema(chunk);

      // Insere deliberação
      const { data: delib, error: deliberacaoErr } = await db
        .from("deliberacoes")
        .insert({
          numero_deliberacao: fields.numero_deliberacao ?? null,
          reuniao_ordinaria: fields.reuniao_ordinaria ?? null,
          processo: fields.processo ?? null,
          interessado: fields.interessado ?? null,
          assunto: fields.assunto ?? null,
          microtema: microtema ?? null,
          resultado: fields.resultado ?? null,
          pauta_interna: fields.pauta_interna ?? false,
          data_reuniao: fields.data_reuniao ?? null,
          agencia_id: agenciaId,
          auto_classified: true,
          extraction_confidence: calcConfidence(fields), // recalcula após merge com LLM
          resumo_pleito: fields.resumo_pleito ?? null,
          fundamento_decisao: fields.fundamento_decisao ?? null,
          raw_text: chunk,
          upload_job_id: jobId,
        })
        .select("id")
        .single();

      if (deliberacaoErr || !delib) {
        console.error(`[pipeline] Erro ao inserir chunk do job ${jobId}:`, deliberacaoErr?.message);
        continue; // tenta próximo chunk
      }

      insertedCount++;

      // Insere votos se houver nomes extraídos
      if (fields.nomes_votacao && fields.nomes_votacao.length > 0) {
        const votoRows = fields.nomes_votacao
          .map((nome: string) => {
            const match = findBestMatch(nome, diretoresList);
            const isContra = fields.nomes_votacao_contra.includes(nome);
            return {
              deliberacao_id: delib.id as string,
              diretor_id: match?.diretorId ?? null,
              tipo_voto: isContra ? ("Desfavoravel" as const) : ("Favoravel" as const),
              is_divergente: isContra,
              is_nominal: true,
            };
          })
          .filter((v: { diretor_id: string | null }) => v.diretor_id !== null);

        if (votoRows.length > 0) {
          await db.from("votos").insert(votoRows);
        }
      }

      // Embedding em background (não bloqueia o job)
      const embedText = [fields.assunto, fields.interessado, fields.resumo_pleito]
        .filter(Boolean)
        .join(". ");
      if (embedText.length > 20) {
        generateEmbedding(embedText)
          .then((embedding) => {
            if (embedding) {
              db.from("deliberacoes")
                .update({ embedding })
                .eq("id", delib.id as string)
                .then(() => {});
            }
          })
          .catch(() => {}); // falha silenciosa — embedding é opcional
      }
    }

    if (insertedCount === 0) {
      throw new Error("Nenhuma deliberação pôde ser inserida");
    }

    // Marca como done (ou done_with_warnings se não inseriu todos os chunks)
    const finalStatus = insertedCount < chunks.length ? "done_with_warnings" : "done";
    await db
      .from("upload_jobs")
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", jobId);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] Job ${jobId} falhou:`, message);

    await db
      .from("upload_jobs")
      .update({
        status: "failed",
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
