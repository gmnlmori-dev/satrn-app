"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markAnnouncementRead } from "@/lib/actions/mark-announcement-read";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";
import type { AppAnnouncement } from "@/types/announcement";

export function AnnouncementWelcomeModal({
  announcement,
}: {
  announcement: AppAnnouncement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();

  const dismiss = useCallback(() => {
    if (pending) return;
    startTransition(async () => {
      const result = await markAnnouncementRead(announcement.id);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }, [announcement.id, pending, router]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi novità"
        className="fixed inset-0 z-[70] bg-canvas/75"
        onClick={() => dismiss()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-welcome-title"
        className={cn(
          uiCard,
          uiTransition,
          "fixed left-1/2 top-1/2 z-[71] flex max-h-[min(36rem,85vh)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-[var(--shadow-surface)]",
        )}
      >
        <div className="border-b border-line-default px-4 py-4 md:px-5">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            Novità
          </p>
          <h2
            id="announcement-welcome-title"
            className="mt-1 text-lg font-semibold text-fg-primary"
          >
            {announcement.title}
          </h2>
          <p className="mt-1 text-xs tabular-nums text-fg-tertiary">
            {formatDateTime(announcement.createdAt)}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-fg-primary">
            {announcement.body}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-line-default px-4 py-4 sm:flex-row sm:justify-end md:px-5">
          <Link
            href="/app/novita"
            className={cn(uiBtnSecondary, "justify-center px-4 py-2.5 text-sm")}
            onClick={() => setOpen(false)}
          >
            Vedi cronologia
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => dismiss()}
            className={cn(uiBtnPrimary, "px-4 py-2.5 text-sm")}
          >
            {pending ? "Salvataggio…" : "Ho capito"}
          </button>
        </div>
      </div>
    </>
  );
}
