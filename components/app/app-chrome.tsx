"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  uiBtnIcon,
  uiFocusRingInset,
  uiTransition,
} from "@/lib/ui-classes";
import { fetchRequestTitleForBreadcrumb } from "@/lib/actions/request-breadcrumb";
import { fetchInboxSubjectForBreadcrumb } from "@/lib/actions/inbox-breadcrumb";
import { CreateRequestProvider } from "@/components/app/create-request-context";
import {
  DetailSaveFeedbackProvider,
  useDetailSaveFeedback,
} from "@/components/app/detail-save-feedback-context";
import { NewRequestQuerySync } from "@/components/app/new-request-query-sync";
import { NewRequestSlideOver } from "@/components/requests/new-request-slide-over";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/** Altezza unica barra superiore (sidebar + header) per allineare i border orizzontali */
const TOP_BAR_H = "h-12";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", glyph: "home" as const },
  { href: "/app/follow-up", label: "Da seguire", glyph: "followup" as const },
  { href: "/app/requests", label: "Richieste", glyph: "queue" as const },
  { href: "/app/inbox", label: "Inbox", glyph: "inbox" as const },
] as const;

function SidebarNavGlyph({
  kind,
  active,
}: {
  kind: (typeof nav)[number]["glyph"];
  active: boolean;
}) {
  if (kind === "followup") {
    const cls = cn(
      "h-4 w-4 shrink-0",
      active
        ? "text-white dark:text-slate-900"
        : "text-slate-500 dark:text-slate-500",
    );
    return (
      <svg
        className={cls}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-13.5-3h3v3.75m-4.5-6.75h.008v.008H9v-.008z"
        />
      </svg>
    );
  }
  if (kind === "inbox") {
    const cls = cn(
      "h-4 w-4 shrink-0",
      active
        ? "text-white dark:text-slate-900"
        : "text-slate-500 dark:text-slate-500",
    );
    return (
      <svg
        className={cls}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
        />
      </svg>
    );
  }
  const cls = cn(
    "h-4 w-4 shrink-0",
    active
      ? "text-white dark:text-slate-900"
      : "text-slate-500 dark:text-slate-500"
  );
  if (kind === "home") {
    return (
      <svg
        className={cls}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    );
  }
  return (
    <svg
      className={cls}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75z"
      />
    </svg>
  );
}

type Breadcrumb = { label: string; href?: string };

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function requestDetailIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const normalized =
    pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const segments = normalized.split("/").filter(Boolean);
  const isDetail =
    segments[0] === "app" &&
    segments[1] === "requests" &&
    Boolean(segments[2]) &&
    segments[2] !== "new";
  if (!isDetail) return null;
  return safeDecode(segments[2]!);
}

function inboxDetailIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const normalized =
    pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const segments = normalized.split("/").filter(Boolean);
  const isDetail =
    segments[0] === "app" &&
    segments[1] === "inbox" &&
    Boolean(segments[2]) &&
    segments[2] !== "new";
  if (!isDetail) return null;
  return safeDecode(segments[2]!);
}

function breadcrumbsForPath(
  pathname: string | null,
  requestDetailTitle: string | null,
  inboxDetailTitle: string | null,
): Breadcrumb[] {
  if (!pathname) return [{ label: "Satrn" }];
  const normalized =
    pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  if (normalized === "/app/dashboard") return [{ label: "Dashboard" }];
  if (normalized === "/app/follow-up") return [{ label: "Da seguire" }];
  if (normalized === "/app/requests") return [{ label: "Richieste" }];
  if (normalized === "/app/inbox") return [{ label: "Inbox" }];
  if (normalized === "/app/inbox/new") {
    return [
      { label: "Inbox", href: "/app/inbox" },
      { label: "Nuovo ingresso" },
    ];
  }

  const segments = normalized.split("/").filter(Boolean);
  const isRequestDetail =
    segments[0] === "app" &&
    segments[1] === "requests" &&
    Boolean(segments[2]) &&
    segments[2] !== "new";

  if (isRequestDetail) {
    return [
      { label: "Richieste", href: "/app/requests" },
      { label: requestDetailTitle ?? "Richiesta dettaglio" },
    ];
  }

  const isInboxDetail =
    segments[0] === "app" &&
    segments[1] === "inbox" &&
    Boolean(segments[2]) &&
    segments[2] !== "new";

  if (isInboxDetail) {
    return [
      { label: "Inbox", href: "/app/inbox" },
      { label: inboxDetailTitle ?? "Dettaglio" },
    ];
  }

  return [{ label: "Satrn" }];
}

