import Link from "next/link";
import { InboxListTable } from "@/components/inbox/inbox-list-table";
import { getInboxItems } from "@/lib/supabase/inbox-queries";
import { cn } from "@/lib/cn";
import { uiBtnPrimary, uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";
import { uiPageLead } from "@/lib/typography";

export const metadata = {
  title: "Inbox",
};

export default async function InboxPage() {
  const items = await getInboxItems();

  return (
    <div className="space-y-5 md:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Inbox
          </h1>
          <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
            Registra input grezzi da canali esterni e convertili in richieste strutturate quando sei pronto.
          </p>
        </div>
        <Link
          href="/app/inbox?nuova=1"
          className={cn(
            uiTransition,
            uiFocusRingOffset,
            uiBtnPrimary,
            "inline-flex shrink-0 justify-center self-start px-4 py-2.5 text-center no-underline sm:min-w-[10rem]",
          )}
        >
          Nuovo inbox
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40 sm:px-6">
          <p className="text-[15px] font-medium text-slate-800 dark:text-slate-200">
            Inbox vuota
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Aggiungi un ingresso manuale per tenere traccia di messaggi e appunti prima di crearne una richiesta.
          </p>
          <Link
            href="/app/inbox?nuova=1"
            className={cn(
              uiTransition,
              uiFocusRingOffset,
              "mt-5 inline-block rounded-md text-sm font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-slate-200",
            )}
          >
            Nuovo inbox
          </Link>
        </div>
      ) : (
        <InboxListTable items={items} />
      )}
    </div>
  );
}
