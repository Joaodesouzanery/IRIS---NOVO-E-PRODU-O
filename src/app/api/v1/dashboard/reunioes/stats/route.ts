/**
 * GET /api/v1/dashboard/reunioes/stats
 * Estatísticas de reuniões por mês.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const db = createSupabaseServerClient();
  const agenciaId = req.nextUrl.searchParams.get("agencia_id");

  let query = db
    .from("deliberacoes")
    .select("data_reuniao, resultado")
    .not("data_reuniao", "is", null)
    .order("data_reuniao", { ascending: true });

  if (agenciaId) query = query.eq("agencia_id", agenciaId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar stats de reuniões" }, { status: 500 });
  }

  const monthStats = new Map<
    string,
    { total: number; deferido: number; indeferido: number }
  >();

  for (const row of data ?? []) {
    const d = new Date(row.data_reuniao!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthStats.has(key)) monthStats.set(key, { total: 0, deferido: 0, indeferido: 0 });
    const s = monthStats.get(key)!;
    s.total++;
    if (row.resultado === "Deferido") s.deferido++;
    else if (row.resultado === "Indeferido") s.indeferido++;
  }

  const result = [...monthStats.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, s]) => ({ period, ...s }));

  return NextResponse.json(result);
}
