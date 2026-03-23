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

/** Interpolates between two hex colors. t = 0 → c1, t = 1 → c2 */
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
  cellSize = 40,
}: IrisHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ row: string; col: string; value: number; x: number; y: number } | null>(null);

  const valueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(`${d.row}::${d.col}`, d.value);
    return m;
  }, [data]);

  const maxValue = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  const LOW_COLOR  = "#1c1c1c";
  const MID_COLOR  = "#2a1a0a";

  const cellColor = (value: number): string => {
    if (value === 0) return LOW_COLOR;
    const t = value / maxValue;
    if (t < 0.5) return lerpHex(MID_COLOR, "#7c3410", t * 2);
    return lerpHex("#7c3410", maxColor, (t - 0.5) * 2);
  };

  return (
    <div className="relative overflow-x-auto">
      <div
        className="inline-grid gap-px"
        style={{
          gridTemplateColumns: `120px repeat(${cols.length}, ${cellSize}px)`,
          gridTemplateRows: `auto repeat(${rows.length}, ${cellSize}px)`,
        }}
      >
        {/* Top-left empty */}
        <div />

        {/* Column headers */}
        {cols.map((col) => (
          <div
            key={col}
            className="flex items-end justify-center pb-1"
            style={{ height: 48 }}
          >
            <span
              className="text-[10px] font-mono text-text-muted leading-tight text-center"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                maxHeight: 44,
                overflow: "hidden",
              }}
            >
              {formatColLabel(col)}
            </span>
          </div>
        ))}

        {/* Rows */}
        {rows.map((row) => (
          <>
            {/* Row label */}
            <div key={`label-${row}`} className="flex items-center pr-2">
              <span className="text-xs text-text-secondary truncate font-medium">
                {formatRowLabel(row)}
              </span>
            </div>

            {/* Cells */}
            {cols.map((col) => {
              const value = valueMap.get(`${row}::${col}`) ?? 0;
              const bg = cellColor(value);
              const textColor = value / maxValue > 0.5 ? "#ffffff" : "#71717a";

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="rounded-sm flex items-center justify-center cursor-default transition-opacity hover:opacity-80"
                  style={{ backgroundColor: bg, width: cellSize, height: cellSize }}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setTooltip({ row, col, value, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {value > 0 && (
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: textColor }}
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
          className="fixed z-50 bg-bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 40 }}
        >
          <p className="text-text-muted font-mono">{formatRowLabel(tooltip.row)} × {formatColLabel(tooltip.col)}</p>
          <p className="text-text-primary font-semibold mt-0.5">{formatValue(tooltip.value)}</p>
        </div>
      )}

      {/* Color scale legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-text-muted font-mono">0</span>
        <div
          className="h-2 w-32 rounded-full"
          style={{
            background: `linear-gradient(to right, ${LOW_COLOR}, ${MID_COLOR}, ${maxColor})`,
          }}
        />
        <span className="text-[10px] text-text-muted font-mono">{maxValue}</span>
      </div>
    </div>
  );
}
