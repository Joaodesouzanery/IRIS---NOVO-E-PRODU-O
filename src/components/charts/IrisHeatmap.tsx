"use client";

import { useMemo, useState } from "react";

interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

interface IrisHeatmapProps {
  rows: string[];
  cols: string[];
  data: HeatmapCell[];
  formatRowLabel?: (r: string) => string;
  formatColLabel?: (c: string) => string;
  formatValue?: (v: number) => string;
  /** Hex color for max value — default orange brand */
  maxColor?: string;
  cellSize?: number;
}

/** Linearly interpolates between two hex colors. t = 0 → c1, t = 1 → c2 */
function lerpHex(c1: string, c2: string, t: number): string {
  const parse = (h: string) => {
    const hex = h.replace("#", "");
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function IrisHeatmap({
  rows,
  cols,
  data,
  formatRowLabel = (r) => r,
  formatColLabel = (c) => c,
  formatValue = (v) => String(v),
  maxColor = "#f97316",
  cellSize = 42,
}: IrisHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    row: string;
    col: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const valueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(`${d.row}::${d.col}`, d.value);
    return m;
  }, [data]);

  const maxValue = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  const BG_COLOR = "#1c1c1c";

  // Clean 2-stop interpolation: dark card bg → brand color. No brown intermediate.
  const cellColor = (value: number): string => {
    if (value === 0) return BG_COLOR;
    // Minimum 12% so low-but-nonzero cells are visibly different from empty
    const t = Math.max(0.12, value / maxValue);
    return lerpHex(BG_COLOR, maxColor, t);
  };

  // Text is always white; opacity varies based on cell brightness
  const textOpacity = (value: number): number => {
    if (value === 0) return 0;
    return value / maxValue > 0.35 ? 1 : 0.6;
  };

  // Height for the diagonal header area
  const HEADER_HEIGHT = 80;

  return (
    <div className="relative overflow-x-auto">
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateColumns: `130px repeat(${cols.length}, ${cellSize}px)`,
          gridTemplateRows: `${HEADER_HEIGHT}px repeat(${rows.length}, ${cellSize}px)`,
        }}
      >
        {/* Top-left corner */}
        <div />

        {/* Column headers — diagonal rotation */}
        {cols.map((col) => (
          <div
            key={col}
            className="relative flex items-end justify-center overflow-visible"
            style={{ height: HEADER_HEIGHT }}
          >
            <span
              className="absolute text-[10px] font-mono text-text-secondary leading-none"
              style={{
                transformOrigin: "left bottom",
                transform: "rotate(-45deg) translateX(6px)",
                whiteSpace: "nowrap",
                bottom: 6,
                left: "50%",
              }}
            >
              {formatColLabel(col)}
            </span>
          </div>
        ))}

        {/* Data rows */}
        {rows.map((row) => (
          <>
            {/* Row label */}
            <div key={`label-${row}`} className="flex items-center pr-3">
              <span className="text-xs text-text-secondary truncate font-medium leading-tight">
                {formatRowLabel(row)}
              </span>
            </div>

            {/* Cells */}
            {cols.map((col) => {
              const value = valueMap.get(`${row}::${col}`) ?? 0;
              const bg = cellColor(value);
              const opacity = textOpacity(value);

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="rounded flex items-center justify-center cursor-default transition-all duration-150 hover:scale-105 hover:z-10"
                  style={{
                    backgroundColor: bg,
                    width: cellSize,
                    height: cellSize,
                    boxShadow: value > 0 ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTooltip({ row, col, value, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {value > 0 && (
                    <span
                      className="font-mono text-xs font-semibold text-white"
                      style={{ opacity }}
                    >
                      {formatValue(value)}
                    </span>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-bg-card border border-border rounded-lg px-3 py-2 shadow-2xl pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 48 }}
        >
          <p className="text-text-muted font-mono text-[10px] uppercase tracking-wider">
            {formatRowLabel(tooltip.row)}
          </p>
          <p className="text-text-secondary font-mono text-[10px] mb-1">
            {formatColLabel(tooltip.col)}
          </p>
          <p className="text-text-primary font-mono font-semibold text-sm">
            {formatValue(tooltip.value)}
          </p>
        </div>
      )}

      {/* Color scale legend */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-[10px] text-text-muted font-mono">Menor</span>
        <div
          className="h-2 w-28 rounded-full"
          style={{
            background: `linear-gradient(to right, ${BG_COLOR}, ${maxColor})`,
          }}
        />
        <span className="text-[10px] text-text-muted font-mono">Maior</span>
        <span className="text-[10px] text-text-label font-mono ml-1">
          (max: {maxValue})
        </span>
      </div>
    </div>
  );
}
