import Link from "next/link";
import { notFound } from "next/navigation";
import { ConvertInboxForm } from "@/components/inbox/convert-inbox-form";
import { InboxStatusControls } from "@/components/inbox/inbox-status-controls";
import { AppEmptyHint } from "@/components/ui/app-empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDateTime } from "@/lib/date";
import { inboxStatusLabel } from "@/lib/labels";
import { getInboxItemById } from "@/lib/supabase/inbox-queries";
import { cn } from "@/lib/cn";
import { uiFocusRingOffset, uiTransition } from "@/lib/ui-classes";
import { uiFormLabel, uiPageLead } from "@/lib/typography";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInboxItemById(id);
  if (!item) return { title: "Inbox" };
  return { title: item.subject || "Inbox" };
}

export default async function InboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInboxItemById(id);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {item.subject || "Senza oggetto"}
        </h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Ingresso registrato manualmente · stato {inboxStatusLabel[item.status]}
          {item.linkedRequestId ? " · collegato a una richiesta esistente." : "."}
        </p>
      </header>

      <SurfaceCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className={uiFormLabel}>Fonte</p>
              <p className="text-slate-900 dark:text-slate-100">
                {item.source || "—"}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Mittente</p>
              <p className="text-slate-900 dark:text-slate-100">
                {item.senderName || "—"}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Email mittente</p>
              <p className="break-all text-slate-900 dark:text-slate-100">
                {item.senderEmail || "—"}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Ricevuto</p>
              <p className="tabular-nums text-slate-900 dark:text-slate-100">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
            <div>
              <p className={uiFormLabel}>Aggiornato</p>
              <p className="tabular-nums text-slate-900 dark:text-slate-100">
                {formatDateTime(item.updatedAt)}
              </p>
            </div>
          </div>
          <div className="sm:pt-1">
            <p className={`${uiFormLabel} mb-2`}>Stato</p>
            <InboxStatusControls item={item} />
          </div>
        </div>

        {item.linkedRequestId ? (
          <div className="mt-5 border-t border-slate-200/80 pt-5 dark:border-slate-800">
            <Link
              href={`/app/requests/${item.linkedRequestId}`}
              className={cn(
                uiTransition,
                uiFocusRingOffset,
                "inline-flex font-semibold text-slate-900 underline-offset-2 hover:underline dark:text-slate-100",
              )}
            >
              Apri richiesta collegata
            </Link>
          </div>
        ) : null}
      </SurfaceCard>

      <SurfaceCard className={cn(!item.linkedRequestId && "pb-5")}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
          Contenuto grezzo
        </h2>
        {item.rawContent?.trim() ? (
          <pre
            className={cn(
              "mt-3 max-h-[min(28rem,55vh)] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200/80 bg-slate-50/90 p-4 text-[13px] leading-relaxed text-slate-900",
              "dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100",
            )}
          >
            {item.rawContent}
          </pre>
        ) : (
          <AppEmptyHint
            className="mt-3"
            title="Nessun testo incollato"
            description="Il contenuto grezzo non è presente. Puoi aggiornare l’ingresso se ti serve recuperare il messaggio originale."
          />
        )}
      </SurfaceCard>

      {!item.linkedRequestId ? <ConvertInboxForm item={item} /> : null}
    </div>
  );
}
