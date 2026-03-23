/**
 * POST /api/v1/upload/preview
 * Aceita múltiplos PDFs, extrai campos via NLP e retorna PreviewResult[].
 * NÃO persiste nada — análise pura em memória.
 * Funciona em modo demo e produção (mesma lógica).
 */

import { NextRequest, NextResponse } from "next/server";
import type { PreviewResult, BatchPreviewResponse } from "@/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_FILES_PER_BATCH = 1000;

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

    // Importações server-only (evita bundle no cliente)
    const { isPdfBuffer, extractPdfText } = await import("@/lib/server/pdf-extractor");
    const { extractFields, calcConfidence } = await import("@/lib/server/nlp-extractor");
    const { classifyMicrotema, classifyPautaInterna } = await import("@/lib/server/classifier");

    const results: PreviewResult[] = [];

    for (const file of files) {
      // Validação de tamanho
      if (file.size > MAX_FILE_SIZE) {
        results.push({
          filename: file.name,
          status: "error",
          error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB, máx 50 MB)`,
          fields: emptyFields(),
          confidence: 0,
          page_count: 0,
          chars_per_page: 0,
        });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Validação via magic bytes — não confia na extensão
      if (!isPdfBuffer(buffer)) {
        results.push({
          filename: file.name,
          status: "error",
          error: "Arquivo inválido: não é um PDF (magic bytes incorretos)",
          fields: emptyFields(),
          confidence: 0,
          page_count: 0,
          chars_per_page: 0,
        });
        continue;
      }

      let extraction: Awaited<ReturnType<typeof extractPdfText>>;
      try {
        extraction = await extractPdfText(buffer);
      } catch {
        results.push({
          filename: file.name,
          status: "error",
          error: "Falha ao extrair texto do PDF",
          fields: emptyFields(),
          confidence: 0,
          page_count: 0,
          chars_per_page: 0,
        });
        continue;
      }

      if (!extraction.text || extraction.text.length < 50) {
        results.push({
          filename: file.name,
          status: "error",
          error: "PDF sem texto extraível — possível documento digitalizado (imagem)",
          fields: emptyFields(),
          confidence: 0,
          page_count: extraction.pageCount,
          chars_per_page: 0,
        });
        continue;
      }

      const fields = extractFields(extraction.text);
      const { microtema } = classifyMicrotema(extraction.text);
      const confidence = calcConfidence(fields);

      // classifyPautaInterna retorna true/false; NLP também detecta via keywords
      // Usamos OR para máxima cobertura
      const pauta_interna =
        fields.pauta_interna || classifyPautaInterna(extraction.text);

      const page_count = extraction.pageCount;
      const chars_per_page = extraction.charsPerPage;

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
        },
        confidence,
        page_count,
        chars_per_page,
      });
    }

    const response: BatchPreviewResponse = { results };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[upload/preview] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

function emptyFields() {
  return {
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
    nomes_votacao: [] as string[],
  };
}
