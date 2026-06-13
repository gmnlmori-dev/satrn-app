"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import type { Request } from "@/types/request";
import { PriorityBadge } from "@/components/requests/priority-badge";
import { StatusBadge } from "@/components/requests/status-badge";
import { formatNextActionPreview, effectiveNextActionAt } from "@/lib/next-action-tasks";
import { cn } from "@/lib/cn";
import { formatDateTime, isRequestOverdue } from "@/lib/date";
import { uiBtnGhost, uiBtnPrimary, uiTransition } from "@/lib/ui-classes";
import { uiCard } from "@/lib/surfaces";

type Props = {
  request: Request;
  showRequestMeta?: boolean;
  onClose: () => void;
};

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-fg-tertiary">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-fg-primary">{children}</dd>
    </div>
  );
}

export function RequestsCalendarRequestPreviewPanel({
  request,
  showRequestMeta = false,
  onClose,
}: Props) {
  const dueAt = effectiveNextActionAt(request);
  const overdue = dueAt && isRequestOverdue(dueAt, request.status);
  const nextActionPreview = formatNextActionPreview(request.nextAction);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Chiudi anteprima richiesta"
        className="fixed inset-0 z-40 bg-canvas/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cal-request-preview-title"
        className={cn(
          uiCard,
          "fixed left-1/2 top-1/2 z-50 flex max-h-[min(32rem,85vh)] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-[var(--shadow-surface)]",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-default px-4 py-3">
          <div className="min-w-0">
            <h3
              id="cal-request-preview-title"
              className="line-clamp-2 text-sm font-semibold text-fg-primary"
            >
              {request.title}
            </h3>
            <p className="mt-1 text-xs text-fg-secondary">{request.companyName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(uiBtnGhost, "shrink-0 px-2 py-1 text-xs")}
          >
            Chiudi
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>

          <dl className="space-y-3">
            <PreviewRow label="Contatto">{request.contactName || "—"}</PreviewRow>
            <PreviewRow label="Assegnata a">
              {request.assignedToLabel ?? "Non assegnata"}
            </PreviewRow>
            {dueAt ? (
              <PreviewRow label="Scadenza">
                <span
                  className={cn(
                    "tabular-nums",
                    overdue ? "font-medium text-danger" : undefined,
                  )}
                >
                  {formatDateTime(dueAt)}
                  {overdue ? " · In ritardo" : null}
                </span>
              </PreviewRow>
            ) : null}
            {nextActionPreview ? (
              <PreviewRow label="Prossima azione">
                <span className="line-clamp-3 leading-snug">{nextActionPreview}</span>
              </PreviewRow>
            ) : null}
            {showRequestMeta ? (
              <>
                {request.teamName ? (
                  <PreviewRow label="Team">{request.teamName}</PreviewRow>
                ) : null}
                {request.createdByLabel ? (
                  <PreviewRow label="Creata da">
                    {request.createdByLabel}
                  </PreviewRow>
                ) : null}
              </>
            ) : null}
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line-default px-4 py-3">
          <button type="button" onClick={onClose} className={uiBtnGhost}>
            Chiudi
          </button>
          <Link
            href={`/app/requests/${request.id}`}
            className={cn(uiBtnPrimary, uiTransition, "inline-flex")}
          >
            Apri richiesta
          </Link>
        </div>
      </div>
    </>
  );
}
