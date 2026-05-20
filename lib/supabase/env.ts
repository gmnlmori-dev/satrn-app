/** Variabili pubbliche Supabase (URL + publishable key). */
export function getSupabasePublicEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Mancano NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return { url, key };
}

/** Service role — solo server (Server Actions admin). Mai esporre al client. */
export function getSupabaseServiceRoleEnv(): { url: string; serviceRoleKey: string } {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Manca SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → Secret key).",
    );
  }
  return { url, serviceRoleKey };
}
