import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para server-side (API Routes, Server Components).
 * Usa a SERVICE_ROLE_KEY que nunca é exposta ao browser.
 * Bypassa Row Level Security — use apenas em código servidor confiável.
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios. " +
        "Configure-os em .env.local ou nas Vercel Environment Variables."
    );
  }

  return createClient(url, key, {
    auth: {
      // No server, não há sessão de usuário
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
