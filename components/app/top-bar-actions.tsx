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
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 16.25 4.25 18.75 6.25 20.75 8.75 18.25 16.75 10.25 14.25 7.75 6.75 16.25Z"
      />
      <path strokeLinecap="round" d="M17.75 9.25 20.75 6.25" />
      <path strokeLinecap="round" d="M18.75 11.25 21.75 11.25" />
      <path strokeLinecap="round" d="M17.75 13.25 20.75 16.25" />
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
