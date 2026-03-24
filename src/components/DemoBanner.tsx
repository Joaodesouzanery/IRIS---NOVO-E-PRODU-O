"use client";

import { useState } from "react";
import { FlaskConical, X } from "lucide-react";

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (!IS_DEMO || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-brand/10 border-b border-brand/20 text-sm">
      <div className="flex items-center gap-2 text-brand">
        <FlaskConical className="w-4 h-4 shrink-0" />
        <span className="font-medium">Modo Demo</span>
        <span className="text-text-muted font-normal">
          — Dados locais da ARTESP (10 deliberações, 4 diretores). PDFs enviados ficam salvos no localStorage.
          Configure o Supabase para persistência em produção.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-muted hover:text-text-primary transition-colors shrink-0"
        aria-label="Fechar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
