"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
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
import { formatDateTime } from "@/lib/date";
import { inboxStatusLabel } from "@/lib/labels";
import { StandaloneTaskBlock } from "@/components/follow-up/standalone-task-block";
import { RequestChecklistInline } from "@/components/follow-up/request-checklist-inline";
import { FollowUpChecklistBlock } from "@/components/follow-up/follow-up-checklist-block";
import {
  orphanChecklistEntriesForRequests,
  type CalendarTaskEntry,
} from "@/lib/next-action-tasks";
import {
  followUpPopoverPanel,
  IconCalendarDays,
  PostponeDueAtPopover,
} from "@/components/follow-up/postpone-due-at-popover";
import type { Task } from "@/types/task";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { cn } from "@/lib/cn";
import {
  uiBtnIcon,
  uiBtnSecondary,
  uiTransition,
} from "@/lib/ui-classes";
import {
  dataTableThClass,
  dataTableRowClass,
} from "@/lib/table-ui";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { uiCard } from "@/lib/surfaces";
import type { InboxItem } from "@/types/inbox";
import type { Request, RequestStatus } from "@/types/request";

const QUICK_STATUSES: RequestStatus[] = [
  "new",
  "in_review",
  "waiting",
  "follow_up",
  "closed",
];

const tableHeadCell = dataTableThClass;

const tableRowInteractive = cn(
  dataTableRowClass,
  "cursor-pointer outline-none",
  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring-focus",
);

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

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
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
                "flex w-full items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-left",
                "hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50",
                selected && "bg-elevated",
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

  useEffect(() => {
    if (!postpone) return;
    const requestId = postpone.request.id;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-postpone-panel]")) return;
      if (t.closest(`[data-postpone-trigger="${requestId}"]`)) return;
      setPostpone(null);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [postpone]);

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
        <PostponeDueAtPopover
          key={postpone.request.id}
          idPrefix={`postpone-req-${postpone.request.id}`}
          title={postpone.request.title}
          currentDueAt={postpone.request.nextActionAt}
          anchorRect={postpone.rect}
          onDismiss={() => setPostpone(null)}
          onApply={async (iso) => {
            const r = await updateRequestOperational(postpone.request.id, {
              next_action_at: iso,
              bump_last_interaction: true,
            });
            if (r.ok) {
              pulseTopBar();
              refresh();
            }
            return r.ok ? { ok: true as const } : { ok: false as const, message: r.message };
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
                  <RequestChecklistInline
                    requestId={r.id}
                    nextAction={r.nextAction}
                    disabled={pending}
                    onChanged={() => {
                      pulseTopBar();
                      refresh();
                    }}
                  />
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
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      data-status-trigger={r.id}
                      title="Cambia stato"
                      aria-label="Cambia stato"
                      disabled={pending}
                      aria-expanded={statusMenu?.id === r.id}
                      aria-haspopup="listbox"
                      className={cn(
                        uiBtnIcon,
                        statusMenu?.id === r.id && "border-accent/40 bg-accent-subtle text-accent",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPostpone(null);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setStatusMenu((m) => (m?.id === r.id ? null : { id: r.id, rect }));
                      }}
                    >
                      <IconAdjustmentsVertical className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      data-postpone-trigger={r.id}
                      title="Sposta scadenza"
                      aria-label="Sposta scadenza"
                      disabled={pending}
                      aria-expanded={postpone?.request.id === r.id}
                      className={cn(
                        uiBtnIcon,
                        postpone?.request.id === r.id && "border-accent/40 bg-accent-subtle text-accent",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusMenu(null);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPostpone((p) =>
                          p?.request.id === r.id ? null : { request: r, rect },
                        );
                      }}
                    >
                      <IconCalendarDays className="h-4 w-4" />
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

function countQueueItems(
  requests: Request[],
  tasks: Task[],
  checklistEntries: CalendarTaskEntry[],
) {
  const orphanChecklists = orphanChecklistEntriesForRequests(
    checklistEntries,
    requests,
  );
  return requests.length + tasks.length + orphanChecklists.length;
}

function QueuePanel({
  requests,
  tasks,
  checklistEntries = [],
  requestAccent,
  emptyTitle,
  emptyHint,
}: {
  requests: Request[];
  tasks: Task[];
  checklistEntries?: CalendarTaskEntry[];
  requestAccent: "danger" | "default";
  emptyTitle: string;
  emptyHint: string;
}) {
  const orphanChecklists = orphanChecklistEntriesForRequests(
    checklistEntries,
    requests,
  );
  const total = countQueueItems(requests, tasks, checklistEntries);
  if (total === 0) {
    return <EmptyRow title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div>
      {requests.length > 0 ? (
        <RequestBlock requests={requests} accent={requestAccent} />
      ) : null}
      {orphanChecklists.length > 0 ? (
        <div
          className={
            requests.length > 0 ? "border-t border-line-default" : undefined
          }
        >
          {requests.length > 0 || tasks.length > 0 ? (
            <p className="border-b border-line-default bg-elevated/30 px-4 py-2 text-xs font-medium text-fg-tertiary sm:px-5">
              Checklist richieste · {orphanChecklists.length}
            </p>
          ) : null}
          <FollowUpChecklistBlock entries={orphanChecklists} />
        </div>
      ) : null}
      {tasks.length > 0 ? (
        <div className={requests.length > 0 || orphanChecklists.length > 0 ? "border-t border-line-default" : undefined}>
          {requests.length > 0 || orphanChecklists.length > 0 ? (
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
  overdueChecklists = [],
  todayChecklists = [],
  upcomingChecklists = [],
  scopeControl = null,
}: {
  overdue: Request[];
  today: Request[];
  upcoming: Request[];
  inbox: InboxItem[];
  overdueTasks?: Task[];
  todayTasks?: Task[];
  upcomingTasks?: Task[];
  overdueChecklists?: CalendarTaskEntry[];
  todayChecklists?: CalendarTaskEntry[];
  upcomingChecklists?: CalendarTaskEntry[];
  scopeControl?: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const overdueCount = countQueueItems(overdue, overdueTasks, overdueChecklists);
  const todayCount = countQueueItems(today, todayTasks, todayChecklists);
  const upcomingCount = countQueueItems(
    upcoming,
    upcomingTasks,
    upcomingChecklists,
  );
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
            checklistEntries={overdueChecklists}
            requestAccent="danger"
            emptyTitle="Nessun ritardo"
            emptyHint="Richieste, checklist e task con scadenza passata compariranno qui."
          />
        ) : null}

        {activeTab === "today" ? (
          <QueuePanel
            requests={today}
            tasks={todayTasks}
            checklistEntries={todayChecklists}
            requestAccent="default"
            emptyTitle="Niente in scadenza oggi"
            emptyHint="Richieste, checklist e task con scadenza oggi compariranno qui."
          />
        ) : null}

        {activeTab === "upcoming" ? (
          <QueuePanel
            requests={upcoming}
            tasks={upcomingTasks}
            checklistEntries={upcomingChecklists}
            requestAccent="default"
            emptyTitle="Nessuna scadenza nei prossimi 7 giorni"
            emptyHint="Richieste, checklist e task da domani al settimo giorno compariranno qui."
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
