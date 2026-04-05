"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Label } from "recharts";

interface PieData {
  name: string;
  value: number;
  color?: string;
}

interface IrisPieChartProps {
  data: PieData[];
  height?: number;
  innerRadius?: number;
  showLegend?: boolean;
  showTotal?: boolean;
}

// Harmonized palette — level-400 colors, visually cohesive on dark backgrounds
const DEFAULT_COLORS = ["#f97316", "#60a5fa", "#34d399", "#a78bfa", "#f87171", "#22d3ee"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-2xl">
      <p className="text-text-muted mb-1 font-mono text-[10px] uppercase tracking-wider">{payload[0].name}</p>
      <div className="flex items-baseline gap-1.5">
        <p className="text-text-primary font-mono font-semibold">{payload[0].value}</p>
        {payload[0].payload.pct && (
          <p className="text-text-muted font-mono text-xs">{payload[0].payload.pct}%</p>
        )}
      </div>
    </div>
  );
};

export function IrisPieChart({
  data,
  height = 180,
  innerRadius = 58,
  showLegend = true,
  showTotal = false,
}: IrisPieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map((d) => ({
    ...d,
    pct: total > 0 ? ((d.value / total) * 100).toFixed(1) : "0",
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={enriched}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 42}
          paddingAngle={4}
          dataKey="value"
        >
          {enriched.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              stroke="transparent"
              fillOpacity={0.92}
            />
          ))}
          {showTotal && (
            <Label
              content={({ viewBox }) => {
                const vb = viewBox as { cx?: number; cy?: number };
                const cx = vb?.cx ?? 0;
                const cy = vb?.cy ?? 0;
                return (
                  <g>
                    <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize={18} fontFamily="JetBrains Mono" fontWeight={600}>
                      {total}
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fill="#71717a" fontSize={9} fontFamily="JetBrains Mono" fontWeight={500} letterSpacing="0.08em">
                      TOTAL
                    </text>
                  </g>
                );
              }}
              position="center"
            />
          )}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "JetBrains Mono, monospace",
              color: "#a1a1aa",
              paddingTop: "6px",
            }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
