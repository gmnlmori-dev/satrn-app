"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  daysFromTodayAtNineDatetimeLocal,
  tomorrowAtNineDatetimeLocal,
} from "@/lib/follow-up-windows";
import { formatDateTime, fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/date";
import { inboxStatusLabel, statusLabel } from "@/lib/labels";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { cn } from "@/lib/cn";
import { uiBtnIcon, uiBtnPrimary, uiBtnSecondary, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel } from "@/lib/typography";
import type { InboxItem } from "@/types/inbox";
import type { Request, RequestStatus } from "@/types/request";

const QUICK_STATUSES: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const datetimeInputClass = cn(
  uiTransition,
  "w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] leading-snug text-slate-900",
  "focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.06]",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-100/10",
);

const tableHeadCell =
  "border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400";

const tableRowInteractive = cn(
  uiTransition,
  "cursor-pointer border-b border-slate-100 outline-none last:border-b-0 dark:border-slate-800/80",
  "focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900/10 dark:focus-visible:bg-slate-900/50 dark:focus-visible:ring-slate-100/15",
);

/** Allineato allo slide-over «Nuova richiesta»: area sotto top bar, a destra della sidebar su md+. */
const BELOW_TOP_BAR = "top-12";

function followUpOverlayBackdropClassName() {
  return cn(
    "pointer-events-auto fixed bottom-0 right-0 z-[58] cursor-default border-0 p-0",
    BELOW_TOP_BAR,
    "left-0 md:left-56",
    "bg-gradient-to-r from-slate-900/5 via-slate-900/12 to-slate-900/20",
    "dark:from-slate-950/18 dark:via-slate-950/28 dark:to-slate-950/38",
  );
}

/** Freccia circolare (Heroicons arrow-path): riprogramma / sposta scadenza. */
function IconArrowPath({ className }: { className?: string }) {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

/** Menu stato: ellissi verticali. */
function IconEllipsisVertical({ className }: { className?: string }) {
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
        d="M12 6.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12 12.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12 18.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
      />
    </svg>
  );
}

function Section({
  anchorId,
  title,
  description,
  count,
  children,
  variant,
}: {
  /** Ancora per link dalla dashboard (`/app/follow-up#...`). */
  anchorId?: string;
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
  variant: "danger" | "default" | "muted";
}) {
  const bar =
    variant === "danger"
      ? "border-rose-200/80 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20"
      : variant === "muted"
        ? "border-slate-200/70 dark:border-slate-800"
        : "border-slate-200/80 dark:border-slate-800";

  const countStyles =
    variant === "danger"
      ? "bg-rose-600/10 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
      : variant === "default"
        ? "bg-slate-900/8 text-slate-800 dark:bg-slate-100/10 dark:text-slate-200"
        : "bg-slate-900/6 text-slate-700 dark:bg-slate-100/8 dark:text-slate-300";

  return (
    <section id={anchorId} className="scroll-mt-24 space-y-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {count !== undefined ? (
            <span
              className={cn(
                "inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums",
                countStyles,
              )}
            >
              {count}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className={cn("overflow-hidden rounded-2xl border shadow-sm shadow-slate-900/[0.03] dark:shadow-none", bar)}>
        {children}
      </div>
    </section>
  );
}

function EmptyRow({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white px-3 py-3 sm:px-4 dark:bg-slate-950/35">
      <AppEmptyHint title={title} description={hint} className="py-6" />
    </div>
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
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const [draft, setDraft] = useState(
    () => toDatetimeLocalValue(request.nextActionAt) || tomorrowAtNineDatetimeLocal(),
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
    const iso = fromDatetimeLocalValue(draft);
    if (!iso) {
      setError("Imposta una data e un orario validi.");
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
          uiTransition,
          "fixed z-[59] max-h-[min(32rem,calc(100vh-4rem))] overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xl shadow-slate-900/12",
          "dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/35",
        )}
      >
        <div className="space-y-4">
          <div>
            <h3 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Sposta scadenza
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">{request.title}</span>
              <span className="text-slate-500 dark:text-slate-500"> · {request.companyName}</span>
            </p>
          </div>

          <div>
            <span className={uiFormLabel}>Scorciatoie</span>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                className={cn(uiBtnSecondary, "px-3 py-2 text-xs")}
                onClick={() => setDraft(tomorrowAtNineDatetimeLocal())}
              >
                Domani 9:00
              </button>
              <button
                type="button"
                disabled={saving}
                className={cn(uiBtnSecondary, "px-3 py-2 text-xs")}
                onClick={() => setDraft(daysFromTodayAtNineDatetimeLocal(3))}
              >
                Tra 3 giorni 9:00
              </button>
              <button
                type="button"
                disabled={saving}
                className={cn(uiBtnSecondary, "px-3 py-2 text-xs")}
                onClick={() => setDraft(daysFromTodayAtNineDatetimeLocal(7))}
              >
                Tra 7 giorni 9:00
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={inputId} className={uiFormLabel}>
              Data e ora
            </label>
            <input
              id={inputId}
              type="datetime-local"
              value={draft}
              disabled={saving}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              className={cn(datetimeInputClass, "mt-1.5")}
            />
            {error ? (
              <p className="mt-2 text-sm text-rose-600 dark:text-rose-400" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
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
              className={cn(uiBtnPrimary, "min-w-[7rem] px-4 py-2.5 text-sm")}
              onClick={() => void apply()}
            >
              {saving ? "Salvataggio…" : "Applica"}
            </button>
          </div>
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
      className={cn(
        uiTransition,
        "overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg shadow-slate-900/12",
        "dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/35",
      )}
    >
      {QUICK_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          role="option"
          aria-selected={currentStatus === s}
          disabled={pending}
          className={cn(
            "flex w-full items-center px-3 py-2 text-left text-sm text-slate-800",
            "hover:bg-slate-50 disabled:opacity-50 dark:text-slate-100 dark:hover:bg-slate-800",
            currentStatus === s && "bg-slate-100/90 font-semibold dark:bg-slate-800/90",
          )}
          onClick={() => onPick(s)}
        >
          {statusLabel[s]}
        </button>
      ))}
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
      ? "hover:bg-rose-50/70 dark:hover:bg-rose-950/25"
      : "hover:bg-slate-50/90 dark:hover:bg-slate-900/40";

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
          <tbody className="bg-white dark:bg-slate-950/35">
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
                  <span className="line-clamp-2 font-medium leading-snug text-slate-900 dark:text-slate-100">
                    {r.title}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-middle text-slate-600 dark:text-slate-400">
                  <span className="line-clamp-2 leading-snug">{r.companyName}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 align-middle text-right tabular-nums text-slate-700 dark:text-slate-300">
                  {r.nextActionAt ? formatDateTime(r.nextActionAt) : "—"}
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <PriorityBadge priority={r.priority} className="max-w-full truncate" />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <StatusBadge status={r.status} className="max-w-full truncate" />
                </td>
                <td className="px-4 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      data-status-trigger={r.id}
                      type="button"
                      disabled={pending}
                      title="Cambia stato"
                      aria-label={`Cambia stato: ${r.title}`}
                      aria-expanded={statusMenu?.id === r.id}
                      aria-haspopup="listbox"
                      className={cn(uiBtnIcon, "h-9 w-9 shrink-0")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPostpone(null);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setStatusMenu((m) => (m?.id === r.id ? null : { id: r.id, rect }));
                      }}
                    >
                      <IconEllipsisVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      title="Sposta scadenza"
                      aria-label={`Sposta scadenza: ${r.title}`}
                      className={cn(uiBtnIcon, "h-9 w-9 shrink-0")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusMenu(null);
                        setPostpone({
                          request: r,
                          rect: e.currentTarget.getBoundingClientRect(),
                        });
                      }}
                    >
                      <IconArrowPath className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </button>
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
        <tbody className="bg-white dark:bg-slate-950/35">
          {items.map((r) => (
            <tr
              key={r.id}
              className={cn(
                tableRowInteractive,
                "hover:bg-slate-50/90 dark:hover:bg-slate-900/40",
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
                <span className="line-clamp-2 font-medium leading-snug text-slate-900 dark:text-slate-100">
                  {r.subject || "(Senza oggetto)"}
                </span>
              </td>
              <td className="px-4 py-3.5 align-middle text-slate-600 dark:text-slate-400">
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

export function FollowUpView({
  overdue,
  today,
  upcoming,
  inbox,
}: {
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
  inbox: InboxItem[];
}) {
  return (
    <div className="space-y-10 md:space-y-12">
      <Section
        anchorId="follow-up-overdue"
        variant="danger"
        title="In ritardo"
        count={overdue.length}
        description="Prossima azione prima di oggi (calendario locale), escluse le richieste chiuse."
      >
        {overdue.length === 0 ? (
          <EmptyRow
            title="Nessun ritardo"
            hint="Nessuna richiesta ha la prossima azione impostata prima di oggi (richieste chiuse escluse)."
          />
        ) : (
          <RequestBlock requests={overdue} accent="danger" />
        )}
      </Section>

      <Section
        anchorId="follow-up-today"
        variant="default"
        title="Oggi"
        count={today.length}
        description="Prossima azione prevista per oggi."
      >
        {today.length === 0 ? (
          <EmptyRow
            title="Niente in scadenza oggi"
            hint="Le richieste con prossima azione prevista per oggi compariranno in questo blocco."
          />
        ) : (
          <RequestBlock requests={today} accent="default" />
        )}
      </Section>

      <Section
        anchorId="follow-up-upcoming"
        variant="muted"
        title="Prossimi 7 giorni"
        count={upcoming.length}
        description="Dalla prossima mezzanotte fino alla fine del settimo giorno."
      >
        {upcoming.length === 0 ? (
          <EmptyRow
            title="Nessuna scadenza nei prossimi 7 giorni"
            hint="Domani fino al settimo giorno non risultano azioni programmate."
          />
        ) : (
          <RequestBlock requests={upcoming} accent="default" />
        )}
      </Section>

      <Section
        anchorId="follow-up-inbox"
        variant="muted"
        title="Inbox da triage"
        count={inbox.length}
        description={`Ingressi in stato ${inboxStatusLabel.new} o ${inboxStatusLabel.reviewed}, non ancora convertiti. Clicca una riga per aprire il dettaglio e convertire; Archivia per toglierla dalla coda.`}
      >
        {inbox.length === 0 ? (
          <EmptyRow
            title="Nessun ingresso da triage"
            hint="Gli elementi in stato Nuovo o Esaminato, non ancora convertiti, compariranno qui. Apri una riga per procedere alla conversione."
          />
        ) : (
          <InboxBlock items={inbox} />
        )}
      </Section>
    </div>
  );
}
