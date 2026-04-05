/**
 * GET /api/v1/dashboard/concentracao
 * Retorna o Índice de Concentração Regulatória (HHI) por agência.
 * HHI = Σ(share_empresa²) → 0 (disperso) a 1 (concentrado).
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/server/is-demo";
import { computeHHI } from "@/lib/server/analytics-engine";

const UUID_RE = /^[0-9a-f-]{32,36}$/i;

export async function GET(req: NextRequest) {
  const agenciaId = req.nextUrl.searchParams.get("agencia_id") || null;

  if (agenciaId && !UUID_RE.test(agenciaId)) {
    return NextResponse.json({ error: "agencia_id inválido" }, { status: 400 });
  }

  if (isDemo()) {
    const { demoData } = await import("@/lib/demo-data");
    return NextResponse.json(computeHHI(demoData.deliberacoes().data, agenciaId));
  }

  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const db = createSupabaseServerClient();

    let query = db
      .from("deliberacoes")
      .select("interessado, agencia_id")
      .not("interessado", "is", null);

    if (agenciaId) query = query.eq("agencia_id", agenciaId);

    const { data, error } = await query;

    if (error) {
      console.error("[concentracao] Erro ao buscar dados:", error);
      return NextResponse.json({ error: "Erro ao calcular concentração" }, { status: 500 });
    }

    // Calcula HHI sobre os dados retornados do banco
    const total = data?.length ?? 0;
    if (total === 0) {
      return NextResponse.json({ hhi: 0, nivel: "baixo", total: 0, top10: [] });
    }

    const countByEmpresa = new Map<string, number>();
    for (const row of data ?? []) {
      const emp = (row.interessado as string).trim();
      countByEmpresa.set(emp, (countByEmpresa.get(emp) ?? 0) + 1);
    }

    let hhi = 0;
    for (const count of countByEmpresa.values()) {
      const share = count / total;
      hhi += share * share;
    }

    const nivel = hhi < 0.15 ? "baixo" : hhi < 0.25 ? "moderado" : "alto";

    const top10 = [...countByEmpresa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([empresa, count]) => ({
        empresa,
        count,
        share_pct: Math.round((count / total) * 1000) / 10,
      }));

    return NextResponse.json({
      hhi: Math.round(hhi * 10000) / 10000,
      nivel,
      total,
      top10,
    });
  } catch (error) {
    console.error("[concentracao] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
