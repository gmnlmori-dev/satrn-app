"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  NextActionDeadlineFields,
  nextActionDeadlineDraftFromIso,
} from "@/components/requests/next-action-deadline-fields";
import { cn } from "@/lib/cn";
import {
  daysFromTodayAtNineInputs,
  tomorrowAtNineInputs,
} from "@/lib/follow-up-windows";
import {
  formatDateTime,
  fromDateAndTimeInputs,
  todayDateInputValue,
} from "@/lib/date";
import {
  uiBtnPrimary,
  uiBtnSecondary,
  uiControl,
  uiTransition,
} from "@/lib/ui-classes";

export const followUpPopoverPanel = cn(
  uiTransition,
  "overflow-hidden rounded-[12px] border border-line-default bg-surface shadow-[var(--shadow-surface)]",
);

const followUpPopoverShortcut = cn(
  uiTransition,
  "rounded-[8px] border border-line-default bg-canvas px-2 py-1 text-xs font-medium text-fg-secondary",
  "hover:bg-elevated hover:text-fg-primary",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40",
  "disabled:cursor-not-allowed disabled:opacity-40",
);

const datetimeInputClass = uiControl;

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

function initialPostponeDraft(dueAt: string | null): { date: string; time: string } {
  if (dueAt) {
    return nextActionDeadlineDraftFromIso(dueAt);
  }
  return tomorrowAtNineInputs();
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function IconCalendarDays({ className }: { className?: string }) {
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

export type PostponeDueAtApplyResult =
  | { ok: true }
  | { ok: false; message: string };

export function PostponeDueAtPopover({
  idPrefix,
  title,
  currentDueAt,
  anchorRect,
  onDismiss,
  onApply,
}: {
  idPrefix: string;
  title: string;
  currentDueAt: string | null;
  anchorRect: DOMRectReadOnly;
  onDismiss: () => void;
  onApply: (iso: string) => Promise<PostponeDueAtApplyResult>;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const [dateDraft, setDateDraft] = useState(() => initialPostponeDraft(currentDueAt).date);
  const [timeDraft, setTimeDraft] = useState(() => initialPostponeDraft(currentDueAt).time);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    const minW = 16 * 16;
    const maxW = Math.min(20 * 16, window.innerWidth - 2 * margin);
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
    el.style.width = `${maxW}px`;
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

  async function apply() {
    if (saving) return;
    const iso = fromDateAndTimeInputs(dateDraft, timeDraft);
    if (!iso) {
      setError("Imposta una data valida.");
      return;
    }
    setError(null);
    setSaving(true);
    const r = await onApply(iso);
    setSaving(false);
    if (r.ok) {
      onDismiss();
    } else {
      setError(r.message);
    }
  }

  if (!isClient || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      data-postpone-panel
      role="dialog"
      aria-labelledby={titleId}
      className={cn(
        followUpPopoverPanel,
        "max-h-[min(28rem,calc(100vh-5rem))] overflow-y-auto",
      )}
    >
      <div className="border-b border-line-default px-3.5 py-2.5">
        <p id={titleId} className="text-[13px] font-semibold text-fg-primary">
          Sposta scadenza
        </p>
        <p className="mt-0.5 truncate text-xs text-fg-tertiary">{title}</p>
        {currentDueAt ? (
          <p className="mt-1 text-xs tabular-nums text-fg-secondary">
            Attuale: {formatDateTime(currentDueAt)}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-1">
          {POSTPONE_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              disabled={saving}
              className={followUpPopoverShortcut}
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

        <NextActionDeadlineFields
          idPrefix={idPrefix}
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

        {error ? (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-line-default pt-3">
          <button
            type="button"
            disabled={saving}
            className={cn(uiBtnSecondary, "px-3 py-1.5 text-xs")}
            onClick={onDismiss}
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={saving}
            aria-busy={saving}
            className={cn(uiBtnPrimary, "px-3 py-1.5 text-xs")}
            onClick={() => void apply()}
          >
            {saving ? "Salvataggio…" : "Applica"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
