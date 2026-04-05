"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  text: string;
  title?: string;
  className?: string;
}

export function HelpTooltip({ text, title, className }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded-full border border-border bg-bg-hover/60 flex items-center justify-center text-text-muted hover:text-brand hover:border-brand/40 transition-colors"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-7 w-72 bg-bg-card border border-border rounded-lg shadow-xl p-3 animate-fade-in">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-bg-card border-l border-t border-border" />
          {title && (
            <p className="text-xs font-semibold text-text-primary mb-1">{title}</p>
          )}
          <p className="text-xs text-text-muted leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}
