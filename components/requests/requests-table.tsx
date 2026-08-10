"use client";

import { useRouter } from "next/navigation";
import type { Request } from "@/types/request";
import type { RequestPriority } from "@/types/request";
import { StatusBadge } from "@/components/requests/status-badge";
import { formatDate, formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import {
  dataTableColSepClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableShellClass,
  dataTableTdClass,
  dataTableThClass,
} from "@/lib/table-ui";
import { uiMono } from "@/lib/typography";
import { uiTransition } from "@/lib/ui-classes";

const clampTwoLines =
  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]";

/** Altezza fissa titolo (2 righe text-sm leading-snug). */
const requestTitleBlockClass = "min-h-[2.75rem]";

/** Altezza uniforme riga: 2 righe titolo (+ sottotitolo azienda su mobile). */
const requestTableRowHeightClass = "h-[5.25rem] sm:h-[4.5rem]";
const priorityBarClass: Record<RequestPriority, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-fg-tertiary",
};

function Row({
  r,
  index,
}: {
  r: Request;
  index: number;
}) {
  const router = useRouter();

  function go() {
    router.push(`/app/requests/${r.id}`, { scroll: true });
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
      aria-label={`Apri progetto: ${r.title}`}
      onClick={go}
      onKeyDown={onKeyDown}
      className={cn(
        dataTableRowClass,
        "group cursor-pointer",
        isOdd && "bg-canvas/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring-focus",
      )}
    >
      <td
        className={cn(
          dataTableTdClass,
          requestTableRowHeightClass,
          "relative overflow-hidden align-top",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r-full transition-colors",
            priorityBarClass[r.priority]
          )}
        />
        <span
          className={cn(
            "block pl-2 text-sm font-medium leading-snug text-fg-primary underline-offset-2 group-hover:underline",
            requestTitleBlockClass,
            clampTwoLines,
          )}
          title={r.title}
        >
          {r.title}
        </span>
        <p className="mt-1 truncate text-xs text-fg-tertiary sm:hidden">
          {r.companyName}
        </p>
      </td>
      <td
        className={cn(
          requestTableRowHeightClass,
          "hidden overflow-hidden px-4 py-3 align-middle text-[15px] leading-snug text-fg-secondary sm:table-cell sm:px-5",
          dataTableColSepClass,
        )}
      >
        <span className={cn("block", clampTwoLines)} title={r.companyName}>
          {r.companyName}
        </span>
      </td>
      <td
        className={cn(
          requestTableRowHeightClass,
          "hidden overflow-hidden px-4 py-3 align-middle md:table-cell sm:px-5",
          dataTableColSepClass,
        )}
      >
        <div
          className="truncate whitespace-nowrap text-[15px] font-medium leading-snug text-fg-primary"
          title={r.contactName}
        >
          {r.contactName}
        </div>
      </td>
      <td
        className={cn(
          requestTableRowHeightClass,
          "overflow-hidden px-4 py-3 align-middle sm:px-5",
          dataTableColSepClass,
        )}
      >
        <StatusBadge status={r.status} />
      </td>
      <td
        className={cn(
          requestTableRowHeightClass,
          "hidden overflow-hidden px-4 py-3 align-middle md:table-cell sm:px-5",
          dataTableColSepClass,
        )}
      >
        <span
          className={cn(
            "block text-sm leading-snug text-fg-secondary",
            clampTwoLines,
          )}
          title={r.assignedToLabel ?? "Non assegnata"}
        >
          {r.assignedToLabel ?? "—"}
        </span>
      </td>
      <td
        className={cn(
          requestTableRowHeightClass,
          "overflow-hidden px-4 py-3 align-middle sm:px-5",
          dataTableColSepClass,
        )}
      >
        <time
          className="block text-sm font-medium tabular-nums leading-snug text-fg-primary"
          dateTime={r.updatedAt}
          title={formatDateTime(r.updatedAt)}
        >
          {formatDate(r.updatedAt)}
        </time>
      </td>
    </tr>
  );
}

export function RequestsTable({ requests }: { requests: Request[] }) {
  return (
    <div className={dataTableShellClass}>
      <div className="w-full min-w-[760px]">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className={dataTableHeadRowClass}>
              <th scope="col" className={cn("w-[24%] 2xl:w-[19%]", dataTableThClass)}>
                Progetto
              </th>
              <th
                scope="col"
                className={cn("hidden w-[18%] 2xl:w-[15%] sm:table-cell", dataTableThClass, dataTableColSepClass)}
              >
                Azienda
              </th>
              <th
                scope="col"
                className={cn("hidden w-[15%] 2xl:w-[12%] md:table-cell", dataTableThClass, dataTableColSepClass)}
              >
                Contatto
              </th>
              <th scope="col" className={cn("w-[12%] 2xl:w-[10%]", dataTableThClass, dataTableColSepClass)}>
                Stato
              </th>
              <th
                scope="col"
                className={cn(
                  "hidden w-[13%] 2xl:w-[11%] md:table-cell",
                  dataTableThClass,
                  dataTableColSepClass,
                )}
              >
                Assegnatario
              </th>
              <th
                scope="col"
                className={cn(
                  "w-[18%] 2xl:w-[15%]",
                  dataTableThClass,
                  dataTableColSepClass,
                )}
              >
                Aggiornato
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r, i) => (
              <Row key={r.id} r={r} index={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
