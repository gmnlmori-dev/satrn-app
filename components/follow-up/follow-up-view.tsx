"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useDetailSaveFeedback } from "@/components/app/detail-save-feedback-context";
import { InboxStatusBadge } from "@/components/inbox/inbox-status-badge";
import { PriorityBadge } from "@/components/requests/priority-badge";
import { StatusBadge } from "@/components/requests/status-badge";
import { updateInboxItemStatus } from "@/lib/actions/update-inbox-status";
import { updateRequestOperational } from "@/lib/actions/update-request-operational";
import {
  daysFromTodayAtNineInputs,
  tomorrowAtNineInputs,
} from "@/lib/follow-up-windows";
import { formatDateTime, fromDateAndTimeInputs, todayDateInputValue } from "@/lib/date";
import {
  NextActionDeadlineFields,
  nextActionDeadlineDraftFromIso,
} from "@/components/requests/next-action-deadline-fields";
import { inboxStatusLabel } from "@/lib/labels";
import { summarizeNextActionTasks } from "@/lib/next-action-tasks";
import { StandaloneTaskBlock } from "@/components/follow-up/standalone-task-block";
import type { Task } from "@/types/task";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { cn } from "@/lib/cn";
import {
  uiBtnIcon,
  uiBtnPrimary,
  uiBtnSecondary,
  uiControl,
  uiTransition,
  slideOverDescription,
  slideOverTitle,
} from "@/lib/ui-classes";
import {
  dataTableThClass,
  dataTableRowClass,
} from "@/lib/table-ui";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { uiCard } from "@/lib/surfaces";
import { uiFormLabel, uiSectionTitle } from "@/lib/typography";
import type { InboxItem } from "@/types/inbox";
import type { Request, RequestStatus } from "@/types/request";

const QUICK_STATUSES: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const datetimeInputClass = uiControl;

function initialPostponeDraft(request: Request): { date: string; time: string } {
  if (request.nextActionAt) {
    return nextActionDeadlineDraftFromIso(request.nextActionAt);
  }
  return tomorrowAtNineInputs();
}

const tableHeadCell = dataTableThClass;

const tableRowInteractive = cn(
  dataTableRowClass,
  "cursor-pointer outline-none",
  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring-focus",
);

/** Allineato allo slide-over «Nuova richiesta»: area sotto top bar, a destra della sidebar su md+. */
const BELOW_TOP_BAR = "top-12";

function followUpOverlayBackdropClassName() {
  return cn(
    "pointer-events-auto fixed bottom-0 right-0 z-[58] cursor-default border-0 p-0",
    BELOW_TOP_BAR,
    "left-0 md:left-52",
    "bg-canvas/70",
  );
}

const followUpPopoverPanel = cn(
  uiTransition,
  "overflow-hidden rounded-[12px] border border-line-default bg-surface shadow-[var(--shadow-surface)]",
);

const followUpActionBar = cn(
  "inline-flex items-center gap-0.5 rounded-[10px] border border-line-default bg-canvas/60 p-0.5",
);

