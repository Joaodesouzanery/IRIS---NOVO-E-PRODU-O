"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Deliberacao } from "@/types";
import { formatDate, getMicrotemaLabel, cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function DeliberacaoDetailPage({ params }: { params: { id: string } }) {
  const { data: deliberacao, isLoading } = useQuery({
    queryKey: ["deliberacao", params.id],
    queryFn: () => api.get<Deliberacao>(`/deliberacoes/${params.id}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        Carregando...
      </div>
    );
  }

  if (!deliberacao) {
    return (
      <div className="text-center py-24">
        <p className="text-text-muted">Deliberação não encontrada</p>
        <Link href="/dashboard/deliberacoes" className="text-brand text-sm hover:underline mt-2 block">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/deliberacoes" className="btn-secondary py-1 px-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-xs text-text-muted font-mono">Deliberação</p>
          <h1 className="text-xl font-semibold text-text-primary">
            {deliberacao.numero_deliberacao ?? deliberacao.id.slice(0, 8)}
          </h1>
        </div>
        {deliberacao.resultado && (
          <div className="ml-auto flex items-center gap-2">
            {deliberacao.resultado === "Deferido" ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-error" />
            )}
            <span className={cn(
              "text-lg font-semibold",
              deliberacao.resultado === "Deferido" ? "text-success" : "text-error"
            )}>
              {deliberacao.resultado}
            </span>
          </div>
        )}
      </div>

      {/* Informações principais */}
      <div className="card">
        <p className="section-label mb-4">Informações da Reunião</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Data da Reunião", value: formatDate(deliberacao.data_reuniao) },
            { label: "Processo", value: deliberacao.processo ?? "—" },
            { label: "Interessado", value: deliberacao.interessado ?? "—" },
            { label: "Microtema", value: deliberacao.microtema ? getMicrotemaLabel(deliberacao.microtema) : "—" },
            { label: "Tipo de Pauta", value: deliberacao.pauta_interna ? "Pauta Interna" : "Pauta Externa" },
            { label: "Confiança IA", value: deliberacao.extraction_confidence != null ? `${(deliberacao.extraction_confidence * 100).toFixed(0)}%` : "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-text-muted font-mono uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-sm text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Votos */}
      {deliberacao.votos && deliberacao.votos.length > 0 && (
        <div className="card">
          <p className="section-label mb-3">Votos</p>
          <div className="space-y-2">
            {deliberacao.votos.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-text-primary">{v.diretor_nome ?? v.diretor_id}</span>
                <div className="flex items-center gap-2">
                  {v.is_divergente && (
                    <span className="badge-red text-xs">Divergente</span>
                  )}
                  <span className={cn(
                    "badge text-xs",
                    v.tipo_voto === "Favoravel" ? "badge-green" :
                    v.tipo_voto === "Desfavoravel" ? "badge-red" :
                    "badge-gray"
                  )}>
                    {v.tipo_voto}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo do pleito */}
      {deliberacao.resumo_pleito && (
        <div className="card">
          <p className="section-label mb-3">Resumo do Pleito</p>
          <p className="text-sm text-text-secondary leading-relaxed">{deliberacao.resumo_pleito}</p>
        </div>
      )}

      {/* Fundamento da decisão */}
      {deliberacao.fundamento_decisao && (
        <div className="card">
          <p className="section-label mb-3">Fundamento da Decisão</p>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {deliberacao.fundamento_decisao}
          </p>
        </div>
      )}
    </div>
  );
}
