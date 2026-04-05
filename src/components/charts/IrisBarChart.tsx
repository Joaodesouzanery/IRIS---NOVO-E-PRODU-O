"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { getMicrotemaColor, getMicrotemaLabel } from "@/lib/utils";

interface BarData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface IrisBarChartProps {
  data: BarData[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  useMicrotemaColors?: boolean;
  height?: number;
  horizontal?: boolean;
  formatLabel?: (name: string) => string;
  multibar?: Array<{ key: string; color: string; label: string }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-2xl">
      <p className="text-text-muted mb-1.5 font-mono text-[10px] uppercase tracking-wider">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-text-primary font-mono font-medium text-sm">{entry.value}</span>
          {entry.name && entry.name !== "value" && (
            <span className="text-text-muted text-[10px]">{entry.name}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export function IrisBarChart({
  data,
  dataKey = "value",
  xKey = "name",
  color = "#f97316",
  useMicrotemaColors = false,
  height = 220,
  horizontal = false,
  formatLabel,
  multibar,
}: IrisBarChartProps) {
  const fmt = formatLabel ?? ((n: string) => getMicrotemaLabel(n));

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#52525b", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            width={110}
            tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "JetBrains Mono" }}
            tickFormatter={fmt}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={useMicrotemaColors ? getMicrotemaColor(entry[xKey] as string) : color}
                fillOpacity={useMicrotemaColors ? 0.9 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: "#52525b", fontSize: 10, fontFamily: "JetBrains Mono" }}
          tickFormatter={fmt}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#52525b", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        {multibar ? (
          <>
            <Legend
              wrapperStyle={{ paddingTop: "8px", fontSize: "11px", fontFamily: "JetBrains Mono", color: "#71717a" }}
            />
            {multibar.map((b) => (
              <Bar key={b.key} dataKey={b.key} fill={b.color} name={b.label} radius={[3, 3, 0, 0]} maxBarSize={28} fillOpacity={0.9} />
            ))}
          </>
        ) : (
          <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={36}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={useMicrotemaColors ? getMicrotemaColor(entry[xKey] as string) : color}
                fillOpacity={useMicrotemaColors ? 0.9 : 1}
              />
            ))}
          </Bar>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
