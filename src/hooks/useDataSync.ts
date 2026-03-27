"use client";

/**
 * useDataSync — bridges client localStorage with server-side API routes.
 * On mount and after changes, pushes deliberações + mode to POST /api/v1/sync.
 * API routes then use the synced data instead of hardcoded demoData.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLocalDelibs } from "@/lib/local-store";

const MODE_KEY = "iris_data_mode";
type DataMode = "demo" | "local";

function readMode(): DataMode {
  if (typeof window === "undefined") return "local";
  return (localStorage.getItem(MODE_KEY) as DataMode) ?? "local";
}

export function useDataSync() {
  const queryClient = useQueryClient();
  const [mode, setModeState] = useState<DataMode>(readMode);
  const [synced, setSynced] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const lastHash = useRef("");

  const doSync = useCallback(async (newMode?: DataMode) => {
    const m = newMode ?? readMode();
    const delibs = m === "local" ? getLocalDelibs() : [];
    setLocalCount(delibs.length);

    // Hash-based change detection
    const hash = `${m}:${delibs.length}:${delibs.map((d) => d.id).join(",")}`;
    if (hash === lastHash.current) {
      setSynced(true);
      return;
    }

    try {
      await fetch("/api/v1/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliberacoes: delibs, mode: m }),
      });
      lastHash.current = hash;
      setSynced(true);
      // Invalidate all cached queries so pages refetch with new data
      queryClient.invalidateQueries();
    } catch {
      // Non-critical; pages will fall back to demo data
      setSynced(true);
    }
  }, [queryClient]);

  const toggleMode = useCallback(() => {
    const next: DataMode = readMode() === "demo" ? "local" : "demo";
    localStorage.setItem(MODE_KEY, next);
    setModeState(next);
    lastHash.current = ""; // Force re-sync
    doSync(next);
  }, [doSync]);

  // Sync on mount
  useEffect(() => {
    doSync();
  }, [doSync]);

  // Listen for cross-tab storage changes
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "iris_local_deliberacoes" || e.key === MODE_KEY) {
        if (e.key === MODE_KEY) setModeState(readMode());
        lastHash.current = ""; // Force re-sync
        doSync();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [doSync]);

  return { mode, toggleMode, synced, localCount, sync: doSync };
}
