/**
 * GET /api/v1/votacao/distribution
 * Distribuição de tipos de voto (para gráfico de pizza).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const db = createSupabaseServerClient();
  const agenciaId = req.nextUrl.searchParams.get("agencia_id");

  let query = db
    .from("votos")
    .select(`tipo_voto, diretores!inner (agencia_id)`);

  if (agenciaId) {
    query = query.eq("diretores.agencia_id", agenciaId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar distribuição" }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const tipo = (row as any).tipo_voto;
    counts.set(tipo, (counts.get(tipo) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  const result = [...counts.entries()].map(([tipo_voto, count]) => ({
    tipo_voto,
    count,
    pct: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
  }));

  return NextResponse.json(result);
}
