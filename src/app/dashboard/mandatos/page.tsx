"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn, formatDate, formatPercent } from "@/lib/utils";
import type { Mandato, Agencia } from "@/types";
import { differenceInMonths, differenceInDays, parseISO } from "date-fns";
import { useState } from "react";
import { Users, Calendar, CheckCircle } from "lucide-react";

function MandatoProgress({ mandato }: { mandato: Mandato }) {
  const now = new Date();
  const inicio = parseISO(mandato.data_inicio);
  const fim = mandato.data_fim ? parseISO(mandato.data_fim) : null;

  const mesesDecorridos = differenceInMonths(now, inicio);
  const mesesTotais = fim ? differenceInMonths(fim, inicio) : 60; // 5 anos padrão
  const pct = Math.min(100, Math.round((mesesDecorridos / mesesTotais) * 100));

  const anos = Math.floor(mesesDecorridos / 12);
  const meses = mesesDecorridos % 12;
  const tempoLabel = anos > 0
    ? `${anos}a ${meses > 0 ? meses + "m " : ""}decorridos`
    : `${meses}m decorridos`;

  const initials = mandato.diretor?.nome
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("") ?? "??";

  return (
    <div className="card-hover p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
          <span className="font-mono text-sm font-semibold text-brand">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Nome e status */}
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {mandato.diretor?.nome ?? "—"}
            </h3>
            <span className={cn(
              "badge text-xs",
              mandato.status === "Ativo" ? "badge-green" : "badge-gray"
            )}>
              {mandato.status}
            </span>
          </div>

          {/* Cargo */}
          <p className="text-xs text-text-muted mb-3">
            {mandato.diretor?.cargo ?? "Diretor"}
          </p>

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

          {/* Barra de progresso do mandato */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">{tempoLabel}</span>
              <span className="text-xs font-mono text-brand">{pct}% do mandato</span>
            </div>
            <div className="w-full bg-bg-hover rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-brand transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MandatosPage() {
  const [agenciaId, setAgenciaId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Ativo");

  const params = new URLSearchParams();
  if (agenciaId) params.set("agencia_id", agenciaId);
  if (statusFilter) params.set("status", statusFilter);

  const { data: mandatos, isLoading } = useQuery({
    queryKey: ["mandatos", params.toString()],
    queryFn: () => api.get<Mandato[]>(`/mandatos?${params.toString()}`),
  });

  const { data: agencias } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => api.get<Agencia[]>("/agencias"),
  });

  const ativos = (mandatos ?? []).filter((m) => m.status === "Ativo").length;
  const totalParticipacoes = 0; // TODO: calcular de votos

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Mandatos</h1>
          <p className="text-sm text-text-muted mt-1">
            Acompanhamento de mandatos dos diretores por agência
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select w-40"
            value={agenciaId}
            onChange={(e) => setAgenciaId(e.target.value)}
          >
            <option value="">Todas as agências</option>
            {(agencias ?? []).map((a) => (
              <option key={a.id} value={a.id}>{a.sigla}</option>
            ))}
          </select>
          <select
            className="select w-32"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
          </select>
        </div>
      </div>

      {/* KPIs de mandatos */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="section-label mb-1">Diretores Ativos</p>
          <p className="metric-value text-brand">{ativos}</p>
        </div>
        <div className="card text-center">
          <p className="section-label mb-1">Total de Mandatos</p>
          <p className="metric-value">{mandatos?.length ?? "—"}</p>
        </div>
        <div className="card text-center">
          <p className="section-label mb-1">Agências</p>
          <p className="metric-value">{agencias?.length ?? "—"}</p>
        </div>
        <div className="card text-center">
          <p className="section-label mb-1">Status</p>
          <p className="metric-value text-success">
            {statusFilter || "Todos"}
          </p>
        </div>
      </div>

      {/* Cards de mandatos */}
      {isLoading ? (
        <div className="text-center py-12 text-text-muted text-sm">
          Carregando mandatos...
        </div>
      ) : (mandatos ?? []).length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          Nenhum mandato encontrado
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(mandatos ?? []).map((m) => (
            <MandatoProgress key={m.id} mandato={m} />
          ))}
        </div>
      )}
    </div>
  );
}
