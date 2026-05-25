"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  useAppSlideCoordinator,
  useExclusiveAppSlide,
  useRegisterAppSlideClose,
} from "@/components/app/app-slide-coordinator";
import { AdminAnnouncementCreateSheet } from "@/components/settings/admin-announcement-create-sheet";
import { AdminAnnouncementEditSheet } from "@/components/settings/admin-announcement-edit-sheet";
import { adminDeleteAnnouncement } from "@/lib/actions/admin-delete-announcement";
import { announcementAudienceLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiBtnSecondary } from "@/lib/ui-classes";
import {
  dataTableHeadRowClass,
  dataTableShellClass,
  dataTableTdClass,
} from "@/lib/table-ui";
import { uiCard } from "@/lib/surfaces";
import type { AppAnnouncement } from "@/types/announcement";
import type { ProfileSummary } from "@/types/profile";
import type { TeamSelectOption } from "@/types/team";

function audienceDetail(announcement: AppAnnouncement): string {
  if (announcement.audience === "team") {
    return announcement.targetTeamName ?? "Team";
  }
  if (announcement.audience === "user") {
    return announcement.targetUserLabel ?? "Utente";
  }
  return announcementAudienceLabel.all;
}

function windowLabel(announcement: AppAnnouncement): string {
  if (!announcement.startsAt && !announcement.endsAt) {
    return "Sempre visibile";
  }
  const parts: string[] = [];
  if (announcement.startsAt) {
    parts.push(`dal ${formatDateTime(announcement.startsAt)}`);
  }
  if (announcement.endsAt) {
    parts.push(`fino al ${formatDateTime(announcement.endsAt)}`);
  }
  return parts.join(" ");
}

function statusLabel(announcement: AppAnnouncement): string {
  if (announcement.isActive) return "Attiva";
  if (announcement.startsAt && new Date(announcement.startsAt).getTime() > Date.now()) {
    return "Programmata";
  }
  return "Scaduta";
}

export function AdminAnnouncementsTable({
  announcements,
  teams,
  profiles,
}: {
  announcements: AppAnnouncement[];
  teams: TeamSelectOption[];
  profiles: ProfileSummary[];
}) {
  const router = useRouter();
  const [editAnnouncement, setEditAnnouncement] = useState<AppAnnouncement | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<AppAnnouncement | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const { openExclusive } = useAppSlideCoordinator();
  const createSlide = useExclusiveAppSlide("admin-announcement-create");

  const closeEdit = useCallback(() => setEditAnnouncement(null), []);
  useRegisterAppSlideClose("admin-announcement-edit", closeEdit);

  const openEdit = useCallback(
    (announcement: AppAnnouncement) => {
      openExclusive("admin-announcement-edit", () =>
        setEditAnnouncement(announcement),
      );
    },
    [openExclusive],
  );

  function confirmDelete() {
    if (!deleteTarget || pendingDelete) return;
    setDeleteError(null);
    startDelete(async () => {
      const result = await adminDeleteAnnouncement(deleteTarget.id);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-fg-secondary">
          Pubblica release notes per tutti o per team/utenti specifici, con
          attivazione e scadenza opzionali.
        </p>
        <button
          type="button"
          className={cn(uiBtnPrimary, "shrink-0 self-start")}
          onClick={createSlide.openSlide}
        >
          Nuova novità
        </button>
      </header>

      <div className={dataTableShellClass}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className={dataTableHeadRowClass}>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Titolo
                </th>
                <th className="w-[9rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Destinatari
                </th>
                <th className="w-[7rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Stato
                </th>
                <th className="min-w-[12rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Finestra
                </th>
                <th className="w-[10rem] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Creata
                </th>
                <th className="w-[9rem] px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-fg-tertiary md:px-5">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={cn(dataTableTdClass, "py-10 text-center text-fg-tertiary")}
                  >
                    Nessuna novità pubblicata.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="border-t border-line-default">
                    <td className={cn(dataTableTdClass, "font-medium text-fg-primary")}>
                      <span className="line-clamp-2">{announcement.title}</span>
                    </td>
                    <td className={dataTableTdClass}>
                      <span className="block text-fg-secondary">
                        {announcementAudienceLabel[announcement.audience]}
                      </span>
                      <span className="mt-0.5 block text-xs text-fg-tertiary">
                        {audienceDetail(announcement)}
                      </span>
                    </td>
                    <td className={dataTableTdClass}>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          announcement.isActive
                            ? "bg-accent-muted text-accent"
                            : "bg-elevated text-fg-tertiary",
                        )}
                      >
                        {statusLabel(announcement)}
                      </span>
                    </td>
                    <td className={cn(dataTableTdClass, "text-fg-secondary")}>
                      <span className="line-clamp-2 text-xs leading-relaxed">
                        {windowLabel(announcement)}
                      </span>
                    </td>
                    <td className={cn(dataTableTdClass, "tabular-nums text-fg-secondary")}>
                      {formatDateTime(announcement.createdAt)}
                    </td>
                    <td className={cn(dataTableTdClass, "text-right")}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={cn(uiBtnSecondary, "px-2.5 py-1 text-xs")}
                          onClick={() => openEdit(announcement)}
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          className={cn(
                            uiBtnSecondary,
                            "px-2.5 py-1 text-xs text-danger hover:bg-danger-muted",
                          )}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(announcement);
                          }}
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget ? (
        <>
          <button
            type="button"
            aria-label="Chiudi conferma eliminazione"
            className="fixed inset-0 z-50 bg-canvas/70"
            onClick={() => !pendingDelete && setDeleteTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              uiCard,
              "fixed left-1/2 top-1/2 z-[51] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 p-5 shadow-[var(--shadow-surface)]",
            )}
          >
            <h3 className="text-base font-semibold text-fg-primary">
              Eliminare la novità?
            </h3>
            <p className="mt-2 text-sm text-fg-secondary">
              «{deleteTarget.title}» verrà rimossa per tutti gli utenti. L&apos;azione
              non è reversibile.
            </p>
            {deleteError ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={uiBtnSecondary}
                disabled={pendingDelete}
                onClick={() => setDeleteTarget(null)}
              >
                Annulla
              </button>
              <button
                type="button"
                className={cn(uiBtnPrimary, "bg-danger text-white hover:opacity-90")}
                disabled={pendingDelete}
                onClick={confirmDelete}
              >
                {pendingDelete ? "Eliminazione…" : "Elimina"}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <AdminAnnouncementCreateSheet
        open={createSlide.open}
        onClose={createSlide.closeSlide}
        teams={teams}
        profiles={profiles}
      />
      <AdminAnnouncementEditSheet
        open={editAnnouncement != null}
        announcement={editAnnouncement}
        onClose={closeEdit}
        teams={teams}
        profiles={profiles}
      />
    </div>
  );
}
