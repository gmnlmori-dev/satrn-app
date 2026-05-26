"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { uiBtnIcon } from "@/lib/ui-classes";

function MegaphoneGlyph({ active }: { active: boolean }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-current")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 3.798v6.126l7.453-3.225A1.125 1.125 0 0 0 19.5 6.006V4.5a1.125 1.125 0 0 0-1.453-1.081L10.5 6.644V3.798Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 3.798v6.126M6.75 4.5v15.75m0 0H4.125A1.125 1.125 0 0 1 3 19.125V4.875A1.125 1.125 0 0 1 4.125 3.75H6.75"
      />
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
            uiBtnIcon,
            "relative h-9 w-9",
            novitaActive && "border-accent/40 bg-accent/10 text-accent",
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
