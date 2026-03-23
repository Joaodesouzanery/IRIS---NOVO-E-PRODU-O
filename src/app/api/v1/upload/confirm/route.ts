/**
 * POST /api/v1/upload/confirm
 * Recebe as deliberações revisadas pelo usuário e persiste no Supabase.
 * Demo mode: processa localmente e retorna as deliberações para localStorage.
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  ConfirmDelib,
  BatchConfirmResponse,
  ConfirmResult,
  Resultado,
  Deliberacao,
  VotoEmbutido,
} from "@/types";

// Allowlist de resultados válidos — evita injeção de valores arbitrários
const RESULTADOS_VALIDOS = new Set<string>([
  "Deferido", "Indeferido", "Parcialmente Deferido", "Retirado de Pauta",
  "Ratificado", "Aprovado", "Aprovado com Ressalvas", "Aprovado por Unanimidade",
  "Recomendado", "Determinado", "Autorizado",
]);

const MICROTEMAS_VALIDOS = new Set<string>([
  "tarifa", "obras", "multa", "contrato", "reequilibrio",
  "fiscalizacao", "seguranca", "ambiental", "desapropriacao",
  "adimplencia", "pessoal", "usuario", "outros",
]);

const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isDemo(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function sanitizeDelib(d: ConfirmDelib): ConfirmDelib {
  return {
    filename: String(d.filename ?? "").slice(0, 255),
    numero_deliberacao: d.numero_deliberacao ? String(d.numero_deliberacao).slice(0, 50) : null,
    reuniao_ordinaria: d.reuniao_ordinaria ? String(d.reuniao_ordinaria).slice(0, 100) : null,
    data_reuniao: d.data_reuniao && RE_ISO_DATE.test(d.data_reuniao) ? d.data_reuniao : null,
    interessado: d.interessado ? String(d.interessado).slice(0, 255) : null,
    assunto: d.assunto ? String(d.assunto).slice(0, 500) : null,
    processo: d.processo ? String(d.processo).slice(0, 100) : null,
    resultado: d.resultado && RESULTADOS_VALIDOS.has(d.resultado)
      ? (d.resultado as Resultado)
      : null,
    microtema: d.microtema && MICROTEMAS_VALIDOS.has(d.microtema) ? d.microtema : "outros",
    pauta_interna: Boolean(d.pauta_interna),
    resumo_pleito: d.resumo_pleito ? String(d.resumo_pleito).slice(0, 2000) : null,
    fundamento_decisao: d.fundamento_decisao ? String(d.fundamento_decisao).slice(0, 2000) : null,
    nomes_votacao: Array.isArray(d.nomes_votacao)
      ? d.nomes_votacao.slice(0, 20).map((n) => String(n).slice(0, 100))
      : [],
    nomes_votacao_contra: Array.isArray(d.nomes_votacao_contra)
      ? d.nomes_votacao_contra.slice(0, 20).map((n) => String(n).slice(0, 100))
      : [],
    extraction_confidence:
      typeof d.extraction_confidence === "number" &&
      d.extraction_confidence >= 0 &&
      d.extraction_confidence <= 1
        ? d.extraction_confidence
        : 0,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { agencia_id?: unknown; deliberacoes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON inválido" }, { status: 400 });
  }

  const { agencia_id, deliberacoes } = body;

  if (!agencia_id || typeof agencia_id !== "string") {
    return NextResponse.json({ error: "agencia_id é obrigatório" }, { status: 400 });
  }

  if (!Array.isArray(deliberacoes) || deliberacoes.length === 0) {
    return NextResponse.json(
      { error: "deliberacoes deve ser um array não vazio" },
      { status: 400 }
    );
  }

  if (deliberacoes.length > 1000) {
    return NextResponse.json(
      { error: "Máximo de 1000 deliberações por envio" },
      { status: 400 }
    );
  }

  // ── Demo mode ─────────────────────────────────────────────────────────────
  if (isDemo()) {
    const { demoData } = await import("@/lib/demo-data");
    const { findBestMatch } = await import("@/lib/server/name-matcher");

    // Diretores da agência para name-matching
    const diretoresList = demoData.mandatos()
      .filter((m) => m.agencia_id === agencia_id)
      .map((m) => ({ id: m.diretor_id, nome: m.diretor_nome, nome_variantes: [] as string[] }));

    const createdDelibs: Deliberacao[] = [];
    const results: ConfirmResult[] = [];

    for (const raw of deliberacoes) {
      const d = sanitizeDelib(raw as ConfirmDelib);
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const nomesContra = new Set(d.nomes_votacao_contra);

      // Unanimidade fallback: se não há nomes → todos os diretores da agência votam a favor
      const votingNames =
        d.nomes_votacao.length > 0
          ? d.nomes_votacao
          : diretoresList.map((dir) => dir.nome);

      const votos: VotoEmbutido[] = votingNames.map((nome) => {
        const match = findBestMatch(nome, diretoresList);
        const isContra = nomesContra.has(nome);
        return {
          id: `local-v-${Math.random().toString(36).slice(2, 9)}`,
          diretor_id: match?.diretorId ?? nome,
          diretor_nome: match?.diretorId
            ? (diretoresList.find((d) => d.id === match.diretorId)?.nome ?? nome)
            : nome,
          tipo_voto: isContra ? "Desfavoravel" : "Favoravel",
          is_divergente: isContra,
          is_nominal: (match?.diretorId ?? null) !== null,
        };
      });

      createdDelibs.push({
        id,
        agencia_id,
        numero_deliberacao: d.numero_deliberacao,
        reuniao_ordinaria: d.reuniao_ordinaria,
        data_reuniao: d.data_reuniao,
        interessado: d.interessado,
        assunto: d.assunto,
        processo: d.processo,
        resultado: d.resultado as Resultado | null,
        microtema: d.microtema,
        pauta_interna: d.pauta_interna,
        resumo_pleito: d.resumo_pleito,
        fundamento_decisao: d.fundamento_decisao,
        auto_classified: true,
        extraction_confidence: d.extraction_confidence,
        created_at: new Date().toISOString(),
        votos,
      });

      results.push({ filename: d.filename, status: "created", deliberacao_id: id });
    }

    const response: BatchConfirmResponse = {
      created: createdDelibs.length,
      errors: 0,
      results,
      deliberacoes: createdDelibs,
    };
    return NextResponse.json(response, { status: 201 });
  }

  // ── Supabase mode ──────────────────────────────────────────────────────────
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const { findBestMatch } = await import("@/lib/server/name-matcher");

    const db = createSupabaseServerClient();

    // Verifica se a agência existe
    const { data: agencia } = await db
      .from("agencias")
      .select("id")
      .eq("id", agencia_id)
      .single();

    if (!agencia) {
      return NextResponse.json({ error: "Agência não encontrada" }, { status: 404 });
    }

    // Carrega diretores da agência para name-matching
    const { data: diretores } = await db
      .from("diretores")
      .select("id, nome")
      .eq("agencia_id", agencia_id);

    const diretoresList = (diretores ?? []).map((d) => ({
      id: d.id,
      nome: d.nome,
      nome_variantes: [] as string[],
    }));

    const results: ConfirmResult[] = [];

    for (const raw of deliberacoes) {
      const d = sanitizeDelib(raw as ConfirmDelib);

      try {
        const { data: delib, error: deliberacaoErr } = await db
          .from("deliberacoes")
          .insert({
            numero_deliberacao: d.numero_deliberacao,
            reuniao_ordinaria: d.reuniao_ordinaria,
            processo: d.processo,
            interessado: d.interessado,
            assunto: d.assunto,
            microtema: d.microtema,
            resultado: d.resultado,
            pauta_interna: d.pauta_interna,
            data_reuniao: d.data_reuniao,
            agencia_id,
            auto_classified: true,
            extraction_confidence: d.extraction_confidence,
            resumo_pleito: d.resumo_pleito,
            fundamento_decisao: d.fundamento_decisao,
          })
          .select("id")
          .single();

        if (deliberacaoErr || !delib) {
          results.push({
            filename: d.filename,
            status: "error",
            error: deliberacaoErr?.message ?? "Erro ao inserir deliberação",
          });
          continue;
        }

        // Cria votos com direção correta e fallback de unanimidade
        const nomesContra = new Set(d.nomes_votacao_contra);

        // Unanimidade fallback: sem nomes → todos os diretores da agência
        const votingNames =
          d.nomes_votacao.length > 0
            ? d.nomes_votacao
            : diretoresList.map((dir) => dir.nome);

        if (votingNames.length > 0) {
          const votoRows = votingNames
            .map((nome) => {
              const match = findBestMatch(nome, diretoresList);
              const isContra = nomesContra.has(nome);
              return {
                deliberacao_id: delib.id as string,
                diretor_id: match?.diretorId ?? null,
                tipo_voto: isContra ? ("Desfavoravel" as const) : ("Favoravel" as const),
                is_divergente: isContra,
                is_nominal: (match?.diretorId ?? null) !== null,
              };
            })
            .filter((v) => v.diretor_id !== null);

          if (votoRows.length > 0) {
            await db.from("votos").insert(votoRows);
          }
        }

        results.push({
          filename: d.filename,
          status: "created",
          deliberacao_id: delib.id as string,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ filename: d.filename, status: "error", error: message });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const errors = results.filter((r) => r.status === "error").length;

    const response: BatchConfirmResponse = { created, errors, results };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[upload/confirm] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
