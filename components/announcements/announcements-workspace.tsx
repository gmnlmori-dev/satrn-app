"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAnnouncementRead } from "@/lib/actions/mark-announcement-read";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";
import { uiCaption, uiPageLead, uiPageTitle, uiSectionTitle } from "@/lib/typography";
import type { AppAnnouncement } from "@/types/announcement";

function AnnouncementDetailPanel({
  announcement,
  onClose,
}: {
  announcement: AppAnnouncement;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Chiudi dettaglio novità"
        className="fixed inset-0 z-40 bg-canvas/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          uiCard,
          "fixed left-1/2 top-1/2 z-50 flex max-h-[min(36rem,85vh)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-[var(--shadow-surface)]",
        )}
      >
        <div className="border-b border-line-default px-4 py-3 md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={uiCaption}>
                {formatDateTime(announcement.createdAt)}
                {!announcement.isActive ? " · non più attiva" : null}
              </p>
              <h2 className="mt-1 text-base font-semibold text-fg-primary">
                {announcement.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(uiTransition, uiFocusRingInset, "rounded-md px-2 py-1 text-sm text-fg-secondary hover:bg-elevated")}
            >
              Chiudi
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-fg-primary">
            {announcement.body}
          </div>
        </div>
      </div>
    </>
  );
}

export function AnnouncementsWorkspace({
  announcements,
}: {
  announcements: AppAnnouncement[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<AppAnnouncement | null>(null);
  const [pending, startTransition] = useTransition();

  function openAnnouncement(announcement: AppAnnouncement) {
    setSelected(announcement);
    if (announcement.isRead) return;
    startTransition(async () => {
      await markAnnouncementRead(announcement.id);
      router.refresh();
    });
  }

  return (
    <>
      <header className="min-w-0">
        <h1 className={uiPageTitle}>Novità</h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Cronologia degli aggiornamenti dell&apos;app. Apri una voce per
          leggere i dettagli.
        </p>
      </header>

      {announcements.length === 0 ? (
        <div className={cn(uiCard, "px-4 py-10 text-center sm:px-5")}>
          <p className={uiSectionTitle}>Nessuna novità</p>
          <p className="mt-2 text-sm text-fg-secondary">
            Quando verranno pubblicati aggiornamenti compariranno qui.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((announcement) => (
            <li key={announcement.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => openAnnouncement(announcement)}
                className={cn(
                  uiCard,
                  uiTransition,
                  uiFocusRingInset,
                  "flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5",
                  "hover:bg-elevated",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-fg-primary">
                      {announcement.title}
                    </h2>
                    {!announcement.isRead ? (
                      <span className="rounded-full bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent">
                        Non letto
                      </span>
                    ) : null}
                    {!announcement.isActive ? (
                      <span className="rounded-full bg-elevated px-2 py-0.5 text-xs text-fg-tertiary">
                        Archiviata
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-fg-secondary">
                    {announcement.body}
                  </p>
                  <p className="mt-2 text-xs tabular-nums text-fg-tertiary">
                    {formatDateTime(announcement.createdAt)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <AnnouncementDetailPanel
          announcement={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
