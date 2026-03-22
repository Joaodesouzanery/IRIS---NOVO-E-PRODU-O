"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface AreaData {
  name: string;
  [key: string]: string | number;
}

interface IrisAreaChartProps {
  data: AreaData[];
  areas: Array<{ key: string; color: string; label: string }>;
  height?: number;
}

export function IrisAreaChart({ data, areas, height = 220 }: IrisAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <defs>
          {areas.map((a) => (
            <linearGradient key={a.key} id={`grad_${a.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={a.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#71717a", fontSize: 11, fontFamily: "JetBrains Mono" }}
        />
        <YAxis tick={{ fill: "#71717a", fontSize: 11, fontFamily: "JetBrains Mono" }} />
        <Tooltip
          contentStyle={{
            background: "#1c1c1c",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            fontSize: "12px",
            fontFamily: "JetBrains Mono",
          }}
          labelStyle={{ color: "#a1a1aa" }}
          itemStyle={{ color: "#ffffff" }}
        />
        {areas.map((a) => (
          <Area
            key={a.key}
            type="monotone"
            dataKey={a.key}
            stroke={a.color}
            fill={`url(#grad_${a.key})`}
            strokeWidth={2}
            name={a.label}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