function AppChromeTitleRow({ pathname }: { pathname: string | null }) {
  const { topBarSavePulse } = useDetailSaveFeedback();
  const detailId = useMemo(() => requestDetailIdFromPath(pathname), [pathname]);
  const [titleFetch, setTitleFetch] = useState<{
    id: string;
    title: string | null;
  } | null>(null);

  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;
    fetchRequestTitleForBreadcrumb(detailId).then((title) => {
      if (!cancelled) setTitleFetch({ id: detailId, title });
    });
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const detailTitle =
    detailId && titleFetch?.id === detailId ? titleFetch.title : null;

  const inboxDetailId = useMemo(
    () => inboxDetailIdFromPath(pathname),
    [pathname],
  );
  const [inboxTitleFetch, setInboxTitleFetch] = useState<{
    id: string;
    title: string | null;
  } | null>(null);

  useEffect(() => {
    if (!inboxDetailId) return;
    let cancelled = false;
    fetchInboxSubjectForBreadcrumb(inboxDetailId).then((title) => {
      if (!cancelled) setInboxTitleFetch({ id: inboxDetailId, title });
    });
    return () => {
      cancelled = true;
    };
  }, [inboxDetailId]);

  const inboxDetailTitle =
    inboxDetailId && inboxTitleFetch?.id === inboxDetailId
      ? inboxTitleFetch.title
      : null;

  const crumbs = useMemo(
    () => breadcrumbsForPath(pathname, detailTitle, inboxDetailTitle),
    [pathname, detailTitle, inboxDetailTitle],
  );
  return (
    <div className="flex min-w-0 flex-1 items-center overflow-hidden self-stretch">
      <div className="inline-flex min-w-0 max-w-full items-center gap-2">
        <div
          aria-label="Percorso pagina"
          className="flex min-w-0 max-w-full items-center gap-1.5 text-base font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100"
        >
          {crumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="inline-flex min-w-0 items-center gap-1.5">
              {idx > 0 ? (
                <span className="shrink-0 text-slate-400 dark:text-slate-500" aria-hidden>
                  &gt;
                </span>
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="max-w-[18rem] truncate text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="max-w-[24rem] truncate">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
        <span className="inline-flex h-6 w-[4.75rem] shrink-0 items-center">
          <span
            role="status"
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium leading-none text-emerald-800 transition-opacity",
              "dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
              topBarSavePulse
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
            />
            Salvato
          </span>
        </span>
      </div>
    </div>
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const openNewRequest = useCallback(() => setNewRequestOpen(true), []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <CreateRequestProvider open={openNewRequest}>
      <DetailSaveFeedbackProvider>
      <div className="flex h-screen h-dvh min-h-0 flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Suspense fallback={null}>
          <NewRequestQuerySync onOpen={openNewRequest} />
        </Suspense>

        <NewRequestSlideOver
          open={newRequestOpen}
          onClose={() => setNewRequestOpen(false)}
        />

        {menuOpen ? (
          <button
            type="button"
            aria-label="Chiudi menu"
            className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "z-50 flex w-56 shrink-0 flex-col border-r border-slate-200/90 bg-white transition-transform duration-200 ease-out",
            "fixed inset-y-0 left-0 md:relative md:inset-auto md:translate-x-0",
            "md:h-full md:overflow-hidden",
            "dark:border-slate-800 dark:bg-slate-900",
            menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div
            className={cn(
              "sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-slate-200/90 bg-white px-3 dark:border-slate-800 dark:bg-slate-900",
              TOP_BAR_H
            )}
          >
            <Link
              href="/app/dashboard"
              className={cn(
                uiFocusRingInset,
                "flex min-w-0 flex-1 items-center rounded-md outline-none"
              )}
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/logo.svg"
                alt="Satrn"
                width={160}
                height={53}
                className="h-7 w-auto max-w-full object-contain object-left dark:brightness-0 dark:invert"
                priority
              />
            </Link>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2.5">
            <div className="mb-2 border-b border-slate-200/90 pb-2 dark:border-slate-800">
              <button
                type="button"
                aria-expanded={createOpen}
                aria-controls="sidebar-create-submenu"
                onClick={() => setCreateOpen((v) => !v)}
                className={cn(
                  uiTransition,
                  uiFocusRingInset,
                  "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[15px] font-medium leading-snug",
                  "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  "dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                )}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span className="truncate">Crea</span>
                </span>
                <svg
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-500 transition-transform dark:text-slate-400",
                    createOpen && "rotate-180"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {createOpen ? (
                <div id="sidebar-create-submenu" className="mt-0.5 space-y-0.5 pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openNewRequest();
                    }}
                    className={cn(
                      uiTransition,
                      uiFocusRingInset,
                      "w-full rounded-md px-2.5 py-1.5 text-left text-[15px] font-medium leading-snug",
                      "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      "dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                    )}
                  >
                    Nuova richiesta
                  </button>
                  <Link
                    href="/app/inbox/new"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      uiTransition,
                      uiFocusRingInset,
                      "block w-full rounded-md px-2.5 py-1.5 text-[15px] font-medium leading-snug",
                      "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      "dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                    )}
                  >
                    Nuovo ingresso inbox
                  </Link>
                </div>
              ) : null}
            </div>
            {nav.map((item) => {
              const isRequestsSection =
                pathname === "/app/requests" ||
                (Boolean(pathname?.startsWith("/app/requests/")) &&
                  pathname !== "/app/requests/new");
              const isInboxSection =
                pathname === "/app/inbox" ||
                Boolean(pathname?.startsWith("/app/inbox/"));
              const active =
                item.href === "/app/requests"
                  ? isRequestsSection
                  : item.href === "/app/inbox"
                    ? isInboxSection
                    : item.href === "/app/follow-up"
                      ? pathname === "/app/follow-up"
                      : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    uiTransition,
                    "inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-[15px] font-medium leading-snug",
                    active
                      ? cn(
                          "bg-slate-900 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/35",
                          "dark:bg-slate-100 dark:text-slate-900 dark:focus-visible:ring-slate-900/20"
                        )
                      : cn(
                          uiFocusRingInset,
                          "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                          "dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                        )
                  )}
                >
                  <SidebarNavGlyph kind={item.glyph} active={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0 border-t border-slate-200/90 p-2.5 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs leading-snug text-slate-500 dark:text-slate-400">
                Satrn
              </span>
              <button
                type="button"
                onClick={async () => {
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }}
                className={cn(
                  uiTransition,
                  uiFocusRingInset,
                  "shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-600",
                  "hover:bg-slate-100 hover:text-slate-900",
                  "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                Esci
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className={cn(
              "sticky top-0 z-50 flex shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white px-3 sm:px-4 dark:border-slate-800 dark:bg-slate-900",
              TOP_BAR_H
            )}
          >
            <button
              type="button"
              className={cn(uiBtnIcon, "h-9 w-9 shrink-0 md:hidden")}
              aria-expanded={menuOpen}
              aria-label="Apri menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <AppChromeTitleRow pathname={pathname ?? null} />
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7">
              {children}
            </div>
          </main>
        </div>
      </div>
      </DetailSaveFeedbackProvider>
    </CreateRequestProvider>
  );
}
