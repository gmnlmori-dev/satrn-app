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

function MegaphoneGlyph({ active }: { active: boolean }) {
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
      <path d="M7 13 18 6" />
      <path d="M6 16 16 11" />
      <path d="M18 6 16 11" />
      <path d="M6 16 4 18.5 6.5 20" />
      <path d="M18.5 6.5 21.5 4.5" />
      <path d="M18.5 8.5 21.5 8.5" />
      <path d="M18.5 10.5 21.5 12.5" />
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
          <MegaphoneGlyph active={novitaActive} />
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
