import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o lado do browser (componentes React "use client").
 * Usa apenas as chaves públicas (NEXT_PUBLIC_*).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
