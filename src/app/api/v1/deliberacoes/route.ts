/**
 * GET /api/v1/deliberacoes
 * Lista deliberações com filtros, paginação e full-text search.
 */

import { NextRequest, NextResponse } from "next/server";
import { demoData } from "@/lib/demo-data";

const VALID_SORT_COLUMNS = new Set([
  "data_reuniao",
  "numero_deliberacao",
  "microtema",
  "resultado",
  "interessado",
  "created_at",
]);

function isDemo(req: NextRequest): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || req.nextUrl.searchParams.get("demo") === "1";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  if (isDemo(req)) {
    return NextResponse.json(
      demoData.deliberacoes({
        page: parseInt(searchParams.get("page") ?? "1", 10),
        limit: parseInt(searchParams.get("limit") ?? "20", 10),
        microtema: searchParams.get("microtema") ?? undefined,
        resultado: searchParams.get("resultado") ?? undefined,
        search: searchParams.get("search") ?? undefined,
      })
    );
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const sortBy = searchParams.get("sort_by") ?? "data_reuniao";
  const sortOrder = searchParams.get("sort_order") === "asc";

  if (!VALID_SORT_COLUMNS.has(sortBy)) {
    return NextResponse.json({ error: "Coluna de ordenação inválida" }, { status: 400 });
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const db = createSupabaseServerClient();
  let query = db
    .from("deliberacoes")
    .select(
      `id, numero_deliberacao, reuniao_ordinaria, data_reuniao,
       interessado, processo, microtema, resultado, pauta_interna,
       extraction_confidence, agencia_id, created_at,
       votos (id, tipo_voto, is_divergente, diretor_id,
         diretores (nome))`,
      { count: "exact" }
    );

  const agenciaId = searchParams.get("agencia_id");
  if (agenciaId) query = query.eq("agencia_id", agenciaId);

  const year = searchParams.get("year");
  if (year) {
    query = query
      .gte("data_reuniao", `${year}-01-01`)
      .lte("data_reuniao", `${year}-12-31`);
  }

  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  if (dateFrom) query = query.gte("data_reuniao", dateFrom);
  if (dateTo) query = query.lte("data_reuniao", dateTo);

  const microtema = searchParams.get("microtema");
  if (microtema) query = query.eq("microtema", microtema);

  const resultado = searchParams.get("resultado");
  if (resultado) query = query.eq("resultado", resultado);

  const pautaInterna = searchParams.get("pauta_interna");
  if (pautaInterna !== null) query = query.eq("pauta_interna", pautaInterna === "true");

  const search = searchParams.get("search");
  if (search && search.trim().length >= 2) {
    query = query.ilike("raw_text", `%${search.trim()}%`);
  }

  query = query
    .order(sortBy, { ascending: sortOrder })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[deliberacoes] Erro:", error);
    return NextResponse.json({ error: "Erro ao buscar deliberações" }, { status: 500 });
  }

  const formatted = (data ?? []).map((d: any) => ({
    ...d,
    votos: (d.votos ?? []).map((v: any) => ({
      id: v.id,
      tipo_voto: v.tipo_voto,
      is_divergente: v.is_divergente,
      diretor_id: v.diretor_id,
      diretor_nome: v.diretores?.nome ?? null,
    })),
  }));

  return NextResponse.json({
    data: formatted,
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}
