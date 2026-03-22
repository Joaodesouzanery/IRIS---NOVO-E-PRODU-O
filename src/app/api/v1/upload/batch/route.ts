/**
 * POST /api/v1/upload/batch
 * Substitui backend/app/api/v1/upload.py
 * Aceita múltiplos PDFs, valida via magic bytes, envia para Supabase Storage,
 * cria registros upload_jobs e enfileira tasks no Trigger.dev.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPdfBuffer, sha256Hex } from "@/lib/server/pdf-extractor";
import { tasks } from "@trigger.dev/sdk/v3";
import type { processPdfTask } from "@/trigger/process-pdf";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB por arquivo
const MAX_FILES_PER_BATCH = 1000;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const agenciaId = formData.get("agencia_id");

    if (!agenciaId || typeof agenciaId !== "string") {
      return NextResponse.json(
        { error: "agencia_id é obrigatório" },
        { status: 400 }
      );
    }

    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_FILES_PER_BATCH} arquivos por lote` },
        { status: 400 }
      );
    }

    const db = createSupabaseServerClient();

    // Verifica se a agência existe
    const { data: agencia } = await db
      .from("agencias")
      .select("id")
      .eq("id", agenciaId)
      .single();

    if (!agencia) {
      return NextResponse.json(
        { error: "Agência não encontrada" },
        { status: 404 }
      );
    }

    const results: Array<{
      filename: string;
      job_id: string | null;
      status: string;
      message?: string;
    }> = [];

    for (const file of files) {
      // Validação de tamanho
      if (file.size > MAX_FILE_SIZE) {
        results.push({
          filename: file.name,
          job_id: null,
          status: "rejected",
          message: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB, máx 50 MB)`,
        });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Validação de tipo via magic bytes (não confia na extensão)
      if (!isPdfBuffer(buffer)) {
        results.push({
          filename: file.name,
          job_id: null,
          status: "rejected",
          message: "Arquivo inválido: não é um PDF",
        });
        continue;
      }

      // SHA-256 para deduplicação
      const fileHash = await sha256Hex(buffer);

      // Verifica duplicata
      const { data: existing } = await db
        .from("upload_jobs")
        .select("id, status")
        .eq("file_hash", fileHash)
        .maybeSingle();

      if (existing) {
        results.push({
          filename: file.name,
          job_id: existing.id,
          status: "duplicate",
          message: `PDF já processado anteriormente (status: ${existing.status})`,
        });
        continue;
      }

      // Upload para Supabase Storage
      const storagePath = `${agenciaId}/${fileHash}.pdf`;
      const { error: uploadErr } = await db.storage
        .from("pdfs")
        .upload(storagePath, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadErr) {
        results.push({
          filename: file.name,
          job_id: null,
          status: "error",
          message: `Falha no upload: ${uploadErr.message}`,
        });
        continue;
      }

      // Criar registro upload_job
      const { data: job, error: jobErr } = await db
        .from("upload_jobs")
        .insert({
          filename: file.name,
          file_hash: fileHash,
          status: "pending",
          agencia_id: agenciaId,
          storage_path: storagePath,
        })
        .select("id")
        .single();

      if (jobErr || !job) {
        results.push({
          filename: file.name,
          job_id: null,
          status: "error",
          message: "Falha ao criar registro de job",
        });
        continue;
      }

      // Enfileirar no Trigger.dev
      await tasks.trigger<typeof processPdfTask>("process-pdf", {
        jobId: job.id,
        agenciaId,
      });

      results.push({
        filename: file.name,
        job_id: job.id,
        status: "queued",
      });
    }

    const queued = results.filter((r) => r.status === "queued").length;
    const rejected = results.filter(
      (r) => r.status === "rejected" || r.status === "error"
    ).length;

    return NextResponse.json(
      {
        total: files.length,
        queued,
        rejected,
        results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[upload/batch] Erro inesperado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
