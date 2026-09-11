"use client";

import { useRouter } from "next/navigation";
import type { InboxItem } from "@/types/inbox";
import type { TeamTag } from "@/types/tag";
import { MemberAvatar } from "@/components/app/user-avatar";
import { InboxStatusBadge } from "@/components/inbox/inbox-status-badge";
import { TagChips } from "@/components/tags/tag-chips";
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

function Row({
  r,
  index,
  showAssignee,
  teamTags,
  showTagColumn,
}: {
  r: InboxItem;
  index: number;
  showAssignee: boolean;
  teamTags: TeamTag[];
  showTagColumn: boolean;
}) {
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
        {showTagColumn && r.tagIds.length > 0 ? (
          <TagChips
            tagIds={r.tagIds}
            catalog={teamTags}
            max={2}
            className="mt-1 md:hidden"
          />
        ) : null}
      </td>
      <td className={cn("hidden px-4 py-3 align-middle sm:table-cell sm:px-5", dataTableColSepClass)}>
        <InboxStatusBadge status={r.status} />
      </td>
      {showTagColumn ? (
        <td
          className={cn(
            dataTableTdClass,
            "hidden align-middle md:table-cell",
            dataTableColSepClass,
          )}
        >
          <TagChips
            tagIds={r.tagIds}
            catalog={teamTags}
            max={3}
            emptyLabel="—"
          />
        </td>
      ) : null}
      {showAssignee ? (
        <td
          className={cn(
            dataTableTdClass,
            "hidden text-fg-secondary lg:table-cell",
            dataTableColSepClass,
          )}
        >
          {r.assignedToLabel ? (
            <span className="flex min-w-0 items-center gap-2">
              <MemberAvatar
                userId={r.assignedUserId}
                name={r.assignedToLabel}
                size="sm"
                title=""
                decorative
              />
              <span className="min-w-0 truncate">{r.assignedToLabel}</span>
            </span>
          ) : (
            "—"
          )}
        </td>
      ) : null}
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

export function InboxListTable({
  items,
  showAssignee = false,
  teamTags = [],
}: {
  items: InboxItem[];
  showAssignee?: boolean;
  teamTags?: TeamTag[];
}) {
  const showTagColumn = teamTags.length > 0;
  const minWidth = showAssignee
    ? showTagColumn
      ? "min-w-[760px]"
      : "min-w-[640px]"
    : showTagColumn
      ? "min-w-[640px]"
      : "min-w-[520px]";

  return (
    <div className={dataTableShellClass}>
      <div className={cn("w-full", minWidth)}>
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
            {showTagColumn ? (
              <th
                scope="col"
                className={cn(
                  dataTableThClass,
                  "hidden w-[11rem] md:table-cell",
                  dataTableColSepClass,
                )}
              >
                Tag
              </th>
            ) : null}
            {showAssignee ? (
              <th
                scope="col"
                className={cn(
                  dataTableThClass,
                  "hidden w-[10rem] lg:table-cell",
                  dataTableColSepClass,
                )}
              >
                Assegnata a
              </th>
            ) : null}
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
            <Row
              key={r.id}
              r={r}
              index={index}
              showAssignee={showAssignee}
              teamTags={teamTags}
              showTagColumn={showTagColumn}
            />
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
