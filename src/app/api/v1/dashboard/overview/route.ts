/**
 * GET /api/v1/dashboard/overview
 * KPIs principais do dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const db = createSupabaseServerClient();
  const agenciaId = req.nextUrl.searchParams.get("agencia_id");

  let baseFilter = db.from("deliberacoes").select("id, resultado, microtema, data_reuniao, extraction_confidence");
  if (agenciaId) baseFilter = baseFilter.eq("agencia_id", agenciaId);

  const { data: deliberacoes, error } = await baseFilter;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar overview" }, { status: 500 });
  }

  const rows = deliberacoes ?? [];
  const total = rows.length;
  const deferidos = rows.filter((r) => r.resultado === "Deferido").length;
  const indeferidos = rows.filter((r) => r.resultado === "Indeferido").length;
  const semResultado = rows.filter((r) => !r.resultado).length;

  const avgConfidence =
    total > 0
      ? rows
          .filter((r) => r.extraction_confidence !== null)
          .reduce((sum, r) => sum + (r.extraction_confidence ?? 0), 0) /
        rows.filter((r) => r.extraction_confidence !== null).length
      : 0;

  // Reuniões únicas (data)
  const reunioesUnicas = new Set(rows.map((r) => r.data_reuniao).filter(Boolean)).size;

  // Microtema mais comum
  const microtemaCount = new Map<string, number>();
  for (const r of rows) {
    if (r.microtema) {
      microtemaCount.set(r.microtema, (microtemaCount.get(r.microtema) ?? 0) + 1);
    }
  }
  const topMicrotema =
    microtemaCount.size > 0
      ? [...microtemaCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

  return NextResponse.json({
    total_deliberacoes: total,
    deferidos,
    indeferidos,
    sem_resultado: semResultado,
    taxa_deferimento: total > 0 ? ((deferidos / total) * 100).toFixed(1) : "0",
    reunioes_unicas: reunioesUnicas,
    avg_confidence: avgConfidence,
    top_microtema: topMicrotema,
  });
}
