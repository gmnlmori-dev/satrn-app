import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Client Supabase per Server Components, Server Actions e route handlers.
 * Legge/scrive la sessione tramite cookie (refresh gestito dal proxy).
 * Un solo client per richiesta (React `cache`).
 */
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component senza contesto di risposta mutabile: il proxy aggiorna i cookie.
        }
        void headers;
      },
    },
  });
});

/**
 * Id dell'utente autenticato, verificando localmente la firma del JWT
 * (chiavi asimmetriche, JWKS in cache) senza round-trip all'Auth server.
 */
export const getAuthUserId = cache(async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
});
