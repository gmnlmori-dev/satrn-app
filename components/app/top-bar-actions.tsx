"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";

const topBarActionClass = cn(
  uiTransition,
  uiFocusRingInset,
  "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-secondary",
  "hover:bg-surface hover:text-fg-primary",
);

function NovitaGlyph({ active }: { active: boolean }) {
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
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <path d="M4 18v2" />
      <path d="M5 19H3" />
    </svg>
  );
}

export function TopBarActions({
  unreadAnnouncementCount = 0,
}: {
  unreadAnnouncementCount?: number;
}) {
  const pathname = usePathname();
  const novitaActive = pathname === "/app/novita";

  return (
    <div
      className="flex shrink-0 items-center self-stretch border-l border-line-default pl-3"
      aria-label="Azioni barra superiore"
    >
      <div className="flex items-center gap-1">
        <Link
          href="/app/novita"
          className={cn(
            topBarActionClass,
            novitaActive && "bg-surface text-fg-primary",
          )}
          aria-label="Novità"
          aria-current={novitaActive ? "page" : undefined}
          title="Novità"
        >
          <NovitaGlyph active={novitaActive} />
          {unreadAnnouncementCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none tabular-nums text-white">
              {unreadAnnouncementCount > 9 ? "9+" : unreadAnnouncementCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
