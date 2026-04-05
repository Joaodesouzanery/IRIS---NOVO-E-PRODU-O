/**
 * GET /api/v1/deliberacoes
 * Lista deliberações com filtros, paginação e full-text search.
 */

import { NextRequest, NextResponse } from "next/server";
import { demoData } from "@/lib/demo-data";
import { isLocalMode, getSyncedDelibs } from "@/lib/server/local-data-store";
import { computeDelibList } from "@/lib/server/analytics-engine";
import { isDemo } from "@/lib/server/is-demo";

const VALID_SORT_COLUMNS = new Set([
  "data_reuniao",
  "numero_deliberacao",
  "microtema",
  "resultado",
  "interessado",
  "created_at",
]);


export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  if (isDemo()) {
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const agencia_id = searchParams.get("agencia_id") ?? undefined;
    const microtema = searchParams.get("microtema") ?? undefined;
    const resultado = searchParams.get("resultado") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const year = searchParams.get("year") ?? undefined;

    if (isLocalMode()) {
      return NextResponse.json(computeDelibList(getSyncedDelibs(), { page, limit, agencia_id, microtema, resultado, search, year }));
    }

    return NextResponse.json(
      demoData.deliberacoes({
        page,
        limit,
        agencia_id,
        microtema,
        resultado,
        search,
        year,
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
       agencias (sigla, nome),
       votos (id, tipo_voto, is_divergente, diretor_id,
         diretores (nome))`,
      { count: "exact" }
    );

  // Validação de formatos para evitar injeção via query params
  const UUID_RE     = /^[0-9a-f-]{32,36}$/i;
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const YEAR_RE     = /^(19|20)\d{2}$/;

  const agenciaId = searchParams.get("agencia_id");
  if (agenciaId) {
    if (!UUID_RE.test(agenciaId)) {
      return NextResponse.json({ error: "agencia_id inválido" }, { status: 400 });
    }
    query = query.eq("agencia_id", agenciaId);
  }

  const year = searchParams.get("year");
  if (year) {
    if (!YEAR_RE.test(year)) {
      return NextResponse.json({ error: "year deve ser um ano válido (ex: 2024)" }, { status: 400 });
    }
    query = query
      .gte("data_reuniao", `${year}-01-01`)
      .lte("data_reuniao", `${year}-12-31`);
  }

  const dateFrom = searchParams.get("date_from");
  const dateTo   = searchParams.get("date_to");
  if (dateFrom) {
    if (!ISO_DATE_RE.test(dateFrom)) {
      return NextResponse.json({ error: "date_from deve ser YYYY-MM-DD" }, { status: 400 });
    }
    query = query.gte("data_reuniao", dateFrom);
  }
  if (dateTo) {
    if (!ISO_DATE_RE.test(dateTo)) {
      return NextResponse.json({ error: "date_to deve ser YYYY-MM-DD" }, { status: 400 });
    }
    query = query.lte("data_reuniao", dateTo);
  }

  const microtema = searchParams.get("microtema");
  if (microtema) query = query.eq("microtema", microtema);

  const resultado = searchParams.get("resultado");
  if (resultado) query = query.eq("resultado", resultado);

  const pautaInterna = searchParams.get("pauta_interna");
  if (pautaInterna !== null) query = query.eq("pauta_interna", pautaInterna === "true");

  const search = searchParams.get("search");
  if (search && search.trim().length >= 2) {
    // Escapa wildcards do ILIKE para evitar wildcard injection
    const escaped = search.trim().replace(/[\\%_]/g, "\\$&");
    query = query.ilike("raw_text", `%${escaped}%`);
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
    agencia: d.agencias ?? null,
    agencias: undefined,
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

export async function DELETE(req: NextRequest) {
  if (isDemo()) {
    // Demo mode: client handles localStorage deletion
    return NextResponse.json({ deleted: 0, demo: true });
  }

  // Require explicit confirmation header — prevents accidental bulk deletes
  if (req.headers.get("x-confirm-delete") !== "yes") {
    return NextResponse.json(
      { error: "Envie o header x-confirm-delete: yes" },
      { status: 400 }
    );
  }

  // agencia_id obrigatório — nunca permitir delete sem escopo de agência
  const agencia_id = req.nextUrl.searchParams.get("agencia_id");
  if (!agencia_id) {
    return NextResponse.json(
      { error: "agencia_id é obrigatório no DELETE para evitar remoção global" },
      { status: 400 }
    );
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const db = createSupabaseServerClient();

  const { error, count } = await db
    .from("deliberacoes")
    .delete()
    .eq("agencia_id", agencia_id);

  if (error) {
    console.error("[deliberacoes DELETE] Erro:", error);
    return NextResponse.json({ error: "Erro ao deletar deliberações" }, { status: 500 });
  }

  return NextResponse.json({ deleted: count ?? 0 });
}
