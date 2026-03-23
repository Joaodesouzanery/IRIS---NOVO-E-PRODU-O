/**
 * POST /api/v1/upload/preview
 * Aceita múltiplos PDFs (máx 5 por lote, 25 MB total), extrai campos via NLP
 * e retorna PreviewResult[]. NÃO persiste nada.
 * Funciona em modo demo e produção (mesma lógica).
 * Inclui: SHA-256 dedup, detecção de agência, validação de payload total.
 */

import { NextRequest, NextResponse } from "next/server";
import type { PreviewResult, BatchPreviewResponse } from "@/types";

const MAX_FILE_SIZE   = 50 * 1024 * 1024; // 50 MB por arquivo
const MAX_TOTAL_SIZE  = 25 * 1024 * 1024; // 25 MB por lote (segurança Vercel)
const MAX_FILES_PER_BATCH = 1000;

// Agências conhecidas em modo demo — sem DB
const DEMO_AGENCIES = [
  { id: "demo-agency-artesp", sigla: "ARTESP" },
  { id: "demo-agency-aneel",  sigla: "ANEEL"  },
  { id: "demo-agency-anvisa", sigla: "ANVISA" },
];

function isDemo(req: NextRequest): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    req.nextUrl.searchParams.get("demo") === "1"
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_FILES_PER_BATCH} arquivos por lote` },
        { status: 400 }
      );
    }

    // Limite de payload total por lote
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          error: `Tamanho total do lote excede ${MAX_TOTAL_SIZE / 1024 / 1024} MB. ` +
                 `Reduza para no máximo 5 PDFs por vez ou use PDFs menores.`,
        },
        { status: 413 }
      );
    }

    // Importações server-only
    const { isPdfBuffer, extractPdfText, sha256Hex } = await import("@/lib/server/pdf-extractor");
    const { extractFields, calcConfidence } = await import("@/lib/server/nlp-extractor");
    const { classifyMicrotema, classifyPautaInterna, detectAgenciaSigla } = await import("@/lib/server/classifier");

    // Carrega agências uma vez por request
    let allAgencias: { id: string; sigla: string }[];
    let db: Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>> | null = null;

    if (isDemo(req)) {
      allAgencias = DEMO_AGENCIES;
    } else {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      db = createSupabaseServerClient();
      const { data } = await db.from("agencias").select("id, sigla").eq("ativo", true);
      allAgencias = data ?? [];
    }

    const siglas = allAgencias.map((a) => a.sigla);

    const results: PreviewResult[] = [];

    for (const file of files) {
      // Validação de tamanho individual
      if (file.size > MAX_FILE_SIZE) {
        results.push({
          ...errorResult(file.name),
          error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB, máx 50 MB)`,
        });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Validação via magic bytes
      if (!isPdfBuffer(buffer)) {
        results.push({
          ...errorResult(file.name),
          error: "Arquivo inválido: não é um PDF (magic bytes incorretos)",
        });
        continue;
      }

      // SHA-256 para deduplicação
      const file_hash = await sha256Hex(buffer);

      // Verificação de duplicata (produção apenas)
      let is_duplicate = false;
      let duplicate_job_id: string | null = null;

      if (db) {
        const { data: existing } = await db
          .from("upload_jobs")
          .select("id, status")
          .eq("file_hash", file_hash)
          .maybeSingle();

        if (existing) {
          is_duplicate = true;
          duplicate_job_id = existing.id as string;
        }
      }

      // Extração de texto
      let extraction: Awaited<ReturnType<typeof extractPdfText>>;
      try {
        extraction = await extractPdfText(buffer);
      } catch {
        results.push({
          ...errorResult(file.name, file_hash),
          error: "Falha ao extrair texto do PDF",
        });
        continue;
      }

      if (!extraction.text || extraction.text.length < 50) {
        results.push({
          ...errorResult(file.name, file_hash),
          error: "PDF sem texto extraível — possível documento digitalizado (imagem)",
          page_count: extraction.pageCount,
        });
        continue;
      }

      // NLP
      const fields = extractFields(extraction.text);
      const { microtema } = classifyMicrotema(extraction.text);
      const confidence = calcConfidence(fields);
      const pauta_interna = fields.pauta_interna || classifyPautaInterna(extraction.text);

      // Detecção de agência
      const agencia_sigla_detected = detectAgenciaSigla(extraction.text, siglas);
      const agencia_id_detected = agencia_sigla_detected
        ? (allAgencias.find((a) => a.sigla === agencia_sigla_detected)?.id ?? null)
        : null;

      results.push({
        filename: file.name,
        status: confidence >= 0.5 ? "ok" : "low_confidence",
        fields: {
          numero_deliberacao: fields.numero_deliberacao,
          reuniao_ordinaria: fields.reuniao_ordinaria,
          data_reuniao: fields.data_reuniao,
          interessado: fields.interessado,
          assunto: fields.assunto,
          processo: fields.processo,
          resultado: fields.resultado,
          microtema,
          pauta_interna,
          resumo_pleito: fields.resumo_pleito,
          fundamento_decisao: fields.fundamento_decisao,
          nomes_votacao: fields.nomes_votacao,
          nomes_votacao_contra: fields.nomes_votacao_contra,
        },
        confidence,
        page_count: extraction.pageCount,
        chars_per_page: extraction.charsPerPage,
        file_hash,
        is_duplicate,
        duplicate_job_id,
        agencia_id_detected,
        agencia_sigla_detected,
      });
    }

    const response: BatchPreviewResponse = { results };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[upload/preview] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

function errorResult(
  filename: string,
  file_hash = ""
): PreviewResult {
  return {
    filename,
    status: "error",
    fields: {
      numero_deliberacao: null,
      reuniao_ordinaria: null,
      data_reuniao: null,
      interessado: null,
      assunto: null,
      processo: null,
      resultado: null,
      microtema: "outros",
      pauta_interna: false,
      resumo_pleito: null,
      fundamento_decisao: null,
      nomes_votacao: [],
      nomes_votacao_contra: [],
    },
    confidence: 0,
    page_count: 0,
    chars_per_page: 0,
    file_hash,
    is_duplicate: false,
    duplicate_job_id: null,
    agencia_id_detected: null,
    agencia_sigla_detected: null,
  };
}
