"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  uiBtnIcon,
  uiFocusRingInset,
  uiNavActive,
  uiNavItem,
  uiTransition,
} from "@/lib/ui-classes";
import { uiMono } from "@/lib/typography";
import { useOptionalCurrentProfile, useInboxEnabled } from "@/components/app/current-user-context";
import { fetchInboxSubjectForBreadcrumb } from "@/lib/actions/inbox-breadcrumb";
import { fetchRequestTitleForBreadcrumb } from "@/lib/actions/request-breadcrumb";
import { CreateRequestProvider } from "@/components/app/create-request-context";
import { CreateNoteProvider } from "@/components/app/create-note-context";
import { CreateTaskProvider } from "@/components/app/create-task-context";
import {
  AppSlideCoordinatorProvider,
  useExclusiveAppSlide,
} from "@/components/app/app-slide-coordinator";
import {
  DetailSaveFeedbackProvider,
  useDetailSaveFeedback,
} from "@/components/app/detail-save-feedback-context";
import { NewRequestQuerySync } from "@/components/app/new-request-query-sync";
import { InboxNewQuerySync } from "@/components/app/inbox-new-query-sync";
import { NoteNewQuerySync } from "@/components/app/note-new-query-sync";
import { NewRequestSlideOver } from "@/components/requests/new-request-slide-over";
import { InboxNewSlideOver } from "@/components/inbox/inbox-new-slide-over";
import { NewNoteSlideOver } from "@/components/notes/new-note-slide-over";
import { NewTaskSlideOver } from "@/components/tasks/new-task-slide-over";
import { resetAppMainScroll } from "@/lib/main-scroll";
import { SidebarUserPanel } from "@/components/app/sidebar-user-panel";
import { TopBarActions } from "@/components/app/top-bar-actions";
import { AnnouncementWelcomeModal } from "@/components/announcements/announcement-welcome-modal";
import type { AppAnnouncement } from "@/types/announcement";

