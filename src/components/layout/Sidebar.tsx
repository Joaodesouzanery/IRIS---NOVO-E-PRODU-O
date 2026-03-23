"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Users,
  Vote,
  Lightbulb,
  Building2,
  ChevronDown,
  Activity,
  TrendingUp,
  Grid3x3,
  Tag,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Menu Principal",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Upload de PDFs", href: "/dashboard/upload", icon: Upload },
      { label: "Deliberações", href: "/dashboard/deliberacoes", icon: FileText },
    ],
  },
  {
    title: "Análise",
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Mandatos", href: "/dashboard/mandatos", icon: Users },
      { label: "Votação", href: "/dashboard/votacao", icon: Vote },
      { label: "Insights", href: "/dashboard/insights", icon: Lightbulb },
    ],
  },
  {
    title: "Painel Regulatório",
    items: [
      { label: "Visão Geral",  href: "/dashboard/painel-regulatorio",           icon: TrendingUp },
      { label: "Setores",      href: "/dashboard/painel-regulatorio/setores",    icon: Grid3x3 },
      { label: "Microtemas",   href: "/dashboard/painel-regulatorio/microtemas", icon: Tag },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Agências", href: "/dashboard/agencias", icon: Building2 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-bg-sidebar border-r border-border shrink-0">
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
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="section-label px-3 mb-1">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
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
          </div>
        ))}
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
