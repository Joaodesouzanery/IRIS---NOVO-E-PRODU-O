"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { cn, formatDate, getMicrotemaLabel, getMicrotemaColor } from "@/lib/utils";
import type { DiretorProfile } from "@/types";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { IrisPieChart } from "@/components/charts/IrisPieChart";
import Link from "next/link";
import { ArrowLeft, Calendar, Building2, Award, TrendingUp } from "lucide-react";

function initials(nome: string): string {
  return nome.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("") || "??";
}

function tendenciaBadgeColor(perfil: string) {
  if (perfil === "Consensual") return "badge-green";
  if (perfil === "Moderadamente divergente") return "text-warning border border-warning/30 bg-warning/10 px-2 py-0.5 rounded text-xs font-mono";
  return "badge-red";
}

export default function DiretorProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["diretor-profile", id],
    queryFn: () => api.get<DiretorProfile>(`/diretores/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-sm animate-fade-in">
        Carregando perfil...
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 animate-fade-in">
        <p className="text-text-muted text-sm">Diretor não encontrado.</p>
        <Link href="/dashboard/mandatos" className="btn-secondary text-xs">← Voltar para Mandatos</Link>
      </div>
    );
  }

  const { stats, tendencias, historico, por_microtema, mandato } = profile;

  // Pie data for vote distribution
  const pieData = [
    { name: "Favorável",     value: stats.favoravel,    color: "#22c55e" },
    { name: "Desfavorável",  value: stats.desfavoravel, color: "#ef4444" },
    { name: "Abstenção",     value: stats.abstencao,    color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/mandatos"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Mandatos
      </Link>

      {/* Hero */}
      <div className="card p-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-brand/15 border-2 border-brand/30 flex items-center justify-center shrink-0">
            <span className="font-mono text-xl font-bold text-brand">{initials(profile.nome)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-text-primary">{profile.nome}</h1>
              <span className={cn(
                "badge",
                mandato.status === "Ativo" ? "badge-green" : "badge-gray"
              )}>
                {mandato.status}
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              {profile.cargo ?? "Diretor"} — {profile.agencia_sigla ?? "—"}
            </p>

            {/* Mandate summary */}
            <div className="flex items-center gap-4 text-xs font-mono text-text-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(mandato.data_inicio)} → {formatDate(mandato.data_fim)}
              </span>
              {mandato.status === "Ativo" && mandato.dias_restantes !== null && (
                <span className="text-brand font-semibold">
                  {mandato.dias_restantes > 0
                    ? `${mandato.dias_restantes} dias restantes`
                    : "Encerra hoje"}
                </span>
              )}
            </div>
          </div>

          {/* Tendência badge */}
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-text-label font-mono uppercase tracking-wider mb-1">Perfil</p>
            <span className={cn("font-mono text-xs font-semibold", tendenciaBadgeColor(tendencias.perfil))}>
              {tendencias.perfil}
            </span>
          </div>
        </div>
      </div>

      {/* Perfil Jurídico */}
      <section className="card">
        <h2 className="section-label mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Perfil Jurídico
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          {[
            { label: "Cargo", value: profile.cargo ?? "—" },
            { label: "Agência", value: profile.agencia_sigla ?? "—" },
            { label: "Início", value: formatDate(mandato.data_inicio) },
            { label: "Término", value: formatDate(mandato.data_fim) },
            { label: "Status", value: mandato.status },
            { label: "Dias restantes", value: mandato.status === "Ativo" && mandato.dias_restantes !== null
              ? `${mandato.dias_restantes}d`
              : "—" },
          ].map((item) => (
            <div key={item.label} className="bg-bg-hover rounded-lg p-3 text-center">
              <p className="text-text-label font-mono uppercase tracking-wider text-[10px] mb-1">{item.label}</p>
              <p className={cn(
                "font-mono font-semibold",
                item.label === "Status" && mandato.status === "Ativo" ? "text-success" :
                item.label === "Status" ? "text-text-muted" :
                item.label === "Dias restantes" && mandato.status === "Ativo" ? "text-brand" :
                "text-text-primary"
              )}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Estatísticas de Votação */}
      <section>
        <h2 className="section-label mb-3 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Estatísticas de Votação
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Total de Votos", value: stats.total_votos, color: "text-text-primary" },
            { label: "Favorável", value: stats.favoravel, color: "text-success" },
            { label: "Desfavorável", value: stats.desfavoravel, color: "text-danger" },
            { label: "Divergente", value: stats.divergente, color: "text-brand" },
          ].map((item) => (
            <div key={item.label} className="card text-center py-4">
              <p className="section-label mb-1">{item.label}</p>
              <p className={cn("text-2xl font-bold font-mono", item.color)}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card flex flex-col items-center">
            <p className="section-label mb-3">% Votos Favoráveis</p>
            <GaugeChart
              value={Math.round(stats.pct_favoravel)}
              label="Favorável"
              color="#22c55e"
              size={160}
            />
          </div>
          <div className="card">
            <p className="section-label mb-2">Distribuição de Votos</p>
            <IrisPieChart data={pieData} height={200} innerRadius={50} />
          </div>
        </div>
      </section>

      {/* Tendências */}
      <section className="card">
        <h2 className="section-label mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Tendências e Análise
        </h2>
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <span className={cn("text-sm font-semibold font-mono", tendenciaBadgeColor(tendencias.perfil))}>
              {tendencias.perfil}
            </span>
            <p className="text-sm text-text-secondary mt-2">{tendencias.descricao}</p>
            <p className="text-xs text-text-muted mt-1">
              Taxa de aprovação: <span className="text-brand font-mono font-semibold">{tendencias.taxa_aprovacao}</span>
            </p>
          </div>

          {por_microtema.length > 0 && (
            <div className="ml-auto">
              <p className="text-[10px] font-mono uppercase tracking-wider text-text-label mb-2">Top microtemas</p>
              <div className="flex flex-wrap gap-1.5">
                {por_microtema.slice(0, 5).map((m) => (
                  <span
                    key={m.microtema}
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{
                      background: getMicrotemaColor(m.microtema) + "22",
                      color: getMicrotemaColor(m.microtema),
                      border: `1px solid ${getMicrotemaColor(m.microtema)}44`,
                    }}
                  >
                    {getMicrotemaLabel(m.microtema)} ({m.total})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Histórico de Votos */}
      <section>
        <h2 className="section-label mb-3">Histórico de Votos</h2>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Data", "Deliberação", "Interessado", "Setor", "Decisão", "Voto"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-text-muted uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                      Nenhum voto registrado
                    </td>
                  </tr>
                ) : (
                  historico.map((v) => (
                    <tr
                      key={v.deliberacao_id}
                      className={cn(
                        "border-b border-border/40 hover:bg-bg-hover/50 transition-colors",
                        v.is_divergente && "bg-danger/5"
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-text-secondary whitespace-nowrap">
                        {formatDate(v.data_reuniao)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary whitespace-nowrap">
                        {v.numero_deliberacao ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-text-primary max-w-[180px] truncate">
                        {v.interessado ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {v.microtema ? (
                          <span
                            className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{
                              background: getMicrotemaColor(v.microtema) + "22",
                              color: getMicrotemaColor(v.microtema),
                            }}
                          >
                            {getMicrotemaLabel(v.microtema)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {v.resultado ? (
                          <span className={cn(
                            "badge",
                            v.resultado === "Deferido" ? "badge-green" :
                            v.resultado === "Indeferido" ? "badge-red" : "badge-gray"
                          )}>
                            {v.resultado}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "font-mono text-xs font-semibold",
                          v.tipo_voto === "Favoravel" ? "text-success" :
                          v.tipo_voto === "Desfavoravel" ? "text-danger" : "text-text-muted"
                        )}>
                          {v.tipo_voto === "Favoravel" ? "Favorável" :
                           v.tipo_voto === "Desfavoravel" ? "Desfavorável" :
                           v.tipo_voto}
                          {v.is_divergente && (
                            <span className="ml-1 text-brand text-[10px]">↗ div.</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
