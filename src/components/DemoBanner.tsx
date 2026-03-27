"use client";

import { FlaskConical, Database } from "lucide-react";
import { useDataSyncContext } from "@/components/DataSyncProvider";

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export function DemoBanner() {
  const { mode, toggleMode, localCount } = useDataSyncContext();

  if (!IS_DEMO) return null;

  const isLocal = mode === "local";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 border-b text-sm"
      style={{
        background: isLocal ? "rgba(249,115,22,0.06)" : "rgba(139,92,246,0.06)",
        borderColor: isLocal ? "rgba(249,115,22,0.15)" : "rgba(139,92,246,0.15)",
      }}
    >
      <div className="flex items-center gap-2">
        {isLocal ? (
          <Database className="w-4 h-4 shrink-0 text-brand" />
        ) : (
          <FlaskConical className="w-4 h-4 shrink-0 text-violet-400" />
        )}
        <span className="font-medium" style={{ color: isLocal ? "var(--brand)" : "rgb(167,139,250)" }}>
          {isLocal ? "Dados Reais" : "Modo Demo"}
        </span>
        <span className="text-text-muted font-normal">
          {isLocal
            ? `— ${localCount} deliberação${localCount !== 1 ? "ões" : ""} via upload (localStorage)`
            : "— 10 amostras fictícias da ARTESP. Alterne para ver seus dados reais."
          }
        </span>
      </div>

      <button
        onClick={toggleMode}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all"
        style={{
          background: isLocal ? "rgba(139,92,246,0.1)" : "rgba(249,115,22,0.1)",
          color: isLocal ? "rgb(167,139,250)" : "var(--brand)",
          border: `1px solid ${isLocal ? "rgba(139,92,246,0.2)" : "rgba(249,115,22,0.2)"}`,
        }}
      >
        {isLocal ? (
          <>
            <FlaskConical className="w-3 h-3" />
            Ver Demo
          </>
        ) : (
          <>
            <Database className="w-3 h-3" />
            Ver Dados Reais
          </>
        )}
      </button>
    </div>
  );
}
