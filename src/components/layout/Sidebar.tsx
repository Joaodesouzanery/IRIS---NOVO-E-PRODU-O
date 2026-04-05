"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  BarChart3,
  Users,
  TrendingUp,
  Building2,
  ChevronDown,
  Activity,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Deliberações", href: "/dashboard/deliberacoes", icon: FileText },
  { label: "Diretores",    href: "/dashboard/analytics/diretores", icon: Users },
  { label: "Análise",      href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Regulatório",  href: "/dashboard/painel-regulatorio", icon: TrendingUp },
  { label: "Configurações",href: "/dashboard/agencias", icon: Building2 },
];

// Which URL prefixes activate each sidebar item
const MODULE_PATHS: Record<string, string[]> = {
  "/dashboard/deliberacoes": [
    "/dashboard",
    "/dashboard/upload",
    "/dashboard/deliberacoes",
  ],
  "/dashboard/analytics/diretores": [
    "/dashboard/analytics/diretores",
    "/dashboard/mandatos",
    "/dashboard/votacao",
  ],
  "/dashboard/analytics": [
    "/dashboard/analytics",
    "/dashboard/analytics/temas",
    "/dashboard/360",
    "/dashboard/insights",
    "/dashboard/governanca",
  ],
  "/dashboard/painel-regulatorio": [
    "/dashboard/painel-regulatorio",
    "/dashboard/empresas",
  ],
  "/dashboard/agencias": [
    "/dashboard/agencias",
    "/dashboard/boletim",
  ],
};

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const paths = MODULE_PATHS[href] ?? [href];
    return paths.some((p) =>
      p === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === p || pathname.startsWith(p + "/")
    );
  };

  return (
    <aside className="flex flex-col w-60 h-screen sticky top-0 bg-bg-sidebar border-r border-border shrink-0">
      {/* Logo / Agency Selector */}
      <div className="p-4 border-b border-border">
        <button className="flex items-center justify-between w-full px-3 py-2.5 rounded-md bg-bg-card border border-border hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
                Agência
              </p>
              <p className="text-sm font-medium text-text-primary truncate max-w-[130px]">
                Todas
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn("sidebar-item", active && "active")}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center">
            <Activity className="w-3 h-3 text-brand" />
          </div>
          <div>
            <p className="text-xs font-mono text-text-muted uppercase tracking-wider">
              IRIS Regulação
            </p>
            <p className="text-xs text-text-label">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
