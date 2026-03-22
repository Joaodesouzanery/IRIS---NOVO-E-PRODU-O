import { cn, formatNumber, formatPercent } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "orange" | "green" | "red";
  className?: string;
  isPercent?: boolean;
}

export function MetricCard({
  label,
  value,
  subvalue,
  icon: Icon,
  trend,
  variant = "default",
  className,
  isPercent = false,
}: MetricCardProps) {
  const displayValue =
    typeof value === "number"
      ? isPercent
        ? formatPercent(value)
        : formatNumber(value)
      : value;

  const borderColor = {
    default: "border-border",
    orange: "border-brand/30",
    green: "border-success/30",
    red: "border-error/30",
  }[variant];

  const iconBg = {
    default: "bg-bg-hover",
    orange: "bg-brand/10",
    green: "bg-success/10",
    red: "bg-error/10",
  }[variant];

  const iconColor = {
    default: "text-text-secondary",
    orange: "text-brand",
    green: "text-success",
    red: "text-error",
  }[variant];

  return (
    <div className={cn("card border", borderColor, className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="section-label">{label}</p>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", iconBg)}>
            <Icon className={cn("w-4 h-4", iconColor)} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="metric-value">{displayValue}</span>
        {subvalue && (
          <span className="text-sm text-text-muted mb-0.5">{subvalue}</span>
        )}
      </div>

      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-xs font-mono",
          trend.value >= 0 ? "text-success" : "text-error"
        )}>
          <span>{trend.value >= 0 ? "+" : ""}{formatPercent(trend.value)}</span>
          <span className="text-text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
