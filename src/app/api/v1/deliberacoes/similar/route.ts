/**
 * GET /api/v1/deliberacoes/similar?id={uuid}&limit=5
 * Retorna as deliberações semanticamente mais similares a uma dada deliberação.
 *
 * Se pgvector + OPENAI_API_KEY estiverem disponíveis: usa cosine similarity.
 * Fallback: busca ILIKE pelo assunto (sem semântica, mas sempre funciona).
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/server/is-demo";

const UUID_RE = /^[0-9a-f-]{32,36}$/i;

export interface SimilarResult {
  id: string;
  numero_deliberacao: string | null;
  data_reuniao: string | null;
  interessado: string | null;
  assunto: string | null;
  resultado: string | null;
  microtema: string | null;
  similarity: number;
  method: "vector" | "text";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const limitParam = searchParams.get("limit") ?? "5";
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 20);

  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "id inválido ou ausente" }, { status: 400 });
  }

  if (isDemo()) {
    // Demo mode: retorna deliberações da demo com similarity simulada
    const { demoData } = await import("@/lib/demo-data");
    const all = demoData.deliberacoes().data;
    const base = all.find((d) => d.id === id);
    if (!base) return NextResponse.json({ results: [] });

    const similar = all
      .filter((d) => d.id !== id && d.microtema === base.microtema)
      .slice(0, limit)
      .map((d, i) => ({
        id: d.id,
        numero_deliberacao: d.numero_deliberacao,
        data_reuniao: d.data_reuniao,
        interessado: d.interessado,
        assunto: (d as Record<string, unknown>).assunto as string | null ?? d.resumo_pleito ?? null,
        resultado: d.resultado,
        microtema: d.microtema,
        similarity: Math.round((0.85 - i * 0.05) * 100) / 100,
        method: "text" as const,
      }));

    return NextResponse.json({ results: similar });
  }

  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const db = createSupabaseServerClient();

    // Busca a deliberação base
    const { data: base, error: baseErr } = await db
      .from("deliberacoes")
      .select("id, assunto, interessado, microtema, agencia_id, embedding")
      .eq("id", id)
      .single();

    if (baseErr || !base) {
      return NextResponse.json({ error: "Deliberação não encontrada" }, { status: 404 });
    }

    // ── Tentativa 1: busca vetorial com pgvector ────────────────────────────
    if (base.embedding && process.env.OPENAI_API_KEY) {
      const { data: similar, error: vecErr } = await db.rpc("buscar_similares", {
        query_embedding: base.embedding,
        agencia_id_filter: base.agencia_id ?? null,
        limit_n: limit + 1, // +1 para excluir a própria deliberação
      });

      if (!vecErr && similar && similar.length > 0) {
        const results: SimilarResult[] = (similar as Array<Record<string, unknown>>)
          .filter((r) => r.id !== id)
          .slice(0, limit)
          .map((r) => ({
            id: r.id as string,
            numero_deliberacao: r.numero_deliberacao as string | null,
            data_reuniao: r.data_reuniao as string | null,
            interessado: r.interessado as string | null,
            assunto: r.assunto as string | null,
            resultado: r.resultado as string | null,
            microtema: r.microtema as string | null,
            similarity: r.similarity as number,
            method: "vector" as const,
          }));

        return NextResponse.json({ results });
      }
    }

    // ── Fallback: busca textual por microtema + assunto ILIKE ──────────────
    const escaped = (base.assunto ?? "").trim().replace(/[\\%_]/g, "\\$&").slice(0, 100);
    let fallbackQuery = db
      .from("deliberacoes")
      .select("id, numero_deliberacao, data_reuniao, interessado, assunto, resultado, microtema")
      .neq("id", id)
      .eq("agencia_id", base.agencia_id)
      .limit(limit);

    if (base.microtema) {
      fallbackQuery = fallbackQuery.eq("microtema", base.microtema);
    } else if (escaped.length > 5) {
      fallbackQuery = fallbackQuery.ilike("assunto", `%${escaped}%`);
    }

    const { data: fallback } = await fallbackQuery;

    const results: SimilarResult[] = (fallback ?? []).map((r, i) => ({
      id: r.id as string,
      numero_deliberacao: r.numero_deliberacao as string | null,
      data_reuniao: r.data_reuniao as string | null,
      interessado: r.interessado as string | null,
      assunto: r.assunto as string | null,
      resultado: r.resultado as string | null,
      microtema: r.microtema as string | null,
      similarity: Math.round((0.75 - i * 0.03) * 100) / 100,
      method: "text" as const,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[deliberacoes/similar] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
