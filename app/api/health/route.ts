import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Health check interno (solo 127.0.0.1: Nginx risponde 404 all'esterno).
 * Stesso formato di Stellr: `status: "ok"` e `database: "reachable"` solo se
 * anche Supabase (Auth) risponde. Usato dal rilascio e dall'heartbeat.
 */
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5000;

async function supabaseReachable(): Promise<boolean> {
  try {
    const { url, key } = getSupabasePublicEnv();
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const reachable = await supabaseReachable();
  const body = {
    status: reachable ? "ok" : "degraded",
    database: reachable ? "reachable" : "unreachable",
    version: process.env.npm_package_version ?? null,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    status: reachable ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
