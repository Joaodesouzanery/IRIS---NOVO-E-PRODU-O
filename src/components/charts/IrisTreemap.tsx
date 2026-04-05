"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { getMicrotemaColor } from "@/lib/utils";

interface TreemapItem {
  name: string;
  value: number;
  /** If provided, overrides the automatic color */
  color?: string;
}

interface IrisTreemapProps {
  data: TreemapItem[];
  height?: number;
  /** "brand" = orange intensity gradient by rank; "microtema" = semantic topic colors */
  colorKey?: "brand" | "microtema";
  /** Total to compute percentage in tooltip */
  total?: number;
}

// Brand orange palette — lighter for smaller values, darker/richer for larger
const BRAND_SHADES = [
  "#f97316", // rank 1 — full brand orange
  "#ea6c0a",
  "#c2550a",
  "#a34407",
  "#7c3306",
  "#5a2404",
  "#3b1603",
  "#2a1002",
];

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  rank?: number;
  total?: number;
  fill?: string;
}

const CustomContent = (props: CustomContentProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name = "", value = 0, fill = "#f97316", total } = props;
  const pct = total && total > 0 ? ((value / total) * 100).toFixed(1) : null;
  const showLabel = width > 60 && height > 36;
  const showPct = width > 80 && height > 52;

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        fill={fill}
        fillOpacity={0.9}
        rx={6}
        ry={6}
      />
      {showLabel && (
        <>
          <text
            x={x + 8}
            y={y + 18}
            fill="#ffffff"
            fontSize={11}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={600}
            style={{ userSelect: "none" }}
          >
            {name.length > 18 ? name.slice(0, 16) + "…" : name}
          </text>
          {showPct && (
            <text
              x={x + 8}
              y={y + 33}
              fill="rgba(255,255,255,0.7)"
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
              style={{ userSelect: "none" }}
            >
              {value}{pct ? ` · ${pct}%` : ""}
            </text>
          )}
        </>
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-2xl">
      <p className="text-text-secondary font-medium mb-0.5">{d.name}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono font-semibold text-text-primary">{d.value}</span>
        {d.pct && (
          <span className="text-text-muted font-mono text-xs">{d.pct}%</span>
        )}
      </div>
    </div>
  );
};

export function IrisTreemap({
  data,
  height = 280,
  colorKey = "brand",
  total,
}: IrisTreemapProps) {
  const computedTotal = total ?? data.reduce((s, d) => s + d.value, 0);

  // Sort by value descending so rank-based coloring makes sense
  const sorted = [...data].sort((a, b) => b.value - a.value);

  const enriched = sorted.map((item, i) => ({
    ...item,
    fill: item.color
      ? item.color
      : colorKey === "microtema"
        ? getMicrotemaColor(item.name.toLowerCase().replace(/\s+/g, "_"))
        : BRAND_SHADES[Math.min(i, BRAND_SHADES.length - 1)],
    pct: computedTotal > 0 ? ((item.value / computedTotal) * 100).toFixed(1) : "0",
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Treemap
        data={enriched}
        dataKey="value"
        aspectRatio={4 / 3}
        content={
          <CustomContent total={computedTotal} />
        }
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
}
