/**
 * GET /api/v1/mandatos
 * Lista mandatos com dados de diretor, ordenados por data de início.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const db = createSupabaseServerClient();
  const agenciaId = req.nextUrl.searchParams.get("agencia_id");

  let query = db
    .from("mandatos")
    .select(
      `id, data_inicio, data_fim, cargo,
       diretores!inner (id, nome, agencia_id, ativo)`
    )
    .order("data_inicio", { ascending: false });

  if (agenciaId) {
    query = query.eq("diretores.agencia_id", agenciaId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar mandatos" }, { status: 500 });
  }

  const formatted = (data ?? []).map((m: any) => ({
    id: m.id,
    data_inicio: m.data_inicio,
    data_fim: m.data_fim,
    cargo: m.cargo,
    diretor_id: m.diretores.id,
    diretor_nome: m.diretores.nome,
    diretor_ativo: m.diretores.ativo,
    agencia_id: m.diretores.agencia_id,
  }));

  return NextResponse.json(formatted);
}
