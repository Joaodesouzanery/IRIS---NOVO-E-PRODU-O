/**
 * POST /api/v1/upload/preview
 * Aceita múltiplos PDFs (máx 5 por lote, 25 MB total), extrai campos via NLP
 * e retorna PreviewResult[]. NÃO persiste nada.
 * Funciona em modo demo e produção (mesma lógica).
 * Inclui: SHA-256 dedup, detecção de agência, validação de payload total.
 */

import { NextRequest, NextResponse } from "next/server";
import type { PreviewResult, BatchPreviewResponse } from "@/types";
import { isDemo } from "@/lib/server/is-demo";

const MAX_FILE_SIZE   = 50 * 1024 * 1024; // 50 MB por arquivo
const MAX_TOTAL_SIZE  = 25 * 1024 * 1024; // 25 MB por lote (segurança Vercel)
const MAX_FILES_PER_BATCH = 1000;

// Agências conhecidas em modo demo — sem DB
const DEMO_AGENCIES = [
  { id: "demo-agency-artesp", sigla: "ARTESP" },
  { id: "demo-agency-anm",    sigla: "ANM"    },
  { id: "demo-agency-aneel",  sigla: "ANEEL"  },
  { id: "demo-agency-anvisa", sigla: "ANVISA" },
];


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
    const { detectDocumentType, splitAtaItems, extractAtaMetadata } = await import("@/lib/server/ata-splitter");

    // Carrega agências uma vez por request
    let allAgencias: { id: string; sigla: string }[];
    let db: Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>> | null = null;

    if (isDemo()) {
      allAgencias = DEMO_AGENCIES;
    } else {
      const { createSupabaseServerClient } = await import("@/lib/supabase/server");
      db = createSupabaseServerClient();
      const { data } = await db.from("agencias").select("id, sigla").eq("ativo", true);
      allAgencias = data ?? [];
    }

    const siglas = allAgencias.map((a) => a.sigla);

    // Processa todos os arquivos em paralelo (antes era sequencial — 5× mais rápido)
    const results: PreviewResult[] = await Promise.all(
      files.map(async (file): Promise<PreviewResult> => {
        // Validação de tamanho individual
        if (file.size > MAX_FILE_SIZE) {
          return {
            ...errorResult(file.name),
            error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB, máx 50 MB)`,
          };
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Validação via magic bytes
        if (!isPdfBuffer(buffer)) {
          return {
            ...errorResult(file.name),
            error: "Arquivo inválido: não é um PDF (magic bytes incorretos)",
          };
        }

        // SHA-256 para deduplicação
        const file_hash = await sha256Hex(buffer);

        // Verificação de duplicata por hash (produção apenas)
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
          return {
            ...errorResult(file.name, file_hash),
            error: "Falha ao extrair texto do PDF",
          };
        }

        if (!extraction.text || extraction.text.length < 50) {
          return {
            ...errorResult(file.name, file_hash),
            error: "PDF sem texto extraível — possível documento digitalizado (imagem). Use uma versão digital ou converta via Adobe Acrobat antes de enviar.",
            page_count: extraction.pageCount,
          };
        }

        // Detectar tipo de documento
        const tipo_documento = detectDocumentType(extraction.text);

        // NLP
        const fields = extractFields(extraction.text);
        const { microtema } = classifyMicrotema(extraction.text);
        const confidence = calcConfidence(fields);

        // Detecção de agência (antes de pauta_interna, pois precisa da sigla)
        const agencia_sigla_detected = detectAgenciaSigla(extraction.text, siglas);
        const agencia_id_detected = agencia_sigla_detected
          ? (allAgencias.find((a) => a.sigla === agencia_sigla_detected)?.id ?? null)
          : null;

        const pauta_interna = fields.pauta_interna || classifyPautaInterna(
          extraction.text, fields.interessado, agencia_sigla_detected
        );

        // Verificação de duplicata semântica (produção apenas)
        // 1. Por numero_deliberacao (principal)
        // 2. Fallback por data_reuniao + agencia_id + interessado (quando número não extraído)
        let semantic_duplicate = false;
        if (db && !is_duplicate) {
          if (fields.numero_deliberacao && agencia_id_detected) {
            const { data: existingDelib } = await db
              .from("deliberacoes")
              .select("id")
              .eq("numero_deliberacao", fields.numero_deliberacao)
              .eq("agencia_id", agencia_id_detected)
              .maybeSingle();
            if (existingDelib) semantic_duplicate = true;
          }

          if (!semantic_duplicate && fields.data_reuniao && agencia_id_detected && fields.interessado) {
            const { data: existingByDate } = await db
              .from("deliberacoes")
              .select("id")
              .eq("data_reuniao", fields.data_reuniao)
              .eq("agencia_id", agencia_id_detected)
              .eq("interessado", fields.interessado)
              .maybeSingle();
            if (existingByDate) semantic_duplicate = true;
          }
        }

        // Se for ata, extrair items individuais para preview
        let ata_items: Array<{
          item_numero: string; processo: string | null; assunto: string | null;
          interessado: string | null; relator: string | null;
          decisao: string | null; resultado: string | null; microtema: string;
        }> | undefined;

        if (tipo_documento === "ata") {
          const rawItems = splitAtaItems(extraction.text);
          const ataMeta = extractAtaMetadata(extraction.text);
          ata_items = rawItems.map((item) => ({
            item_numero: item.item_numero,
            processo: item.processo,
            assunto: item.assunto,
            interessado: item.interessado,
            relator: item.relator,
            decisao: item.decisao?.slice(0, 500) ?? null,
            resultado: item.resultado,
            microtema: classifyMicrotema(item.raw_text, agencia_sigla_detected).microtema,
          }));
          // Sobrescrever data se o campo estava vazio (deliberação não detectou, mas ata sim)
          if (!fields.data_reuniao && ataMeta.data_reuniao) {
            fields.data_reuniao = ataMeta.data_reuniao;
          }
        }

        return {
          filename: file.name,
          status: confidence >= 0.5 ? "ok" : "low_confidence",
          fields: {
            numero_deliberacao: fields.numero_deliberacao,
            numero_reuniao: fields.numero_reuniao,
            reuniao_ordinaria: fields.reuniao_ordinaria,
            tipo_reuniao: fields.tipo_reuniao,
            tipo_documento,
            data_reuniao: fields.data_reuniao,
            interessado: fields.interessado,
            assunto: fields.assunto,
            procedencia: fields.procedencia,
            relator: null, // deliberações individuais não têm relator global
            item_numero: null,
            processo: fields.processo,
            resultado: fields.resultado,
            decisoes_todas: fields.decisoes_todas,
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
          is_duplicate: is_duplicate || semantic_duplicate,
          duplicate_job_id,
          agencia_id_detected,
          agencia_sigla_detected,
          ...(ata_items ? { ata_items } : {}),
          extraction_raw: {
            numero_deliberacao: fields.numero_deliberacao,
            reuniao_ordinaria: fields.reuniao_ordinaria,
            numero_reuniao: fields.numero_reuniao,
            tipo_reuniao: fields.tipo_reuniao,
            data_reuniao: fields.data_reuniao,
            interessado: fields.interessado,
            procedencia: fields.procedencia,
            processo: fields.processo,
            assunto: fields.assunto,
            resultado: fields.resultado,
            decisoes_todas: fields.decisoes_todas,
            microtema,
            pauta_interna,
            resumo_pleito: fields.resumo_pleito,
            fundamento_decisao: fields.fundamento_decisao,
            nomes_votacao: fields.nomes_votacao,
            nomes_votacao_favor: fields.nomes_votacao_favor,
            nomes_votacao_contra: fields.nomes_votacao_contra,
            signatarios: fields.signatarios,
            unanimidade_detectada: fields.unanimidade_detectada,
            confidence,
            page_count: extraction.pageCount,
            chars_per_page: extraction.charsPerPage,
            agencia_sigla_detected,
            semantic_duplicate,
          },
        };
      })
    );

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
      numero_reuniao: null,
      reuniao_ordinaria: null,
      tipo_reuniao: null,
      tipo_documento: "deliberacao" as const,
      data_reuniao: null,
      interessado: null,
      assunto: null,
      procedencia: null,
      relator: null,
      item_numero: null,
      processo: null,
      resultado: null,
      decisoes_todas: [],
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
