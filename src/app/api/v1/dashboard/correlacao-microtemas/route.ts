/**
 * GET /api/v1/dashboard/correlacao-microtemas
 * Retorna correlação de co-ocorrência entre microtemas nas mesmas reuniões.
 * Coeficiente = co_ocorrencias / min(total_a, total_b)  →  0 a 1.
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/server/is-demo";
import { computeCorrelacaoMicrotemas } from "@/lib/server/analytics-engine";

const UUID_RE = /^[0-9a-f-]{32,36}$/i;

export async function GET(req: NextRequest) {
  const agenciaId = req.nextUrl.searchParams.get("agencia_id") || null;

  if (agenciaId && !UUID_RE.test(agenciaId)) {
    return NextResponse.json({ error: "agencia_id inválido" }, { status: 400 });
  }

  if (isDemo()) {
    const { demoData } = await import("@/lib/demo-data");
    return NextResponse.json(
      computeCorrelacaoMicrotemas(demoData.deliberacoes().data, agenciaId)
    );
  }

  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const db = createSupabaseServerClient();

    let query = db
      .from("deliberacoes")
      .select("data_reuniao, microtema")
      .not("microtema", "is", null)
      .not("data_reuniao", "is", null);

    if (agenciaId) query = query.eq("agencia_id", agenciaId);

    const { data, error } = await query;

    if (error) {
      console.error("[correlacao-microtemas] Erro ao buscar dados:", error);
      return NextResponse.json({ error: "Erro ao calcular correlação" }, { status: 500 });
    }

    const rows = data ?? [];
    const byReuniaoMap = new Map<string, Set<string>>();
    for (const row of rows) {
      const key = row.data_reuniao as string;
      if (!byReuniaoMap.has(key)) byReuniaoMap.set(key, new Set());
      byReuniaoMap.get(key)!.add(row.microtema as string);
    }

    const reunioes = [...byReuniaoMap.values()];
    const totalReunioes = reunioes.length;

    const temaCount = new Map<string, number>();
    const coOcorrencias = new Map<string, Map<string, number>>();

    for (const temas of reunioes) {
      const arr = [...temas];
      for (const t of arr) {
        temaCount.set(t, (temaCount.get(t) ?? 0) + 1);
      }
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const [a, b] = [arr[i], arr[j]].sort();
          if (!coOcorrencias.has(a)) coOcorrencias.set(a, new Map());
          const inner = coOcorrencias.get(a)!;
          inner.set(b, (inner.get(b) ?? 0) + 1);
        }
      }
    }

    const topPares: Array<{ tema_a: string; tema_b: string; coeficiente: number; co_ocorrencias: number }> = [];
    for (const [a, bMap] of coOcorrencias) {
      for (const [b, co] of bMap) {
        const minCount = Math.min(temaCount.get(a) ?? 1, temaCount.get(b) ?? 1);
        topPares.push({
          tema_a: a, tema_b: b,
          coeficiente: Math.round((co / minCount) * 100) / 100,
          co_ocorrencias: co,
        });
      }
    }
    topPares.sort((x, y) => y.coeficiente - x.coeficiente);

    const temas = [...temaCount.keys()].sort();
    const matriz: Record<string, Record<string, number>> = {};
    for (const t of temas) {
      matriz[t] = {};
      for (const u of temas) {
        if (t === u) {
          matriz[t][u] = 1;
        } else {
          const [a, b] = [t, u].sort();
          const minC = Math.min(temaCount.get(a) ?? 1, temaCount.get(b) ?? 1);
          const co = coOcorrencias.get(a)?.get(b) ?? 0;
          matriz[t][u] = Math.round((co / minC) * 100) / 100;
        }
      }
    }

    return NextResponse.json({ topPares: topPares.slice(0, 10), matriz, totalReunioes });
  } catch (error) {
    console.error("[correlacao-microtemas] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
