"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";

export interface RadarSeries {
  key: string;
  name: string;
  color: string;
}

interface IrisRadarChartProps {
  /** Each item has `subject` (axis label) + one numeric key per series */
  data: Array<{ subject: string; [key: string]: number | string }>;
  series: RadarSeries[];
  height?: number;
  /** Maximum possible value on each axis (used to scale). Default 100 */
  fullMark?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-2xl">
      <p className="text-text-muted font-mono text-[10px] uppercase tracking-wider mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-secondary font-mono">{entry.name}:</span>
          <span className="text-text-primary font-mono font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function IrisRadarChart({
  data,
  series,
  height = 300,
  fullMark = 100,
}: IrisRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#2a2a2a" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#71717a", fontSize: 11, fontFamily: "JetBrains Mono" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            fontSize: "11px",
            fontFamily: "JetBrains Mono, monospace",
            color: "#71717a",
            paddingTop: "8px",
          }}
        />
        {series.map((s) => (
          <Radar
            key={s.key}
            name={s.name}
            dataKey={s.key}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
