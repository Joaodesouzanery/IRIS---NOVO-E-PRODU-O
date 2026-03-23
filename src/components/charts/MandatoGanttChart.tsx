"use client";

import { formatDate } from "@/lib/utils";
import { differenceInDays, parseISO, addYears } from "date-fns";
import { useState } from "react";

export interface GanttRow {
  id: string;
  nome: string;
  cargo: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: "Ativo" | "Inativo";
}

interface MandatoGanttChartProps {
  rows: GanttRow[];
}

function initials(nome: string): string {
  return nome
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("") || "??";
}

export function MandatoGanttChart({ rows }: MandatoGanttChartProps) {
  const [tooltip, setTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  if (rows.length === 0) return null;

  const today = new Date();

  // Compute domain: min start → max(end, today + 18 months)
  const starts = rows.map((r) => parseISO(r.data_inicio).getTime());
  const ends = rows.map((r) => (r.data_fim ? parseISO(r.data_fim).getTime() : addYears(today, 2).getTime()));
  const domainStart = Math.min(...starts);
  const domainEnd = Math.max(...ends, addYears(today, 1).getTime());
  const domainSpan = domainEnd - domainStart;

  function pct(ms: number): number {
    return Math.max(0, Math.min(100, ((ms - domainStart) / domainSpan) * 100));
  }

  const todayPct = pct(today.getTime());

  // Year markers
  const startYear = new Date(domainStart).getFullYear();
  const endYear = new Date(domainEnd).getFullYear();
  const yearMarkers: number[] = [];
  for (let y = startYear + 1; y <= endYear; y++) {
    yearMarkers.push(pct(new Date(`${y}-01-01`).getTime()));
  }

  const tooltipRow = tooltip ? rows.find((r) => r.id === tooltip.id) : null;

  return (
    <div className="space-y-1 select-none">
      {/* Year axis */}
      <div className="relative h-5 ml-[200px]">
        {yearMarkers.map((p, i) => (
          <span
            key={i}
            className="absolute text-[10px] font-mono text-text-label -translate-x-1/2"
            style={{ left: `${p}%` }}
          >
            {startYear + i + 1}
          </span>
        ))}
      </div>

      {/* Gantt rows */}
      {rows.map((row, idx) => {
        const startMs = parseISO(row.data_inicio).getTime();
        const endMs = row.data_fim ? parseISO(row.data_fim).getTime() : addYears(today, 2).getTime();
        const barLeft = pct(startMs);
        const barRight = pct(endMs);
        const barWidth = barRight - barLeft;

        const diasRestantes = row.status === "Ativo" && row.data_fim
          ? differenceInDays(parseISO(row.data_fim), today)
          : null;

        return (
          <div
            key={row.id}
            className={`flex items-center gap-2 group ${idx % 2 === 0 ? "bg-bg-hover/20" : ""} rounded px-1 py-1.5`}
          >
            {/* Director label */}
            <div className="w-[196px] shrink-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center">
                <span className="font-mono text-[10px] font-semibold text-brand">{initials(row.nome)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate leading-tight">{row.nome.split(" ").slice(0, 2).join(" ")}</p>
                <p className="text-[10px] text-text-muted truncate leading-tight">{row.cargo ?? "Diretor"}</p>
              </div>
            </div>

            {/* Timeline bar */}
            <div className="flex-1 relative h-6">
              {/* Background track */}
              <div className="absolute inset-y-0 inset-x-0 bg-bg-hover rounded" />

              {/* Year grid lines */}
              {yearMarkers.map((p, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0 w-px bg-border/40"
                  style={{ left: `${p}%` }}
                />
              ))}

              {/* Mandate bar */}
              <div
                className={`absolute inset-y-1 rounded transition-opacity ${
                  row.status === "Ativo"
                    ? "bg-brand/80 hover:bg-brand cursor-pointer"
                    : "bg-text-label/40 hover:bg-text-label/60 cursor-pointer"
                }`}
                style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.parentElement as HTMLElement)
                    .getBoundingClientRect();
                  setTooltip({ id: row.id, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              />

              {/* TODAY marker */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white/60 z-10"
                style={{ left: `${todayPct}%` }}
              >
                <div className="absolute -top-3.5 -translate-x-1/2 text-[9px] font-mono text-white/50">HOJE</div>
              </div>
            </div>

            {/* Countdown / status */}
            <div className="w-28 shrink-0 text-right">
              {row.status === "Ativo" && diasRestantes !== null ? (
                diasRestantes > 0 ? (
                  <span className="text-[10px] font-mono text-brand">
                    {diasRestantes > 365
                      ? `${Math.floor(diasRestantes / 365)}a ${Math.floor((diasRestantes % 365) / 30)}m`
                      : `${diasRestantes}d`} restantes
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-danger">Encerra hoje</span>
                )
              ) : row.status === "Inativo" ? (
                <span className="badge badge-gray text-[10px]">Encerrado</span>
              ) : (
                <span className="text-[10px] font-mono text-text-label">Indeterminado</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Tooltip */}
      {tooltip && tooltipRow && (
        <div
          className="fixed z-50 bg-bg-card border border-border rounded-lg shadow-xl px-3 py-2 text-xs font-mono pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 80 }}
        >
          <p className="text-text-primary font-semibold mb-1">{tooltipRow.nome}</p>
          <p className="text-text-muted">{tooltipRow.cargo}</p>
          <p className="text-text-secondary mt-1">
            {formatDate(tooltipRow.data_inicio)} → {formatDate(tooltipRow.data_fim)}
          </p>
          <span className={`badge mt-1 ${tooltipRow.status === "Ativo" ? "badge-green" : "badge-gray"}`}>
            {tooltipRow.status}
          </span>
        </div>
      )}
    </div>
  );
}
