"use client";

import { useRouter } from "next/navigation";
import type { Request } from "@/types/request";
import type { RequestPriority } from "@/types/request";
import { StatusBadge } from "@/components/requests/status-badge";
import { formatDate, formatDateTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { uiTransition } from "@/lib/ui-classes";
const thClass =
  "px-4 py-3 text-left text-xs font-medium tracking-normal text-slate-500 sm:px-5 dark:text-slate-400";
const colSepClass = "border-l border-slate-200/60 dark:border-slate-800/75";
const clampTwoLines =
  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]";
const priorityBarClass: Record<RequestPriority, string> = {
  high: "bg-rose-300/75 dark:bg-rose-500/45",
  medium: "bg-amber-300/75 dark:bg-amber-500/45",
  low: "bg-slate-300/85 dark:bg-slate-500/50",
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
      aria-label={`Apri richiesta: ${r.title}`}
      onClick={go}
      onKeyDown={onKeyDown}
      className={cn(
        uiTransition,
        "group h-28 cursor-pointer border-b border-slate-100/90 last:border-b-0",
        isOdd
          ? "bg-slate-50/55 dark:bg-slate-800/22"
          : "bg-white dark:bg-slate-900/35",
        "hover:bg-slate-100/75 focus-visible:bg-slate-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900/10",
        "dark:hover:bg-slate-700/35 dark:focus-visible:bg-slate-700/40 dark:focus-visible:ring-slate-100/12"
      )}
    >
      <td className="relative overflow-hidden px-4 py-3 align-middle sm:px-5">
        <span
          aria-hidden
          className={cn(
            "absolute bottom-3 left-0 top-3 w-1 rounded-r-full transition-colors",
            priorityBarClass[r.priority]
          )}
        />
        <span
          className={cn(
            "block pl-2 text-[15px] font-medium leading-snug text-slate-900 underline-offset-2 group-hover:underline dark:text-slate-100",
            clampTwoLines
          )}
          title={r.title}
        >
          {r.title}
        </span>
        <p className="mt-1 truncate text-xs text-slate-600 sm:hidden dark:text-slate-400">
          {r.companyName}
        </p>
      </td>
      <td
        className={cn(
          "hidden overflow-hidden px-4 py-3 align-middle text-[15px] leading-snug text-slate-800 sm:table-cell sm:px-5 dark:text-slate-200",
          colSepClass
        )}
      >
        <span className={cn("block", clampTwoLines)} title={r.companyName}>
          {r.companyName}
        </span>
      </td>
      <td
        className={cn(
          "hidden overflow-hidden px-4 py-3 align-middle md:table-cell sm:px-5",
          colSepClass
        )}
      >
        <div
          className="truncate whitespace-nowrap text-[15px] font-medium leading-snug text-slate-900 dark:text-slate-100"
          title={r.contactName}
        >
          {r.contactName}
        </div>
      </td>
      <td className={cn("overflow-hidden px-4 py-3 align-middle sm:px-5", colSepClass)}>
        <StatusBadge status={r.status} />
      </td>
      <td
        className={cn(
          "hidden min-w-0 max-w-md overflow-hidden px-4 py-3 align-middle 2xl:table-cell sm:px-5",
          colSepClass
        )}
      >
        <span
          className={cn(
            "block text-sm leading-relaxed text-slate-700 dark:text-slate-300",
            clampTwoLines
          )}
          title={r.nextAction}
        >
          {r.nextAction}
        </span>
      </td>
      <td
        className={cn(
          "overflow-hidden px-4 py-3 align-middle sm:px-5",
          colSepClass
        )}
      >
        <time
          className="block text-sm font-medium tabular-nums leading-snug text-slate-800 dark:text-slate-200"
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
    <div className="w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900/40">
      <div className="w-full">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/80">
              <th scope="col" className={cn("w-[26%] 2xl:w-[21%]", thClass)}>
                Richiesta
              </th>
              <th
                scope="col"
                className={cn("hidden w-[21%] 2xl:w-[17%] sm:table-cell", thClass, colSepClass)}
              >
                Azienda
              </th>
              <th
                scope="col"
                className={cn("hidden w-[19%] 2xl:w-[15%] md:table-cell", thClass, colSepClass)}
              >
                Contatto
              </th>
              <th scope="col" className={cn("w-[14%] 2xl:w-[12%]", thClass, colSepClass)}>
                Stato
              </th>
              <th
                scope="col"
                className={cn(
                  "hidden w-[22%] 2xl:w-[21%] 2xl:table-cell",
                  thClass,
                  colSepClass
                )}
              >
                Prossima azione
              </th>
              <th
                scope="col"
                className={cn(
                  "w-[20%] 2xl:w-[15%]",
                  thClass,
                  colSepClass
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
