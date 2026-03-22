/**
 * GET /api/v1/diretores
 * Lista diretores, opcionalmente filtrados por agência.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const db = createSupabaseServerClient();
  const agenciaId = req.nextUrl.searchParams.get("agencia_id");

  let query = db
    .from("diretores")
    .select("*, mandatos (id, data_inicio, data_fim, cargo)")
    .order("nome", { ascending: true });

  if (agenciaId) query = query.eq("agencia_id", agenciaId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar diretores" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
