"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardOverview, MicrotemaStats, DiretorOverviewItem } from "@/types";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { IrisBarChart } from "@/components/charts/IrisBarChart";
import { IrisPieChart } from "@/components/charts/IrisPieChart";
import { getMicrotemaLabel, formatNumber } from "@/lib/utils";
import { FileText, CheckCircle, XCircle, Tag } from "lucide-react";

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<DashboardOverview>("/dashboard/overview"),
  });

  const { data: microtemas } = useQuery({
    queryKey: ["dashboard", "microtemas"],
    queryFn: () => api.get<MicrotemaStats[]>("/dashboard/microtemas"),
  });

  const { data: diretores } = useQuery({
    queryKey: ["dashboard", "diretores-overview"],
    queryFn: () => api.get<DiretorOverviewItem[]>("/dashboard/diretores/overview"),
  });

  const microtemasBarData = (microtemas ?? []).map((m) => ({
    name: m.microtema,
    value: m.total,
  }));

  const totalDel = overview?.total_deliberacoes ?? 0;
  const externos = totalDel - (overview ? (totalDel * 0) : 0); // calculado abaixo
  const pautaPieData = overview
    ? [
        {
          name: "Deferidos",
          value: overview.deferidos,
          color: "#22c55e",
        },
        {
          name: "Indeferidos",
          value: overview.indeferidos,
          color: "#ef4444",
        },
        {
          name: "Sem resultado",
          value: overview.sem_resultado,
          color: "#71717a",
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Inteligência Regulatória
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Análise de deliberações de agências reguladoras brasileiras
        </p>
      </div>

      {/* SEÇÃO 1: Header KPIs */}
      <section>
        <p className="section-label mb-3">Visão Geral</p>
        <div className="grid grid-cols-3 gap-4">
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
        </div>
      </section>

      {/* SEÇÃO 2: Métricas de Valor */}
      <section>
        <p className="section-label mb-3">Métricas de Valor Regulatório</p>
        <div className="grid grid-cols-3 gap-4">

          {/* Microtemas identificados */}
          <div className="card">
            <p className="section-label mb-2">Microtemas Identificados</p>
            <p className="metric-value">{microtemas?.length ?? "—"}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {(microtemas ?? []).slice(0, 5).map((m) => (
                <span key={m.microtema} className="badge-orange text-xs">
                  {getMicrotemaLabel(m.microtema)}
                </span>
              ))}
            </div>
          </div>

          {/* Distribuição de resultados */}
          <div className="card">
            <p className="section-label mb-2">Distribuição de Resultados</p>
            <IrisPieChart data={pautaPieData} height={160} innerRadius={45} />
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

          {/* Deliberações por microtema (ranking) */}
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

          {/* KPIs numéricos */}
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
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-muted">Microtema mais frequente</span>
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
