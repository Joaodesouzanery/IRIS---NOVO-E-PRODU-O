"use client";

import { formatPercent } from "@/lib/utils";

interface GaugeChartProps {
  value: number; // 0-100
  label?: string;
  color?: string;
  size?: number;
}

export function GaugeChart({
  value,
  label = "Taxa",
  color = "#f97316",
  size = 160,
}: GaugeChartProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = 60;
  const strokeWidth = 12;
  const center = size / 2;

  // Semicírculo: vai de -180° a 0° (metade de cima)
  const circumference = Math.PI * radius;
  const progress = (clampedValue / 100) * circumference;

  const startX = center - radius;
  const endX = center + radius;
  const y = center + 20;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Trilho de fundo */}
        <path
          d={`M ${startX} ${y} A ${radius} ${radius} 0 0 1 ${endX} ${y}`}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progresso */}
        <path
          d={`M ${startX} ${y} A ${radius} ${radius} 0 0 1 ${endX} ${y}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        {/* Valor central */}
        <text
          x={center}
          y={y - 10}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="22"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
        >
          {formatPercent(clampedValue, 1)}
        </text>
        <text
          x={center}
          y={y + 10}
          textAnchor="middle"
          fill="#71717a"
          fontSize="10"
          fontFamily="JetBrains Mono, monospace"
        >
          {label.toUpperCase()}
        </text>
        {/* Labels 0% e 100% */}
        <text x={startX - 4} y={y + 18} fill="#52525b" fontSize="9" fontFamily="JetBrains Mono">0%</text>
        <text x={endX - 16} y={y + 18} fill="#52525b" fontSize="9" fontFamily="JetBrains Mono">100%</text>
      </svg>
    </div>
  );
}
