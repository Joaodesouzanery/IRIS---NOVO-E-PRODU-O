/**
 * POST /api/v1/upload/confirm
 * Recebe as deliberações revisadas pelo usuário e persiste no Supabase.
 * Demo mode: processa localmente e retorna as deliberações para localStorage.
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemo } from "@/lib/server/is-demo";
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
  // ARTESP
  "tarifa", "obras", "multa", "contrato", "reequilibrio",
  "fiscalizacao", "seguranca", "ambiental", "desapropriacao",
  "adimplencia", "pessoal", "usuario",
  // ANM (mineração)
  "lavra", "pesquisa", "licenciamento", "servidao", "cfem",
  "disponibilidade", "recursos",
  // Genérico
  "outros",
]);

const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;


const TIPOS_REUNIAO_VALIDOS = new Set(["Ordinaria", "Extraordinaria"]);
const TIPOS_DOCUMENTO_VALIDOS = new Set(["deliberacao", "ata", "resolucao", "portaria"]);

function sanitizeDelib(d: ConfirmDelib): ConfirmDelib {
  return {
    filename: String(d.filename ?? "").slice(0, 255),
    numero_deliberacao: d.numero_deliberacao ? String(d.numero_deliberacao).slice(0, 50) : null,
    numero_reuniao: d.numero_reuniao ? String(d.numero_reuniao).slice(0, 10) : null,
    reuniao_ordinaria: d.reuniao_ordinaria ? String(d.reuniao_ordinaria).slice(0, 100) : null,
    tipo_reuniao: d.tipo_reuniao && TIPOS_REUNIAO_VALIDOS.has(d.tipo_reuniao) ? d.tipo_reuniao : null,
    tipo_documento: d.tipo_documento && TIPOS_DOCUMENTO_VALIDOS.has(d.tipo_documento)
      ? d.tipo_documento : "deliberacao",
    data_reuniao: d.data_reuniao && RE_ISO_DATE.test(d.data_reuniao) ? d.data_reuniao : null,
    interessado: d.interessado ? String(d.interessado).slice(0, 255) : null,
    assunto: d.assunto ? String(d.assunto).slice(0, 500) : null,
    procedencia: d.procedencia ? String(d.procedencia).slice(0, 200) : null,
    relator: d.relator ? String(d.relator).slice(0, 200) : null,
    item_numero: d.item_numero ? String(d.item_numero).slice(0, 20) : null,
    processo: d.processo ? String(d.processo).slice(0, 100) : null,
    resultado: d.resultado && RESULTADOS_VALIDOS.has(d.resultado)
      ? (d.resultado as Resultado)
      : null,
    decisoes_todas: Array.isArray(d.decisoes_todas)
      ? d.decisoes_todas.filter((v) => RESULTADOS_VALIDOS.has(v)).slice(0, 10)
      : [],
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
    extraction_raw: d.extraction_raw && typeof d.extraction_raw === "object" ? d.extraction_raw : undefined,
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

    // Helper para criar votos
    function buildVotos(nomes: string[], contra: Set<string>): VotoEmbutido[] {
      const votingNames = nomes.length > 0 ? nomes : diretoresList.map((dir) => dir.nome);
      return votingNames.map((nome) => {
        const match = findBestMatch(nome, diretoresList);
        const isContra = contra.has(nome);
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
    }

    for (const raw of deliberacoes) {
      const d = sanitizeDelib(raw as ConfirmDelib);
      const nomesContra = new Set(d.nomes_votacao_contra);
      const rawConfirm = raw as ConfirmDelib;

      // ── Ata com items: expandir em N+1 deliberações ────────────────────
      if (d.tipo_documento === "ata" && rawConfirm.ata_items && rawConfirm.ata_items.length > 0) {
        const paiId = `local-ata-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        // Criar ata-pai (registro envelope)
        createdDelibs.push({
          id: paiId,
          agencia_id,
          numero_deliberacao: d.numero_deliberacao,
          numero_reuniao: d.numero_reuniao,
          reuniao_ordinaria: d.reuniao_ordinaria,
          tipo_reuniao: d.tipo_reuniao as "Ordinaria" | "Extraordinaria" | null,
          tipo_documento: "ata",
          data_reuniao: d.data_reuniao,
          interessado: null,
          assunto: `Ata da ${d.numero_reuniao ?? ""}ª Reunião - ${rawConfirm.ata_items.length} processos`,
          procedencia: d.procedencia,
          relator: null,
          item_numero: null,
          documento_pai_id: null,
          processo: null,
          resultado: null,
          decisoes_todas: [],
          microtema: null,
          pauta_interna: false,
          resumo_pleito: null,
          fundamento_decisao: null,
          auto_classified: true,
          extraction_confidence: 1,
          created_at: new Date().toISOString(),
          votos: [],
          raw_extraction: d.extraction_raw ?? null,
        });

        // Criar deliberação-filha para cada item
        for (const item of rawConfirm.ata_items) {
          const childId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          createdDelibs.push({
            id: childId,
            agencia_id,
            numero_deliberacao: d.numero_reuniao
              ? `ATA-${d.numero_reuniao}-${item.item_numero}` : null,
            numero_reuniao: d.numero_reuniao,
            reuniao_ordinaria: d.reuniao_ordinaria,
            tipo_reuniao: d.tipo_reuniao as "Ordinaria" | "Extraordinaria" | null,
            tipo_documento: "ata",
            data_reuniao: d.data_reuniao,
            interessado: item.interessado,
            assunto: item.assunto,
            procedencia: null,
            relator: item.relator,
            item_numero: item.item_numero,
            documento_pai_id: paiId,
            processo: item.processo,
            resultado: item.resultado as Resultado | null,
            decisoes_todas: [],
            microtema: item.microtema,
            pauta_interna: false,
            resumo_pleito: item.decisao?.slice(0, 2000) ?? null,
            fundamento_decisao: null,
            auto_classified: true,
            extraction_confidence: item.processo ? 0.8 : 0.4,
            created_at: new Date().toISOString(),
            votos: buildVotos(d.nomes_votacao, nomesContra),
            raw_extraction: null,
          });
        }

        results.push({ filename: d.filename, status: "created", deliberacao_id: paiId });
        continue;
      }

      // ── Deliberação individual ──────────────────────────────────────────
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const votos = buildVotos(d.nomes_votacao, nomesContra);

      createdDelibs.push({
        id,
        agencia_id,
        numero_deliberacao: d.numero_deliberacao,
        numero_reuniao: d.numero_reuniao,
        reuniao_ordinaria: d.reuniao_ordinaria,
        tipo_reuniao: d.tipo_reuniao as "Ordinaria" | "Extraordinaria" | null,
        tipo_documento: (d.tipo_documento ?? "deliberacao") as "deliberacao" | "ata" | "resolucao" | "portaria",
        data_reuniao: d.data_reuniao,
        interessado: d.interessado,
        assunto: d.assunto,
        procedencia: d.procedencia,
        relator: d.relator ?? null,
        item_numero: d.item_numero ?? null,
        documento_pai_id: null,
        processo: d.processo,
        resultado: d.resultado as Resultado | null,
        decisoes_todas: d.decisoes_todas,
        microtema: d.microtema,
        pauta_interna: d.pauta_interna,
        resumo_pleito: d.resumo_pleito,
        fundamento_decisao: d.fundamento_decisao,
        auto_classified: true,
        extraction_confidence: d.extraction_confidence,
        created_at: new Date().toISOString(),
        votos,
        raw_extraction: d.extraction_raw ?? null,
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
            numero_reuniao: d.numero_reuniao,
            reuniao_ordinaria: d.reuniao_ordinaria,
            tipo_reuniao: d.tipo_reuniao,
            tipo_documento: d.tipo_documento ?? "deliberacao",
            processo: d.processo,
            interessado: d.interessado,
            assunto: d.assunto,
            procedencia: d.procedencia,
            relator: d.relator,
            item_numero: d.item_numero,
            microtema: d.microtema,
            resultado: d.resultado,
            decisoes_todas: d.decisoes_todas.length > 0 ? d.decisoes_todas : null,
            pauta_interna: d.pauta_interna,
            data_reuniao: d.data_reuniao,
            agencia_id,
            auto_classified: true,
            extraction_confidence: d.extraction_confidence,
            resumo_pleito: d.resumo_pleito,
            fundamento_decisao: d.fundamento_decisao,
            raw_extraction: d.extraction_raw ?? null,
          })
          .select("id")
          .single();

        if (deliberacaoErr || !delib) {
          console.error("[upload/confirm] Erro ao inserir deliberação:", deliberacaoErr);
          results.push({
            filename: d.filename,
            status: "error",
            error: "Erro ao inserir deliberação",
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
        console.error("[upload/confirm] Erro inesperado ao processar deliberação:", err);
        results.push({ filename: d.filename, status: "error", error: "Erro interno ao processar deliberação" });
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
