"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";
import { uiCardElevated } from "@/lib/surfaces";
import { uiBtnIcon, uiBtnPrimary } from "@/lib/ui-classes";
import { uiFieldLabel, uiPageLead, uiPageTitle } from "@/lib/typography";

export function LoginForm({ inactive }: { inactive?: boolean }) {
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
    <div className="relative flex min-h-[100dvh] flex-col bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--accent-muted),transparent_65%)] opacity-80"
      />

      <header className="relative z-10 flex justify-end px-4 pt-4 sm:px-6 sm:pt-6">
        <ThemeToggle compact className={cn(uiBtnIcon, "h-9 w-9 shrink-0")} />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-6">
        <div className="mb-8 flex w-full max-w-[420px] flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt="Satrn"
            width={200}
            height={66}
            className="logo-on-dark h-9 w-auto object-contain"
            priority
          />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-secondary">
            Software operativo per centralizzare richieste, follow-up e processi.
          </p>
        </div>

        <div className={cn(uiCardElevated, "w-full max-w-[420px] p-6 sm:p-7")}>
          {inactive ? (
            <p
              role="alert"
              className="mb-5 rounded-[10px] border border-warning/30 bg-warning-muted px-3 py-2.5 text-sm text-warning-fg"
            >
              Questo account è stato disattivato. Contatta un amministratore Satrn
              per ripristinare l&apos;accesso.
            </p>
          ) : null}

          <div className="border-b border-line-default pb-5">
            <h1 className={uiPageTitle}>Accesso</h1>
            <p className={cn(uiPageLead, "mt-1.5")}>
              Accedi con email e password per usare l&apos;app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className={uiFieldLabel}>
                Email
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="login-password" className={uiFieldLabel}>
                Password
              </label>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-[10px] border border-danger/30 bg-danger-muted px-3 py-2.5 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className={cn(uiBtnPrimary, "mt-2 w-full py-2.5")}
            >
              {busy ? "Accesso…" : "Entra"}
            </button>
          </form>
        </div>
      </main>

      <footer className="relative z-10 px-4 pb-6 text-center">
        <p className="text-xs text-fg-tertiary">Satrn · Gestione operativa</p>
      </footer>
    </div>
  );
}
