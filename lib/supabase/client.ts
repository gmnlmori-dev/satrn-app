import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase (chiave pubblica). Usabile da Server/Client Components e route handlers.
 * Per RLS in futuro servirà sessione utente; per ora niente auth.
 */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Mancano NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return createClient(url, key);
}
