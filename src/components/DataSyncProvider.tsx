"use client";

/**
 * DataSyncProvider — wraps dashboard children.
 * Ensures localStorage data is synced to server before any API queries fire.
 */

import { createContext, useContext } from "react";
import { useDataSync } from "@/hooks/useDataSync";

type DataSyncCtx = {
  mode: "demo" | "local";
  toggleMode: () => void;
  synced: boolean;
  localCount: number;
  sync: (m?: "demo" | "local") => Promise<void>;
};

const Ctx = createContext<DataSyncCtx>({
  mode: "local",
  toggleMode: () => {},
  synced: false,
  localCount: 0,
  sync: async () => {},
});

export function useDataSyncContext() {
  return useContext(Ctx);
}

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const data = useDataSync();

  if (!data.synced) {
    return (
      <div className="flex items-center justify-center h-screen text-text-muted text-sm">
        Sincronizando dados...
      </div>
    );
  }

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}
