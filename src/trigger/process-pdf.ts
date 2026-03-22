/**
 * process-pdf.ts
 * Background job do Trigger.dev — substitui o Celery worker Python.
 * Executa fora do Vercel serverless (sem limite de timeout).
 *
 * Pipeline:
 *   1. Busca metadados do job no Supabase
 *   2. Baixa o PDF do Supabase Storage
 *   3. Extrai texto com pdf-parse
 *   4. Extrai campos com regex (nlp-extractor)
 *   5. Classifica microtema (classifier)
 *   6. Resolve nomes de diretores (name-matcher)
 *   7. Persiste deliberação + votos no Supabase
 *   8. Atualiza status do job
 */

import { task, logger } from "@trigger.dev/sdk/v3";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/server/pdf-extractor";
import { extractFields, calcConfidence } from "@/lib/server/nlp-extractor";
import { classifyMicrotema } from "@/lib/server/classifier";
import { findBestMatch, normalizeName } from "@/lib/server/name-matcher";

// ─── Payload do task ──────────────────────────────────────────────────────
interface ProcessPdfPayload {
  jobId: string;
  agenciaId: string;
}

// ─── Task principal ───────────────────────────────────────────────────────
export const processPdfTask = task({
  id: "process-pdf",
  // Retry automático: 3 tentativas com backoff exponencial
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 30_000,
    factor: 2,
  },
  run: async (payload: ProcessPdfPayload) => {
    const { jobId, agenciaId } = payload;
    const db = createSupabaseServerClient();

    logger.info("Iniciando processamento", { jobId });

    // ── 1. Buscar job e marcar como "processing" ────────────────────────
    const { data: job, error: jobErr } = await db
      .from("upload_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      throw new Error(`Job não encontrado: ${jobId}`);
    }

    await db
      .from("upload_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    try {
      // ── 2. Baixar PDF do Supabase Storage ──────────────────────────────
      if (!job.storage_path) {
        throw new Error("storage_path vazio no job");
      }

      const { data: fileData, error: dlErr } = await db.storage
        .from("pdfs")
        .download(job.storage_path);

      if (dlErr || !fileData) {
        throw new Error(`Falha ao baixar PDF: ${dlErr?.message}`);
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      logger.info("PDF baixado", { bytes: buffer.length });

      // ── 3. Extração de texto ────────────────────────────────────────────
      const { text, pageCount, charsPerPage } = await extractPdfText(buffer);
      logger.info("Texto extraído", { pageCount, charsPerPage });

      if (charsPerPage < 30) {
        // PDF escaneado sem OCR — marcar com aviso mas não falhar
        await db
          .from("upload_jobs")
          .update({
            status: "done_with_warnings",
            error_message: `PDF possivelmente escaneado (${charsPerPage} chars/página). Extração limitada.`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        return { jobId, status: "done_with_warnings" };
      }

      // ── 4. Extração de campos NLP ───────────────────────────────────────
      const fields = extractFields(text);
      const confidence = calcConfidence(fields);
      logger.info("Campos extraídos", { confidence, resultado: fields.resultado });

      // ── 5. Classificação de microtema ───────────────────────────────────
      const { microtema } = classifyMicrotema(text);
      logger.info("Microtema classificado", { microtema });

      // ── 6. Resolver diretores ───────────────────────────────────────────
      // Busca diretores existentes da agência
      const { data: diretores } = await db
        .from("diretores")
        .select("id, nome, nome_variantes")
        .eq("agencia_id", agenciaId);

      const diretoresList = diretores ?? [];
      const votosParaInserir: Array<{
        diretor_id: string;
        tipo_voto: string;
        is_divergente: boolean;
        is_nominal: boolean;
      }> = [];

      for (const nomeRaw of fields.nomes_votacao) {
        const normalizado = normalizeName(nomeRaw);
        const match = findBestMatch(normalizado, diretoresList);

        let diretorId = match.diretorId;

        if (match.isNew) {
          // Criar novo diretor
          const { data: novoDiretor } = await db
            .from("diretores")
            .insert({
              nome: normalizado,
              nome_variantes: [nomeRaw],
              agencia_id: agenciaId,
              needs_review: true,
            })
            .select("id")
            .single();

          if (novoDiretor) {
            diretorId = novoDiretor.id;
            // Adicionar à lista local para evitar duplicatas no mesmo job
            diretoresList.push({
              id: novoDiretor.id,
              nome: normalizado,
              nome_variantes: [nomeRaw],
            });
          }
        } else if (match.needsReview && diretorId) {
          // Adicionar variante para revisão posterior
          const existing = diretoresList.find((d) => d.id === diretorId);
          if (existing && !existing.nome_variantes.includes(nomeRaw)) {
            await db
              .from("diretores")
              .update({
                nome_variantes: [...existing.nome_variantes, nomeRaw],
                needs_review: true,
              })
              .eq("id", diretorId);
          }
        }

        if (diretorId) {
          votosParaInserir.push({
            diretor_id: diretorId,
            tipo_voto: "Favoravel", // padrão — refinar com contexto se disponível
            is_divergente: false,
            is_nominal: fields.nomes_votacao.length > 0,
          });
        }
      }

      // ── 7. Inserir deliberação ──────────────────────────────────────────
      const { data: deliberacao, error: insErr } = await db
        .from("deliberacoes")
        .insert({
          agencia_id: agenciaId,
          upload_job_id: jobId,
          numero_deliberacao: fields.numero_deliberacao,
          reuniao_ordinaria: fields.reuniao_ordinaria,
          data_reuniao: fields.data_reuniao,
          interessado: fields.interessado,
          processo: fields.processo,
          microtema,
          resultado: fields.resultado,
          pauta_interna: fields.pauta_interna,
          resumo_pleito: fields.resumo_pleito,
          fundamento_decisao: fields.fundamento_decisao,
          extraction_confidence: confidence,
          auto_classified: true,
          raw_text: text.slice(0, 50_000), // limite para não explodir o banco
          raw_extracted: fields,
        })
        .select("id")
        .single();

      if (insErr || !deliberacao) {
        throw new Error(`Falha ao inserir deliberação: ${insErr?.message}`);
      }

      logger.info("Deliberação inserida", { deliberacaoId: deliberacao.id });

      // ── 8. Inserir votos ────────────────────────────────────────────────
      if (votosParaInserir.length > 0) {
        const votosComDeliberacao = votosParaInserir.map((v) => ({
          ...v,
          deliberacao_id: deliberacao.id,
        }));

        const { error: votosErr } = await db
          .from("votos")
          .upsert(votosComDeliberacao, {
            onConflict: "deliberacao_id,diretor_id",
            ignoreDuplicates: true,
          });

        if (votosErr) {
          logger.warn("Erro ao inserir votos", { error: votosErr.message });
        }
      }

      // ── 9. Marcar job como "done" ───────────────────────────────────────
      await db
        .from("upload_jobs")
        .update({
          status: "done",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      logger.info("Job concluído com sucesso", { jobId, deliberacaoId: deliberacao.id });

      return {
        jobId,
        deliberacaoId: deliberacao.id,
        status: "done",
        confidence,
        microtema,
      };
    } catch (error) {
      // Atualiza job como failed para esta tentativa
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Erro no processamento", { jobId, error: errorMessage });

      await db
        .from("upload_jobs")
        .update({
          status: "failed",
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      // Re-throw para o Trigger.dev fazer retry automático
      throw error;
    }
  },
});
