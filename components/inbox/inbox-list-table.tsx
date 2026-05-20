"use client";

import { useRouter } from "next/navigation";
import type { InboxItem } from "@/types/inbox";
import { InboxStatusBadge } from "@/components/inbox/inbox-status-badge";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import {
  dataTableColSepClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableShellClass,
  dataTableTdClass,
  dataTableThClass,
} from "@/lib/table-ui";
import { uiTransition } from "@/lib/ui-classes";

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
      aria-label={`Apri: ${r.subject || "(Senza oggetto)"}`}
      onClick={go}
      onKeyDown={onKeyDown}
      className={cn(
        dataTableRowClass,
        "group min-h-[4.5rem] cursor-pointer",
        isOdd && "bg-canvas/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring-focus",
      )}
    >
      <td className={dataTableTdClass}>
        <span className="block text-sm font-medium leading-snug text-fg-primary underline-offset-2 group-hover:underline">
          {r.subject || "(Senza oggetto)"}
        </span>
        <p className="mt-0.5 truncate text-xs text-fg-tertiary">
          {[r.source, r.senderName, r.senderEmail].filter(Boolean).join(" · ") ||
            "—"}
        </p>
      </td>
      <td className={cn("hidden px-4 py-3 align-middle sm:table-cell sm:px-5", dataTableColSepClass)}>
        <InboxStatusBadge status={r.status} />
      </td>
      <td
        className={cn(
          dataTableTdClass,
          "hidden text-fg-tertiary md:table-cell",
          dataTableColSepClass,
        )}
      >
        {formatDateTime(r.createdAt)}
      </td>
    </tr>
  );
}

export function InboxListTable({ items }: { items: InboxItem[] }) {
  return (
    <div className={dataTableShellClass}>
      <div className="w-full min-w-[520px]">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead>
          <tr className={dataTableHeadRowClass}>
            <th scope="col" className={cn(dataTableThClass, "min-w-0")}>
              Oggetto
            </th>
            <th
              scope="col"
              className={cn(dataTableThClass, "hidden w-[8.5rem] sm:table-cell", dataTableColSepClass)}
            >
              Stato
            </th>
            <th
              scope="col"
              className={cn(
                dataTableThClass,
                "hidden w-[11rem] md:table-cell lg:w-[12rem]",
                dataTableColSepClass,
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
      </div>
      <div className="border-t border-line-default px-4 py-2.5 text-right text-xs text-fg-tertiary sm:hidden">
        Tocca una riga per aprire il dettaglio.
      </div>
    </div>
  );
}