/** Altezza unica barra superiore (sidebar + header) per allineare i border orizzontali */
const TOP_BAR_H = "h-12";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", glyph: "home" as const },
  { href: "/app/follow-up", label: "Da seguire", glyph: "followup" as const },
  { href: "/app/calendar", label: "Calendario", glyph: "calendar" as const },
  { href: "/app/tasks", label: "Task", glyph: "task" as const },
  { href: "/app/inbox", label: "Inbox", glyph: "inbox" as const },
  { href: "/app/requests", label: "Progetti", glyph: "queue" as const },
  { href: "/app/notes", label: "Note", glyph: "note" as const },
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
      active ? "text-accent" : "text-fg-tertiary",
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
  if (kind === "note") {
    const cls = cn(
      "h-4 w-4 shrink-0",
      active ? "text-accent" : "text-fg-tertiary",
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
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    );
  }
  if (kind === "inbox") {
    const cls = cn(
      "h-4 w-4 shrink-0",
      active ? "text-accent" : "text-fg-tertiary",
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
  if (kind === "task") {
    const cls = cn(
      "h-4 w-4 shrink-0",
      active ? "text-accent" : "text-fg-tertiary",
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
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    );
  }
  if (kind === "calendar") {
    const cls = cn(
      "h-4 w-4 shrink-0",
      active ? "text-accent" : "text-fg-tertiary",
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
  const cls = cn(
    "h-4 w-4 shrink-0",
    active ? "text-accent" : "text-fg-tertiary"
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
  if (normalized === "/app/requests") return [{ label: "Progetti" }];
  if (normalized === "/app/calendar") return [{ label: "Calendario" }];
  if (normalized === "/app/inbox") return [{ label: "Inbox" }];
  if (normalized === "/app/tasks") return [{ label: "Task" }];
  if (normalized === "/app/notes") return [{ label: "Note" }];
  if (normalized === "/app/novita") return [{ label: "Novità" }];
  if (normalized === "/app/notes/new") {
    return [
      { label: "Note", href: "/app/notes" },
      { label: "Nuova nota" },
    ];
  }
  if (normalized === "/app/inbox/new") {
    return [
      { label: "Inbox", href: "/app/inbox" },
      { label: "Nuovo inbox" },
    ];
  }
  if (normalized === "/app/requests/new") {
    return [
      { label: "Progetti", href: "/app/requests" },
      { label: "Nuovo progetto" },
    ];
  }
  if (normalized === "/app/settings" || normalized.startsWith("/app/settings/")) {
    if (normalized === "/app/settings") {
      return [{ label: "Impostazioni" }];
    }
    if (normalized === "/app/settings/users") {
      return [
        { label: "Impostazioni", href: "/app/settings" },
        { label: "Utenti" },
      ];
    }
    if (normalized === "/app/settings/teams") {
      return [
        { label: "Impostazioni", href: "/app/settings" },
        { label: "Team" },
      ];
    }
    if (normalized === "/app/settings/announcements") {
      return [
        { label: "Impostazioni", href: "/app/settings" },
        { label: "Novità" },
      ];
    }
    return [{ label: "Impostazioni" }];
  }

  const segments = normalized.split("/").filter(Boolean);
  const isRequestDetail =
    segments[0] === "app" &&
    segments[1] === "requests" &&
    Boolean(segments[2]) &&
    segments[2] !== "new";

  if (isRequestDetail) {
    return [
      { label: "Progetti", href: "/app/requests" },
      { label: requestDetailTitle ?? "Dettaglio progetto" },
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
          className="flex min-w-0 max-w-full items-center gap-1.5 text-sm font-medium leading-tight text-fg-primary"
        >
          {crumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="inline-flex min-w-0 items-center gap-1.5">
              {idx > 0 ? (
                <span className="shrink-0 text-fg-tertiary" aria-hidden>
                  /
                </span>
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="max-w-[18rem] truncate text-fg-secondary underline-offset-2 hover:text-accent hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn("max-w-[24rem] truncate", idx === crumbs.length - 1 && crumbs.length > 1 && uiMono)}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </div>
        <span className="inline-flex h-6 w-[4.75rem] shrink-0 items-center">
          <span
            role="status"
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success-muted px-2 py-0.5 text-[11px] font-medium leading-none text-success transition-opacity",
              topBarSavePulse
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-success"
            />
            Salvato
          </span>
        </span>
      </div>
    </div>
  );
}

export function AppChrome({
  children,
  welcomeAnnouncement = null,
  unreadAnnouncementCount = 0,
}: {
  children: React.ReactNode;
  welcomeAnnouncement?: AppAnnouncement | null;
  unreadAnnouncementCount?: number;
}) {
  return (
    <AppSlideCoordinatorProvider>
      <AppChromeInner
        welcomeAnnouncement={welcomeAnnouncement}
        unreadAnnouncementCount={unreadAnnouncementCount}
      >
        {children}
      </AppChromeInner>
    </AppSlideCoordinatorProvider>
  );
}

function AppChromeInner({
  children,
  welcomeAnnouncement,
  unreadAnnouncementCount,
}: {
  children: React.ReactNode;
  welcomeAnnouncement: AppAnnouncement | null;
  unreadAnnouncementCount: number;
}) {
  const pathname = usePathname();
  const me = useOptionalCurrentProfile();
  const inboxEnabled = useInboxEnabled();
  const visibleNav = useMemo(
    () => nav.filter((item) => item.href !== "/app/inbox" || inboxEnabled),
    [inboxEnabled],
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const newRequestSlide = useExclusiveAppSlide("new-request");
  const newInboxSlide = useExclusiveAppSlide("new-inbox");
  const newNoteSlide = useExclusiveAppSlide("new-note");
  const newTaskSlide = useExclusiveAppSlide("new-task");
  const [createOpen, setCreateOpen] = useState(false);
  const openNewRequest = newRequestSlide.openSlide;
  const openNewInbox = newInboxSlide.openSlide;
  const openNewNote = newNoteSlide.openSlide;
  const openNewTask = newTaskSlide.openSlide;

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    resetAppMainScroll();
  }, [pathname]);

  return (
    <CreateRequestProvider open={openNewRequest}>
      <CreateNoteProvider open={openNewNote}>
      <CreateTaskProvider open={openNewTask}>
      <DetailSaveFeedbackProvider>
      <div className="flex h-screen h-dvh min-h-0 flex-row overflow-hidden bg-canvas">
        <Suspense fallback={null}>
          <NewRequestQuerySync onOpen={openNewRequest} />
        </Suspense>
        <Suspense fallback={null}>
          {inboxEnabled ? (
            <InboxNewQuerySync onOpen={openNewInbox} />
          ) : null}
        </Suspense>
        <Suspense fallback={null}>
          <NoteNewQuerySync onOpen={openNewNote} />
        </Suspense>

        <NewRequestSlideOver
          open={newRequestSlide.open}
          onClose={newRequestSlide.closeSlide}
        />
        {inboxEnabled ? (
          <InboxNewSlideOver
            open={newInboxSlide.open}
            onClose={newInboxSlide.closeSlide}
          />
        ) : null}
        <NewNoteSlideOver
          open={newNoteSlide.open}
          onClose={newNoteSlide.closeSlide}
        />
        <NewTaskSlideOver
          open={newTaskSlide.open}
          onClose={newTaskSlide.closeSlide}
        />

        {menuOpen ? (
          <button
            type="button"
            aria-label="Chiudi menu"
            className="fixed inset-0 z-40 bg-canvas/90 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "z-50 flex w-52 min-w-52 max-w-52 shrink-0 flex-col border-r border-line-default bg-sidebar transition-transform duration-200 ease-out",
            "fixed inset-y-0 left-0 md:relative md:inset-auto md:translate-x-0",
            "md:h-full md:overflow-hidden",
            menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div
            className={cn(
              "sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-line-default bg-sidebar px-3",
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
                className="logo-on-dark h-7 w-auto max-w-full object-contain object-left"
                priority
              />
            </Link>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2.5">
            <div className="mb-2 border-b border-line-default pb-2">
              <button
                type="button"
                aria-expanded={createOpen}
                aria-controls="sidebar-create-submenu"
                onClick={() => setCreateOpen((v) => !v)}
                className={cn(
                  uiTransition,
                  uiFocusRingInset,
                  "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium leading-snug",
                  "text-fg-secondary hover:bg-elevated hover:text-fg-primary",
                )}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-fg-tertiary"
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
                    "h-4 w-4 shrink-0 text-fg-tertiary transition-transform",
                    createOpen && "rotate-180",
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
                      openNewTask();
                    }}
                    className={cn(
                      uiTransition,
                      uiFocusRingInset,
                      "w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium leading-snug",
                      "text-fg-secondary hover:bg-elevated hover:text-fg-primary",
                    )}
                  >
                    Task
                  </button>
                  {inboxEnabled ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openNewInbox();
                      }}
                      className={cn(
                        uiTransition,
                        uiFocusRingInset,
                        "w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium leading-snug",
                        "text-fg-secondary hover:bg-elevated hover:text-fg-primary",
                      )}
                    >
                      Inbox
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openNewRequest();
                    }}
                    className={cn(
                      uiTransition,
                      uiFocusRingInset,
                      "w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium leading-snug",
                      "text-fg-secondary hover:bg-elevated hover:text-fg-primary",
                    )}
                  >
                    Progetto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openNewNote();
                    }}
                    className={cn(
                      uiTransition,
                      uiFocusRingInset,
                      "w-full rounded-md px-2.5 py-1.5 text-left text-sm font-medium leading-snug",
                      "text-fg-secondary hover:bg-elevated hover:text-fg-primary",
                    )}
                  >
                    Nota
                  </button>
                </div>
              ) : null}
            </div>
            {visibleNav.map((item) => {
              const isRequestsSection =
                pathname === "/app/requests" ||
                (Boolean(pathname?.startsWith("/app/requests/")) &&
                  pathname !== "/app/requests/new");
              const isInboxSection =
                pathname === "/app/inbox" ||
                Boolean(pathname?.startsWith("/app/inbox/"));
              const isNotesSection =
                pathname === "/app/notes" ||
                Boolean(pathname?.startsWith("/app/notes/"));
              const isTasksSection = pathname === "/app/tasks";
              const active =
                item.href === "/app/requests"
                  ? isRequestsSection
                  : item.href === "/app/inbox"
                    ? isInboxSection
                    : item.href === "/app/notes"
                      ? isNotesSection
                      : item.href === "/app/tasks"
                        ? isTasksSection
                        : item.href === "/app/follow-up"
                          ? pathname === "/app/follow-up"
                          : item.href === "/app/calendar"
                            ? pathname === "/app/calendar"
                            : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={active ? uiNavActive : uiNavItem}
                >
                  <SidebarNavGlyph kind={item.glyph} active={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SidebarUserPanel onNavigate={() => setMenuOpen(false)} />
        </aside>

        {welcomeAnnouncement ? (
          <AnnouncementWelcomeModal announcement={welcomeAnnouncement} />
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className={cn(
              "sticky top-0 z-50 flex shrink-0 items-center gap-3 border-b border-line-default bg-sidebar px-3 sm:px-4",
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
            <TopBarActions unreadAnnouncementCount={unreadAnnouncementCount} />
          </header>

          <main
            data-app-main
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-pt-24"
          >
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              {children}
            </div>
          </main>
        </div>
      </div>
      </DetailSaveFeedbackProvider>
      </CreateTaskProvider>
      </CreateNoteProvider>
    </CreateRequestProvider>
  );
}
