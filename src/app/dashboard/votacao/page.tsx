"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { VotoMatrixRow, VotoDistribution } from "@/types";
import { IrisPieChart } from "@/components/charts/IrisPieChart";

const TIPO_VOTO_COLORS: Record<string, string> = {
  Favoravel: "#22c55e",
  Desfavoravel: "#ef4444",
  Abstencao: "#eab308",
  Ausente: "#71717a",
};

const TIPO_VOTO_LABELS: Record<string, string> = {
  Favoravel: "Favorável",
  Desfavoravel: "Desfavorável",
  Abstencao: "Abstenção",
  Ausente: "Ausente",
};

export default function VotacaoPage() {
  const { data: matrix } = useQuery({
    queryKey: ["votacao", "matrix"],
    queryFn: () => api.get<VotoMatrixRow[]>("/votacao/matrix"),
  });

  const { data: distribution } = useQuery({
    queryKey: ["votacao", "distribution"],
    queryFn: () => api.get<VotoDistribution[]>("/votacao/distribution"),
  });

  const pieData = (distribution ?? []).map((d) => ({
    name: TIPO_VOTO_LABELS[d.tipo_voto] ?? d.tipo_voto,
    value: d.count,
    color: TIPO_VOTO_COLORS[d.tipo_voto] ?? "#71717a",
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Votação</h1>
        <p className="text-sm text-text-muted mt-1">
          Análise de votos e posicionamentos dos diretores
        </p>
      </div>

      {/* Gráficos superiores */}
      <div className="grid grid-cols-3 gap-4">
        {/* Distribuição por tipo */}
        <div className="card col-span-1">
          <p className="section-label mb-3">Distribuição de Votos</p>
          <IrisPieChart data={pieData} height={200} innerRadius={55} />
          <div className="mt-3 space-y-1.5">
            {(distribution ?? []).map((d) => (
              <div key={d.tipo_voto} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: TIPO_VOTO_COLORS[d.tipo_voto] ?? "#71717a" }}
                  />
                  <span className="text-xs text-text-secondary">
                    {TIPO_VOTO_LABELS[d.tipo_voto] ?? d.tipo_voto}
                  </span>
                </div>
                <span className="font-mono text-xs text-text-primary font-medium">
                  {formatNumber(d.count)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo */}
        <div className="card col-span-2">
          <p className="section-label mb-1">Resumo do Colegiado</p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="text-center p-4 rounded-md bg-bg-hover">
              <p className="metric-value text-text-primary">
                {(distribution ?? []).reduce((s, d) => s + d.count, 0).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-text-muted mt-1">Total de Votos</p>
            </div>
            <div className="text-center p-4 rounded-md bg-bg-hover">
              <p className="metric-value text-success">
                {distribution?.find((d) => d.tipo_voto === "Favoravel")?.count ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-1">Votos Favoráveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Matriz de Votação */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="section-label">Matriz de Votação por Diretor</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Diretor", "Favorável", "Desfavorável", "Abstenção", "Divergente", "Total"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-label text-text-muted font-mono whitespace-nowrap">
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(matrix ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted text-sm">
                    Nenhum dado de votação disponível
                  </td>
                </tr>
              ) : (
                (matrix ?? []).map((row) => (
                  <tr key={row.diretor_id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary font-medium max-w-[200px] truncate">
                      {row.diretor_nome}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-success">{row.favoravel}</td>
                    <td className="px-4 py-3 font-mono text-sm text-error">{row.desfavoravel}</td>
                    <td className="px-4 py-3 font-mono text-sm text-warning">{row.abstencao}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {row.divergente > 0 ? (
                        <span className="badge-red">{row.divergente}</span>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-brand">{row.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
