"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MicrotemaStats, DiretorOverviewItem } from "@/types";
import { IrisBarChart } from "@/components/charts/IrisBarChart";
import { IrisAreaChart } from "@/components/charts/IrisAreaChart";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { getMicrotemaLabel, getMicrotemaColor, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { BarChart3, Users, Building2, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { data: microtemas } = useQuery({
    queryKey: ["dashboard", "microtemas"],
    queryFn: () => api.get<MicrotemaStats[]>("/dashboard/microtemas"),
  });

  const { data: diretores } = useQuery({
    queryKey: ["dashboard", "diretores-overview"],
    queryFn: () => api.get<DiretorOverviewItem[]>("/dashboard/diretores/overview"),
  });

  const topMicrotema = (microtemas ?? []).reduce(
    (max, m) => (m.total > (max?.total ?? 0) ? m : max),
    null as MicrotemaStats | null
  );

  const maisIndeferido = (microtemas ?? []).reduce(
    (max, m) => (m.pct_indeferido > (max?.pct_indeferido ?? 0) ? m : max),
    null as MicrotemaStats | null
  );

  const maisDeferido = (microtemas ?? []).reduce(
    (max, m) => (m.pct_deferido > (max?.pct_deferido ?? 0) ? m : max),
    null as MicrotemaStats | null
  );

  const rankingData = (microtemas ?? []).map((m) => ({
    name: m.microtema,
    value: m.total,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-1">Métricas analíticas por tema e diretor</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/analytics/diretores" className="btn-secondary text-xs">
            <Users className="w-3.5 h-3.5" /> Por Diretor
          </Link>
          <Link href="/dashboard/analytics/temas" className="btn-secondary text-xs">
            <BarChart3 className="w-3.5 h-3.5" /> Por Tema
          </Link>
          <Link href="/dashboard/analytics/institucional" className="btn-secondary text-xs">
            <Building2 className="w-3.5 h-3.5" /> Institucional
          </Link>
        </div>
      </div>

      {/* SEÇÃO: Métricas por Tema */}
      <section>
        <p className="section-label mb-4">Métricas por Tema</p>

        {/* Cards destaque */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {maisIndeferido && (
            <div className="card border-error/30">
              <p className="section-label text-error/70 mb-2">Tema com mais indeferimentos</p>
              <p className="text-lg font-semibold text-text-primary">
                {getMicrotemaLabel(maisIndeferido.microtema)}
              </p>
              <p className="font-mono text-2xl text-error mt-1">
                {maisIndeferido.pct_indeferido.toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted mt-1">
                {formatNumber(maisIndeferido.indeferido)} de {formatNumber(maisIndeferido.total)} deliberações
              </p>
            </div>
          )}
          {maisDeferido && (
            <div className="card border-success/30">
              <p className="section-label text-success/70 mb-2">Tema com mais deferimentos</p>
              <p className="text-lg font-semibold text-text-primary">
                {getMicrotemaLabel(maisDeferido.microtema)}
              </p>
              <p className="font-mono text-2xl text-success mt-1">
                {maisDeferido.pct_deferido.toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted mt-1">
                {formatNumber(maisDeferido.deferido)} de {formatNumber(maisDeferido.total)} deliberações
              </p>
            </div>
          )}
        </div>

        {/* Ranking horizontal */}
        <div className="card">
          <p className="text-sm font-medium text-text-secondary mb-4">
            Ranking: Temas mais recorrentes
          </p>
          <IrisBarChart
            data={rankingData}
            horizontal
            height={Math.max(200, rankingData.length * 36)}
            useMicrotemaColors
            formatLabel={getMicrotemaLabel}
          />
        </div>
      </section>

      {/* SEÇÃO: Métricas por Diretor */}
      <section>
        <p className="section-label mb-4">Métricas por Diretor</p>
        <div className="grid grid-cols-3 gap-4">
          {(diretores ?? []).slice(0, 3).map((d) => (
            <div key={d.diretor_id} className="card-hover">
              <p className="text-sm font-semibold text-text-primary mb-3 truncate">
                {d.diretor_nome}
              </p>
              <GaugeChart
                value={d.taxa_deferimento}
                label="Taxa Defirimento"
                size={150}
              />
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Total de votos</span>
                  <span className="font-mono text-text-primary">{formatNumber(d.total_votos)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Favoráveis</span>
                  <span className="font-mono text-success">{formatNumber(d.votos_favoraveis)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right">
          <Link href="/dashboard/analytics/diretores" className="text-xs text-brand hover:underline">
            Ver análise completa por diretor →
          </Link>
        </div>
      </section>
    </div>
  );
}
