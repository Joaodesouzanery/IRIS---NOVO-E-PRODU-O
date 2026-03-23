"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardOverview, MicrotemaStats, DiretorOverviewItem, Agencia } from "@/types";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { IrisBarChart } from "@/components/charts/IrisBarChart";
import { IrisPieChart } from "@/components/charts/IrisPieChart";
import { getMicrotemaLabel, formatNumber } from "@/lib/utils";
import { FileText, CheckCircle, Tag, Cpu } from "lucide-react";

export default function DashboardPage() {
  const [agenciaId, setAgenciaId] = useState<string>("");

  const agenciaParam = agenciaId ? `?agencia_id=${agenciaId}` : "";

  const { data: agencias } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => api.get<Agencia[]>("/agencias"),
  });

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["dashboard", "overview", agenciaId],
    queryFn: () => api.get<DashboardOverview>(`/dashboard/overview${agenciaParam}`),
  });

  const { data: microtemas } = useQuery({
    queryKey: ["dashboard", "microtemas", agenciaId],
    queryFn: () => api.get<MicrotemaStats[]>(`/dashboard/microtemas${agenciaParam}`),
  });

  const { data: diretores } = useQuery({
    queryKey: ["dashboard", "diretores-overview", agenciaId],
    queryFn: () => api.get<DiretorOverviewItem[]>(`/dashboard/diretores/overview${agenciaParam}`),
  });

  const microtemasBarData = (microtemas ?? []).map((m) => ({
    name: m.microtema,
    value: m.total,
  }));

  // Distribuição de resultados
  const resultadosPieData = overview
    ? [
        { name: "Deferidos",     value: overview.deferidos,     color: "#22c55e" },
        { name: "Indeferidos",   value: overview.indeferidos,   color: "#ef4444" },
        { name: "Sem resultado", value: overview.sem_resultado, color: "#71717a" },
      ].filter((d) => d.value > 0)
    : [];

  // Pauta interna vs externa
  const pautaPieData = overview
    ? [
        { name: "Pauta Externa",  value: overview.pauta_externa,       color: "#f97316" },
        { name: "Pauta Interna",  value: overview.pauta_interna_count, color: "#8b5cf6" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Inteligência Regulatória
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Análise de deliberações de agências reguladoras brasileiras
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

      {/* SEÇÃO 1: Header KPIs */}
      <section>
        <p className="section-label mb-3">Visão Geral</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Total de Deliberações"
            value={loadingOverview ? "—" : overview?.total_deliberacoes ?? 0}
            subvalue="deliberações"
            icon={FileText}
            variant="orange"
          />
          <MetricCard
            label="Taxa de Deferimento"
            value={loadingOverview ? "—" : `${overview?.taxa_deferimento ?? 0}%`}
            icon={CheckCircle}
            variant="green"
          />
          <MetricCard
            label="Reuniões Únicas"
            value={loadingOverview ? "—" : overview?.reunioes_unicas ?? 0}
            subvalue="reuniões"
            icon={Tag}
            variant="default"
          />
          <MetricCard
            label="Auto-Classificadas"
            value={loadingOverview ? "—" : `${overview?.auto_classified_pct ?? 0}%`}
            subvalue="por IA"
            icon={Cpu}
            variant="default"
          />
        </div>
      </section>

      {/* SEÇÃO 2: Métricas de Valor */}
      <section>
        <p className="section-label mb-3">Métricas de Valor Regulatório</p>
        <div className="grid grid-cols-3 gap-4">

          {/* Distribuição de resultados */}
          <div className="card">
            <p className="section-label mb-2">Distribuição de Resultados</p>
            <IrisPieChart data={resultadosPieData} height={160} innerRadius={45} />
          </div>

          {/* Pauta Interna vs Externa */}
          <div className="card">
            <p className="section-label mb-2">Pauta Interna vs Externa</p>
            {pautaPieData.length > 0 ? (
              <IrisPieChart data={pautaPieData} height={160} innerRadius={45} />
            ) : (
              <div className="h-[160px] flex items-center justify-center text-text-muted text-sm">
                Sem dados
              </div>
            )}
          </div>

          {/* Votos por diretor */}
          <div className="card">
            <p className="section-label mb-2">Votos por Diretor</p>
            {diretores && diretores.length > 0 ? (
              <div className="space-y-2 mt-2">
                {diretores.slice(0, 5).map((d) => (
                  <div key={d.diretor_id} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary truncate max-w-[140px]">
                      {d.diretor_nome.split(" ").slice(0, 2).join(" ")}
                    </span>
                    <span className="font-mono text-sm text-brand font-medium">
                      {formatNumber(d.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted mt-2">Nenhum dado disponível</p>
            )}
          </div>

          {/* Deliberações por microtema */}
          <div className="card col-span-2">
            <p className="section-label mb-3">Deliberações por Microtema</p>
            <IrisBarChart
              data={microtemasBarData}
              useMicrotemaColors
              horizontal
              height={200}
              formatLabel={getMicrotemaLabel}
            />
          </div>

          {/* Confiança da IA */}
          <div className="card">
            <p className="section-label mb-3">Confiança da IA</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Média de confiança</span>
                <span className="font-mono text-brand font-medium">
                  {overview?.avg_confidence
                    ? `${(overview.avg_confidence * 100).toFixed(0)}%`
                    : "—"}
                </span>
              </div>
              <div className="w-full bg-bg-hover rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-brand transition-all duration-700"
                  style={{ width: `${(overview?.avg_confidence ?? 0) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Microtemas identificados</span>
                <span className="font-mono text-sm text-brand font-medium">
                  {microtemas?.length ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Top microtema</span>
                {overview?.top_microtema && (
                  <span className="badge-orange text-xs">
                    {getMicrotemaLabel(overview.top_microtema)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
