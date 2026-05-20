"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";
import { uiBtnPrimary } from "@/lib/ui-classes";
import { uiFormLabel, uiPageLead, uiPageTitle } from "@/lib/typography";

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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="mb-8">
        <Image
          src="/logo.svg"
          alt="Satrn"
          width={200}
          height={66}
          className="logo-on-dark h-9 w-auto object-contain object-center"
          priority
        />
      </div>

      <Panel className="w-full max-w-md shadow-sm">
        {inactive ? (
          <p
            role="alert"
            className="mb-4 rounded-md border border-warning/30 bg-warning-muted px-3 py-2 text-sm text-warning"
          >
            Questo account è stato disattivato. Contatta un amministratore Satrn per
            ripristinare l&apos;accesso.
          </p>
        ) : null}
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
            <label htmlFor="login-password" className={uiFormLabel}>
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
              className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger"
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
      </Panel>
    </div>
  );
}
