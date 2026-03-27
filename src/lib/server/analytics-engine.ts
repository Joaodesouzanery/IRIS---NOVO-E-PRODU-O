/**
 * analytics-engine.ts
 * Pure functions that compute dashboard/analytics from Deliberacao[].
 * Used by API routes when in "local" mode (synced from client localStorage).
 * Each function returns the exact same shape as the corresponding demoData method.
 */

import type { Deliberacao, VotoEmbutido } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filterByAgencia(delibs: Deliberacao[], agenciaId?: string | null): Deliberacao[] {
  return agenciaId ? delibs.filter((d) => d.agencia_id === agenciaId) : delibs;
}

function allVotos(delibs: Deliberacao[]): Array<VotoEmbutido & { delib: Deliberacao }> {
  const result: Array<VotoEmbutido & { delib: Deliberacao }> = [];
  for (const d of delibs) {
    for (const v of d.votos ?? []) {
      result.push({ ...v, delib: d });
    }
  }
  return result;
}

// ─── 19. extractDirectors ────────────────────────────────────────────────────

export function extractDirectors(delibs: Deliberacao[]) {
  const map = new Map<string, { id: string; nome: string; agencia_id: string }>();
  for (const d of delibs) {
    for (const v of d.votos ?? []) {
      if (!map.has(v.diretor_id)) {
        map.set(v.diretor_id, {
          id: v.diretor_id,
          nome: v.diretor_nome ?? v.diretor_id,
          agencia_id: d.agencia_id ?? "",
        });
      }
    }
  }
  return [...map.values()];
}

// ─── 1. computeOverview ──────────────────────────────────────────────────────

