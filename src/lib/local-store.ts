/**
 * local-store.ts
 * Client-side only — localStorage persistence for deliberações in demo mode.
 * Safe to import in "use client" components; returns empty arrays on SSR.
 */

import type { Deliberacao } from "@/types";

const KEY = "iris_local_deliberacoes";

export function getLocalDelibs(): Deliberacao[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Deliberacao[];
  } catch {
    return [];
  }
}

export function appendLocalDelibs(items: Deliberacao[]): void {
  const existing = getLocalDelibs();
  const ids = new Set(existing.map((d) => d.id));
  const merged = [...existing, ...items.filter((d) => !ids.has(d.id))];
  localStorage.setItem(KEY, JSON.stringify(merged));
}

export function clearLocalDelibs(): void {
  localStorage.removeItem(KEY);
}

export function countLocalDelibs(): number {
  return getLocalDelibs().length;
}

export function updateLocalDelib(id: string, updates: Partial<Deliberacao>): boolean {
  if (typeof window === "undefined") return false;
  const existing = getLocalDelibs();
  const idx = existing.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  existing[idx] = { ...existing[idx], ...updates };
  localStorage.setItem(KEY, JSON.stringify(existing));
  return true;
}