/** Calendario: sposta scadenza. */
function IconCalendarDays({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

/** Stato richiesta. */
function IconAdjustmentsVertical({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
      />
    </svg>
  );
}

function IconXMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function FollowUpActionButton({
  active = false,
  label,
  disabled,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        uiTransition,
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-fg-secondary",
        "hover:bg-surface hover:text-fg-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40",
        active && "bg-surface text-accent shadow-sm ring-1 ring-inset ring-accent/25",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const POSTPONE_SHORTCUTS: {
  label: string;
  apply: () => { date: string; time: string };
}[] = [
  {
    label: "Oggi",
    apply: () => ({ date: todayDateInputValue(), time: "" }),
  },
  {
    label: "Domani 9:00",
    apply: tomorrowAtNineInputs,
  },
  {
    label: "Tra 3 gg",
    apply: () => daysFromTodayAtNineInputs(3),
  },
  {
    label: "Tra 7 gg",
    apply: () => daysFromTodayAtNineInputs(7),
  },
];

export type FollowUpTab = "overdue" | "today" | "upcoming" | "inbox";

const TAB_HASH: Record<FollowUpTab, string> = {
  overdue: "follow-up-overdue",
  today: "follow-up-today",
  upcoming: "follow-up-upcoming",
  inbox: "follow-up-inbox",
};

const HASH_TO_TAB: Record<string, FollowUpTab> = {
  "follow-up-overdue": "overdue",
  "follow-up-tasks-overdue": "overdue",
  "follow-up-today": "today",
  "follow-up-tasks-today": "today",
  "follow-up-upcoming": "upcoming",
  "follow-up-tasks-upcoming": "upcoming",
  "follow-up-inbox": "inbox",
};

function tabFromHash(hash: string): FollowUpTab | null {
  const id = hash.replace(/^#/, "");
  return HASH_TO_TAB[id] ?? null;
}

function defaultFollowUpTab(
  overdue: number,
  today: number,
  upcoming: number,
  inbox: number,
): FollowUpTab {
  if (overdue > 0) return "overdue";
  if (today > 0) return "today";
  if (upcoming > 0) return "upcoming";
  if (inbox > 0) return "inbox";
  return "overdue";
}

function tabLabel(label: string, count: number) {
  return count > 0 ? `${label} (${count})` : label;
}

function EmptyRow({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-surface px-3 py-3 sm:px-4">
      <AppEmptyHint title={title} description={hint} className="py-6" />
    </div>
  );
}

function RequestTaskCount({ nextAction }: { nextAction: string }) {
  const { open, total, overdue } = summarizeNextActionTasks(nextAction);
  if (total === 0) return null;

  if (overdue > 0) {
    const overdueLabel =
      overdue === 1 ? "1 task in ritardo" : `${overdue} task in ritardo`;
    const otherOpen = open - overdue;

    return (
      <span className="mt-1 block text-xs tabular-nums">
        <span className="font-medium text-danger">{overdueLabel}</span>
        {otherOpen > 0 ? (
          <span className="text-fg-tertiary">
            {otherOpen === 1
              ? " · 1 altra aperta"
              : ` · ${otherOpen} altre aperte`}
          </span>
        ) : open < total ? (
          <span className="text-fg-tertiary">{` · ${total} totali`}</span>
        ) : null}
      </span>
    );
  }

  const label =
    open > 0
      ? open === 1
        ? "1 task aperta"
        : `${open} task aperte`
      : total === 1
        ? "1 task completata"
        : `${total} task completate`;

  return (
    <span className="mt-1 block text-xs tabular-nums text-fg-tertiary">
      {label}
      {open > 0 && open < total ? (
        <span className="text-fg-tertiary/80">{` · ${total} totali`}</span>
      ) : null}
    </span>
  );
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function PostponeScadenzaPopover({
  request,
  anchorRect,
  onDismiss,
  onApplied,
}: {
  request: Request;
  anchorRect: DOMRectReadOnly;
  onDismiss: () => void;
  onApplied: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const [dateDraft, setDateDraft] = useState(() =>
    initialPostponeDraft(request).date,
  );
  const [timeDraft, setTimeDraft] = useState(() =>
    initialPostponeDraft(request).time,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const applyPosition = useCallback(() => {
    const el = panelRef.current;
    if (!el || !anchorRect || typeof window === "undefined") return;
    const margin = 12;
    const topBar = 48;
    const maxW = Math.min(22 * 16, window.innerWidth - 2 * margin);
    let right = window.innerWidth - anchorRect.right;
    right = Math.max(margin, Math.min(right, window.innerWidth - maxW - margin));
    let top = anchorRect.bottom + 8;
    const h = el.getBoundingClientRect().height;
    if (h > 0 && top + h > window.innerHeight - margin) {
      const above = anchorRect.top - h - 8;
      if (above >= topBar + margin) top = above;
    }
    el.style.top = `${top}px`;
    el.style.right = `${right}px`;
    el.style.width = `${maxW}px`;
  }, [anchorRect]);

  useLayoutEffect(() => {
    applyPosition();
    const id = requestAnimationFrame(() => requestAnimationFrame(applyPosition));
    return () => cancelAnimationFrame(id);
  }, [applyPosition]);

  useEffect(() => {
    function onResize() {
      applyPosition();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [applyPosition]);

  async function apply() {
    if (saving) return;
    const iso = fromDateAndTimeInputs(dateDraft, timeDraft);
    if (!iso) {
      setError("Imposta una data valida.");
      return;
    }
    setError(null);
    setSaving(true);
    const r = await updateRequestOperational(request.id, {
      next_action_at: iso,
      bump_last_interaction: true,
    });
    setSaving(false);
    if (r.ok) {
      onDismiss();
      onApplied();
    } else {
      setError(r.message);
    }
  }

  if (!isClient || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Chiudi"
        className={followUpOverlayBackdropClassName()}
        onClick={onDismiss}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          followUpPopoverPanel,
          "fixed z-[59] max-h-[min(36rem,calc(100vh-4rem))] overflow-y-auto p-0",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-default px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-muted text-accent">
              <IconCalendarDays className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 id={titleId} className={slideOverTitle}>
                Sposta scadenza
              </h3>
              <p className={cn(slideOverDescription, "mt-0.5 line-clamp-2")}>
                {request.title}
                <span className="text-fg-tertiary"> · {request.companyName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Chiudi"
            disabled={saving}
            className={uiBtnIcon}
            onClick={onDismiss}
          >
            <IconXMark className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {request.nextActionAt ? (
            <div className="rounded-[10px] border border-line-default bg-canvas/70 px-3 py-2.5 text-sm">
              <span className="text-fg-tertiary">Scadenza attuale </span>
              <span className="font-medium tabular-nums text-fg-primary">
                {formatDateTime(request.nextActionAt)}
              </span>
            </div>
          ) : null}

          <div>
            <span className={uiSectionTitle}>Scorciatoie</span>
            <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-[10px] border border-line-default bg-canvas p-1 sm:grid-cols-4">
              {POSTPONE_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  disabled={saving}
                  className={cn(
                    uiTransition,
                    "rounded-[8px] px-2 py-2 text-center text-xs font-medium text-fg-secondary",
                    "hover:bg-surface hover:text-fg-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                  onClick={() => {
                    const next = shortcut.apply();
                    setDateDraft(next.date);
                    setTimeDraft(next.time);
                    setError(null);
                  }}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={uiFormLabel}>Nuova scadenza</span>
            <div className="mt-2">
              <NextActionDeadlineFields
                idPrefix={`postpone-${request.id}`}
                hideHeading
                hideHint
                showToday={false}
                disabled={saving}
                inputClass={datetimeInputClass}
                date={dateDraft}
                time={timeDraft}
                onDateChange={(value) => {
                  setDateDraft(value);
                  setError(null);
                }}
                onTimeChange={(value) => {
                  setTimeDraft(value);
                  setError(null);
                }}
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line-default px-5 py-4">
          <button
            type="button"
            disabled={saving}
            className={cn(uiBtnSecondary, "px-4 py-2.5 text-sm")}
            onClick={onDismiss}
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={saving}
            aria-busy={saving}
            className={cn(uiBtnPrimary, "min-w-[7rem] px-4 py-2.5 text-sm")}
            onClick={() => void apply()}
          >
            {saving ? "Salvataggio…" : "Applica"}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

function StatusMenuFloating({
  requestTitle,
  currentStatus,
  anchorRect,
  pending,
  onClose,
  onPick,
}: {
  requestTitle: string;
  currentStatus: RequestStatus;
  anchorRect: DOMRectReadOnly;
  pending: boolean;
  onClose: () => void;
  onPick: (status: RequestStatus) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  const applyPosition = useCallback(() => {
    const el = panelRef.current;
    if (!el || !anchorRect || typeof window === "undefined") return;
    const margin = 12;
    const topBar = 48;
    const minW = 12 * 16;
    let right = window.innerWidth - anchorRect.right;
    right = Math.max(margin, Math.min(right, window.innerWidth - minW - margin));
    let top = anchorRect.bottom + 6;
    const h = el.getBoundingClientRect().height;
    if (h > 0 && top + h > window.innerHeight - margin) {
      const above = anchorRect.top - h - 6;
      if (above >= topBar + margin) top = above;
    }
    el.style.position = "fixed";
    el.style.top = `${top}px`;
    el.style.right = `${right}px`;
    el.style.zIndex = "60";
    el.style.minWidth = `${minW}px`;
  }, [anchorRect]);

  useLayoutEffect(() => {
    applyPosition();
    const id = requestAnimationFrame(() => requestAnimationFrame(applyPosition));
    return () => cancelAnimationFrame(id);
  }, [applyPosition]);

  useEffect(() => {
    function onResize() {
      applyPosition();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [applyPosition]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!isClient || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      data-status-menu-panel
      role="listbox"
      aria-label={`Stati per ${requestTitle}`}
      className={cn(followUpPopoverPanel, "min-w-[15rem] max-w-[18rem]")}
    >
      <div className="border-b border-line-default px-3.5 py-2.5">
        <p className="text-[13px] font-semibold text-fg-primary">Cambia stato</p>
        <p className="mt-0.5 truncate text-xs text-fg-tertiary">{requestTitle}</p>
      </div>
      <div className="p-1.5">
        {QUICK_STATUSES.map((s) => {
          const selected = currentStatus === s;
          return (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={pending}
              className={cn(
                uiTransition,
                "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left",
                "hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50",
                selected && "bg-accent-subtle/60 ring-1 ring-inset ring-accent/20",
              )}
              onClick={() => onPick(s)}
            >
              <StatusBadge status={s} />
              {selected ? (
                <IconCheck className="ml-auto h-4 w-4 shrink-0 text-accent" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

function RequestBlock({
  requests,
  accent,
}: {
  requests: Request[];
  accent: "danger" | "default";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { pulseTopBar } = useDetailSaveFeedback();
  const [postpone, setPostpone] = useState<{
    request: Request;
    rect: DOMRectReadOnly;
  } | null>(null);
  const [statusMenu, setStatusMenu] = useState<{
    id: string;
    rect: DOMRectReadOnly;
  } | null>(null);

  const statusMenuRequest = statusMenu
    ? requests.find((x) => x.id === statusMenu.id)
    : undefined;

  function refresh() {
    startTransition(() => router.refresh());
  }

  useEffect(() => {
    if (!statusMenu) return;
    const menuId = statusMenu.id;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-status-menu-panel]")) return;
      if (t.closest(`[data-status-trigger="${menuId}"]`)) return;
      setStatusMenu(null);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [statusMenu]);

  async function saveRequestStatus(id: string, status: RequestStatus) {
    setStatusMenu(null);
    const r = await updateRequestOperational(id, {
      status,
      bump_last_interaction: true,
    });
    if (r.ok) {
      pulseTopBar();
      refresh();
    }
  }

  function interactiveTarget(target: EventTarget | null) {
    return (target as HTMLElement | null)?.closest("button, a, select, input, textarea");
  }

  function rowNavigate(id: string, e: React.MouseEvent) {
    if (interactiveTarget(e.target)) return;
    router.push(`/app/requests/${id}`, { scroll: true });
  }

  const rowHover =
    accent === "danger"
      ? "hover:bg-danger-muted/40"
      : "hover:bg-elevated";

  return (
    <>
      {postpone ? (
        <PostponeScadenzaPopover
          key={postpone.request.id}
          request={postpone.request}
          anchorRect={postpone.rect}
          onDismiss={() => setPostpone(null)}
          onApplied={() => {
            pulseTopBar();
            refresh();
          }}
        />
      ) : null}
      {statusMenu && statusMenuRequest ? (
        <StatusMenuFloating
          key={statusMenu.id}
          requestTitle={statusMenuRequest.title}
          currentStatus={statusMenuRequest.status}
          anchorRect={statusMenu.rect}
          pending={pending}
          onClose={() => setStatusMenu(null)}
          onPick={(s) => void saveRequestStatus(statusMenu.id, s)}
        />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col className="min-w-0 w-[30%]" />
            <col className="min-w-0 w-[17%]" />
            <col className="w-[14%]" />
            <col className="min-w-0 w-[11%]" />
            <col className="min-w-0 w-[19%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead>
            <tr>
              <th className={cn(tableHeadCell, "rounded-tl-2xl")}>Richiesta</th>
              <th className={tableHeadCell}>Azienda</th>
              <th className={cn(tableHeadCell, "text-right")}>Scadenza</th>
              <th className={tableHeadCell}>Priorità</th>
              <th className={tableHeadCell}>Stato</th>
              <th className={cn(tableHeadCell, "rounded-tr-2xl text-right")}>
                <span className="sr-only">Azioni</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {requests.map((r) => (
              <tr
                key={r.id}
                className={cn(tableRowInteractive, rowHover, pending && "pointer-events-none opacity-75")}
                onClick={(e) => rowNavigate(r.id, e)}
              >
                <td className="px-4 py-3.5 align-middle">
                  <Link
                    href={`/app/requests/${r.id}`}
                    className="sr-only"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Apri dettaglio: {r.title}
                  </Link>
                  <span className="line-clamp-2 font-medium leading-snug text-fg-primary">
                    {r.title}
                  </span>
                  <RequestTaskCount nextAction={r.nextAction} />
                </td>
                <td className="px-4 py-3.5 align-middle text-fg-secondary">
                  <span className="line-clamp-2 leading-snug">{r.companyName}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 align-middle text-right tabular-nums text-fg-secondary">
                  {r.nextActionAt ? formatDateTime(r.nextActionAt) : "—"}
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <PriorityBadge priority={r.priority} className="max-w-full truncate" />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <StatusBadge status={r.status} className="max-w-full truncate" />
                </td>
                <td className="px-4 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
                  <div className={followUpActionBar}>
                    <FollowUpActionButton
                      data-status-trigger={r.id}
                      active={statusMenu?.id === r.id}
                      disabled={pending}
                      label="Cambia stato"
                      aria-expanded={statusMenu?.id === r.id}
                      aria-haspopup="listbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPostpone(null);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setStatusMenu((m) => (m?.id === r.id ? null : { id: r.id, rect }));
                      }}
                    >
                      <IconAdjustmentsVertical className="h-4 w-4" />
                    </FollowUpActionButton>
                    <FollowUpActionButton
                      active={postpone?.request.id === r.id}
                      disabled={pending}
                      label="Sposta scadenza"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusMenu(null);
                        setPostpone({
                          request: r,
                          rect: e.currentTarget.getBoundingClientRect(),
                        });
                      }}
                    >
                      <IconCalendarDays className="h-4 w-4" />
                    </FollowUpActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InboxBlock({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { pulseTopBar } = useDetailSaveFeedback();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function archivia(id: string) {
    const r = await updateInboxItemStatus(id, "archived");
    if (r.ok) {
      pulseTopBar();
      refresh();
    }
  }

  function rowNavigate(id: string, e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, select, input")) return;
    router.push(`/app/inbox/${id}`, { scroll: true });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] table-fixed border-collapse text-left text-sm">
        <colgroup>
          <col className="min-w-0 w-[40%]" />
          <col className="min-w-0 w-[32%]" />
          <col className="w-[16%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead>
          <tr>
            <th className={cn(tableHeadCell, "rounded-tl-2xl")}>Oggetto</th>
            <th className={tableHeadCell}>Mittente · Origine</th>
            <th className={tableHeadCell}>Stato</th>
            <th className={cn(tableHeadCell, "rounded-tr-2xl text-right")}>
              <span className="sr-only">Azioni</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface">
          {items.map((r) => (
            <tr
              key={r.id}
              className={cn(
                tableRowInteractive,
                "hover:bg-elevated",
                pending && "pointer-events-none opacity-75",
              )}
              onClick={(e) => rowNavigate(r.id, e)}
            >
              <td className="px-4 py-3.5 align-middle">
                <Link
                  href={`/app/inbox/${r.id}`}
                  className="sr-only"
                  onClick={(e) => e.stopPropagation()}
                >
                  Apri dettaglio: {r.subject || "(Senza oggetto)"}
                </Link>
                <span className="line-clamp-2 font-medium leading-snug text-fg-primary">
                  {r.subject || "(Senza oggetto)"}
                </span>
              </td>
              <td className="px-4 py-3.5 align-middle text-fg-secondary">
                <span className="line-clamp-2 leading-snug">
                  {[r.senderName, r.source].filter(Boolean).join(" · ") || "—"}
                </span>
              </td>
              <td className="px-4 py-3.5 align-middle">
                <InboxStatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={`Archivia: ${r.subject || "messaggio"}`}
                    className={cn(uiBtnSecondary, "h-9 whitespace-nowrap px-3 text-sm")}
                    onClick={() => archivia(r.id)}
                  >
                    Archivia
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueuePanel({
  requests,
  tasks,
  requestAccent,
  emptyTitle,
  emptyHint,
}: {
  requests: Request[];
  tasks: Task[];
  requestAccent: "danger" | "default";
  emptyTitle: string;
  emptyHint: string;
}) {
  const total = requests.length + tasks.length;
  if (total === 0) {
    return <EmptyRow title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div>
      {requests.length > 0 ? (
        <RequestBlock requests={requests} accent={requestAccent} />
      ) : null}
      {tasks.length > 0 ? (
        <div className={requests.length > 0 ? "border-t border-line-default" : undefined}>
          {requests.length > 0 ? (
            <p className="border-b border-line-default bg-elevated/30 px-4 py-2 text-xs font-medium text-fg-tertiary sm:px-5">
              Task libere · {tasks.length}
            </p>
          ) : null}
          <StandaloneTaskBlock tasks={tasks} compact />
        </div>
      ) : null}
    </div>
  );
}

export function FollowUpView({
  overdue,
  today,
  upcoming,
  inbox,
  overdueTasks = [],
  todayTasks = [],
  upcomingTasks = [],
  scopeControl = null,
}: {
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
  inbox: InboxItem[];
  overdueTasks?: Task[];
  todayTasks?: Task[];
  upcomingTasks?: Task[];
  scopeControl?: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const overdueCount = overdue.length + overdueTasks.length;
  const todayCount = today.length + todayTasks.length;
  const upcomingCount = upcoming.length + upcomingTasks.length;
  const inboxCount = inbox.length;

  const [activeTab, setActiveTab] = useState<FollowUpTab>(() => {
    if (typeof window !== "undefined") {
      const fromHash = tabFromHash(window.location.hash);
      if (fromHash) return fromHash;
    }
    return defaultFollowUpTab(
      overdueCount,
      todayCount,
      upcomingCount,
      inboxCount,
    );
  });

  const syncTabFromHash = useCallback(() => {
    const fromHash = tabFromHash(window.location.hash);
    if (fromHash) setActiveTab(fromHash);
  }, []);

  useEffect(() => {
    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, [syncTabFromHash]);

  function selectTab(tab: FollowUpTab) {
    setActiveTab(tab);
    const hash = TAB_HASH[tab];
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, "", `${pathname}${query}#${hash}`);
  }

  const tabOptions: { value: FollowUpTab; label: string }[] = [
    { value: "overdue", label: tabLabel("In ritardo", overdueCount) },
    { value: "today", label: tabLabel("Oggi", todayCount) },
    { value: "upcoming", label: tabLabel("7 giorni", upcomingCount) },
    { value: "inbox", label: tabLabel("Inbox", inboxCount) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="overflow-x-auto pb-0.5">
          <SegmentedControl
            ariaLabel="Finestra temporale"
            value={activeTab}
            options={tabOptions}
            onChange={selectTab}
            className="min-w-max"
          />
        </div>
        {scopeControl ? (
          <div className="flex shrink-0 justify-end">{scopeControl}</div>
        ) : null}
      </div>

      <div
        id={TAB_HASH[activeTab]}
        className={cn(
          uiCard,
          "scroll-mt-24 overflow-hidden",
          activeTab === "overdue" &&
            overdueCount > 0 &&
            "border-l-4 border-l-danger",
        )}
      >
        {activeTab === "overdue" ? (
          <QueuePanel
            requests={overdue}
            tasks={overdueTasks}
            requestAccent="danger"
            emptyTitle="Nessun ritardo"
            emptyHint="Richieste e task con scadenza passata compariranno qui."
          />
        ) : null}

        {activeTab === "today" ? (
          <QueuePanel
            requests={today}
            tasks={todayTasks}
            requestAccent="default"
            emptyTitle="Niente in scadenza oggi"
            emptyHint="Richieste e task con scadenza oggi compariranno qui."
          />
        ) : null}

        {activeTab === "upcoming" ? (
          <QueuePanel
            requests={upcoming}
            tasks={upcomingTasks}
            requestAccent="default"
            emptyTitle="Nessuna scadenza nei prossimi 7 giorni"
            emptyHint="Richieste e task da domani al settimo giorno compariranno qui."
          />
        ) : null}

        {activeTab === "inbox" ? (
          inboxCount === 0 ? (
            <EmptyRow
              title="Nessun ingresso da triage"
              hint={`Gli elementi in stato ${inboxStatusLabel.new} o ${inboxStatusLabel.reviewed}, non ancora convertiti, compariranno qui.`}
            />
          ) : (
            <InboxBlock items={inbox} />
          )
        ) : null}
      </div>
    </div>
  );
}
