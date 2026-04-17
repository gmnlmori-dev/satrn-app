import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "./lib/supabase/env";

/** Copia i cookie di sessione Supabase sulla risposta di redirect (dopo refresh token). */
function copyCookies(from: NextResponse, to: NextResponse) {
  for (const c of from.cookies.getAll()) {
    to.cookies.set(c.name, c.value, {
      path: c.path,
      domain: c.domain,
      maxAge: c.maxAge,
      expires: c.expires,
      sameSite: c.sameSite as boolean | "lax" | "strict" | "none" | undefined,
      httpOnly: c.httpOnly,
      secure: c.secure,
    });
  }
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const { url: supabaseUrl, key: supabaseKey } = getSupabasePublicEnv();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (user) {
      const redirect = NextResponse.redirect(
        new URL("/app/dashboard", request.url),
      );
      copyCookies(response, redirect);
      return redirect;
    }
    return response;
  }

  if (!user) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