export function computeOverview(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const total = rows.length;
  const deferidos = rows.filter((r) => r.resultado === "Deferido").length;
  const indeferidos = rows.filter((r) => r.resultado === "Indeferido").length;
  const sem_resultado = rows.filter((r) => !r.resultado).length;

  const withConf = rows.filter((r) => r.extraction_confidence != null);
  const avg_confidence = withConf.length > 0
    ? withConf.reduce((s, r) => s + (r.extraction_confidence ?? 0), 0) / withConf.length
    : 0;

  const reunioes_unicas = new Set(rows.map((r) => r.data_reuniao).filter(Boolean)).size;

  const temaCount = new Map<string, number>();
  for (const r of rows) {
    if (r.microtema) temaCount.set(r.microtema, (temaCount.get(r.microtema) ?? 0) + 1);
  }
  const top_microtema = temaCount.size > 0
    ? [...temaCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const autoClassified = rows.filter((r) => r.auto_classified).length;
  const pauta_interna_count = rows.filter((r) => r.pauta_interna).length;

  return {
    total_deliberacoes: total,
    deferidos,
    indeferidos,
    sem_resultado,
    taxa_deferimento: total > 0 ? ((deferidos / total) * 100).toFixed(1) : "0",
    reunioes_unicas,
    avg_confidence,
    top_microtema,
    auto_classified_pct: total > 0 ? Math.round((autoClassified / total) * 100) : 0,
    pauta_externa: total - pauta_interna_count,
    pauta_interna_count,
  };
}

// ─── 2. computeMicrotemas ────────────────────────────────────────────────────

export function computeMicrotemas(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const stats = new Map<string, { total: number; deferido: number; indeferido: number }>();
  for (const d of rows) {
    const m = d.microtema ?? "outros";
    if (!stats.has(m)) stats.set(m, { total: 0, deferido: 0, indeferido: 0 });
    const s = stats.get(m)!;
    s.total++;
    if (d.resultado === "Deferido") s.deferido++;
    else if (d.resultado === "Indeferido") s.indeferido++;
  }
  return [...stats.entries()]
    .map(([microtema, s]) => ({
      microtema,
      total: s.total,
      deferido: s.deferido,
      indeferido: s.indeferido,
      pct_deferido: s.total > 0 ? (s.deferido / s.total) * 100 : 0,
      pct_indeferido: s.total > 0 ? (s.indeferido / s.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ─── 3. computeMicrotemasEvolution ───────────────────────────────────────────

export function computeMicrotemasEvolution(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const groups = new Map<string, Map<string, number>>();
  for (const d of rows) {
    const period = (d.data_reuniao ?? "").slice(0, 7);
    if (!period) continue;
    if (!groups.has(period)) groups.set(period, new Map());
    const pm = groups.get(period)!;
    const m = d.microtema ?? "outros";
    pm.set(m, (pm.get(m) ?? 0) + 1);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, temas]) => ({ period, ...Object.fromEntries(temas) }));
}

// ─── 4. computeDiretoresOverview ─────────────────────────────────────────────

export function computeDiretoresOverview(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const map = new Map<string, {
    diretor_id: string; diretor_nome: string;
    total: number; favoravel: number; desfavoravel: number; divergente: number;
  }>();

  for (const d of rows) {
    for (const v of d.votos ?? []) {
      if (!v.diretor_id) continue;
      if (!map.has(v.diretor_id)) {
        map.set(v.diretor_id, {
          diretor_id: v.diretor_id,
          diretor_nome: v.diretor_nome ?? v.diretor_id,
          total: 0, favoravel: 0, desfavoravel: 0, divergente: 0,
        });
      }
      const s = map.get(v.diretor_id)!;
      s.total++;
      if (v.tipo_voto === "Favoravel") s.favoravel++;
      else s.desfavoravel++;
      if (v.is_divergente) s.divergente++;
    }
  }

  return [...map.values()]
    .map((s) => ({
      ...s,
      pct_favor: s.total > 0 ? Math.round((s.favoravel / s.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ─── 5. computeReunioesCalendar ──────────────────────────────────────────────

export function computeReunioesCalendar(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const counts = new Map<string, number>();
  for (const d of rows) {
    if (d.data_reuniao) counts.set(d.data_reuniao, (counts.get(d.data_reuniao) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

// ─── 6. computeReunioesStats ─────────────────────────────────────────────────

export function computeReunioesStats(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const byMonth = new Map<string, { total: number; deferido: number; indeferido: number }>();
  for (const d of rows) {
    const period = (d.data_reuniao ?? "").slice(0, 7);
    if (!period) continue;
    if (!byMonth.has(period)) byMonth.set(period, { total: 0, deferido: 0, indeferido: 0 });
    const s = byMonth.get(period)!;
    s.total++;
    if (d.resultado === "Deferido") s.deferido++;
    else if (d.resultado === "Indeferido") s.indeferido++;
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, s]) => ({ period, ...s }));
}

// ─── 7. computeDelibList ─────────────────────────────────────────────────────

export function computeDelibList(
  delibs: Deliberacao[],
  params?: {
    page?: number; limit?: number; agencia_id?: string | null;
    microtema?: string | null; resultado?: string | null;
    search?: string | null; year?: string | null;
  },
) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  let items = [...delibs];
  if (params?.agencia_id) items = items.filter((d) => d.agencia_id === params.agencia_id);
  if (params?.microtema)  items = items.filter((d) => d.microtema === params.microtema);
  if (params?.resultado)  items = items.filter((d) => d.resultado === params.resultado);
  if (params?.year)       items = items.filter((d) => (d.data_reuniao ?? "").startsWith(params.year!));
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter((d) =>
      d.interessado?.toLowerCase().includes(q) ||
      d.processo?.toLowerCase().includes(q) ||
      d.numero_deliberacao?.toLowerCase().includes(q)
    );
  }

  items.sort((a, b) => (b.data_reuniao ?? "").localeCompare(a.data_reuniao ?? ""));

  const total = items.length;
  const offset = (page - 1) * limit;
  return { data: items.slice(offset, offset + limit), total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── 8. computeDelibById ─────────────────────────────────────────────────────

export function computeDelibById(delibs: Deliberacao[], id: string): Deliberacao | null {
  return delibs.find((d) => d.id === id) ?? null;
}

// ─── 9. computeVotacaoMatrix ─────────────────────────────────────────────────

export function computeVotacaoMatrix(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const map = new Map<string, {
    diretor_id: string; diretor_nome: string;
    total: number; favoravel: number; desfavoravel: number; abstencao: number; divergente: number;
  }>();

  for (const d of rows) {
    for (const v of d.votos ?? []) {
      if (!v.diretor_id) continue;
      if (!map.has(v.diretor_id)) {
        map.set(v.diretor_id, {
          diretor_id: v.diretor_id,
          diretor_nome: v.diretor_nome ?? v.diretor_id,
          total: 0, favoravel: 0, desfavoravel: 0, abstencao: 0, divergente: 0,
        });
      }
      const s = map.get(v.diretor_id)!;
      s.total++;
      if (v.tipo_voto === "Favoravel") s.favoravel++;
      else if (v.tipo_voto === "Abstencao") s.abstencao++;
      else s.desfavoravel++;
      if (v.is_divergente) s.divergente++;
    }
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

// ─── 10. computeVotacaoDistribution ──────────────────────────────────────────

export function computeVotacaoDistribution(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const counts = new Map<string, number>();
  let totalVotos = 0;

  for (const d of rows) {
    for (const v of d.votos ?? []) {
      counts.set(v.tipo_voto, (counts.get(v.tipo_voto) ?? 0) + 1);
      totalVotos++;
    }
  }

  return [...counts.entries()]
    .map(([tipo_voto, count]) => ({
      tipo_voto,
      count,
      pct: totalVotos > 0 ? ((count / totalVotos) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── 11. computeVotacaoFidelidade ────────────────────────────────────────────

export function computeVotacaoFidelidade(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const map = new Map<string, {
    diretor_id: string; diretor_nome: string;
    total_votos: number; votos_nominais: number; votos_divergentes: number;
  }>();

  for (const d of rows) {
    for (const v of d.votos ?? []) {
      if (!v.diretor_id) continue;
      if (!map.has(v.diretor_id)) {
        map.set(v.diretor_id, {
          diretor_id: v.diretor_id,
          diretor_nome: v.diretor_nome ?? v.diretor_id,
          total_votos: 0, votos_nominais: 0, votos_divergentes: 0,
        });
      }
      const s = map.get(v.diretor_id)!;
      s.total_votos++;
      if (v.is_nominal) s.votos_nominais++;
      if (v.is_divergente) s.votos_divergentes++;
    }
  }

  return [...map.values()].map((s) => ({
    ...s,
    taxa_fidelidade: s.total_votos > 0
      ? ((1 - s.votos_divergentes / s.total_votos) * 100).toFixed(1)
      : "100.0",
  }));
}

// ─── 12. computeVotacaoSectors ───────────────────────────────────────────────

export function computeVotacaoSectors(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const counts = new Map<string, number>();
  for (const d of rows) {
    const m = d.microtema ?? "outros";
    const votosCount = (d.votos ?? []).length;
    counts.set(m, (counts.get(m) ?? 0) + (votosCount || 1));
  }
  return [...counts.entries()]
    .map(([microtema, count]) => ({ microtema, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── 13. computeMandatos ─────────────────────────────────────────────────────

export function computeMandatos(
  delibs: Deliberacao[],
  agenciaId?: string | null,
  statusFilter?: string | null,
) {
  const rows = filterByAgencia(delibs, agenciaId);
  const dirs = extractDirectors(rows);

  // Build a date range per director from deliberação dates
  const dateRange = new Map<string, { earliest: string; latest: string }>();
  for (const d of rows) {
    for (const v of d.votos ?? []) {
      const date = d.data_reuniao ?? "";
      if (!date) continue;
      const r = dateRange.get(v.diretor_id);
      if (!r) {
        dateRange.set(v.diretor_id, { earliest: date, latest: date });
      } else {
        if (date < r.earliest) r.earliest = date;
        if (date > r.latest) r.latest = date;
      }
    }
  }

  const mandatos = dirs.map((dir, i) => {
    const range = dateRange.get(dir.id);
    return {
      id: `synced-m-${i}`,
      diretor_id: dir.id,
      diretor_nome: dir.nome,
      cargo: "Diretor(a)",
      agencia_id: dir.agencia_id,
      data_inicio: range?.earliest ?? "",
      data_fim: null as string | null,
      status: "Ativo" as const,
    };
  });

  if (statusFilter) {
    return mandatos.filter((m) => m.status === statusFilter);
  }
  return mandatos;
}

// ─── 14. computeMandatosStats ────────────────────────────────────────────────

export function computeMandatosStats(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const dirs = extractDirectors(rows);
  const total = rows.length;

  const comDivergencia = rows.filter((d) =>
    (d.votos ?? []).some((v) => v.is_divergente)
  ).length;
  const taxa_consenso = total > 0
    ? (((total - comDivergencia) / total) * 100).toFixed(1) + "%"
    : "100%";

  return {
    diretores_ativos: dirs.length,
    participacoes_colegiadas: total * dirs.length,
    taxa_consenso,
    total_deliberacoes: total,
  };
}

// ─── 15. computeMandatosAnalytics ────────────────────────────────────────────

export function computeMandatosAnalytics(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const total = rows.length;

  const comLitigio = rows.filter((d) =>
    (d.votos ?? []).some((v) => v.is_divergente)
  ).length;
  const taxa_litigio = total > 0 ? `${((comLitigio / total) * 100).toFixed(1)}%` : "0%";
  const taxa_consenso = total > 0 ? `${(((total - comLitigio) / total) * 100).toFixed(1)}%` : "0%";

  const sancao = rows.filter((d) =>
    d.microtema === "multa" || d.resultado === "Indeferido"
  ).length;
  const taxa_sancao = total > 0 ? `${((sancao / total) * 100).toFixed(1)}%` : "0%";

  const resultadoCount = new Map<string, number>();
  for (const d of rows) {
    const r = d.resultado ?? "Sem resultado";
    resultadoCount.set(r, (resultadoCount.get(r) ?? 0) + 1);
  }
  const distribuicao_decisao = [...resultadoCount.entries()]
    .map(([resultado, count]) => ({
      resultado,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const byMonth = new Map<string, { total: number; deferido: number; indeferido: number }>();
  for (const d of rows) {
    const period = (d.data_reuniao ?? "").slice(0, 7);
    if (!period) continue;
    if (!byMonth.has(period)) byMonth.set(period, { total: 0, deferido: 0, indeferido: 0 });
    const s = byMonth.get(period)!;
    s.total++;
    if (d.resultado === "Deferido") s.deferido++;
    else if (d.resultado === "Indeferido") s.indeferido++;
  }
  const evolucao_mensal = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, s]) => ({ period, ...s }));

  return { total_deliberacoes: total, taxa_litigio, taxa_consenso, taxa_sancao, distribuicao_decisao, evolucao_mensal };
}

// ─── 16. computeDiretores ────────────────────────────────────────────────────

export function computeDiretores(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId);
  const dirs = extractDirectors(rows);
  return dirs.map((d) => ({
    id: d.id,
    nome: d.nome,
    agencia_id: d.agencia_id,
    cargo: "Diretor(a)",
    needs_review: false,
    ativo: true,
    created_at: new Date().toISOString(),
  }));
}

// ─── 17. computeDiretorProfile ───────────────────────────────────────────────

export function computeDiretorProfile(delibs: Deliberacao[], dirId: string) {
  const allDirs = extractDirectors(delibs);
  const diretor = allDirs.find((d) => d.id === dirId);
  if (!diretor) return null;

  let favoravel = 0, desfavoravel = 0, abstencao = 0, divergente = 0;
  const microtemaCount = new Map<string, number>();
  const historico: Array<{
    deliberacao_id: string; numero_deliberacao: string | null; data_reuniao: string | null;
    interessado: string | null; microtema: string | null; resultado: string | null;
    tipo_voto: string; is_divergente: boolean;
  }> = [];

  for (const d of delibs) {
    const meuVoto = (d.votos ?? []).find((v) => v.diretor_id === dirId);
    if (!meuVoto) continue;

    if (meuVoto.tipo_voto === "Favoravel") favoravel++;
    else if (meuVoto.tipo_voto === "Abstencao") abstencao++;
    else desfavoravel++;
    if (meuVoto.is_divergente) divergente++;
    if (d.microtema) microtemaCount.set(d.microtema, (microtemaCount.get(d.microtema) ?? 0) + 1);

    historico.push({
      deliberacao_id: d.id,
      numero_deliberacao: d.numero_deliberacao,
      data_reuniao: d.data_reuniao,
      interessado: d.interessado,
      microtema: d.microtema,
      resultado: d.resultado,
      tipo_voto: meuVoto.tipo_voto,
      is_divergente: meuVoto.is_divergente,
    });
  }
  historico.sort((a, b) => (b.data_reuniao ?? "").localeCompare(a.data_reuniao ?? ""));

  const total = favoravel + desfavoravel + abstencao;
  const pct_favoravel = total > 0 ? (favoravel / total) * 100 : 0;
  const pct_divergente = total > 0 ? (divergente / total) * 100 : 0;

  const perfil: "Consensual" | "Moderadamente divergente" | "Divergente" =
    pct_divergente < 5 ? "Consensual"
    : pct_divergente < 15 ? "Moderadamente divergente"
    : "Divergente";

  const microtema_dominante = microtemaCount.size > 0
    ? [...microtemaCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const taxa_aprovacao = total > 0 ? `${pct_favoravel.toFixed(1)}%` : "—";
  const descricao = total > 0
    ? (pct_divergente < 5
        ? `Vota com a maioria em ${(100 - pct_divergente).toFixed(0)}% dos casos`
        : `Apresentou voto divergente em ${pct_divergente.toFixed(1)}% das deliberações`)
    : "Sem histórico de votos registrado";

  return {
    id: diretor.id,
    nome: diretor.nome,
    cargo: "Diretor(a)",
    agencia_id: diretor.agencia_id,
    agencia_sigla: null,
    mandato: {
      data_inicio: historico.length > 0 ? historico[historico.length - 1].data_reuniao ?? "" : "",
      data_fim: null,
      status: "Ativo" as const,
      dias_restantes: null,
    },
    stats: { total_votos: total, favoravel, desfavoravel, abstencao, divergente, pct_favoravel, pct_divergente },
    por_microtema: [...microtemaCount.entries()]
      .map(([microtema, t]) => ({ microtema, total: t }))
      .sort((a, b) => b.total - a.total),
    historico,
    tendencias: { perfil, microtema_dominante, taxa_aprovacao, descricao },
  };
}

// ─── 18. computeEmpresas ─────────────────────────────────────────────────────

export function computeEmpresas(delibs: Deliberacao[], agenciaId?: string | null) {
  const rows = filterByAgencia(delibs, agenciaId).filter((d) => d.interessado);
  const map = new Map<string, {
    total: number; deferido: number; indeferido: number;
    ultima: string; microtemas: Set<string>; agencia: string;
  }>();

  for (const d of rows) {
    if (!d.interessado) continue;
    if (!map.has(d.interessado)) {
      map.set(d.interessado, { total: 0, deferido: 0, indeferido: 0, ultima: "", microtemas: new Set(), agencia: d.agencia_id ?? "" });
    }
    const s = map.get(d.interessado)!;
    s.total++;
    if (d.resultado === "Deferido") s.deferido++;
    else if (d.resultado === "Indeferido") s.indeferido++;
    if (!s.ultima || (d.data_reuniao ?? "") > s.ultima) s.ultima = d.data_reuniao ?? "";
    if (d.microtema) s.microtemas.add(d.microtema);
  }

  return [...map.entries()]
    .map(([nome, s]) => {
      const microtemas = [...s.microtemas];
      return {
        nome,
        total_deliberacoes: s.total,
        deferidos: s.deferido,
        indeferidos: s.indeferido,
        pct_deferido: s.total > 0 ? (s.deferido / s.total) * 100 : 0,
        ultima_deliberacao: s.ultima || null,
        microtemas,
        microtema_principal: microtemas[0] ?? null,
        agencia_id: s.agencia,
      };
    })
    .sort((a, b) => b.total_deliberacoes - a.total_deliberacoes);
}
