"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { appRoleLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function userInitial(fullName: string, email: string): string {
  const name = fullName.trim();
  if (name) return name.charAt(0).toUpperCase();
  const mail = email.trim();
  if (mail) return mail.charAt(0).toUpperCase();
  return "?";
}

function SettingsGlyph({ active }: { active: boolean }) {
  return (
    <svg
      className={cn(
        "h-4 w-4 shrink-0",
        active ? "text-accent" : "text-fg-tertiary",
      )}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.722 7.722 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function LogoutGlyph() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
      />
    </svg>
  );
}

const footerActionClass = cn(
  uiTransition,
  uiFocusRingInset,
  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium leading-none text-fg-secondary",
  "hover:bg-surface hover:text-fg-primary",
);

export function SidebarUserPanel({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useOptionalCurrentProfile();
  const settingsActive = pathname?.startsWith("/app/settings") ?? false;

  if (!me) {
    return (
      <div className="shrink-0 border-t border-line-default p-2.5">
        <div className="flex items-center justify-center rounded-lg border border-line-default bg-elevated/40 p-2">
          <ThemeToggle compact className="h-9 w-9 justify-center px-0" />
        </div>
      </div>
    );
  }

  const displayName = me.fullName.trim() || me.email.trim() || "Utente";
  const subtitle = [appRoleLabel[me.role], me.teamName?.trim()]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="shrink-0 border-t border-line-default p-2.5">
      <div className="rounded-lg border border-line-default bg-elevated/40">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent"
            aria-hidden
          >
            {userInitial(me.fullName, me.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-snug text-fg-primary">
              {displayName}
            </p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 border-t border-line-default bg-sidebar/60 p-1">
          <Link
            href="/app/settings"
            onClick={onNavigate}
            className={cn(
              footerActionClass,
              settingsActive && "bg-surface text-fg-primary",
            )}
            aria-current={settingsActive ? "page" : undefined}
            title="Impostazioni"
          >
            <SettingsGlyph active={settingsActive} />
            <span className="max-w-full truncate">Impost.</span>
          </Link>
          <ThemeToggle compact className={footerActionClass} />
          <button
            type="button"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/login");
              router.refresh();
            }}
            className={cn(footerActionClass, "hover:text-danger")}
            title="Esci"
          >
            <LogoutGlyph />
            <span className="max-w-full truncate">Esci</span>
          </button>
        </div>
      </div>
    </div>
  );
}
