/**
 * GET /api/v1/deliberacoes/export
 * Exporta deliberações filtradas como CSV.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const db = createSupabaseServerClient();

  let query = db.from("deliberacoes").select(
    `numero_deliberacao, reuniao_ordinaria, data_reuniao,
     interessado, processo, microtema, resultado,
     pauta_interna, extraction_confidence, created_at,
     agencias (sigla)`
  );

  const agenciaId = searchParams.get("agencia_id");
  if (agenciaId) query = query.eq("agencia_id", agenciaId);

  const year = searchParams.get("year");
  if (year) {
    query = query.gte("data_reuniao", `${year}-01-01`).lte("data_reuniao", `${year}-12-31`);
  }

  const microtema = searchParams.get("microtema");
  if (microtema) query = query.eq("microtema", microtema);

  const resultado = searchParams.get("resultado");
  if (resultado) query = query.eq("resultado", resultado);

  query = query.order("data_reuniao", { ascending: false }).limit(5000);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao exportar" }, { status: 500 });
  }

  const rows = data ?? [];

  // Cabeçalho CSV
  const headers = [
    "Numero",
    "Reuniao",
    "Data",
    "Interessado",
    "Processo",
    "Microtema",
    "Resultado",
    "Pauta Interna",
    "Confiança IA",
    "Agência",
    "Criado Em",
  ];

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csvRows = rows.map((r: any) =>
    [
      escape(r.numero_deliberacao),
      escape(r.reuniao_ordinaria),
      escape(r.data_reuniao),
      escape(r.interessado),
      escape(r.processo),
      escape(r.microtema),
      escape(r.resultado),
      escape(r.pauta_interna ? "Sim" : "Não"),
      escape(r.extraction_confidence != null ? `${(r.extraction_confidence * 100).toFixed(0)}%` : ""),
      escape(r.agencias?.sigla),
      escape(r.created_at),
    ].join(",")
  );

  const csv = [headers.join(","), ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deliberacoes_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
