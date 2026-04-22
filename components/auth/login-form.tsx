"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel, uiPageLead, uiPageTitle } from "@/lib/typography";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/app/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mb-8">
        <Image
          src="/logo.svg"
          alt="Satrn"
          width={200}
          height={66}
          className="h-9 w-auto object-contain object-center dark:brightness-0 dark:invert"
          priority
        />
      </div>

      <SurfaceCard className="w-full max-w-md shadow-sm">
        <h1 className={uiPageTitle}>
          Accesso
        </h1>
        <p className={cn(uiPageLead, "mt-1.5")}>
          Accedi con email e password per usare l&apos;app.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className={uiFormLabel}>
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                uiTransition,
                uiFocusRingOffset,
                "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 shadow-sm",
                "placeholder:text-slate-400",
                "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
              )}
            />
          </div>
          <div>
            <label htmlFor="login-password" className={uiFormLabel}>
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                uiTransition,
                uiFocusRingOffset,
                "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 shadow-sm",
                "placeholder:text-slate-400",
                "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
              )}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className={cn(uiBtnPrimary, "w-full")}
          >
            {busy ? "Accesso…" : "Entra"}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
