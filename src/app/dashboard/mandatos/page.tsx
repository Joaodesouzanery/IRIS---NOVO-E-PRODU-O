"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Mandato, Agencia, MandatosStats, VotoMatrixRow, VotoDistribution, VotoSector } from "@/types";
import { differenceInMonths, parseISO } from "date-fns";
import { useState } from "react";
import { IrisPieChart } from "@/components/charts/IrisPieChart";
import { IrisBarChart } from "@/components/charts/IrisBarChart";

// ─── Director Card ────────────────────────────────────────────────────────────

function DirectorCard({
  mandato,
  participacoes,
}: {
  mandato: Mandato;
  participacoes: number;
}) {
  const now = new Date();
  const inicio = parseISO(mandato.data_inicio);
  const fim = mandato.data_fim ? parseISO(mandato.data_fim) : null;

  const mesesDecorridos = differenceInMonths(now, inicio);
  const mesesTotais = fim ? differenceInMonths(fim, inicio) : 60;
  const pct = Math.min(100, Math.max(0, Math.round((mesesDecorridos / mesesTotais) * 100)));

  const anos = Math.floor(mesesDecorridos / 12);
  const meses = mesesDecorridos % 12;
  const tempoLabel = anos > 0
    ? `${anos}a ${meses > 0 ? meses + "m " : ""}decorridos`
    : `${meses}m decorridos`;

  const initials = mandato.diretor_nome
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("") || "??";

  return (
    <div className="card-hover p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
          <span className="font-mono text-sm font-semibold text-brand">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Nome e status */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {mandato.diretor_nome}
            </h3>
            <span className={cn(
              "badge text-xs",
              mandato.status === "Ativo" ? "badge-green" : "badge-gray"
            )}>
              {mandato.status}
            </span>
          </div>

          {/* Cargo */}
          <p className="text-xs text-text-muted mb-3">{mandato.cargo ?? "Diretor"}</p>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <p className="text-text-label font-mono uppercase tracking-wider text-[10px] mb-0.5">Início</p>
              <p className="text-text-secondary font-mono">{formatDate(mandato.data_inicio)}</p>
            </div>
            <div>
              <p className="text-text-label font-mono uppercase tracking-wider text-[10px] mb-0.5">Término</p>
              <p className="text-text-secondary font-mono">{formatDate(mandato.data_fim)}</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">{tempoLabel}</span>
              <span className="text-xs font-mono text-brand">{pct}%</span>
            </div>
            <div className="w-full bg-bg-hover rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-brand transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Participações */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-semibold text-brand">{participacoes}</span>
            <span className="text-xs text-text-muted">participações colegiadas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Voting Matrix Table ──────────────────────────────────────────────────────

function VotacaoMatrix({ rows }: { rows: VotoMatrixRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-text-label font-normal uppercase tracking-wider">Diretor</th>
            <th className="text-right py-2 px-3 text-text-label font-normal uppercase tracking-wider">Favorável</th>
            <th className="text-right py-2 px-3 text-text-label font-normal uppercase tracking-wider">Desfav.</th>
            <th className="text-right py-2 px-3 text-text-label font-normal uppercase tracking-wider">Abstenção</th>
            <th className="text-right py-2 px-3 text-text-label font-normal uppercase tracking-wider">Divergente</th>
            <th className="text-right py-2 pl-3 text-text-label font-normal uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.diretor_id} className="border-b border-border/40 hover:bg-bg-hover/50 transition-colors">
              <td className="py-2.5 pr-4 text-text-primary font-sans text-xs">{row.diretor_nome}</td>
              <td className="text-right py-2.5 px-3 text-success">{row.favoravel}</td>
              <td className="text-right py-2.5 px-3 text-danger">{row.desfavoravel}</td>
              <td className="text-right py-2.5 px-3 text-text-muted">{row.abstencao}</td>
              <td className="text-right py-2.5 px-3 text-brand">{row.divergente}</td>
              <td className="text-right py-2.5 pl-3 text-text-secondary font-semibold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MandatosPage() {
  const [agenciaId, setAgenciaId] = useState<string>("");

  const agenciaParam = agenciaId ? `?agencia_id=${agenciaId}` : "";

  const { data: agencias } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => api.get<Agencia[]>("/agencias"),
  });

  const { data: mandatos, isLoading } = useQuery({
    queryKey: ["mandatos", agenciaId],
    queryFn: () => api.get<Mandato[]>(`/mandatos?status=Ativo${agenciaId ? `&agencia_id=${agenciaId}` : ""}`),
  });

  const { data: stats } = useQuery({
    queryKey: ["mandatos-stats", agenciaId],
    queryFn: () => api.get<MandatosStats>(`/mandatos/stats${agenciaParam}`),
  });

  const { data: matrix } = useQuery({
    queryKey: ["votacao-matrix", agenciaId],
    queryFn: () => api.get<VotoMatrixRow[]>(`/votacao/matrix${agenciaParam}`),
  });

  const { data: distribution } = useQuery({
    queryKey: ["votacao-distribution", agenciaId],
    queryFn: () => api.get<VotoDistribution[]>(`/votacao/distribution${agenciaParam}`),
  });

  const { data: sectors } = useQuery({
    queryKey: ["votacao-sectors", agenciaId],
    queryFn: () => api.get<VotoSector[]>(`/votacao/sectors${agenciaParam}`),
  });

  // Map diretor_id → total participações from matrix
  const participacoesMap = new Map<string, number>();
  for (const row of matrix ?? []) {
    participacoesMap.set(row.diretor_id, row.total);
  }

  // Pie data
  const votoLabels: Record<string, string> = {
    Favoravel: "Favorável",
    Desfavoravel: "Desfavorável",
    Abstencao: "Abstenção",
    Ausente: "Ausente",
  };
  const votoColors: Record<string, string> = {
    Favoravel: "#22c55e",
    Desfavoravel: "#ef4444",
    Abstencao: "#f59e0b",
    Ausente: "#71717a",
  };
  const pieData = (distribution ?? []).map((d) => ({
    name: votoLabels[d.tipo_voto] ?? d.tipo_voto,
    value: d.count,
    color: votoColors[d.tipo_voto],
  }));

  // Sectors bar data
  const sectorsData = (sectors ?? []).map((s) => ({ name: s.microtema, value: s.count }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Mandatos</h1>
          <p className="text-sm text-text-muted mt-1">
            Diretores, participações colegiadas e votações
          </p>
        </div>
        <select
          className="select w-44"
          value={agenciaId}
          onChange={(e) => setAgenciaId(e.target.value)}
        >
          <option value="">Todas as agências</option>
          {(agencias ?? []).map((a) => (
            <option key={a.id} value={a.id}>{a.sigla}</option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="section-label mb-1">Diretores Ativos</p>
          <p className="metric-value text-brand">{stats?.diretores_ativos ?? "—"}</p>
        </div>
        <div className="card text-center">
          <p className="section-label mb-1">Participações Coleg.</p>
          <p className="metric-value">{stats?.participacoes_colegiadas ?? "—"}</p>
        </div>
        <div className="card text-center">
          <p className="section-label mb-1">Taxa de Consenso</p>
          <p className="metric-value text-success">{stats?.taxa_consenso ?? "—"}</p>
        </div>
        <div className="card text-center">
          <p className="section-label mb-1">Deliberações</p>
          <p className="metric-value">{stats?.total_deliberacoes ?? "—"}</p>
        </div>
      </div>

      {/* Director Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-text-muted text-sm">Carregando diretores...</div>
      ) : (mandatos ?? []).length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">Nenhum mandato ativo encontrado</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(mandatos ?? []).map((m) => (
            <DirectorCard
              key={m.id}
              mandato={m}
              participacoes={participacoesMap.get(m.diretor_id ?? "") ?? 0}
            />
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuição de votos */}
        <div className="card">
          <h2 className="section-label mb-4">Distribuição de Votos</h2>
          {pieData.length > 0 ? (
            <IrisPieChart data={pieData} height={220} innerRadius={55} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">
              Sem dados
            </div>
          )}
        </div>

        {/* Votos por setor */}
        <div className="card">
          <h2 className="section-label mb-4">Votos por Setor</h2>
          {sectorsData.length > 0 ? (
            <IrisBarChart
              data={sectorsData}
              horizontal={true}
              useMicrotemaColors={true}
              height={220}
            />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* Voting Matrix */}
      {(matrix ?? []).length > 0 && (
        <div className="card">
          <h2 className="section-label mb-4">Matriz de Votação</h2>
          <VotacaoMatrix rows={matrix ?? []} />
        </div>
      )}
    </div>
  );
}
