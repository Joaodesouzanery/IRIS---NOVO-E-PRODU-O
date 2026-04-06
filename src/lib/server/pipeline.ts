/**
 * Pipeline de processamento de PDF.
 * Substitui o Trigger.dev worker — chamado via waitUntil() do @vercel/functions
 * diretamente da API Route de upload, sem serviço externo.
 *
 * Suporta:
 *   - Deliberações (1 PDF = 1 deliberação) — ARTESP e similares
 *   - Atas de reunião (1 PDF = N deliberações) — ANM e similares
 *   - Fila com concorrência limitada para uploads em massa
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/server/pdf-extractor";
import { extractFields, calcConfidence } from "@/lib/server/nlp-extractor";
import { classifyMicrotema } from "@/lib/server/classifier";
import { findBestMatch } from "@/lib/server/name-matcher";
import { detectDocumentType, splitAtaItems, extractAtaMetadata } from "@/lib/server/ata-splitter";
import type { TipoDocumento } from "@/types";

// ─── Processamento de um PDF individual ─────────────────────────────────
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
      throw new Error("PDF sem texto extraível (possível imagem)");
    }

    // Detectar tipo de documento
    const tipo_documento = detectDocumentType(extraction.text);

    // Busca diretores da agência para matching de nomes
    const { data: diretores } = await db
      .from("diretores")
      .select("id, nome")
      .eq("agencia_id", agenciaId);

    const diretoresList = (diretores ?? []).map((d) => ({
      id: d.id, nome: d.nome, nome_variantes: [] as string[],
    }));

    if (tipo_documento === "ata") {
      await processAta(db, extraction.text, jobId, agenciaId, diretoresList);
    } else {
      await processDeliberacao(db, extraction.text, tipo_documento, jobId, agenciaId, diretoresList);
    }

    // Marca como done
    await db
      .from("upload_jobs")
      .update({ status: "done", updated_at: new Date().toISOString() })
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

// ─── Processar deliberação individual (ARTESP e similares) ──────────────
async function processDeliberacao(
  db: ReturnType<typeof createSupabaseServerClient>,
  text: string,
  tipo_documento: TipoDocumento,
  jobId: string,
  agenciaId: string,
  diretoresList: Array<{ id: string; nome: string; nome_variantes: string[] }>,
): Promise<void> {
  const fields = extractFields(text);
  const confidence = calcConfidence(fields);
  const { microtema } = classifyMicrotema(text);

  const { data: delib, error: deliberacaoErr } = await db
    .from("deliberacoes")
    .insert({
      numero_deliberacao: fields.numero_deliberacao ?? null,
      numero_reuniao: fields.numero_reuniao ?? null,
      reuniao_ordinaria: fields.reuniao_ordinaria ?? null,
      tipo_reuniao: fields.tipo_reuniao ?? null,
      tipo_documento,
      processo: fields.processo ?? null,
      interessado: fields.interessado ?? null,
      assunto: fields.assunto ?? null,
      procedencia: fields.procedencia ?? null,
      microtema: microtema ?? null,
      resultado: fields.resultado ?? null,
      decisoes_todas: fields.decisoes_todas.length > 0 ? fields.decisoes_todas : null,
      pauta_interna: fields.pauta_interna ?? false,
      data_reuniao: fields.data_reuniao ?? null,
      agencia_id: agenciaId,
      auto_classified: true,
      extraction_confidence: confidence,
      resumo_pleito: fields.resumo_pleito ?? null,
      fundamento_decisao: fields.fundamento_decisao ?? null,
      raw_text: text.slice(0, 50000),
      upload_job_id: jobId,
    })
    .select("id")
    .single();

  if (deliberacaoErr || !delib) {
    throw new Error(`Erro ao inserir deliberação: ${deliberacaoErr?.message}`);
  }

  await insertVotos(db, delib.id as string, fields.nomes_votacao, fields.nomes_votacao_contra, diretoresList);
}

// ─── Processar ata de reunião (ANM e similares) — 1 PDF = N deliberações
async function processAta(
  db: ReturnType<typeof createSupabaseServerClient>,
  text: string,
  jobId: string,
  agenciaId: string,
  diretoresList: Array<{ id: string; nome: string; nome_variantes: string[] }>,
): Promise<void> {
  const metadata = extractAtaMetadata(text);
  const items = splitAtaItems(text);

  if (items.length === 0) {
    throw new Error("Ata sem items deliberativos extraíveis");
  }

  // Criar deliberação-pai (registro da ata como um todo)
  const { data: ataDelib, error: ataErr } = await db
    .from("deliberacoes")
    .insert({
      numero_deliberacao: metadata.numero_reuniao
        ? `ATA-${metadata.numero_reuniao}` : null,
      numero_reuniao: metadata.numero_reuniao ?? null,
      tipo_reuniao: metadata.tipo_reuniao ?? null,
      tipo_documento: "ata" as const,
      data_reuniao: metadata.data_reuniao ?? null,
      agencia_id: agenciaId,
      auto_classified: true,
      extraction_confidence: 1,
      pauta_interna: false,
      raw_text: text.slice(0, 50000),
      upload_job_id: jobId,
      assunto: `Ata da ${metadata.numero_reuniao ?? ""}ª Reunião ${metadata.tipo_reuniao ?? "Ordinária"} - ${items.length} processos`,
    })
    .select("id")
    .single();

  if (ataErr || !ataDelib) {
    throw new Error(`Erro ao inserir ata: ${ataErr?.message}`);
  }

  const ataId = ataDelib.id as string;

  // Inserir cada item como deliberação filha
  for (const item of items) {
    const { microtema } = classifyMicrotema(item.raw_text);

    const { data: itemDelib, error: itemErr } = await db
      .from("deliberacoes")
      .insert({
        numero_deliberacao: metadata.numero_reuniao
          ? `ATA-${metadata.numero_reuniao}-${item.item_numero}` : null,
        numero_reuniao: metadata.numero_reuniao ?? null,
        tipo_reuniao: metadata.tipo_reuniao ?? null,
        tipo_documento: "ata" as const,
        item_numero: item.item_numero,
        documento_pai_id: ataId,
        processo: item.processo ?? null,
        interessado: item.interessado ?? null,
        assunto: item.assunto ?? null,
        relator: item.relator ?? null,
        microtema: microtema ?? null,
        resultado: item.resultado ?? null,
        pauta_interna: false,
        data_reuniao: metadata.data_reuniao ?? null,
        agencia_id: agenciaId,
        auto_classified: true,
        extraction_confidence: item.processo ? 0.8 : 0.4,
        resumo_pleito: item.decisao?.slice(0, 2000) ?? null,
        raw_text: item.raw_text.slice(0, 50000),
        upload_job_id: jobId,
      })
      .select("id")
      .single();

    if (itemErr || !itemDelib) {
      console.error(`[pipeline] Item ${item.item_numero} falhou:`, itemErr?.message);
      continue;
    }

    // Votos: se unanimidade, todos os signatários votaram a favor
    if (item.unanimidade && metadata.signatarios.length > 0) {
      await insertVotos(
        db,
        itemDelib.id as string,
        metadata.signatarios,
        [],
        diretoresList,
      );
    }
  }
}

// ─── Inserir votos ──────────────────────────────────────────────────────
async function insertVotos(
  db: ReturnType<typeof createSupabaseServerClient>,
  deliberacaoId: string,
  nomes: string[],
  nomesContra: string[],
  diretoresList: Array<{ id: string; nome: string; nome_variantes: string[] }>,
): Promise<void> {
  if (!nomes || nomes.length === 0) return;

  const votoRows = nomes
    .map((nome: string) => {
      const match = findBestMatch(nome, diretoresList);
      const isContra = nomesContra.includes(nome);
      return {
        deliberacao_id: deliberacaoId,
        diretor_id: match?.diretorId ?? null,
        tipo_voto: isContra ? ("Desfavoravel" as const) : ("Favoravel" as const),
        is_divergente: isContra,
        is_nominal: true,
      };
    })
    .filter((v) => v.diretor_id !== null);

  if (votoRows.length > 0) {
    await db.from("votos").insert(votoRows);
  }
}

// ─── Fila com concorrência limitada para uploads em massa ───────────────
export async function processQueue(
  jobs: Array<{ jobId: string; agenciaId: string }>,
  concurrency = 3,
): Promise<void> {
  const queue = [...jobs];
  const active: Promise<void>[] = [];

  while (queue.length > 0 || active.length > 0) {
    while (active.length < concurrency && queue.length > 0) {
      const job = queue.shift()!;
      const p = processPdf(job.jobId, job.agenciaId)
        .catch((err) => {
          console.error(`[queue] Job ${job.jobId} falhou:`, err);
        })
        .then(() => {
          const idx = active.indexOf(p);
          if (idx !== -1) active.splice(idx, 1);
        });
      active.push(p);
    }
    if (active.length > 0) await Promise.race(active);
  }
}
