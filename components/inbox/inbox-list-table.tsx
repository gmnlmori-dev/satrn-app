"use client";

import { useRouter } from "next/navigation";
import type { InboxItem } from "@/types/inbox";
import { InboxStatusBadge } from "@/components/inbox/inbox-status-badge";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiTransition } from "@/lib/ui-classes";

const thClass =
  "px-4 py-3 text-left text-xs font-medium tracking-normal text-slate-500 sm:px-5 dark:text-slate-400";

function Row({ r, index }: { r: InboxItem; index: number }) {
  const router = useRouter();

  function go() {
    router.push(`/app/inbox/${r.id}`, { scroll: true });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  }

  const isOdd = index % 2 === 1;

  return (
    <tr
      tabIndex={0}
      aria-label={`Apri: ${r.subject}`}
      onClick={go}
      onKeyDown={onKeyDown}
      className={cn(
        uiTransition,
        "group cursor-pointer border-b border-slate-100/90 last:border-b-0",
        isOdd
          ? "bg-slate-50/55 dark:bg-slate-800/22"
          : "bg-white dark:bg-slate-900/35",
        "hover:bg-slate-100/75 focus-visible:bg-slate-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900/10",
        "dark:hover:bg-slate-700/35 dark:focus-visible:bg-slate-700/40 dark:focus-visible:ring-slate-100/12",
      )}
    >
      <td className="px-4 py-3 align-middle sm:px-5">
        <span className="block text-[15px] font-medium leading-snug text-slate-900 underline-offset-2 group-hover:underline dark:text-slate-100">
          {r.subject || "(Senza oggetto)"}
        </span>
        <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-400">
          {[r.source, r.senderName, r.senderEmail].filter(Boolean).join(" · ") ||
            "—"}
        </p>
      </td>
      <td className="hidden px-4 py-3 align-middle sm:table-cell sm:px-5">
        <InboxStatusBadge status={r.status} />
      </td>
      <td className="hidden px-4 py-3 align-middle text-sm tabular-nums text-slate-600 md:table-cell sm:px-5 dark:text-slate-400">
        {formatDateTime(r.createdAt)}
      </td>
    </tr>
  );
}

export function InboxListTable({ items }: { items: InboxItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200/90 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/80">
            <th className={cn(thClass, "min-w-0")}>Oggetto</th>
            <th className={cn(thClass, "hidden w-[8.5rem] sm:table-cell")}>
              Stato
            </th>
            <th
              className={cn(
                thClass,
                "hidden w-[11rem] md:table-cell lg:w-[12rem]",
              )}
            >
              Ricevuto
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, index) => (
            <Row key={r.id} r={r} index={index} />
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-200/80 px-4 py-2.5 text-right text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500 sm:hidden">
        Tocca una riga per aprire il dettaglio.
      </div>
    </div>
  );
}
