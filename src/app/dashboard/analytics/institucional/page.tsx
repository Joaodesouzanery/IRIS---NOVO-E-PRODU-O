"use client";

import Link from "next/link";
import { ShieldCheck, TrendingUp, ArrowRight } from "lucide-react";

export default function AnalyticsInstitucionalPage() {
  const modules = [
    {
      href: "/dashboard/governanca",
      icon: ShieldCheck,
      title: "Governança Regulatória",
      description:
        "Score de qualidade institucional, KPIs de conformidade, alertas por agência e evolução temporal do desempenho.",
      color: "text-brand",
      bg: "bg-brand/10",
    },
    {
      href: "/dashboard/analytics/temas",
      icon: TrendingUp,
      title: "Analytics por Tema",
      description:
        "Tendência mensal, distribuição temática e ranking de empresas reguladas com métricas de deferimento.",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Analytics Institucional</h1>
        <p className="text-sm text-text-muted mt-1">
          Indicadores de qualidade, conformidade e desempenho institucional das agências reguladoras.
        </p>
      </div>

      <div className="grid gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="card flex items-start gap-4 hover:border-brand/30 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors">
                  {m.title}
                </p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{m.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-label group-hover:text-brand transition-colors shrink-0 mt-0.5" />
            </Link>
          );
        })}
      </div>

      {/* KPI summary — placeholder pulling from overview */}
      <div className="card border-border/50">
        <p className="text-xs text-text-muted font-mono uppercase tracking-wider mb-3">
          Indicadores Institucionais Rápidos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Score Médio",         value: "—", hint: "Qualidade agregada" },
            { label: "Taxa de Consenso",    value: "—", hint: "Unanimidade" },
            { label: "Qualidade IA",        value: "—", hint: "Confiança extração" },
          ].map((kpi) => (
            <div key={kpi.label} className="space-y-1">
              <p className="text-xs text-text-label font-mono uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-mono font-semibold text-text-primary">{kpi.value}</p>
              <p className="text-xs text-text-muted">{kpi.hint}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4">
          Para indicadores completos acesse{" "}
          <Link href="/dashboard/governanca" className="text-brand hover:underline">
            Governança Regulatória →
          </Link>
        </p>
      </div>
    </div>
  );
}
