/**
 * POST/GET /api/v1/sync
 * Bridges client-side localStorage with server-side API routes.
 * Client pushes deliberações + mode; server stores in memory for API routes to use.
 */

import { NextRequest, NextResponse } from "next/server";
import type { Deliberacao } from "@/types";
import { isDemo } from "@/lib/server/is-demo";
import {
  setSyncedDelibs,
  getSyncedDelibs,
  setDataMode,
  getDataMode,
  getLastSyncAt,
} from "@/lib/server/local-data-store";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Sync endpoint é exclusivo do modo demo — nunca disponível em produção
  if (!isDemo()) {
    return NextResponse.json(
      { error: "Sync endpoint indisponível em modo produção" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { deliberacoes, mode } = body as {
      deliberacoes?: Deliberacao[];
      mode?: "demo" | "local";
    };

    if (mode === "demo" || mode === "local") {
      setDataMode(mode);
    }

    if (Array.isArray(deliberacoes)) {
      setSyncedDelibs(deliberacoes);
    }

    return NextResponse.json({
      ok: true,
      count: getSyncedDelibs().length,
      mode: getDataMode(),
    });
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
}

export async function GET(): Promise<NextResponse> {
  if (!isDemo()) {
    return NextResponse.json(
      { error: "Sync endpoint indisponível em modo produção" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    mode: getDataMode(),
    count: getSyncedDelibs().length,
    lastSyncAt: getLastSyncAt(),
  });
}
